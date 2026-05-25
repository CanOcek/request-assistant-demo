import { useEffect, useMemo, useState } from "react";
import { appName, type HealthResponse } from "@request-assistant/shared";

type HealthState =
  | { status: "loading" }
  | { status: "online"; data: HealthResponse }
  | { status: "offline"; message: string };

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export function App() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const healthUrl = useMemo(() => `${apiBaseUrl}/api/health`, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadHealth() {
      try {
        const response = await fetch(healthUrl, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Health check failed with ${response.status}`);
        }

        const data = (await response.json()) as HealthResponse;
        setHealth({ status: "online", data });
      } catch (error) {
        if (controller.signal.aborted) return;
        setHealth({
          status: "offline",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    loadHealth();

    return () => controller.abort();
  }, [healthUrl]);

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Maintenance request assistant</p>
        <h1>{appName}</h1>
        <p className="hero-copy">
          Demo scaffold for tenant request intake, Hausverwaltung review, and owner approvals.
        </p>
      </section>

      <section className="status-panel" aria-live="polite">
        <div>
          <p className="label">Backend status</p>
          <h2>{health.status === "online" ? "Connected" : health.status === "loading" ? "Checking..." : "Offline"}</h2>
        </div>
        {health.status === "online" ? (
          <p className="status-detail">
            Connected to <strong>{health.data.service}</strong> at {new Date(health.data.timestamp).toLocaleString()}.
          </p>
        ) : health.status === "offline" ? (
          <p className="status-detail error">{health.message}</p>
        ) : (
          <p className="status-detail">Calling {healthUrl}</p>
        )}
      </section>
    </main>
  );
}
