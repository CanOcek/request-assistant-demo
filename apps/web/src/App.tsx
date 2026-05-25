import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  appName,
  createTicketRequestSchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  type CreateTicketRequest,
  type DemoLoginResponse,
  type DemoUser,
  type HealthResponse,
  type PropertyOption,
  type TicketCategory,
  type TicketDetail,
  type TicketListItem,
  type TicketPriority,
  type UserRole
} from "@request-assistant/shared";
import { Building2, ClipboardList, Languages, ListChecks, LogOut, Plus, ShieldCheck, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./components/ui/table";
import { Textarea } from "./components/ui/textarea";

type HealthState =
  | { status: "loading" }
  | { status: "online"; data: HealthResponse }
  | { status: "offline"; message: string };

type AuthState =
  | { status: "checking" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: DemoUser };

type DemoRole = Extract<UserRole, "tenant" | "property_manager" | "owner">;
type Page = "new-request" | "tickets" | "ticket-detail";

type TicketFormState = {
  propertyId: string;
  unitId: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  roomOrLocation: string;
  contactDetails: string;
  accessDetails: string;
  attachmentNote: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const tokenStorageKey = "request-assistant-demo-token";
const categories = ticketCategorySchema.options;
const priorities = ticketPrioritySchema.options;

const emptyForm: TicketFormState = {
  propertyId: "",
  unitId: "",
  title: "",
  description: "",
  category: "other",
  priority: "medium",
  roomOrLocation: "",
  contactDetails: "",
  accessDetails: "",
  attachmentNote: ""
};

export function App() {
  const { i18n, t } = useTranslation();
  const [health, setHealth] = useState<HealthState>({ status: "loading" });
  const [auth, setAuth] = useState<AuthState>({ status: "checking" });
  const [authError, setAuthError] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("new-request");
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [form, setForm] = useState<TicketFormState>(emptyForm);
  const [dataError, setDataError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const healthUrl = useMemo(() => `${apiBaseUrl}/api/health`, []);

  const roleSections = [
    {
      value: "tenant",
      icon: Wrench,
      label: t("roles.tenant"),
      description: t("roles.tenantDescription")
    },
    {
      value: "property_manager",
      icon: Building2,
      label: t("roles.manager"),
      description: t("roles.managerDescription")
    },
    {
      value: "owner",
      icon: ShieldCheck,
      label: t("roles.owner"),
      description: t("roles.ownerDescription")
    }
  ] satisfies Array<{
    value: DemoRole;
    icon: typeof Wrench;
    label: string;
    description: string;
  }>;

  const currentUnitOptions = properties.find((property) => property.id === form.propertyId)?.units ?? [];

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
    setDataError(null);

    try {
      const response = await request<DemoLoginResponse>("/api/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({ role })
      });

      window.localStorage.setItem(tokenStorageKey, response.token);
      setAuth({ status: "authenticated", user: response.user });
      setPage(role === "tenant" ? "new-request" : "tickets");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : t("auth.loginFailed"));
    }
  }

  function logout() {
    window.localStorage.removeItem(tokenStorageKey);
    setAuth({ status: "anonymous" });
    setAuthError(null);
    setDataError(null);
    setTickets([]);
    setProperties([]);
    setSelectedTicket(null);
    setSelectedTicketId(null);
    setForm(emptyForm);
  }

  async function loadTickets() {
    const response = await request<{ tickets: TicketListItem[] }>("/api/tickets");
    setTickets(response.tickets);
  }

  async function loadTicketDetail(ticketId: string) {
    setDataError(null);
    const response = await request<{ ticket: TicketDetail }>(`/api/tickets/${ticketId}`);
    setSelectedTicket(response.ticket);
    setSelectedTicketId(ticketId);
    setPage("ticket-detail");
  }

  function updateForm<K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "propertyId" ? { unitId: "" } : {})
    }));
  }

  function normalizeForm(): CreateTicketRequest {
    return {
      propertyId: form.propertyId,
      unitId: form.unitId || undefined,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      roomOrLocation: form.roomOrLocation.trim() || undefined,
      contactDetails: form.contactDetails.trim() || undefined,
      accessDetails: form.accessDetails.trim() || undefined,
      attachmentNote: form.attachmentNote.trim() || undefined
    };
  }

  async function submitTicket(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const body = normalizeForm();
    const parsed = createTicketRequestSchema.safeParse(body);

    if (!parsed.success) {
      setFormError(t("tickets.form.validationError"));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await request<{ id: string }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify(parsed.data)
      });

      setForm({ ...emptyForm, propertyId: form.propertyId, unitId: form.unitId });
      await loadTickets();
      await loadTicketDetail(response.id);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("tickets.form.submitError"));
    } finally {
      setIsSubmitting(false);
    }
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
        if (!cancelled) {
          setAuth({ status: "authenticated", user: response.user });
          setPage(response.user.role === "tenant" ? "new-request" : "tickets");
        }
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

  useEffect(() => {
    if (auth.status !== "authenticated") return;

    let cancelled = false;

    async function loadInitialData() {
      try {
        setDataError(null);
        const [propertyResponse, ticketResponse] = await Promise.all([
          request<{ properties: PropertyOption[] }>("/api/properties"),
          request<{ tickets: TicketListItem[] }>("/api/tickets")
        ]);

        if (cancelled) return;

        setProperties(propertyResponse.properties);
        setTickets(ticketResponse.tickets);

        const firstProperty = propertyResponse.properties[0];
        setForm((current) => ({
          ...current,
          propertyId: current.propertyId || firstProperty?.id || "",
          unitId: current.unitId || firstProperty?.units[0]?.id || ""
        }));
      } catch (error) {
        if (!cancelled) setDataError(error instanceof Error ? error.message : t("common.loadError"));
      }
    }

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [auth.status]);

  return (
    <main className="mx-auto grid w-[min(1180px,calc(100%-32px))] gap-6 py-6 md:py-10">
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

      <section className="grid gap-2">
        <Badge variant="secondary" className="w-fit">
          Sprint D4
        </Badge>
        <h2 className="max-w-3xl text-3xl font-semibold tracking-normal md:text-5xl">{t("app.title")}</h2>
        <p className="max-w-2xl text-base text-muted-foreground md:text-lg">{t("app.subtitle")}</p>
      </section>

      {auth.status === "authenticated" ? (
        <div className="flex flex-wrap items-center gap-2">
          {auth.user.role === "tenant" ? (
            <Button variant={page === "new-request" ? "default" : "outline"} onClick={() => setPage("new-request")}>
              <Plus className="h-4 w-4" />
              {t("nav.newRequest")}
            </Button>
          ) : null}
          <Button
            variant={page === "tickets" || page === "ticket-detail" ? "default" : "outline"}
            onClick={() => {
              setPage("tickets");
              setSelectedTicket(null);
              setSelectedTicketId(null);
              void loadTickets();
            }}
          >
            <ListChecks className="h-4 w-4" />
            {auth.user.role === "tenant" ? t("nav.myTickets") : t("nav.managerDashboard")}
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
        {auth.status === "authenticated" ? (
          <Card>
            <CardHeader>
              <CardTitle>{auth.user.role === "tenant" ? t("tickets.tenantTitle") : t("tickets.dashboardTitle")}</CardTitle>
              <CardDescription>
                {t("auth.signedInAs", { name: auth.user.name })} · {auth.user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataError ? <p className="mb-4 text-sm text-destructive">{dataError}</p> : null}
              {page === "new-request" && auth.user.role === "tenant" ? (
                <TicketForm
                  currentUnitOptions={currentUnitOptions}
                  form={form}
                  formError={formError}
                  isSubmitting={isSubmitting}
                  onSubmit={submitTicket}
                  properties={properties}
                  t={t}
                  updateForm={updateForm}
                />
              ) : page === "ticket-detail" && selectedTicket ? (
                <TicketDetailView ticket={selectedTicket} t={t} />
              ) : (
                <TicketList tickets={tickets} t={t} onOpenTicket={(ticketId) => void loadTicketDetail(ticketId)} />
              )}
              {selectedTicketId && !selectedTicket && page === "ticket-detail" ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t("auth.chooseDemoUser")}</CardTitle>
              <CardDescription>{t("auth.chooseDemoUserDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
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
              {auth.status === "checking" ? <p className="mt-4 text-sm text-muted-foreground">{t("auth.checking")}</p> : null}
              {authError ? <p className="mt-4 text-sm text-destructive">{authError}</p> : null}
            </CardContent>
          </Card>
        )}

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
      </section>
    </main>
  );
}

function TicketForm({
  currentUnitOptions,
  form,
  formError,
  isSubmitting,
  onSubmit,
  properties,
  t,
  updateForm
}: {
  currentUnitOptions: PropertyOption["units"];
  form: TicketFormState;
  formError: string | null;
  isSubmitting: boolean;
  onSubmit: (event: FormEvent) => void;
  properties: PropertyOption[];
  t: (key: string) => string;
  updateForm: <K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.property")}
          <Select value={form.propertyId} onValueChange={(value) => updateForm("propertyId", value)}>
            <SelectTrigger>
              <SelectValue placeholder={t("tickets.form.selectProperty")} />
            </SelectTrigger>
            <SelectContent>
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.unit")}
          <Select value={form.unitId} onValueChange={(value) => updateForm("unitId", value)}>
            <SelectTrigger>
              <SelectValue placeholder={t("tickets.form.selectUnit")} />
            </SelectTrigger>
            <SelectContent>
              {currentUnitOptions.map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        {t("tickets.form.title")}
        <Input value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        {t("tickets.form.description")}
        <Textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.category")}
          <Select value={form.category} onValueChange={(value) => updateForm("category", value as TicketCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(`ticket.category.${category}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.priority")}
          <Select value={form.priority} onValueChange={(value) => updateForm("priority", value as TicketPriority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {t(`ticket.priority.${priority}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.location")}
          <Input value={form.roomOrLocation} onChange={(event) => updateForm("roomOrLocation", event.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.contactDetails")}
          <Input value={form.contactDetails} onChange={(event) => updateForm("contactDetails", event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          {t("tickets.form.accessDetails")}
          <Input value={form.accessDetails} onChange={(event) => updateForm("accessDetails", event.target.value)} />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        {t("tickets.form.attachmentNote")}
        <Input value={form.attachmentNote} onChange={(event) => updateForm("attachmentNote", event.target.value)} />
      </label>

      {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

      <Button className="w-fit" disabled={isSubmitting} type="submit">
        {isSubmitting ? t("tickets.form.submitting") : t("tickets.form.submit")}
      </Button>
    </form>
  );
}

function TicketList({
  onOpenTicket,
  t,
  tickets
}: {
  onOpenTicket: (ticketId: string) => void;
  t: (key: string) => string;
  tickets: TicketListItem[];
}) {
  if (!tickets.length) {
    return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("tickets.table.ticket")}</TableHead>
          <TableHead>{t("tickets.table.category")}</TableHead>
          <TableHead>{t("tickets.table.priority")}</TableHead>
          <TableHead>{t("tickets.table.status")}</TableHead>
          <TableHead>{t("tickets.table.action")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <div className="grid gap-1">
                <span className="font-medium">{ticket.title}</span>
                <span className="text-xs text-muted-foreground">
                  {ticket.propertyName}
                  {ticket.unitLabel ? ` · ${ticket.unitLabel}` : ""}
                </span>
              </div>
            </TableCell>
            <TableCell>{t(`ticket.category.${ticket.category}`)}</TableCell>
            <TableCell>
              <Badge variant={ticket.priority === "urgent" ? "urgent" : "outline"}>{t(`ticket.priority.${ticket.priority}`)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{t(`ticket.status.${ticket.status}`)}</Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onClick={() => onOpenTicket(ticket.id)}>
                {t("tickets.table.open")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TicketDetailView({ t, ticket }: { t: (key: string) => string; ticket: TicketDetail }) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t(`ticket.status.${ticket.status}`)}</Badge>
          <Badge variant={ticket.priority === "urgent" ? "urgent" : "outline"}>{t(`ticket.priority.${ticket.priority}`)}</Badge>
          <Badge variant="outline">{t(`ticket.category.${ticket.category}`)}</Badge>
        </div>
        <h3 className="text-2xl font-semibold">{ticket.title}</h3>
        <p className="text-sm text-muted-foreground">
          {ticket.propertyName}
          {ticket.unitLabel ? ` · ${ticket.unitLabel}` : ""} · {new Date(ticket.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
        <p>{ticket.description}</p>
        {ticket.roomOrLocation ? <DetailRow label={t("tickets.form.location")} value={ticket.roomOrLocation} /> : null}
        {ticket.contactDetails ? <DetailRow label={t("tickets.form.contactDetails")} value={ticket.contactDetails} /> : null}
        {ticket.accessDetails ? <DetailRow label={t("tickets.form.accessDetails")} value={ticket.accessDetails} /> : null}
        {ticket.attachmentNote ? <DetailRow label={t("tickets.form.attachmentNote")} value={ticket.attachmentNote} /> : null}
      </div>

      <div className="grid gap-3">
        <h4 className="font-semibold">{t("tickets.messages")}</h4>
        {ticket.messages.length ? (
          ticket.messages.map((message) => (
            <div className="rounded-lg border p-3" key={message.id}>
              <p className="text-sm">{message.message}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {message.authorName} · {new Date(message.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("common.empty")}</p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}
