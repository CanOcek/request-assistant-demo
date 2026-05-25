import "dotenv/config";
import cors from "cors";
import express from "express";
import type { HealthResponse } from "@request-assistant/shared";
import { createDatabaseClient, hasDatabaseUrl } from "./db/client.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  let database: HealthResponse["database"] = "not_configured";

  if (hasDatabaseUrl()) {
    const { client } = createDatabaseClient();

    try {
      await client`select 1`;
      database = "connected";
    } catch {
      database = "error";
    } finally {
      await client.end();
    }
  }

  const response: HealthResponse = {
    status: "ok",
    service: "request-assistant-api",
    timestamp: new Date().toISOString(),
    database
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
