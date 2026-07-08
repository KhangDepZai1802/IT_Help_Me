"use client";

import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  HardDrive,
  History,
  Inbox,
  LayoutDashboard,
  LogIn,
  LogOut,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  UserRoundCheck,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/constants";
import { initialDepartments, initialRequests, initialStaff } from "@/lib/sample-data";
import type { Department, ITRequest, ITStaff, Priority, Rating, RequestStatus, Role } from "@/lib/types";

const STORAGE_KEY = "it-help-me-state-v1";
const IT_LOGIN_PASSWORD = "123456";

type LoginSession = {
  role: Role;
  departmentId: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}

function makeRequestId() {
  const date = new Date();
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const serial = String(Math.floor(100 + Math.random() * 900));
  return `REQ-${yy}${mm}${dd}-${serial}`;
}

function safeCsvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function monthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthKey() {
  return monthKey(new Date().toISOString());
}

function matchesMonth(value: string, selectedMonth: string) {
  return monthKey(value) === selectedMonth;
}

function isToday(value: string) {
  const date = new Date(value);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

export function PortalShell() {
  const [role, setRole] = useState<Role>("IT");
  const [session, setSession] = useState<LoginSession | null>(null);
  const [loginRole, setLoginRole] = useState<Role | "">("");
  const [loginDepartmentId, setLoginDepartmentId] = useState(initialDepartments[0].id);
  const [loginPassword, setLoginPassword] = useState("");
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [staff, setStaff] = useState<ITStaff[]>(initialStaff);
  const [requests, setRequests] = useState<ITRequest[]>(initialRequests);
  const [activeDepartmentId, setActiveDepartmentId] = useState(initialDepartments[0].id);
  const [selectedRequestId, setSelectedRequestId] = useState(initialRequests[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey());
  const [hasLoaded, setHasLoaded] = useState(false);

  const [requesterName, setRequesterName] = useState("");
  const [newRequestDepartmentId, setNewRequestDepartmentId] = useState(initialDepartments[0].id);
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("MEDIUM");
  const [attachmentName, setAttachmentName] = useState("");

  const [draftStatus, setDraftStatus] = useState<RequestStatus>("NEW");
  const [draftAssignedToId, setDraftAssignedToId] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          departments: Department[];
          staff: ITStaff[];
          requests: ITRequest[];
          activeDepartmentId: string;
        };
        setDepartments(parsed.departments);
        setStaff(parsed.staff);
        setRequests(parsed.requests);
        setActiveDepartmentId(parsed.activeDepartmentId);
        setLoginDepartmentId(parsed.activeDepartmentId);
        setNewRequestDepartmentId(parsed.activeDepartmentId);
        setSelectedRequestId(parsed.requests[0]?.id ?? "");
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ departments, staff, requests, activeDepartmentId })
    );
  }, [activeDepartmentId, departments, hasLoaded, requests, staff]);

  const departmentName = (id: string) => departments.find((department) => department.id === id)?.name ?? "Không rõ";
  const staffName = (id: string | null) => staff.find((member) => member.id === id)?.fullName ?? "Chưa gán";

  function pickFirstVisibleRequestId(nextRole: Role, departmentId: string) {
    return (
      requests.find((request) => request.status !== "DONE" && (nextRole === "IT" || request.departmentId === departmentId))?.id ??
      ""
    );
  }

  function resetViewFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loginRole) {
      window.alert("Vui lòng chọn tài khoản/phòng ban trước khi vào hệ thống.");
      return;
    }

    if (loginRole === "DEPARTMENT" && !loginDepartmentId) {
      window.alert("Vui lòng chọn phòng ban trước khi vào hệ thống.");
      return;
    }

    if (loginRole === "IT" && loginPassword !== IT_LOGIN_PASSWORD) {
      window.alert("Mật khẩu phòng IT không đúng.");
      return;
    }

    const nextDepartmentId = loginRole === "DEPARTMENT" ? loginDepartmentId : activeDepartmentId;
    const loginLabel = loginRole === "IT" ? "Phòng IT" : departmentName(loginDepartmentId);
    const shouldEnter = window.confirm(`Chắc chưa?\nBạn sẽ đăng nhập bằng tài khoản ${loginLabel}.`);
    if (!shouldEnter) return;

    setSession({ role: loginRole, departmentId: nextDepartmentId });
    setRole(loginRole);
    if (loginRole === "DEPARTMENT") {
      setActiveDepartmentId(loginDepartmentId);
      setNewRequestDepartmentId(loginDepartmentId);
    }
    resetViewFilters();
    setSelectedRequestId(pickFirstVisibleRequestId(loginRole, nextDepartmentId));
  }

  function handleLogout() {
    setSession(null);
    setLoginRole("");
    setLoginPassword("");
    setRole("IT");
    resetViewFilters();
  }

  function handleRoleChange(nextRole: Role) {
    if (!session) return;
    if (session.role !== "IT" && nextRole === "IT") return;

    setRole(nextRole);
    resetViewFilters();
    setSelectedRequestId(pickFirstVisibleRequestId(nextRole, activeDepartmentId));
  }

  const todayPendingRequests = useMemo(() => {
    return requests
      .filter((request) => (role === "IT" ? true : request.departmentId === activeDepartmentId))
      .filter((request) => request.status !== "DONE" && request.status !== "REJECTED")
      .filter((request) => isToday(request.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [activeDepartmentId, requests, role]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => (role === "IT" ? true : request.departmentId === activeDepartmentId))
      .filter((request) => request.status !== "DONE" && request.status !== "REJECTED")
      .filter((request) => (statusFilter === "ALL" ? true : request.status === statusFilter))
      .filter((request) => (departmentFilter === "ALL" || role !== "IT" ? true : request.departmentId === departmentFilter))
      .filter((request) => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return true;
        return [request.id, request.requesterName, request.content, departmentName(request.departmentId), staffName(request.assignedToId)]
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [activeDepartmentId, departmentFilter, query, requests, role, statusFilter]);

  const selectedRequest = filteredRequests.find((request) => request.id === selectedRequestId) ?? filteredRequests[0];

  useEffect(() => {
    if (!selectedRequest) return;
    setDraftStatus(selectedRequest.status);
    setDraftAssignedToId(selectedRequest.assignedToId ?? "");
    setDraftNote(selectedRequest.resolutionNote);
  }, [selectedRequest?.id, selectedRequest]);

  const requestsForMonth = useMemo(() => {
    return requests
      .filter((request) => (role === "IT" ? true : request.departmentId === activeDepartmentId))
      .filter((request) => matchesMonth(request.createdAt, selectedMonth));
  }, [activeDepartmentId, requests, role, selectedMonth]);

  const statusStats = useMemo(() => {
    return (["NEW", "IN_PROGRESS", "DONE", "REJECTED"] as RequestStatus[]).map((status) => ({
      status,
      count: requestsForMonth.filter((request) => request.status === status).length
    }));
  }, [requestsForMonth]);

  const departmentStats = useMemo(() => {
    const visibleDepartments = role === "IT" ? departments : departments.filter((department) => department.id === activeDepartmentId);
    return visibleDepartments
      .map((department) => ({
        name: department.name,
        count: requestsForMonth.filter((request) => request.departmentId === department.id).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activeDepartmentId, departments, requestsForMonth, role]);

  const historyRequestsForMonth = useMemo(() => {
    return requestsForMonth
      .filter((request) => request.status === "DONE" || request.status === "REJECTED")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [requestsForMonth]);

  function handleCreateRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requesterName.trim() || !newContent.trim()) return;

    const createdAt = new Date().toISOString();
    const id = makeRequestId();
    const request: ITRequest = {
      id,
      departmentId: role === "DEPARTMENT" ? activeDepartmentId : newRequestDepartmentId,
      requesterName: requesterName.trim(),
      content: newContent.trim(),
      priority: newPriority,
      status: "NEW",
      assignedToId: null,
      resolutionNote: "",
      attachmentName,
      createdAt,
      updatedAt: createdAt,
      history: [
        {
          id: `${id}-history-new`,
          requestId: id,
          oldStatus: null,
          newStatus: "NEW",
          changedById: null,
          note: "Tạo yêu cầu",
          changedAt: createdAt
        }
      ]
    };

    setRequests((current) => [request, ...current]);
    setSelectedRequestId(id);
    setRequesterName("");
    setNewContent("");
    setNewPriority("MEDIUM");
    setAttachmentName("");
  }

  function handleUpdateRequest() {
    if (!selectedRequest) return;
    if ((draftStatus === "DONE" || draftStatus === "REJECTED") && !draftNote.trim()) {
      window.alert("Cần nhập ghi chú kết quả hoặc lý do trước khi đóng yêu cầu.");
      return;
    }

    const changedAt = new Date().toISOString();
    setRequests((current) =>
      current.map((request) => {
        if (request.id !== selectedRequest.id) return request;

        const statusChanged = request.status !== draftStatus;
        return {
          ...request,
          status: draftStatus,
          assignedToId: draftAssignedToId || null,
          resolutionNote: draftNote.trim(),
          updatedAt: changedAt,
          history: statusChanged
            ? [
                {
                  id: `${request.id}-history-${changedAt}`,
                  requestId: request.id,
                  oldStatus: request.status,
                  newStatus: draftStatus,
                  changedById: draftAssignedToId || null,
                  note: draftNote.trim() || "Cập nhật trạng thái",
                  changedAt
                },
                ...request.history
              ]
            : request.history
        };
      })
    );
  }

  function handleAddDepartment() {
    const name = newDepartmentName.trim();
    if (!name) return;
    const department = { id: `dept-${Date.now()}`, name, isActive: true };
    setDepartments((current) => [...current, department]);
    setNewDepartmentName("");
  }

  function handleAddStaff() {
    const fullName = newStaffName.trim();
    if (!fullName) return;
    setStaff((current) => [...current, { id: `it-${Date.now()}`, fullName, isActive: true }]);
    setNewStaffName("");
  }

  function handleDeleteStaff(staffId: string) {
    const member = staff.find((item) => item.id === staffId);
    if (!member) return;
    const shouldDelete = window.confirm(`Xóa ${member.fullName} khỏi danh sách nhân viên IT?`);
    if (!shouldDelete) return;

    setStaff((current) => current.filter((item) => item.id !== staffId));
    setRequests((current) =>
      current.map((request) => (request.assignedToId === staffId ? { ...request, assignedToId: null } : request))
    );
    if (draftAssignedToId === staffId) setDraftAssignedToId("");
  }

  function handleDeleteRequest(requestId: string) {
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    const shouldDelete = window.confirm(`Bạn có chắc muốn xóa phiếu ${request.id} của ${request.requesterName}?`);
    if (!shouldDelete) return;

    setRequests((current) => {
      const remaining = current.filter((item) => item.id !== requestId);
      if (selectedRequestId === requestId) {
        const nextRequest = remaining.find(
          (item) => item.status !== "DONE" && item.status !== "REJECTED" && (role === "IT" || item.departmentId === activeDepartmentId)
        );
        setSelectedRequestId(nextRequest?.id ?? "");
      }
      return remaining;
    });
  }

  function handleRateRequest(requestId: string, rating: Rating) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId && request.status === "DONE" && !request.rating
          ? { ...request, rating, updatedAt: new Date().toISOString() }
          : request
      )
    );
  }

  function exportCsv() {
    const header = ["Mã", "Phòng ban", "Người gửi", "Nội dung", "Ưu tiên", "Trạng thái", "Phụ trách", "Ghi chú", "Ngày tạo"];
    const rows = filteredRequests.map((request) => [
      request.id,
      departmentName(request.departmentId),
      request.requesterName,
      request.content,
      priorityLabels[request.priority],
      statusLabels[request.status],
      staffName(request.assignedToId),
      request.resolutionNote,
      formatDateTime(request.createdAt)
    ]);
    const csv = [header, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "it-help-me-requests.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!hasLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-slate-900">
        <div className="rounded-lg bg-white px-5 py-4 text-sm font-black text-slate-600 shadow-sm ring-1 ring-slate-200">
          Đang tải hệ thống...
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <LoginScreen
        departments={departments}
        loginDepartmentId={loginDepartmentId}
        loginPassword={loginPassword}
        loginRole={loginRole}
        setLoginDepartmentId={setLoginDepartmentId}
        setLoginPassword={setLoginPassword}
        setLoginRole={setLoginRole}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 px-4 py-5 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[330px] hero-panel" />
      <section className="relative mx-auto max-w-7xl">
        <header className="relative z-20 overflow-visible rounded-lg px-5 py-5 text-white shadow-soft ring-1 ring-white/20 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute -right-24 -top-28 size-72 rounded-full bg-white/18 blur-3xl" />
            <div className="absolute bottom-0 left-1/4 h-28 w-80 rounded-full bg-amber-200/10 blur-3xl" />
          </div>
          <nav className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-white/18 ring-1 ring-white/28">
                <HardDrive size={20} />
              </div>
              <div>
                <p className="text-xl font-black tracking-wide">IT HELP ME!</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {session.role === "IT" ? (
                <div className="flex rounded-md bg-white/16 p-1 ring-1 ring-white/25">
                  <button
                    className={`rounded px-3 py-2 text-sm font-extrabold ${role === "DEPARTMENT" ? "bg-white text-aqua" : "text-white/82"}`}
                    onClick={() => handleRoleChange("DEPARTMENT")}
                    type="button"
                  >
                    Phòng ban
                  </button>
                  <button
                    className={`rounded px-3 py-2 text-sm font-extrabold ${role === "IT" ? "bg-white text-aqua" : "text-white/82"}`}
                    onClick={() => handleRoleChange("IT")}
                    type="button"
                  >
                    IT
                  </button>
                </div>
              ) : (
                <span className="rounded-md bg-white px-3 py-2 text-sm font-extrabold text-aqua shadow-sm">
                  Phòng ban
                </span>
              )}

              {role === "DEPARTMENT" ? (
                <CustomSelect
                  className="w-44"
                  buttonClassName="glass-field h-10 border-white/25 bg-white/20 text-white shadow-none hover:bg-white/25"
                  disabled={session.role === "DEPARTMENT"}
                  value={activeDepartmentId}
                  options={departments.map((department) => ({ value: department.id, label: department.name }))}
                  onChange={(value) => {
                    setActiveDepartmentId(value);
                    setNewRequestDepartmentId(value);
                    setSelectedRequestId(pickFirstVisibleRequestId("DEPARTMENT", value));
                  }}
                />
              ) : null}

              <button
                className="flex h-10 items-center gap-2 rounded-md bg-white/16 px-3 text-sm font-extrabold text-white ring-1 ring-white/25 hover:bg-white/24"
                type="button"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Đăng xuất
              </button>

              <NotificationBell
                departmentName={departmentName}
                requests={todayPendingRequests}
                setSelectedRequestId={setSelectedRequestId}
              />
            </div>
          </nav>
        </header>

        <section className="grid items-start gap-5 pt-6 lg:grid-cols-[1.05fr_1.35fr_1fr]">
          {role === "DEPARTMENT" ? (
            <RequestForm
              attachmentName={attachmentName}
              departments={departments}
              newContent={newContent}
              newPriority={newPriority}
              newRequestDepartmentId={role === "DEPARTMENT" ? activeDepartmentId : newRequestDepartmentId}
              requesterName={requesterName}
              setAttachmentName={setAttachmentName}
              setNewContent={setNewContent}
              setNewPriority={setNewPriority}
              setNewRequestDepartmentId={setNewRequestDepartmentId}
              setRequesterName={setRequesterName}
              onSubmit={handleCreateRequest}
              lockDepartment={role === "DEPARTMENT"}
            />
          ) : (
            <ITEditor
              draftAssignedToId={draftAssignedToId}
              draftNote={draftNote}
              draftStatus={draftStatus}
              request={selectedRequest}
              setDraftAssignedToId={setDraftAssignedToId}
              setDraftNote={setDraftNote}
              setDraftStatus={setDraftStatus}
              staff={staff}
              staffName={staffName}
              onSave={handleUpdateRequest}
            />
          )}

          <TicketBoard
            departmentFilter={departmentFilter}
            departmentName={departmentName}
            departments={departments}
            filteredRequests={filteredRequests}
            role={role}
            selectedRequestId={selectedRequest?.id ?? ""}
            setDepartmentFilter={setDepartmentFilter}
            setSelectedRequestId={setSelectedRequestId}
            setStatusFilter={setStatusFilter}
            staffName={staffName}
            statusFilter={statusFilter}
            query={query}
            setQuery={setQuery}
            onExport={exportCsv}
            onOpenHistory={() => setIsHistoryOpen(true)}
            historyCount={historyRequestsForMonth.length}
            onDeleteRequest={role === "IT" ? handleDeleteRequest : undefined}
          />

          <InsightsPanel
            departmentStats={departmentStats}
            requestsForMonthCount={requestsForMonth.length}
            role={role}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            statusStats={statusStats}
            onOpenCatalog={() => setIsCatalogOpen(true)}
          />
        </section>

        <RequestHistoryModal
          departmentName={departmentName}
          historyRequests={historyRequestsForMonth}
          isOpen={isHistoryOpen}
          role={role}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          onClose={() => setIsHistoryOpen(false)}
          onRateRequest={handleRateRequest}
        />
        <CatalogModal
          isOpen={isCatalogOpen}
          newDepartmentName={newDepartmentName}
          newStaffName={newStaffName}
          setNewDepartmentName={setNewDepartmentName}
          setNewStaffName={setNewStaffName}
          staff={staff}
          onAddDepartment={handleAddDepartment}
          onAddStaff={handleAddStaff}
          onClose={() => setIsCatalogOpen(false)}
          onDeleteStaff={handleDeleteStaff}
        />
      </section>
    </main>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200/70 ${className}`}>{children}</div>;
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-md bg-aqua/12 text-aqua">
          <Icon size={18} />
        </span>
        <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">{title}</h2>
      </div>
    </div>
  );
}

function LoginScreen({
  departments,
  loginDepartmentId,
  loginPassword,
  loginRole,
  setLoginDepartmentId,
  setLoginPassword,
  setLoginRole,
  onSubmit
}: {
  departments: Department[];
  loginDepartmentId: string;
  loginPassword: string;
  loginRole: Role | "";
  setLoginDepartmentId: (value: string) => void;
  setLoginPassword: (value: string) => void;
  setLoginRole: (value: Role | "") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const canSubmit = (loginRole === "IT" && Boolean(loginPassword)) || (loginRole === "DEPARTMENT" && Boolean(loginDepartmentId));

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] hero-panel" />
      <section className="relative mx-auto flex min-h-[calc(100vh-48px)] max-w-3xl items-center">
        <form className="w-full rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-7" onSubmit={onSubmit}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-md bg-aqua text-white shadow-lg shadow-aqua/20">
              <HardDrive size={24} />
            </div>
            <div>
              <p className="text-2xl font-black tracking-wide text-slate-950">IT HELP ME!</p>
              <p className="mt-1 text-sm font-bold text-slate-500">Chọn tài khoản/phòng ban trước khi vào hệ thống.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              className={`rounded-md border p-4 text-left transition ${
                loginRole === "DEPARTMENT"
                  ? "border-aqua bg-aqua/8 shadow-sm ring-4 ring-aqua/10"
                  : "border-slate-200 bg-white hover:border-aqua/50"
              }`}
              type="button"
              aria-pressed={loginRole === "DEPARTMENT"}
              onClick={() => {
                setLoginRole("DEPARTMENT");
                setLoginPassword("");
              }}
            >
              <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-aqua/12 text-aqua">
                <UserRoundCheck size={20} />
              </span>
              <span className="block text-sm font-black uppercase tracking-wide text-slate-900">Phòng ban khác</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">
                Chỉ gửi yêu cầu và xem lịch sử của phòng ban đã chọn.
              </span>
            </button>

            <button
              className={`rounded-md border p-4 text-left transition ${
                loginRole === "IT"
                  ? "border-aqua bg-aqua/8 shadow-sm ring-4 ring-aqua/10"
                  : "border-slate-200 bg-white hover:border-aqua/50"
              }`}
              type="button"
              aria-pressed={loginRole === "IT"}
              onClick={() => setLoginRole("IT")}
            >
              <span className="mb-3 flex size-10 items-center justify-center rounded-md bg-slate-900 text-white">
                <ShieldCheck size={20} />
              </span>
              <span className="block text-sm font-black uppercase tracking-wide text-slate-900">Phòng IT</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-slate-500">
                Xử lý toàn bộ ticket và có thể chuyển sang giao diện phòng ban.
              </span>
            </button>
          </div>

          <label className="mt-5 block">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Phòng ban đăng nhập</span>
            {loginRole === "IT" ? (
              <div className="mt-2 flex h-11 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm font-bold text-slate-500 shadow-sm">
                Phòng IT
              </div>
            ) : (
              <CustomSelect
                className="mt-2"
                disabled={loginRole !== "DEPARTMENT"}
                value={loginDepartmentId}
                options={departments.map((department) => ({ value: department.id, label: department.name }))}
                onChange={setLoginDepartmentId}
              />
            )}
          </label>

          {loginRole === "IT" ? (
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Mật khẩu phòng IT</span>
              <input
                className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-aqua"
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
          ) : null}

          <button
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-black text-white shadow-lg shadow-aqua/15 hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            type="submit"
            disabled={!canSubmit}
          >
            <LogIn size={18} />
            Vào hệ thống
          </button>
        </form>
      </section>
    </main>
  );
}

function CustomSelect<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
  className = "",
  buttonClassName = "",
  menuClassName = ""
}: {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div
      className={`relative ${className}`}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        className={`flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-sm font-bold text-slate-900 shadow-sm outline-none transition hover:border-aqua/60 focus:border-aqua focus:ring-4 focus:ring-aqua/12 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${buttonClassName || "h-11"}`}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="min-w-0 truncate">{selectedOption?.label}</span>
        <ChevronDown className={`shrink-0 transition ${isOpen ? "rotate-180" : ""}`} size={16} />
      </button>

      {isOpen ? (
        <div
          className={`absolute left-0 top-[calc(100%+8px)] z-50 max-h-72 w-full min-w-44 overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 text-slate-900 shadow-soft ${menuClassName}`}
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left text-sm font-bold transition ${
                  isSelected ? "bg-aqua text-white" : "text-slate-700 hover:bg-aqua/10 hover:text-aqua"
                }`}
                type="button"
                role="option"
                aria-selected={isSelected}
                key={option.value}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {isSelected ? <CheckCircle2 size={15} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function MonthPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear] = value.split("-").map(Number);
  const [viewYear, setViewYear] = useState(selectedYear);
  const selectedMonthIndex = Number(value.split("-")[1]) - 1;
  const currentMonth = currentMonthKey();
  const monthNames = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) =>
        new Intl.DateTimeFormat("vi-VN", { month: "short" }).format(new Date(viewYear, index, 1))
      ),
    [viewYear]
  );

  useEffect(() => {
    setViewYear(Number(value.split("-")[0]));
  }, [value]);

  return (
    <div
      className="relative mt-2"
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        className="flex h-10 w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-sm font-bold text-slate-900 shadow-sm outline-none transition hover:border-aqua/60 focus:border-aqua focus:ring-4 focus:ring-aqua/12"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="min-w-0 truncate capitalize">{formatMonthLabel(value)}</span>
        <CalendarDays className="shrink-0 text-slate-900" size={17} />
      </button>

      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-[120] w-full min-w-72 rounded-lg border border-slate-200 bg-white p-3 text-slate-900 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-2 rounded-md bg-slate-50 p-1 ring-1 ring-slate-200">
            <button
              className="flex size-8 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-aqua"
              type="button"
              aria-label="Nam truoc"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setViewYear((year) => year - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <span className="text-sm font-black text-slate-900">{viewYear}</span>
            <button
              className="flex size-8 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-aqua"
              type="button"
              aria-label="Nam sau"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setViewYear((year) => year + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((label, index) => {
              const monthValue = `${viewYear}-${String(index + 1).padStart(2, "0")}`;
              const isSelected = viewYear === selectedYear && index === selectedMonthIndex;
              return (
                <button
                  className={`h-9 rounded-md text-sm font-black capitalize transition ${
                    isSelected
                      ? "bg-aqua text-white shadow-sm shadow-aqua/20"
                      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-aqua/10 hover:text-aqua"
                  }`}
                  type="button"
                  key={monthValue}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(monthValue);
                    setIsOpen(false);
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            className="mt-3 h-9 w-full rounded-md bg-slate-900 text-xs font-black text-white hover:bg-slate-800"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange(currentMonth);
              setIsOpen(false);
            }}
          >
            Tháng này
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NotificationBell({
  departmentName,
  requests,
  setSelectedRequestId
}: {
  departmentName: (id: string) => string;
  requests: ITRequest[];
  setSelectedRequestId: (value: string) => void;
}) {
  return (
    <div className="group relative">
      <button
        className="relative flex size-10 items-center justify-center rounded-md bg-white/18 text-white ring-1 ring-white/24 hover:bg-white/24"
        type="button"
        aria-label="Thông báo"
      >
        <Bell size={18} />
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-300 px-1.5 py-0.5 text-center text-[11px] font-black text-slate-900">
          {requests.length}
        </span>
      </button>

      <div className="pointer-events-none absolute right-0 top-12 z-[70] w-[min(360px,calc(100vw-32px))] translate-y-1 rounded-lg bg-white p-3 text-slate-900 opacity-0 shadow-soft ring-1 ring-slate-200 transition duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-wide">Hôm nay chưa xong</p>
          <span className="rounded-full bg-aqua/12 px-2 py-1 text-[11px] font-black text-aqua">{requests.length}</span>
        </div>

        <div className="thin-scrollbar max-h-80 space-y-2 overflow-auto pr-1">
          {requests.length ? (
            requests.map((request) => (
              <button
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-left hover:border-aqua hover:bg-aqua/8"
                key={request.id}
                type="button"
                onClick={() => setSelectedRequestId(request.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">{request.requesterName}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {request.id} · {departmentName(request.departmentId)} · {formatDateTime(request.createdAt)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black ring-1 ${statusTone[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-600">{request.content}</p>
              </button>
            ))
          ) : (
            <div className="rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              Không có yêu cầu nào trong hôm nay đang chờ xử lý.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestForm({
  attachmentName,
  departments,
  lockDepartment,
  newContent,
  newPriority,
  newRequestDepartmentId,
  requesterName,
  setAttachmentName,
  setNewContent,
  setNewPriority,
  setNewRequestDepartmentId,
  setRequesterName,
  onSubmit
}: {
  attachmentName: string;
  departments: Department[];
  lockDepartment: boolean;
  newContent: string;
  newPriority: Priority;
  newRequestDepartmentId: string;
  requesterName: string;
  setAttachmentName: (value: string) => void;
  setNewContent: (value: string) => void;
  setNewPriority: (value: Priority) => void;
  setNewRequestDepartmentId: (value: string) => void;
  setRequesterName: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel>
      <SectionTitle icon={Send} title="Gửi yêu cầu" />
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Phòng ban</span>
          <CustomSelect
            className="mt-2"
            disabled={lockDepartment}
            value={newRequestDepartmentId}
            options={departments.map((department) => ({ value: department.id, label: department.name }))}
            onChange={setNewRequestDepartmentId}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Người gửi</span>
          <input
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-aqua"
            value={requesterName}
            onChange={(event) => setRequesterName(event.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Nội dung</span>
          <textarea
            className="mt-2 min-h-32 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 outline-none focus:border-aqua"
            value={newContent}
            onChange={(event) => setNewContent(event.target.value)}
            required
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Ưu tiên</span>
            <CustomSelect
              className="mt-2"
              buttonClassName="h-11 bg-white"
              value={newPriority}
              options={Object.entries(priorityLabels).map(([value, label]) => ({ value: value as Priority, label }))}
              onChange={setNewPriority}
            />
          </label>

          <div className="block">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">File</span>
            <label className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-800 px-3 text-sm font-black text-white shadow-sm hover:bg-slate-700">
              Chọn file
              <input
                className="sr-only"
                type="file"
                onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>
        </div>

        {attachmentName ? <p className="text-xs font-bold text-slate-500">File đã chọn: {attachmentName}</p> : null}

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-black text-white shadow-lg shadow-aqua/15 hover:bg-aqua/90" type="submit">
          <Send size={17} />
          Gửi yêu cầu
        </button>
      </form>
    </Panel>
  );
}

function ITEditor({
  draftAssignedToId,
  draftNote,
  draftStatus,
  request,
  setDraftAssignedToId,
  setDraftNote,
  setDraftStatus,
  staff,
  staffName,
  onSave
}: {
  draftAssignedToId: string;
  draftNote: string;
  draftStatus: RequestStatus;
  request?: ITRequest;
  setDraftAssignedToId: (value: string) => void;
  setDraftNote: (value: string) => void;
  setDraftStatus: (value: RequestStatus) => void;
  staff: ITStaff[];
  staffName: (id: string | null) => string;
  onSave: () => void;
}) {
  if (!request) {
    return (
      <Panel>
        <SectionTitle icon={ClipboardList} title="Xử lý" />
        <p className="text-sm font-semibold text-slate-500">Chưa có yêu cầu.</p>
      </Panel>
    );
  }

  return (
    <Panel>
      <SectionTitle icon={UserRoundCheck} title="Xử lý" />
      <div className="mb-4 rounded-md bg-slate-50 p-4 ring-1 ring-slate-200">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">{request.id}</p>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{request.content}</p>
        <p className="mt-3 text-xs font-bold text-slate-400">Hiện tại: {staffName(request.assignedToId)}</p>
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Phụ trách</span>
          <CustomSelect
            className="mt-2"
            buttonClassName="h-11 bg-white"
            value={draftAssignedToId}
            options={[{ value: "", label: staffName(null) }, ...staff.map((member) => ({ value: member.id, label: member.fullName }))]}
            onChange={setDraftAssignedToId}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Trạng thái</span>
          <CustomSelect
            className="mt-2"
            buttonClassName="h-11 bg-white"
            value={draftStatus}
            options={Object.entries(statusLabels).map(([value, label]) => ({ value: value as RequestStatus, label }))}
            onChange={setDraftStatus}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Ghi chú</span>
          <textarea
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 outline-none focus:border-aqua"
            value={draftNote}
            onChange={(event) => setDraftNote(event.target.value)}
          />
        </label>

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-black text-white shadow-lg shadow-aqua/20 hover:bg-aqua/90" type="button" onClick={onSave}>
          <CheckCircle2 size={18} />
          Lưu xử lý
        </button>
      </div>
    </Panel>
  );
}

function TicketBoard({
  departmentFilter,
  departmentName,
  departments,
  filteredRequests,
  query,
  role,
  selectedRequestId,
  setDepartmentFilter,
  setQuery,
  setSelectedRequestId,
  setStatusFilter,
  staffName,
  statusFilter,
  onExport,
  onOpenHistory,
  historyCount,
  onDeleteRequest
}: {
  departmentFilter: string;
  departmentName: (id: string) => string;
  departments: Department[];
  filteredRequests: ITRequest[];
  query: string;
  role: Role;
  selectedRequestId: string;
  setDepartmentFilter: (value: string) => void;
  setQuery: (value: string) => void;
  setSelectedRequestId: (value: string) => void;
  setStatusFilter: (value: RequestStatus | "ALL") => void;
  staffName: (id: string | null) => string;
  statusFilter: RequestStatus | "ALL";
  onExport: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onDeleteRequest?: (requestId: string) => void;
}) {
  const ticketStatusOptions = Object.entries(statusLabels)
    .filter(([value]) => value !== "DONE" && value !== "REJECTED")
    .map(([value, label]) => ({ value: value as RequestStatus, label }));

  return (
    <div className="space-y-3">
      <Panel className="min-h-[520px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-amber-50 text-amber-700 ring-1 ring-amber-100">
              <Inbox size={18} />
            </span>
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">Tickets</h2>
          </div>
          {role === "IT" ? (
            <button className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-black text-white" type="button" onClick={onExport}>
              <Download size={15} />
              Excel
            </button>
          ) : null}
        </div>

        <label className="mb-3 flex h-11 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3">
          <Search size={18} className="text-aqua" />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
            placeholder="Tìm ticket, người gửi, nội dung..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <CustomSelect
            value={statusFilter}
            options={[{ value: "ALL", label: "Tất cả trạng thái" }, ...ticketStatusOptions]}
            onChange={setStatusFilter}
            buttonClassName="h-10"
          />

          {role === "IT" ? (
            <CustomSelect
              value={departmentFilter}
              options={[{ value: "ALL", label: "Tất cả phòng ban" }, ...departments.map((department) => ({ value: department.id, label: department.name }))]}
              onChange={setDepartmentFilter}
              buttonClassName="h-10"
            />
          ) : null}
        </div>

        <div className="thin-scrollbar max-h-[440px] space-y-3 overflow-auto pr-1">
          {filteredRequests.length ? (
            filteredRequests.map((request) => (
              <div
                className={`relative rounded-md border ${
                  selectedRequestId === request.id ? "border-aqua bg-aqua/8 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
                key={request.id}
              >
                <button className="w-full p-4 pr-12 text-left" type="button" onClick={() => setSelectedRequestId(request.id)}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{request.requesterName}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {request.id} · {departmentName(request.departmentId)} · {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusTone[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">{request.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded px-2 py-1 text-[11px] font-black ${priorityTone[request.priority]}`}>{priorityLabels[request.priority]}</span>
                    <span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-500">{staffName(request.assignedToId)}</span>
                    {request.attachmentName ? (
                      <span className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600">
                        <FileText size={12} />
                        File
                      </span>
                    ) : null}
                  </div>
                </button>

                {role === "IT" && onDeleteRequest ? (
                  <button
                    className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md bg-rose-50 text-rose-500 ring-1 ring-rose-100 hover:bg-rose-100 hover:text-rose-700 hover:ring-rose-200"
                    type="button"
                    title="Xóa phiếu"
                    aria-label={`Xóa phiếu ${request.id}`}
                    onClick={() => onDeleteRequest(request.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
              Không có ticket đang xử lý theo bộ lọc hiện tại.
            </p>
          )}
        </div>
      </Panel>

      <button
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-aqua shadow-sm ring-1 ring-aqua/30 hover:bg-aqua/10"
        type="button"
        onClick={onOpenHistory}
      >
        <History size={17} />
        Xem lịch sử
        <span className="rounded-full bg-aqua/12 px-2 py-0.5 text-[11px] text-aqua">{historyCount}</span>
      </button>
    </div>
  );
}

function InsightsPanel({
  departmentStats,
  requestsForMonthCount,
  role,
  selectedMonth,
  setSelectedMonth,
  statusStats,
  onOpenCatalog
}: {
  departmentStats: { name: string; count: number }[];
  requestsForMonthCount: number;
  role: Role;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  statusStats: { status: RequestStatus; count: number }[];
  onOpenCatalog: () => void;
}) {
  const maxDepartmentCount = Math.max(1, ...departmentStats.map((item) => item.count));

  return (
    <div className="space-y-5">
      <Panel>
        <SectionTitle icon={LayoutDashboard} title="Thống kê" />
        <label className="mb-4 block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tháng</span>
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Tổng" value={requestsForMonthCount} tone="bg-slate-900 text-white" />
          <Metric label="Mới" value={statusStats.find((item) => item.status === "NEW")?.count ?? 0} tone="bg-amber-50 text-amber-900 ring-1 ring-amber-100" />
        </div>

        <div className="mt-5 space-y-3">
          {statusStats.map((item) => (
            <div className="flex items-center justify-between gap-3" key={item.status}>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusTone[item.status]}`}>{statusLabels[item.status]}</span>
              <span className="text-sm font-black text-slate-700">{item.count}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {departmentStats.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-500">
                <span>{item.name}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-aqua" style={{ width: `${(item.count / maxDepartmentCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {role === "IT" ? (
        <button
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-aqua shadow-sm ring-1 ring-aqua/30 hover:bg-aqua/10"
          type="button"
          onClick={onOpenCatalog}
        >
          <Settings2 size={17} />
          Danh mục
        </button>
      ) : null}
    </div>
  );
}

function CatalogModal({
  isOpen,
  newDepartmentName,
  newStaffName,
  setNewDepartmentName,
  setNewStaffName,
  staff,
  onAddDepartment,
  onAddStaff,
  onClose,
  onDeleteStaff
}: {
  isOpen: boolean;
  newDepartmentName: string;
  newStaffName: string;
  setNewDepartmentName: (value: string) => void;
  setNewStaffName: (value: string) => void;
  staff: ITStaff[];
  onAddDepartment: () => void;
  onAddStaff: () => void;
  onClose: () => void;
  onDeleteStaff: (staffId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-[min(560px,calc(100vw-32px))] overflow-hidden rounded-lg bg-white text-slate-900 shadow-soft ring-1 ring-slate-200"
        role="dialog"
        aria-modal="true"
        aria-label="Danh mục"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-md bg-aqua/12 text-aqua">
              <Settings2 size={18} />
            </span>
            <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">Danh mục</h2>
          </div>
          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
            type="button"
            aria-label="Đóng danh mục"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onAddDepartment();
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-aqua"
              placeholder="Phòng ban mới"
              value={newDepartmentName}
              onChange={(event) => setNewDepartmentName(event.target.value)}
            />
            <button className="flex size-10 items-center justify-center rounded-md bg-aqua text-white" type="submit" title="Thêm phòng ban">
              <Plus size={18} />
            </button>
          </form>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              onAddStaff();
            }}
          >
            <input
              className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-aqua"
              placeholder="Nhân viên IT mới"
              value={newStaffName}
              onChange={(event) => setNewStaffName(event.target.value)}
            />
            <button className="flex size-10 items-center justify-center rounded-md bg-slate-800 text-white hover:bg-slate-700" type="submit" title="Thêm nhân viên IT">
              <Plus size={18} />
            </button>
          </form>

          <div className="thin-scrollbar max-h-[44vh] space-y-2 overflow-auto pr-1">
            {staff.map((member) => (
              <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200" key={member.id}>
                <span className="min-w-0 truncate text-sm font-black text-slate-700">{member.fullName}</span>
                <button
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                  type="button"
                  title="Xóa nhân viên IT"
                  onClick={() => onDeleteStaff(member.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StarRating({
  value,
  interactive,
  onChange
}: {
  value?: Rating;
  interactive: boolean;
  onChange?: (rating: Rating) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3, 4, 5] as Rating[]).map((rating) => {
        const isActive = Boolean(value && rating <= value);
        if (!interactive) {
          return (
            <Star
              className={isActive ? "fill-amber-400 text-amber-400" : "text-slate-300"}
              key={rating}
              size={16}
            />
          );
        }

        return (
          <button
            className={`flex size-7 items-center justify-center rounded-md ${
              isActive ? "text-amber-500" : "text-slate-300 hover:bg-amber-50 hover:text-amber-500"
            }`}
            type="button"
            title={`${rating} sao`}
            aria-label={`Đánh giá ${rating} sao`}
            key={rating}
            onClick={() => onChange?.(rating)}
          >
            <Star className={isActive ? "fill-amber-400" : ""} size={16} />
          </button>
        );
      })}
    </div>
  );
}

function RequestHistoryModal({
  historyRequests,
  departmentName,
  isOpen,
  role,
  selectedMonth,
  setSelectedMonth,
  onClose,
  onRateRequest
}: {
  historyRequests: ITRequest[];
  departmentName: (id: string) => string;
  isOpen: boolean;
  role: Role;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  onClose: () => void;
  onRateRequest: (requestId: string, rating: Rating) => void;
}) {
  if (!isOpen) return null;

  function exportHistoryCsv() {
    const header = ["Người gửi", "Phòng ban", "Thời gian nhờ", "Trạng thái", "Đánh giá"];
    const rows = historyRequests.map((request) => [
      request.requesterName,
      departmentName(request.departmentId),
      formatDateTime(request.createdAt),
      statusLabels[request.status],
      request.status === "DONE" ? (request.rating ? `${request.rating}/5` : "Chưa đánh giá") : "Không áp dụng"
    ]);
    const csv = [header, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `it-help-me-history-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-[min(880px,calc(100vw-32px))] overflow-visible rounded-lg bg-white text-slate-900 shadow-soft ring-1 ring-slate-200"
        role="dialog"
        aria-modal="true"
        aria-label="Lịch sử hoàn thành"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-md bg-aqua/12 text-aqua">
                <History size={18} />
              </span>
              <h2 className="text-lg font-black uppercase tracking-wide text-slate-900">Lịch sử</h2>
            </div>
            <p className="mt-2 truncate text-xs font-bold text-slate-400">Các yêu cầu đã hoàn thành hoặc bị từ chối</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {role === "IT" ? (
              <button
                className="flex h-9 items-center gap-2 rounded-md bg-slate-900 px-3 text-xs font-black text-white hover:bg-slate-700"
                type="button"
                onClick={exportHistoryCsv}
              >
                <Download size={15} />
                Excel
              </button>
            ) : null}
            <button
              className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
              type="button"
              aria-label="Đóng lịch sử"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <label className="mb-4 block max-w-xs">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">Tháng lịch sử</span>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </label>

          {historyRequests.length ? (
            <div className="thin-scrollbar max-h-[58vh] overflow-auto rounded-md border border-slate-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="border-b border-slate-200 px-3 py-3">Người gửi</th>
                    <th className="border-b border-slate-200 px-3 py-3">Phòng ban</th>
                    <th className="border-b border-slate-200 px-3 py-3">Thời gian nhờ</th>
                    <th className="border-b border-slate-200 px-3 py-3">Trạng thái</th>
                    <th className="border-b border-slate-200 px-3 py-3">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyRequests.map((request) => (
                    <tr className="bg-white hover:bg-slate-50" key={request.id}>
                      <td className="px-3 py-3 font-black text-slate-800">{request.requesterName}</td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{departmentName(request.departmentId)}</td>
                      <td className="px-3 py-3 font-semibold text-slate-600">{formatDateTime(request.createdAt)}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusTone[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {request.status === "DONE" ? (
                            <>
                              <StarRating
                                value={request.rating}
                                interactive={role === "DEPARTMENT" && !request.rating}
                                onChange={(rating) => onRateRequest(request.id, rating)}
                              />
                              {request.rating ? (
                                <span className="text-xs font-black text-slate-500">{request.rating}/5</span>
                              ) : (
                                <span className="text-xs font-bold text-slate-400">Chưa đánh giá</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs font-bold text-slate-400">Không áp dụng</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="rounded-md bg-slate-50 p-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
              Chưa có yêu cầu hoàn thành hoặc bị từ chối trong tháng này.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-md p-4 ${tone}`}>
      <p className="text-xs font-black uppercase tracking-wider opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

