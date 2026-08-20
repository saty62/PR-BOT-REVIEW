import "dotenv/config";

const redisUrl = process.env.REDIS_URL?.trim();

if (!redisUrl) {
  throw new Error("REDIS_URL is missing");
}

export const connection = {
  url: redisUrl,
  maxRetriesPerRequest: null,
};