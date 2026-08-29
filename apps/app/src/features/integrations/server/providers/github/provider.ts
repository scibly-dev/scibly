import type {
  IntegrationCredential,
  IntegrationGrantList,
} from "../../../contracts";
import type { ConnectCallbackParams } from "../../base-provider";
import type { GitHubAppConfig } from "./app-auth";

import { routes } from "@scibly/routes";

import {
  IntegrationProvider,
  IntegrationRevokedError,
} from "../../base-provider";
import {
  exchangeUserToken,
  fetchInstallation,
  fetchInstallationRepositories,
  GitHubRequestError,
  mintInstallationToken,
  readGitHubAppConfig,
  userCanAccessInstallation,
} from "./app-auth";

async function installationIsGone(
  config: GitHubAppConfig,
  installationId: string,
): Promise<boolean> {
  try {
    await fetchInstallation(config, installationId);
    return false;
  } catch (error) {
    return error instanceof GitHubRequestError && error.status === 404;
  }
}

// The workspace is the account id, not the installation id a reinstall replaces: only
// the account tells a reconnect from a move to a different organization.
export class GitHubProvider extends IntegrationProvider {
  readonly providerId = "GITHUB";
  readonly displayName = "GitHub";
  readonly credential = "app_installation";

  // The install page redirects to the app's own registered callback, so there is
  // no redirect URI to pass.
  getAuthUrl(state: string, _redirectUri: string): string {
    const { appSlug } = readGitHubAppConfig();
    const url = new URL(routes.external.integrations.github.install(appSlug));
    url.searchParams.set("state", state);
    return url.toString();
  }

  // The installation id is a claim on a browser redirect; the code beside it is the
  // proof that the user standing here reaches that installation at all.
  async completeConnect(
    params: ConnectCallbackParams,
  ): Promise<IntegrationCredential> {
    if (!params.installationId) {
      throw new Error("GitHub returned no installation to connect to.");
    }
    if (!params.code) {
      throw new Error(
        "GitHub returned no user authorization for the installation.",
      );
    }
    const config = readGitHubAppConfig();
    const userToken = await exchangeUserToken(config, params.code);
    if (!(await userCanAccessInstallation(userToken, params.installationId))) {
      throw new Error(
        `GitHub installation ${params.installationId} is not one this user can reach.`,
      );
    }
    const installation = await fetchInstallation(config, params.installationId);
    return {
      kind: "app_installation",
      installationId: installation.installationId,
      workspaceId: installation.accountId,
      workspaceName: installation.accountLogin,
    };
  }

  // Acting on revoked throws the connection away, so one 404 is not enough to go on:
  // the app is asked directly whether the installation is really gone.
  async mintAccessToken(installationId: string): Promise<string> {
    const config = readGitHubAppConfig();
    try {
      return await mintInstallationToken(config, installationId);
    } catch (error) {
      if (!(error instanceof GitHubRequestError) || error.status !== 404) {
        throw error;
      }
      if (await installationIsGone(config, installationId)) {
        throw new IntegrationRevokedError(this.providerId);
      }
      throw error;
    }
  }

  async listGrants(token: string): Promise<IntegrationGrantList> {
    const { repositories, totalCount } =
      await fetchInstallationRepositories(token);
    return {
      grants: repositories.map((repository) => ({
        id: String(repository.id),
        name: repository.full_name,
        url: repository.html_url,
      })),
      totalCount,
    };
  }
}
