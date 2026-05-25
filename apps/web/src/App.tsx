import { useEffect, useMemo, useState } from "react";
import {
  appName,
  type DemoLoginResponse,
  type DemoUser,
  type HealthResponse,
  type UserRole
} from "@request-assistant/shared";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  Languages,
  LogOut,
  ShieldCheck,
  UserCog,
  Wrench
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

type HealthState =
  | { status: "loading" }
  | { status: "online"; data: HealthResponse }
  | { status: "offline"; message: string };

type AuthState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: DemoUser };

type DemoRole = Extract<UserRole, "tenant" | "property_manager" | "owner">;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const tokenStorageKey = "request-assistant-demo-token";

export function App() {
  const { i18n, t } = useTranslation();
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [authError, setAuthError] = useState<string | null>(null);
  const healthUrl = useMemo(() => `${apiBaseUrl}/api/health`, []);

  const roleSections = [
    {
      value: "tenant",
      icon: Wrench,
      label: t("roles.tenant"),
      description: t("roles.tenantDescription"),
      pages: [t("nav.newRequest"), t("nav.myTickets")]
    },
    {
      value: "property_manager",
      icon: Building2,
      label: t("roles.manager"),
      description: t("roles.managerDescription"),
      pages: [t("nav.managerDashboard")]
    },
    {
      value: "owner",
      icon: ShieldCheck,
      label: t("roles.owner"),
      description: t("roles.ownerDescription"),
      pages: [t("nav.approvals")]
    }
  ] satisfies Array<{
    value: DemoRole;
    icon: typeof UserCog;
    label: string;
    description: string;
    pages: string[];
  }>;

  const currentRole = auth.status === "authenticated" ? auth.user.role : "tenant";
  const currentRoleSection =
    auth.status === "authenticated" ? roleSections.find((role) => role.value === auth.user.role) : undefined;

  const setLanguage = (language: string) => {
    void i18n.changeLanguage(language);
    window.localStorage.setItem("language", language);
  };

  async function request<T>(path: string, options: RequestInit = {}) {
    const token = window.localStorage.getItem(tokenStorageKey);
    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(error?.message ?? `Request failed with ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async function login(role: DemoRole) {
    setAuthError(null);

    try {
      const response = await request<DemoLoginResponse>("/api/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({ role })
      });

      window.localStorage.setItem(tokenStorageKey, response.token);
      setAuth({ status: "authenticated", user: response.user });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t("auth.loginFailed"));
    }
  }

  function logout() {
    window.localStorage.removeItem(tokenStorageKey);
    setAuth({ status: "anonymous" });
    setAuthError(null);
  }

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

  useEffect(() => {
    const token = window.localStorage.getItem(tokenStorageKey);

    if (!token) {
      setAuth({ status: "anonymous" });
      return;
    }

    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const response = await request<{ user: DemoUser }>("/api/me");
        if (!cancelled) setAuth({ status: "authenticated", user: response.user });
      } catch {
        window.localStorage.removeItem(tokenStorageKey);
        if (!cancelled) setAuth({ status: "anonymous" });
      }
    }

    loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto grid w-[min(1080px,calc(100%-32px))] gap-6 py-6 md:py-10">
      <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">{t("app.eyebrow")}</p>
            <h1 className="text-2xl font-semibold tracking-normal">{appName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-muted-foreground" />
          <Select value={i18n.language} onValueChange={setLanguage}>
            <SelectTrigger className="w-36" aria-label={t("app.language")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{t("app.english")}</SelectItem>
              <SelectItem value="de">{t("app.german")}</SelectItem>
            </SelectContent>
          </Select>
          {auth.status === "authenticated" ? (
            <Button variant="ghost" size="icon" onClick={logout} aria-label={t("auth.logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-4">
        <div className="grid gap-2">
          <Badge variant="secondary" className="w-fit">
            Sprint D3
          </Badge>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-5xl">{t("app.title")}</h2>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{t("app.subtitle")}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>
              {auth.status === "authenticated"
                ? t("auth.signedInAs", { name: auth.user.name })
                : t("auth.chooseDemoUser")}
            </CardTitle>
            <CardDescription>
              {auth.status === "authenticated" ? t("auth.roleLandingDescription") : t("auth.chooseDemoUserDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auth.status === "authenticated" && currentRoleSection ? (
              <div className="grid gap-5">
                <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                    <currentRoleSection.icon className="h-5 w-5" />
                  </div>
                  <div className="grid gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{currentRoleSection.label}</h3>
                      <Badge variant="outline">{auth.user.email}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{currentRoleSection.description}</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.page")}</TableHead>
                      <TableHead>{t("common.role")}</TableHead>
                      <TableHead>{t("common.purpose")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRoleSection.pages.map((page) => (
                      <TableRow key={page}>
                        <TableCell className="font-medium">{page}</TableCell>
                        <TableCell>{currentRoleSection.label}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t("common.placeholder")}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-3">
                {roleSections.map((role) => {
                  const Icon = role.icon;

                  return (
                    <Button
                      className="h-auto justify-start p-4 text-left"
                      key={role.value}
                      onClick={() => void login(role.value)}
                      variant="outline"
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="grid gap-1">
                        <span className="font-semibold">{role.label}</span>
                        <span className="text-xs font-normal text-muted-foreground">{role.description}</span>
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
            {auth.status === "checking" ? <p className="mt-4 text-sm text-muted-foreground">{t("auth.checking")}</p> : null}
            {authError ? <p className="mt-4 text-sm text-destructive">{authError}</p> : null}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card aria-live="polite">
            <CardHeader>
              <CardDescription>{t("app.backendStatus")}</CardDescription>
              <CardTitle>
                {health.status === "online"
                  ? t("app.connected")
                  : health.status === "loading"
                    ? t("app.checking")
                    : t("app.offline")}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {health.status === "online" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    {t("app.connectedTo", {
                      service: health.data.service,
                      time: new Date(health.data.timestamp).toLocaleString()
                    })}
                  </p>
                  <Badge variant={health.data.database === "connected" ? "default" : "outline"} className="w-fit">
                    {t(`database.${health.data.database ?? "not_configured"}`)}
                  </Badge>
                </>
              ) : health.status === "offline" ? (
                <p className="text-sm text-destructive">{health.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("app.calling", { url: healthUrl })}</p>
              )}
            </CardContent>
          </Card>

          <Tabs value={currentRole} onValueChange={() => undefined}>
            <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
              {roleSections.map((role) => (
                <TabsTrigger disabled={auth.status !== "authenticated" || role.value !== currentRole} key={role.value} value={role.value}>
                  {role.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <CheckCircle2 className="h-4 w-4" />
                {t("common.openPreview")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("app.demoScope")}</DialogTitle>
                <DialogDescription>{t("app.demoScopeDescription")}</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </main>
  );
}
