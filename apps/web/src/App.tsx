import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  appName,
  aiTicketExtractRequestSchema,
  createTicketRequestSchema,
  createTicketMessageRequestSchema,
  messageVisibilitySchema,
  ticketCategorySchema,
  ticketPrioritySchema,
  ticketStatusSchema,
  updateTicketRequestSchema,
  type CreateTicketMessageRequest,
  type CreateTicketRequest,
  type AiTicketExtractResponse,
  type ApprovalDetail,
  type ApprovalListItem,
  type DemoLoginResponse,
  type DemoUser,
  type HealthResponse,
  type MessageVisibility,
  type PropertyOption,
  type TicketCategory,
  type TicketDetail,
  type TicketListItem,
  type TicketPriority,
  type TicketStatus,
  type UpdateTicketRequest,
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
type Page = "new-request" | "tickets" | "ticket-detail" | "approvals" | "approval-detail";

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
const statuses = ticketStatusSchema.options;
const messageVisibilities = messageVisibilitySchema.options;

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
  const [approvals, setApprovals] = useState<ApprovalListItem[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalDetail | null>(null);
  const [form, setForm] = useState<TicketFormState>(emptyForm);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResult, setAiResult] = useState<AiTicketExtractResponse | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    propertyId: "all"
  });
  const [managerDraft, setManagerDraft] = useState<UpdateTicketRequest>({});
  const [messageDraft, setMessageDraft] = useState("");
  const [messageVisibility, setMessageVisibility] = useState<MessageVisibility>("tenant_visible");
  const [managerError, setManagerError] = useState<string | null>(null);
  const [isSavingManager, setIsSavingManager] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [isSavingApproval, setIsSavingApproval] = useState(false);
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
      setPage(role === "tenant" ? "new-request" : role === "owner" ? "approvals" : "tickets");
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
    setApprovals([]);
    setSelectedApproval(null);
    setForm(emptyForm);
  }

  async function loadTickets(nextFilters = filters) {
    const params = new URLSearchParams();

    if (nextFilters.status !== "all") params.set("status", nextFilters.status);
    if (nextFilters.priority !== "all") params.set("priority", nextFilters.priority);
    if (nextFilters.category !== "all") params.set("category", nextFilters.category);
    if (nextFilters.propertyId !== "all") params.set("propertyId", nextFilters.propertyId);

    const query = params.toString();
    const response = await request<{ tickets: TicketListItem[] }>(`/api/tickets${query ? `?${query}` : ""}`);
    setTickets(response.tickets);
  }

  async function loadTicketDetail(ticketId: string) {
    setDataError(null);
    const response = await request<{ ticket: TicketDetail }>(`/api/tickets/${ticketId}`);
    setSelectedTicket(response.ticket);
    setManagerDraft({
      status: response.ticket.status,
      category: response.ticket.category,
      priority: response.ticket.priority,
      roomOrLocation: response.ticket.roomOrLocation ?? "",
      contactDetails: response.ticket.contactDetails ?? "",
      accessDetails: response.ticket.accessDetails ?? "",
      attachmentNote: response.ticket.attachmentNote ?? ""
    });
    setMessageDraft("");
    setMessageVisibility("tenant_visible");
    setManagerError(null);
    setSelectedTicketId(ticketId);
    setPage("ticket-detail");
  }

  async function loadApprovals() {
    const response = await request<{ approvals: ApprovalListItem[] }>("/api/approvals");
    setApprovals(response.approvals);
  }

  async function loadApprovalDetail(approvalId: string) {
    setApprovalError(null);
    const response = await request<{ approval: ApprovalDetail }>(`/api/approvals/${approvalId}`);
    setSelectedApproval(response.approval);
    setDecisionNote(response.approval.decisionNote ?? "");
    setPage("approval-detail");
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

  async function structureWithAi() {
    setAiError(null);

    const parsed = aiTicketExtractRequestSchema.safeParse({ input: aiInput.trim() });

    if (!parsed.success) {
      setAiError(t("ai.validationError"));
      return;
    }

    setIsStructuring(true);

    try {
      const response = await request<{ extraction: AiTicketExtractResponse }>("/api/ai/tickets/extract", {
        method: "POST",
        body: JSON.stringify(parsed.data)
      });

      setAiResult(response.extraction);
      setForm((current) => ({
        ...current,
        title: response.extraction.suggestedTitle,
        description: response.extraction.cleanDescription,
        category: response.extraction.category,
        priority: response.extraction.priority,
        roomOrLocation: response.extraction.roomOrLocation ?? current.roomOrLocation
      }));
    } catch (error) {
      setAiError(error instanceof Error ? error.message : t("ai.extractError"));
    } finally {
      setIsStructuring(false);
    }
  }

  function updateFilter(key: keyof typeof filters, value: string) {
    const nextFilters = { ...filters, [key]: value };
    setFilters(nextFilters);
    void loadTickets(nextFilters);
  }

  function updateManagerDraft<K extends keyof UpdateTicketRequest>(key: K, value: UpdateTicketRequest[K]) {
    setManagerDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveManagerTicket() {
    if (!selectedTicket) return;

    const parsed = updateTicketRequestSchema.safeParse(managerDraft);

    if (!parsed.success) {
      setManagerError(t("manager.validationError"));
      return;
    }

    setIsSavingManager(true);
    setManagerError(null);

    try {
      await request<{ id: string }>(`/api/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify(parsed.data)
      });
      await loadTickets();
      await loadTicketDetail(selectedTicket.id);
    } catch (error) {
      setManagerError(error instanceof Error ? error.message : t("manager.saveError"));
    } finally {
      setIsSavingManager(false);
    }
  }

  async function addTicketMessage() {
    if (!selectedTicket) return;

    const body: CreateTicketMessageRequest = {
      message: messageDraft.trim(),
      visibility: messageVisibility
    };
    const parsed = createTicketMessageRequestSchema.safeParse(body);

    if (!parsed.success) {
      setManagerError(t("manager.messageValidationError"));
      return;
    }

    setIsSavingManager(true);
    setManagerError(null);

    try {
      await request<{ id: string }>(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        body: JSON.stringify(parsed.data)
      });
      setMessageDraft("");
      await loadTicketDetail(selectedTicket.id);
    } catch (error) {
      setManagerError(error instanceof Error ? error.message : t("manager.messageSaveError"));
    } finally {
      setIsSavingManager(false);
    }
  }

  async function requestOwnerApproval(ticketId: string) {
    setManagerError(null);
    setIsSavingManager(true);

    try {
      await request<{ id: string }>(`/api/tickets/${ticketId}/approval-request`, { method: "POST" });
      await loadTickets();
      await loadTicketDetail(ticketId);
    } catch (error) {
      setManagerError(error instanceof Error ? error.message : t("approval.requestError"));
    } finally {
      setIsSavingManager(false);
    }
  }

  async function decideApproval(decision: "approve" | "reject") {
    if (!selectedApproval) return;

    const confirmed = window.confirm(decision === "approve" ? t("approval.confirmApprove") : t("approval.confirmReject"));
    if (!confirmed) return;

    setApprovalError(null);
    setIsSavingApproval(true);

    try {
      await request<{ id: string; status: string }>(`/api/approvals/${selectedApproval.id}/${decision}`, {
        method: "POST",
        body: JSON.stringify({ decisionNote: decisionNote.trim() || undefined })
      });
      await loadApprovals();
      await loadApprovalDetail(selectedApproval.id);
    } catch (error) {
      setApprovalError(error instanceof Error ? error.message : t("approval.decisionError"));
    } finally {
      setIsSavingApproval(false);
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
          setPage(response.user.role === "tenant" ? "new-request" : response.user.role === "owner" ? "approvals" : "tickets");
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
        setIsLoadingData(true);
        setDataError(null);
        const [propertyResponse, ticketResponse] = await Promise.all([
          request<{ properties: PropertyOption[] }>("/api/properties"),
          request<{ tickets: TicketListItem[] }>("/api/tickets")
        ]);
        const approvalResponse =
          auth.status === "authenticated" && auth.user.role !== "tenant"
            ? await request<{ approvals: ApprovalListItem[] }>("/api/approvals")
            : { approvals: [] };

        if (cancelled) return;

        setProperties(propertyResponse.properties);
        setTickets(ticketResponse.tickets);
        setApprovals(approvalResponse.approvals);

        const firstProperty = propertyResponse.properties[0];
        setForm((current) => ({
          ...current,
          propertyId: current.propertyId || firstProperty?.id || "",
          unitId: current.unitId || firstProperty?.units[0]?.id || ""
        }));
      } catch (error) {
        if (!cancelled) setDataError(error instanceof Error ? error.message : t("common.loadError"));
      } finally {
        if (!cancelled) setIsLoadingData(false);
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
          Sprint D8
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
          {auth.user.role === "owner" ? (
            <Button
              variant={page === "approvals" || page === "approval-detail" ? "default" : "outline"}
              onClick={() => {
                setPage("approvals");
                setSelectedApproval(null);
                void loadApprovals();
              }}
            >
              <ShieldCheck className="h-4 w-4" />
              {t("nav.approvals")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.5fr_0.8fr]">
        {auth.status === "authenticated" ? (
          <Card>
            <CardHeader>
              <CardTitle>{getMainCardTitle(auth.user.role, page, t)}</CardTitle>
              <CardDescription>
                {t("auth.signedInAs", { name: auth.user.name })} · {auth.user.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataError ? <p className="mb-4 text-sm text-destructive">{dataError}</p> : null}
              {isLoadingData ? (
                <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
              ) : page === "new-request" && auth.user.role === "tenant" ? (
                <TicketForm
                  currentUnitOptions={currentUnitOptions}
                  form={form}
                  formError={formError}
                  aiError={aiError}
                  aiInput={aiInput}
                  aiResult={aiResult}
                  isSubmitting={isSubmitting}
                  isStructuring={isStructuring}
                  onSubmit={submitTicket}
                  onAiInputChange={setAiInput}
                  onStructureWithAi={() => void structureWithAi()}
                  properties={properties}
                  t={t}
                  updateForm={updateForm}
                />
              ) : page === "approval-detail" && selectedApproval ? (
                <ApprovalDetailView
                  approval={selectedApproval}
                  approvalError={approvalError}
                  decisionNote={decisionNote}
                  isSavingApproval={isSavingApproval}
                  onDecisionNoteChange={setDecisionNote}
                  onApprove={() => void decideApproval("approve")}
                  onReject={() => void decideApproval("reject")}
                  role={auth.user.role}
                  t={t}
                />
              ) : page === "approvals" && auth.user.role === "owner" ? (
                <ApprovalList approvals={approvals} onOpenApproval={(approvalId) => void loadApprovalDetail(approvalId)} t={t} />
              ) : page === "ticket-detail" && selectedTicket ? (
                <TicketDetailView
                  isSavingManager={isSavingManager}
                  managerDraft={managerDraft}
                  managerError={managerError}
                  messageDraft={messageDraft}
                  messageVisibility={messageVisibility}
                  onAddMessage={() => void addTicketMessage()}
                  onMessageChange={setMessageDraft}
                  onMessageVisibilityChange={setMessageVisibility}
                  onRequestApproval={() => void requestOwnerApproval(selectedTicket.id)}
                  onSaveManager={() => void saveManagerTicket()}
                  onUpdateManagerDraft={updateManagerDraft}
                  role={auth.user.role}
                  ticket={selectedTicket}
                  t={t}
                />
              ) : (
                <div className="grid gap-4">
                  {auth.user.role === "property_manager" ? (
                    <ManagerFilters filters={filters} properties={properties} t={t} updateFilter={updateFilter} />
                  ) : null}
                  <TicketList tickets={tickets} t={t} onOpenTicket={(ticketId) => void loadTicketDetail(ticketId)} />
                </div>
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
  aiError,
  aiInput,
  aiResult,
  currentUnitOptions,
  form,
  formError,
  isSubmitting,
  isStructuring,
  onAiInputChange,
  onSubmit,
  onStructureWithAi,
  properties,
  t,
  updateForm
}: {
  aiError: string | null;
  aiInput: string;
  aiResult: AiTicketExtractResponse | null;
  currentUnitOptions: PropertyOption["units"];
  form: TicketFormState;
  formError: string | null;
  isSubmitting: boolean;
  isStructuring: boolean;
  onAiInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onStructureWithAi: () => void;
  properties: PropertyOption[];
  t: (key: string) => string;
  updateForm: <K extends keyof TicketFormState>(key: K, value: TicketFormState[K]) => void;
}) {
  return (
    <form className="grid gap-4" onSubmit={onSubmit}>
      <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
        <div className="grid gap-1">
          <h3 className="font-semibold">{t("ai.title")}</h3>
          <p className="text-sm text-muted-foreground">{t("ai.description")}</p>
        </div>
        <Textarea value={aiInput} onChange={(event) => onAiInputChange(event.target.value)} />
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Button disabled={isStructuring} onClick={onStructureWithAi} type="button" variant="outline">
            {isStructuring ? t("ai.structuring") : t("ai.structure")}
          </Button>
          {aiResult ? (
            <Badge variant={aiResult.source === "openai" ? "default" : "outline"}>
              {aiResult.source === "openai" ? t("ai.realAi") : t("ai.mockAi")}
            </Badge>
          ) : null}
        </div>
        {aiError ? <p className="text-sm text-destructive">{aiError}</p> : null}
        {aiResult ? (
          <div className="grid gap-2 rounded-md border bg-card p-3 text-sm">
            <p>
              <span className="font-medium">{t("ai.summary")}:</span> {aiResult.summary}
            </p>
            <p>
              <span className="font-medium">{t("ai.confidence")}:</span> {Math.round(aiResult.confidence * 100)}%
            </p>
            {aiResult.followUpQuestions.length ? (
              <div className="grid gap-1">
                <span className="font-medium">{t("ai.followUps")}</span>
                <ul className="list-disc pl-5 text-muted-foreground">
                  {aiResult.followUpQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

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

function getMainCardTitle(role: UserRole, page: Page, t: (key: string) => string) {
  if (page === "approval-detail") return t("approval.detailTitle");
  if (page === "approvals" || role === "owner") return t("approval.listTitle");
  if (role === "tenant") return t("tickets.tenantTitle");
  return t("tickets.dashboardTitle");
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

function ManagerFilters({
  filters,
  properties,
  t,
  updateFilter
}: {
  filters: { status: string; priority: string; category: string; propertyId: string };
  properties: PropertyOption[];
  t: (key: string) => string;
  updateFilter: (key: "status" | "priority" | "category" | "propertyId", value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 md:grid-cols-4">
      <FilterSelect label={t("manager.filters.status")} value={filters.status} onChange={(value) => updateFilter("status", value)}>
        <SelectItem value="all">{t("manager.filters.all")}</SelectItem>
        {statuses.map((status) => (
          <SelectItem key={status} value={status}>
            {t(`ticket.status.${status}`)}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect label={t("manager.filters.priority")} value={filters.priority} onChange={(value) => updateFilter("priority", value)}>
        <SelectItem value="all">{t("manager.filters.all")}</SelectItem>
        {priorities.map((priority) => (
          <SelectItem key={priority} value={priority}>
            {t(`ticket.priority.${priority}`)}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect label={t("manager.filters.category")} value={filters.category} onChange={(value) => updateFilter("category", value)}>
        <SelectItem value="all">{t("manager.filters.all")}</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category} value={category}>
            {t(`ticket.category.${category}`)}
          </SelectItem>
        ))}
      </FilterSelect>
      <FilterSelect label={t("manager.filters.property")} value={filters.propertyId} onChange={(value) => updateFilter("propertyId", value)}>
        <SelectItem value="all">{t("manager.filters.all")}</SelectItem>
        {properties.map((property) => (
          <SelectItem key={property.id} value={property.id}>
            {property.name}
          </SelectItem>
        ))}
      </FilterSelect>
    </div>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </label>
  );
}

function TicketDetailView({
  isSavingManager,
  managerDraft,
  managerError,
  messageDraft,
  messageVisibility,
  onAddMessage,
  onMessageChange,
  onMessageVisibilityChange,
  onRequestApproval,
  onSaveManager,
  onUpdateManagerDraft,
  role,
  t,
  ticket
}: {
  isSavingManager: boolean;
  managerDraft: UpdateTicketRequest;
  managerError: string | null;
  messageDraft: string;
  messageVisibility: MessageVisibility;
  onAddMessage: () => void;
  onMessageChange: (value: string) => void;
  onMessageVisibilityChange: (value: MessageVisibility) => void;
  onRequestApproval: () => void;
  onSaveManager: () => void;
  onUpdateManagerDraft: <K extends keyof UpdateTicketRequest>(key: K, value: UpdateTicketRequest[K]) => void;
  role: UserRole;
  t: (key: string) => string;
  ticket: TicketDetail;
}) {
  const isManager = role === "property_manager" || role === "admin";

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
        {ticket.approvalRequired ? (
          <DetailRow label={t("approval.decision")} value={t(`approval.status.${ticket.approvalStatus ?? "pending"}`)} />
        ) : null}
      </div>

      <div className="grid gap-3 rounded-lg border bg-card p-4">
        <h4 className="font-semibold">{t("tickets.timeline")}</h4>
        <div className="grid gap-3">
          <TimelineItem label={t("ticket.status.submitted")} value={new Date(ticket.createdAt).toLocaleString()} />
          {ticket.messages.map((message) => (
            <TimelineItem
              key={message.id}
              label={message.message}
              value={`${message.authorName} · ${new Date(message.createdAt).toLocaleString()}`}
            />
          ))}
          <TimelineItem label={t(`ticket.status.${ticket.status}`)} value={new Date(ticket.updatedAt).toLocaleString()} />
        </div>
      </div>

      {isManager ? (
        <div className="grid gap-4 rounded-lg border bg-card p-4">
          <h4 className="font-semibold">{t("manager.editTitle")}</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              {t("tickets.table.status")}
              <Select value={managerDraft.status ?? ticket.status} onValueChange={(value) => onUpdateManagerDraft("status", value as TicketStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {t(`ticket.status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("tickets.form.category")}
              <Select
                value={managerDraft.category ?? ticket.category}
                onValueChange={(value) => onUpdateManagerDraft("category", value as TicketCategory)}
              >
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
              <Select
                value={managerDraft.priority ?? ticket.priority}
                onValueChange={(value) => onUpdateManagerDraft("priority", value as TicketPriority)}
              >
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
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              {t("tickets.form.location")}
              <Input
                value={managerDraft.roomOrLocation ?? ""}
                onChange={(event) => onUpdateManagerDraft("roomOrLocation", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("tickets.form.contactDetails")}
              <Input
                value={managerDraft.contactDetails ?? ""}
                onChange={(event) => onUpdateManagerDraft("contactDetails", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("tickets.form.accessDetails")}
              <Input
                value={managerDraft.accessDetails ?? ""}
                onChange={(event) => onUpdateManagerDraft("accessDetails", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("tickets.form.attachmentNote")}
              <Input
                value={managerDraft.attachmentNote ?? ""}
                onChange={(event) => onUpdateManagerDraft("attachmentNote", event.target.value)}
              />
            </label>
          </div>
          <div className="grid gap-3">
            <h4 className="font-semibold">{t("manager.addUpdate")}</h4>
            <Textarea value={messageDraft} onChange={(event) => onMessageChange(event.target.value)} />
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Select value={messageVisibility} onValueChange={(value) => onMessageVisibilityChange(value as MessageVisibility)}>
                <SelectTrigger className="md:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {messageVisibilities.map((visibility) => (
                    <SelectItem key={visibility} value={visibility}>
                      {t(`message.visibility.${visibility}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button disabled={isSavingManager} onClick={onAddMessage} type="button" variant="outline">
                {t("manager.addUpdate")}
              </Button>
            </div>
          </div>
          {managerError ? <p className="text-sm text-destructive">{managerError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={isSavingManager} onClick={onSaveManager} type="button">
              {isSavingManager ? t("manager.saving") : t("manager.saveTicket")}
            </Button>
            <Button disabled={isSavingManager || ticket.approvalStatus === "pending"} onClick={onRequestApproval} type="button" variant="outline">
              {ticket.approvalStatus === "pending" ? t("approval.pending") : t("approval.request")}
            </Button>
          </div>
        </div>
      ) : null}

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

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[12px_1fr] gap-3 text-sm">
      <span className="mt-1 h-3 w-3 rounded-full bg-primary" />
      <span>
        <span className="block font-medium">{label}</span>
        <span className="block text-muted-foreground">{value}</span>
      </span>
    </div>
  );
}

function ApprovalList({
  approvals,
  onOpenApproval,
  t
}: {
  approvals: ApprovalListItem[];
  onOpenApproval: (approvalId: string) => void;
  t: (key: string) => string;
}) {
  if (!approvals.length) {
    return <p className="text-sm text-muted-foreground">{t("common.empty")}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("tickets.table.ticket")}</TableHead>
          <TableHead>{t("tickets.table.priority")}</TableHead>
          <TableHead>{t("tickets.table.status")}</TableHead>
          <TableHead>{t("tickets.table.action")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {approvals.map((approval) => (
          <TableRow key={approval.id}>
            <TableCell>
              <div className="grid gap-1">
                <span className="font-medium">{approval.ticketTitle}</span>
                <span className="text-xs text-muted-foreground">
                  {approval.propertyName}
                  {approval.unitLabel ? ` · ${approval.unitLabel}` : ""}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={approval.priority === "urgent" ? "urgent" : "outline"}>{t(`ticket.priority.${approval.priority}`)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{t(`approval.status.${approval.status}`)}</Badge>
            </TableCell>
            <TableCell>
              <Button size="sm" variant="outline" onClick={() => onOpenApproval(approval.id)}>
                {t("tickets.table.open")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ApprovalDetailView({
  approval,
  approvalError,
  decisionNote,
  isSavingApproval,
  onApprove,
  onDecisionNoteChange,
  onReject,
  role,
  t
}: {
  approval: ApprovalDetail;
  approvalError: string | null;
  decisionNote: string;
  isSavingApproval: boolean;
  onApprove: () => void;
  onDecisionNoteChange: (value: string) => void;
  onReject: () => void;
  role: UserRole;
  t: (key: string) => string;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{t(`approval.status.${approval.status}`)}</Badge>
          <Badge variant={approval.priority === "urgent" ? "urgent" : "outline"}>{t(`ticket.priority.${approval.priority}`)}</Badge>
          <Badge variant="outline">{t(`ticket.category.${approval.category}`)}</Badge>
        </div>
        <h3 className="text-2xl font-semibold">{approval.ticketTitle}</h3>
        <p className="text-sm text-muted-foreground">
          {approval.propertyName}
          {approval.unitLabel ? ` · ${approval.unitLabel}` : ""} · {new Date(approval.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
        <p>{approval.ticketDescription}</p>
        {approval.roomOrLocation ? <DetailRow label={t("tickets.form.location")} value={approval.roomOrLocation} /> : null}
        {approval.attachmentNote ? <DetailRow label={t("tickets.form.attachmentNote")} value={approval.attachmentNote} /> : null}
        <DetailRow label={t("approval.requestedBy")} value={approval.managerName} />
      </div>

      {role === "owner" && approval.status === "pending" ? (
        <div className="grid gap-3 rounded-lg border bg-card p-4">
          <label className="grid gap-2 text-sm font-medium">
            {t("approval.decisionNote")}
            <Textarea value={decisionNote} onChange={(event) => onDecisionNoteChange(event.target.value)} />
          </label>
          {approvalError ? <p className="text-sm text-destructive">{approvalError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button disabled={isSavingApproval} onClick={onApprove} type="button">
              {t("approval.approve")}
            </Button>
            <Button disabled={isSavingApproval} onClick={onReject} type="button" variant="outline">
              {t("approval.reject")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 rounded-lg border bg-muted/30 p-4">
          <DetailRow label={t("approval.decision")} value={t(`approval.status.${approval.status}`)} />
          {approval.decisionNote ? <DetailRow label={t("approval.decisionNote")} value={approval.decisionNote} /> : null}
        </div>
      )}
    </div>
  );
}
