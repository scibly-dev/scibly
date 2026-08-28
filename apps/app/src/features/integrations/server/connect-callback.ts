import type {
  IntegrationCallbackError,
  IntegrationCredential,
  IntegrationProviderId,
} from "../contracts";
import type {
  BaseIntegrationProvider,
  ConnectCallbackParams,
} from "./base-provider";

import { getSession } from "@scibly/auth/session";
import { db } from "@scibly/db";
import { getLocale } from "@scibly/i18n";
import {
  INTEGRATION_CONNECTED_QUERY_PARAM,
  INTEGRATION_ERROR_QUERY_PARAM,
  localizedUrl,
  routes,
} from "@scibly/routes";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "@/env";
import {
  getProvider,
  isIntegrationProvider,
} from "@/features/integrations/server/registry";
import { requireOrgMember } from "@/features/organizations/server";
import { encryptApiKey } from "@/lib/crypto/api-key";
import { verifyOAuthState } from "@/lib/crypto/oauth-state";

import { detachSourcesFromConnection } from "./detach-sources";

type CallbackDestination = {
  settingsUrl: string;
};

type ValidCallback = CallbackDestination & {
  provider: IntegrationProviderId;
  params: ConnectCallbackParams;
  orgSlug: string;
  connectedByUserId: string;
};

function errorRedirect(
  destination: CallbackDestination,
  reason: IntegrationCallbackError,
) {
  return NextResponse.redirect(
    `${destination.settingsUrl}?${INTEGRATION_ERROR_QUERY_PARAM}=${reason}`,
  );
}

function providerError(oauthError: string): IntegrationCallbackError {
  return oauthError === "access_denied" ? "provider_denied" : "provider_error";
}

// An OAuth provider sends back a code to redeem, an app installation the id of
// the installation just made. Only the one the provider deals in is looked at.
function readCallbackParams(
  searchParams: URLSearchParams,
  provider: BaseIntegrationProvider,
): ConnectCallbackParams | null {
  const params: ConnectCallbackParams = {
    code: searchParams.get("code"),
    installationId: searchParams.get("installation_id"),
  };
  const required =
    provider.credential === "app_installation"
      ? params.installationId
      : params.code;
  return required ? params : null;
}

function validateCallback(
  req: NextRequest,
  providerParam: string,
):
  | { ok: true; callback: ValidCallback }
  | {
      ok: false;
      destination: CallbackDestination;
      reason: IntegrationCallbackError;
    } {
  const { searchParams } = req.nextUrl;
  // The provider sends the browser here directly, so these links carry their
  // own locale prefix rather than relying on the middleware that adds one.
  const fallback = {
    settingsUrl: localizedUrl(getLocale(null, true), routes.app.profile.root),
  };

  const oauthError = searchParams.get("error");
  const state = searchParams.get("state");

  if (!state) {
    return {
      ok: false,
      destination: fallback,
      reason: oauthError ? providerError(oauthError) : "missing_params",
    };
  }

  const verified = verifyOAuthState(state);
  if (!verified.ok) {
    return {
      ok: false,
      destination: fallback,
      reason: verified.reason === "expired" ? "expired_state" : "invalid_state",
    };
  }

  const { orgSlug, provider, userId, lang } = verified.payload;
  const destination = {
    settingsUrl: localizedUrl(
      getLocale(lang, true),
      routes.app.profile.org(orgSlug).settings,
    ),
  };

  if (oauthError) {
    return { ok: false, destination, reason: providerError(oauthError) };
  }
  if (!orgSlug || !userId || !isIntegrationProvider(provider)) {
    return { ok: false, destination, reason: "invalid_state" };
  }

  if (provider !== providerParam.toUpperCase()) {
    return { ok: false, destination, reason: "state_mismatch" };
  }

  const params = readCallbackParams(searchParams, getProvider(provider));
  if (!params) {
    return { ok: false, destination, reason: "missing_params" };
  }

  return {
    ok: true,
    callback: {
      ...destination,
      provider,
      params,
      orgSlug,
      connectedByUserId: userId,
    },
  };
}

async function authorizeCallback(
  req: NextRequest,
  callback: ValidCallback,
): Promise<{ organizationId: string } | IntegrationCallbackError> {
  const session = await getSession(req.headers);
  if (!session?.user || session.user.id !== callback.connectedByUserId) {
    return "session_mismatch";
  }

  const organization = await db.organization.findUnique({
    where: { slug: callback.orgSlug },
    select: { id: true },
  });
  if (!organization) return "org_not_found";

  try {
    await requireOrgMember(organization.id, session.user.id, "admin_or_owner");
    return { organizationId: organization.id };
  } catch {
    return "forbidden";
  }
}

// The two shapes use disjoint columns, and each connect clears the other's.
function credentialColumns(credential: IntegrationCredential) {
  if (credential.kind === "app_installation") {
    return {
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      installationId: credential.installationId,
    };
  }
  return {
    accessTokenEncrypted: encryptApiKey(credential.accessToken),
    refreshTokenEncrypted: credential.refreshToken
      ? encryptApiKey(credential.refreshToken)
      : null,
    tokenExpiresAt: credential.expiresAt ?? null,
    installationId: null,
  };
}

async function completeAndPersistConnection(
  callback: ValidCallback,
  organizationId: string,
) {
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/${callback.provider.toLowerCase()}/callback`;

  const existing = await db.integrationConnection.findUnique({
    where: {
      organizationId_provider: {
        organizationId,
        provider: callback.provider,
      },
    },
    select: { id: true, workspaceId: true },
  });

  const credential = await getProvider(callback.provider).completeConnect(
    callback.params,
    redirectUri,
  );

  if (
    existing?.workspaceId &&
    credential.workspaceId &&
    existing.workspaceId !== credential.workspaceId
  ) {
    await detachSourcesFromConnection(
      existing.id,
      callback.provider,
      "workspace_changed",
    );
  }

  const connectionData = {
    ...credentialColumns(credential),
    workspaceId: credential.workspaceId ?? null,
    workspaceName: credential.workspaceName ?? null,

    connectedByUserId: callback.connectedByUserId,
  };

  await db.integrationConnection.upsert({
    where: {
      organizationId_provider: {
        organizationId,
        provider: callback.provider,
      },
    },
    create: { organizationId, provider: callback.provider, ...connectionData },
    update: connectionData,
  });
}

export async function handleIntegrationConnectCallback(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerParam } = await params;
  const validation = validateCallback(req, providerParam);
  if (!validation.ok) {
    return errorRedirect(validation.destination, validation.reason);
  }

  const { callback } = validation;
  const authorization = await authorizeCallback(req, callback);
  if (typeof authorization === "string") {
    return errorRedirect(callback, authorization);
  }

  try {
    await completeAndPersistConnection(callback, authorization.organizationId);
    return NextResponse.redirect(
      `${callback.settingsUrl}?${INTEGRATION_CONNECTED_QUERY_PARAM}=${callback.provider.toLowerCase()}`,
    );
  } catch (err) {
    console.error(
      `[IntegrationCallback] ${callback.provider} connect failed:`,
      err,
    );
    return errorRedirect(callback, "token_exchange_failed");
  }
}
