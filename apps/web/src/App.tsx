import { useEffect, useMemo, useState } from "react";
import { appName, type HealthResponse } from "@request-assistant/shared";
import { Building2, CheckCircle2, ClipboardList, Languages, ShieldCheck, UserCog, Wrench } from "lucide-react";
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

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export function App() {
  const { i18n, t } = useTranslation();
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
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
      value: "manager",
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
    },
    {
      value: "admin",
      icon: UserCog,
      label: t("roles.admin"),
      description: t("roles.adminDescription"),
      pages: [t("nav.admin")]
    }
  ];

  const setLanguage = (language: string) => {
    void i18n.changeLanguage(language);
    window.localStorage.setItem("language", language);
  };

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
        </div>
      </header>

      <section className="grid gap-4">
        <div className="grid gap-2">
          <Badge variant="secondary" className="w-fit">
            Sprint D1
          </Badge>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-5xl">{t("app.title")}</h2>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{t("app.subtitle")}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("app.demoScope")}</CardTitle>
            <CardDescription>{t("app.demoScopeDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="tenant">
              <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4">
                {roleSections.map((role) => (
                  <TabsTrigger key={role.value} value={role.value}>
                    {role.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {roleSections.map((role) => {
                const Icon = role.icon;

                return (
                  <TabsContent key={role.value} value={role.value}>
                    <div className="grid gap-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-md bg-accent text-accent-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{role.label}</h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
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
                          {role.pages.map((page) => (
                            <TableRow key={page}>
                              <TableCell className="font-medium">{page}</TableCell>
                              <TableCell>{role.label}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{t("common.placeholder")}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
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
            <CardContent>
              {health.status === "online" ? (
                <p className="text-sm text-muted-foreground">
                  {t("app.connectedTo", {
                    service: health.data.service,
                    time: new Date(health.data.timestamp).toLocaleString()
                  })}
                </p>
              ) : health.status === "offline" ? (
                <p className="text-sm text-destructive">{health.message}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("app.calling", { url: healthUrl })}</p>
              )}
            </CardContent>
          </Card>

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
