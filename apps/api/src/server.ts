import "./env.js";
import cors from "cors";
import { eq } from "drizzle-orm";
import express from "express";
import { demoLoginRequestSchema, type DemoLoginResponse, type DemoUser, type HealthResponse } from "@request-assistant/shared";
import { createDemoToken, verifyDemoToken } from "./auth/token.js";
import { createDatabaseClient, hasDatabaseUrl } from "./db/client.js";
import { users } from "./db/schema.js";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

function getBearerToken(header: string | undefined) {
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

function requireDatabase() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured");
  }
}

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

app.post("/api/auth/demo-login", async (req, res) => {
  const parsed = demoLoginRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid demo role." });
    return;
  }

  try {
    requireDatabase();
    const { client, db } = createDatabaseClient();

    try {
      const [user] = await db.select().from(users).where(eq(users.role, parsed.data.role)).limit(1);

      if (!user) {
        res.status(404).json({ message: "Demo user not found. Run the seed script first." });
        return;
      }

      const demoUser: DemoUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
      const response: DemoLoginResponse = {
        token: createDemoToken(demoUser),
        user: demoUser
      };

      res.json(response);
    } finally {
      await client.end();
    }
  } catch (error) {
    res.status(503).json({
      message: error instanceof Error ? error.message : "Demo login is unavailable."
    });
  }
});

app.get("/api/me", (req, res) => {
  const token = getBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({ message: "Missing bearer token." });
    return;
  }

  const payload = verifyDemoToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid bearer token." });
    return;
  }

  const user: DemoUser = {
    id: payload.sub,
    name: payload.name,
    email: payload.email,
    role: payload.role
  };

  res.json({ user });
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
