import "dotenv/config";
import { App } from "@octokit/app";

const appId =
  process.env.APP_ID ??
  process.env.GITHUB_APP_ID;

const privateKey =
  process.env.PRIVATE_KEY ??
  process.env.GITHUB_PRIVATE_KEY;

function createGitHubApp() {
  const normalizedAppId = appId?.trim();

  // Convert literal \n from Render/.env into real newlines
  const normalizedPrivateKey = privateKey
    ?.trim()
    .replace(/\\n/g, "\n");

  if (!normalizedAppId) {
    throw new Error(
      "GitHub App ID is missing. Set APP_ID or GITHUB_APP_ID."
    );
  }

  if (!normalizedPrivateKey) {
    throw new Error(
      "GitHub private key is missing. Set PRIVATE_KEY or GITHUB_PRIVATE_KEY."
    );
  }

  if (!normalizedPrivateKey.includes("-----BEGIN")) {
    throw new Error(
      "GitHub private key format is invalid."
    );
  }

  console.log("GitHub App credentials loaded successfully");
  console.log("GitHub App ID:", normalizedAppId);

  return new App({
    appId: Number(normalizedAppId),
    privateKey: normalizedPrivateKey,
  });
}

export const githubapp = createGitHubApp();