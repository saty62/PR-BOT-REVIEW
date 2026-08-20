import { Worker } from "bullmq";
import { connection } from "../utils/connection.js";
import { githubapp } from "../auth/auth.js";
import fetchPatch from "../utils/utils.js";
import { aiReview } from "../utils/aiReview.js";
import { postReview } from "../utils/postReview.js";

export function startPRReviewWorker() {
  console.log("Starting PR Review Worker...");

  const worker = new Worker(
    "pr-review",
    async (job) => {
      console.log("========================================");
      console.log("JOB RECEIVED");
      console.log("Job ID:", job.id);
      console.log("Job Name:", job.name);
      console.log("Job Data:", job.data);
      console.log("========================================");

      try {
        const {
          owner,
          repo,
          prNumber,
          installationId,
        } = job.data;

        console.log("Getting GitHub installation client...");

        const octokit =
          await githubapp.getInstallationOctokit(
            installationId
          );

        console.log("GitHub installation client created");

        console.log(
          `Fetching patch for ${owner}/${repo} PR #${prNumber}...`
        );

        const patches = await fetchPatch({
          owner,
          repo,
          prNumber,
          octokit,
        });

        console.log("Patches fetched successfully");

        console.log("Sending patches to AI...");

        const reviewText = await aiReview(patches);

        console.log("AI review generated successfully");

        console.log("Posting review to GitHub...");

        await postReview({
          owner,
          repo,
          prNumber,
          reviewText,
          octokit,
        });

        console.log(`Review posted for PR #${prNumber}`);

        return {
          success: true,
          prNumber,
        };
      } catch (err) {
        console.error("Worker failed:", err);
        throw err;
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );

  worker.on("ready", () => {
    console.log("========================================");
    console.log("BULLMQ WORKER READY");
    console.log("========================================");
  });

  worker.on("active", (job) => {
    console.log(
      `Worker started processing job: ${job.id}`
    );
  });

  worker.on("completed", (job) => {
    console.log(
      `Worker completed job: ${job.id}`
    );
  });

  worker.on("failed", (job, err) => {
    console.error(
      `Worker failed job: ${job?.id}`,
      err
    );
  });

  worker.on("error", (err) => {
    console.error(
      "BULLMQ WORKER ERROR:",
      err
    );
  });

  return worker;
}