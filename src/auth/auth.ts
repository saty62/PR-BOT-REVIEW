import "dotenv/config";
import { App } from "@octokit/app";

const appId = process.env.APP_ID ?? process.env.GITHUB_APP_ID;
const privateKey = process.env.PRIVATE_KEY ?? process.env.GITHUB_PRIVATE_KEY;

function createGitHubApp() {
  const normalizedAppId = appId?.trim();
  const normalizedPrivateKey = privateKey?.trim();

  if (!normalizedAppId || !normalizedPrivateKey) {
    return null;
  }

  return new App({
    appId: Number(normalizedAppId),
    privateKey: normalizedPrivateKey.replace(/\\n/g, "\n"),
  });
}

export const githubapp = createGitHubApp() ?? {
  async getInstallationOctokit() {
    throw new Error(
      "GitHub App credentials are not configured. Set APP_ID and PRIVATE_KEY (or GITHUB_APP_ID/GITHUB_PRIVATE_KEY) in .env."
    );
  },
};
