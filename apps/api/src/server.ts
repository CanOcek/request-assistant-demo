import "dotenv/config";
import cors from "cors";
import express from "express";
import type { HealthResponse } from "@request-assistant/shared";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  const response: HealthResponse = {
    status: "ok",
    service: "request-assistant-api",
    timestamp: new Date().toISOString()
  };

  res.json(response);
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
