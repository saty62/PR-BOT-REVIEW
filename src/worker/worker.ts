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
      console.log("Worker received job");
      console.log("Job ID:", job.id);
      console.log("Job data:", job.data);
      console.log("========================================");

      try {
        const {
          owner,
          repo,
          prNumber,
          installationId,
        } = job.data;

        if (!owner || !repo || !prNumber || !installationId) {
          throw new Error(
            `Invalid job data: ${JSON.stringify(job.data)}`
          );
        }

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

        console.log("Sending patches to Gemini for review...");

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
      } catch (error) {
        console.error(
          `Worker failed for job ${job.id}:`,
          error
        );

        // Very important:
        // Throwing makes BullMQ mark the job as failed.
        throw error;
      }
    },
    {
      connection,
      concurrency: 2,
    }
  );

  worker.on("ready", () => {
    console.log("========================================");
    console.log("PR Review Worker is READY");
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

  worker.on("failed", (job, error) => {
    console.error(
      `Worker failed job: ${job?.id}`,
      error
    );
  });

  worker.on("error", (error) => {
    console.error(
      "BullMQ Worker error:",
      error
    );
  });

  return worker;
}