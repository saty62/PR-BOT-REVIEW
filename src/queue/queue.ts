import { Queue } from "bullmq";
import { connection } from "../utils/connection.js";

export const reviewQueue = new Queue("pr-review", {
  connection,
});

reviewQueue.on("error", (error) => {
  console.error("Review queue error:", error);
});