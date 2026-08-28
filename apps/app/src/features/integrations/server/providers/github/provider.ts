import type {
  IntegrationCredential,
  IntegrationGrant,
} from "../../../contracts";
import type { ConnectCallbackParams } from "../../base-provider";
import type { GitHubAppConfig } from "./app-auth";

import {
  IntegrationProvider,
  IntegrationRevokedError,
} from "../../base-provider";
import {
  fetchInstallation,
  fetchInstallationRepositories,
  GitHubRequestError,
  mintInstallationToken,
  readGitHubAppConfig,
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

// GitHub is connected by installing an app on an account, not by an OAuth
// grant, so what comes back is an installation id. The workspace behind it is
// the account id — not the installation id, which a reinstall replaces — so
// that is what tells a reconnect from a move to a different organization.
export class GitHubProvider extends IntegrationProvider {
  readonly providerId = "GITHUB";
  readonly displayName = "GitHub";
  readonly credential = "app_installation";

  // The redirect back is the app's registered setup URL, so unlike OAuth there
  // is nothing to pass here; only the state rides along and comes back.
  getAuthUrl(state: string, _redirectUri: string): string {
    const { appSlug } = readGitHubAppConfig();
    const url = new URL(
      `https://github.com/apps/${encodeURIComponent(appSlug)}/installations/new`,
    );
    url.searchParams.set("state", state);
    return url.toString();
  }

  async completeConnect(
    params: ConnectCallbackParams,
  ): Promise<IntegrationCredential> {
    if (!params.installationId) {
      throw new Error("GitHub returned no installation to connect to.");
    }
    const installation = await fetchInstallation(
      readGitHubAppConfig(),
      params.installationId,
    );
    return {
      kind: "app_installation",
      installationId: installation.installationId,
      workspaceId: installation.accountId,
      workspaceName: installation.accountLogin,
    };
  }

  // GitHub answers 404 for an installation that no longer exists, which is
  // what an uninstall on its side looks like from here — the id we hold is
  // simply gone, and no token will ever be minted from it again. Acting on
  // that throws the connection away and detaches every source hanging off it,
  // so one 404 from one endpoint is not enough to go on: the app is asked
  // directly whether the installation is still there, and anything short of a
  // second 404 stays an ordinary failure that changes nothing.
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

  async listGrants(token: string): Promise<IntegrationGrant[]> {
    const repositories = await fetchInstallationRepositories(token);
    return repositories.map((repository) => ({
      id: String(repository.id),
      name: repository.full_name,
      url: repository.html_url,
    }));
  }
}
