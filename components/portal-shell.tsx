"use client";

import {
  Bell,
  CalendarDays,
  CalendarCheck2,   // 👈 thêm dòng này
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  History,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Star,
  Trash2,
  UserRoundCheck,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FormEvent, ReactNode, TextareaHTMLAttributes, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/constants";
import { initialDepartments, initialRequests, initialStaff } from "@/lib/sample-data";
import type { ChatMessage, Department, ITRequest, ITStaff, Priority, Rating, RequestStatus, Role } from "@/lib/types";
import Link from "next/link";
const STORAGE_KEY = "it-help-me-state-v1";
const LEGACY_IMPORT_KEY = "it-help-me-legacy-imported-v1";
const SOUND_PREF_KEY = "it-help-me-notification-sound-v1";
const SEED_REQUEST_IDS = new Set(["REQ-260707-001", "REQ-260707-002", "REQ-260706-014", "REQ-260705-009"]);
const IT_POLL_INTERVAL_MS = 15000;
const APP_ICON_SRC = "/it.png";
const COPYRIGHT_TEXT = "© 2026 Bản quyền thuộc về TeamIT Gustino";
const TEAM_TAGLINE = "Team IT Gustino – Xử lý cực pro!";

type LoginSession = {
  role: Role;
  departmentId: string | null;
  username?: string;
  accountId?: string;
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

function isClosedStatus(status: RequestStatus) {
  return status === "DONE" || status === "REJECTED";
}

function removeClosedSeedRequests(requests: ITRequest[]) {
  return requests.filter((request) => !(SEED_REQUEST_IDS.has(request.id) && isClosedStatus(request.status)));
}

type SelectOption<T extends string> = {
  value: T;
  label: string;
};

type AppState = {
  departments: Department[];
  staff: ITStaff[];
  requests: ITRequest[];
  chatMessages?: ChatMessage[];
  chatUnreadCount?: number;
  chatUnreadByDepartment?: Record<string, number>;
  activeDepartmentId: string;
};

type AuthBootstrap = {
  session: LoginSession | null;
  departments: Department[];
};

type LoginResponse = {
  session: LoginSession;
  state: AppState;
};

type UploadResponse = {
  fileName: string;
  fileUrl: string;
};

type DialogState =
  | {
      kind: "alert";
      title: string;
      message: string;
    }
  | {
      kind: "confirm";
      title: string;
      message: string;
      confirmLabel: string;
      cancelLabel: string;
      tone: "default" | "danger";
      resolve: (value: boolean) => void;
    }
  | null;

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Không thể kết nối database.");
  }

  return response.json() as Promise<T>;
}

async function uploadAttachment(file: File, requestId: string, departmentId: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("requestId", requestId);
  formData.append("departmentId", departmentId);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || "Không thể upload file đính kèm.");
  }

  return response.json() as Promise<UploadResponse>;
}

function attachmentHref(fileUrl?: string) {
  if (!fileUrl) return "";
  return `/api/files/${fileUrl.split("/").map(encodeURIComponent).join("/")}`;
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric"
  }).format(new Date(year, month - 1, 1));
}

function addPendingId(current: string[], id: string) {
  return current.includes(id) ? current : [...current, id];
}

function removePendingId(current: string[], id: string) {
  return current.filter((item) => item !== id);
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
  const [loadError, setLoadError] = useState("");

  const [requesterName, setRequesterName] = useState("");
  const [newRequestDepartmentId, setNewRequestDepartmentId] = useState(initialDepartments[0].id);
  const [newContent, setNewContent] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("MEDIUM");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [draftStatus, setDraftStatus] = useState<RequestStatus>("NEW");
  const [draftAssignedToId, setDraftAssignedToId] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [serverChatUnreadCount, setServerChatUnreadCount] = useState(0);
  const [serverChatUnreadByDepartment, setServerChatUnreadByDepartment] = useState<Record<string, number>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatDepartmentId, setSelectedChatDepartmentId] = useState(initialDepartments[0].id);
  const [chatDraft, setChatDraft] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [recallingChatMessageIds, setRecallingChatMessageIds] = useState<string[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCreatingRequest, setIsCreatingRequest] = useState(false);
  const [isSavingRequest, setIsSavingRequest] = useState(false);
  const [isAddingDepartment, setIsAddingDepartment] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [deletingRequestIds, setDeletingRequestIds] = useState<string[]>([]);
  const [deletingDepartmentIds, setDeletingDepartmentIds] = useState<string[]>([]);
  const [deletingStaffIds, setDeletingStaffIds] = useState<string[]>([]);
  const [ratingRequestIds, setRatingRequestIds] = useState<string[]>([]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isNotificationSoundOn, setIsNotificationSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownRequestIdsRef = useRef<Set<string>>(new Set(initialRequests.map((request) => request.id)));
  const hasPrimedITNotificationsRef = useRef(false);

  const showAlert = useCallback((message: string, title = "Thông báo") => {
    setDialog({ kind: "alert", title, message });
  }, []);

  const askConfirm = useCallback(
    (
      message: string,
      options: { title?: string; confirmLabel?: string; cancelLabel?: string; tone?: "default" | "danger" } = {}
    ) => {
      return new Promise<boolean>((resolve) => {
        setDialog({
          kind: "confirm",
          title: options.title ?? "Xác nhận",
          message,
          confirmLabel: options.confirmLabel ?? "Đồng ý",
          cancelLabel: options.cancelLabel ?? "Hủy",
          tone: options.tone ?? "default",
          resolve
        });
      });
    },
    []
  );

  function closeDialog(result: boolean) {
    setDialog((current) => {
      if (current?.kind === "confirm") current.resolve(result);
      return null;
    });
  }

  function applyState(
    state: AppState,
    nextSession: LoginSession | null = session,
    options: { preserveSelectedRequest?: boolean; preserveActiveDepartment?: boolean } = {}
  ) {
    const nextDepartments = state.departments?.length ? state.departments : initialDepartments;
    const nextStaff = state.staff?.length ? state.staff : initialStaff;
    const nextRequests = removeClosedSeedRequests(state.requests ?? []);
    const nextChatMessages = state.chatMessages ?? [];
    const nextActiveDepartments = nextDepartments.filter((department) => department.isActive);
    const fallbackDepartmentId = nextActiveDepartments[0]?.id ?? nextDepartments[0]?.id ?? initialDepartments[0].id;
    const requestedDepartmentId = nextActiveDepartments.some((department) => department.id === state.activeDepartmentId) ? state.activeDepartmentId : "";
    const defaultActiveDepartmentId =
      nextSession?.role === "DEPARTMENT"
        ? nextSession.departmentId ?? nextDepartments[0]?.id ?? initialDepartments[0].id
        : requestedDepartmentId || fallbackDepartmentId;
    const nextActiveDepartmentId =
      options.preserveActiveDepartment && nextActiveDepartments.some((department) => department.id === activeDepartmentId)
        ? activeDepartmentId
        : defaultActiveDepartmentId;

    setDepartments(nextDepartments);
    setStaff(nextStaff);
    setRequests(nextRequests);
    setChatMessages(nextChatMessages);
    setServerChatUnreadCount(state.chatUnreadCount ?? 0);
    setServerChatUnreadByDepartment(state.chatUnreadByDepartment ?? {});
    setActiveDepartmentId(nextActiveDepartmentId);
    setLoginDepartmentId(nextActiveDepartmentId);
    setNewRequestDepartmentId(nextActiveDepartmentId);
    setSelectedRequestId((current) => {
      if (options.preserveSelectedRequest && nextRequests.some((request) => request.id === current)) return current;
      return nextRequests.find((request) => !isClosedStatus(request.status))?.id ?? "";
    });
    setLoadError("");
  }

  useEffect(() => {
    let ignore = false;

    async function loadState() {
      try {
        const state = await apiRequest<AppState>("/api/state");
        const bootstrap = await apiRequest<AuthBootstrap>("/api/auth/session");
        if (ignore) return;
        if (bootstrap.session) {
          setSession(bootstrap.session);
          setRole(bootstrap.session.role);
        }

        const raw = "";
        const shouldImportLegacy = false;

        if (shouldImportLegacy) {
          const parsed = JSON.parse(raw) as AppState;
          const legacyState: AppState = {
            departments: parsed.departments?.length ? parsed.departments : state.departments,
            staff: parsed.staff?.length ? parsed.staff : state.staff,
            requests: removeClosedSeedRequests(parsed.requests ?? state.requests),
            chatMessages: state.chatMessages ?? [],
            chatUnreadCount: state.chatUnreadCount ?? 0,
            chatUnreadByDepartment: state.chatUnreadByDepartment ?? {},
            activeDepartmentId: parsed.activeDepartmentId || state.activeDepartmentId
          };

          const importedState = await apiRequest<AppState>("/api/import-state", {
            method: "POST",
            body: JSON.stringify(legacyState)
          });

          window.localStorage.setItem(LEGACY_IMPORT_KEY, "true");
          applyState(importedState);
        } else {
          applyState(state);
        }
      } catch (error) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as AppState;
            applyState({
              departments: parsed.departments?.length ? parsed.departments : initialDepartments,
              staff: parsed.staff?.length ? parsed.staff : initialStaff,
              requests: removeClosedSeedRequests(parsed.requests ?? initialRequests),
              chatMessages: [],
              chatUnreadCount: 0,
              chatUnreadByDepartment: {},
              activeDepartmentId: parsed.activeDepartmentId || initialDepartments[0].id
            });
          } catch {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }

        setLoadError(error instanceof Error ? error.message : "Không thể tải dữ liệu từ database.");
      } finally {
        if (!ignore) setHasLoaded(true);
      }
    }

    function applyState(state: AppState) {
      const nextDepartments = state.departments?.length ? state.departments : initialDepartments;
      const nextStaff = state.staff?.length ? state.staff : initialStaff;
      const nextRequests = removeClosedSeedRequests(state.requests ?? initialRequests);
      const nextChatMessages = state.chatMessages ?? [];
      const nextActiveDepartments = nextDepartments.filter((department) => department.isActive);
      const requestedDepartmentId = nextActiveDepartments.some((department) => department.id === state.activeDepartmentId) ? state.activeDepartmentId : "";
      const nextActiveDepartmentId = requestedDepartmentId || nextActiveDepartments[0]?.id || nextDepartments[0]?.id || initialDepartments[0].id;

      setDepartments(nextDepartments);
      setStaff(nextStaff);
      setRequests(nextRequests);
      setChatMessages(nextChatMessages);
      setServerChatUnreadCount(state.chatUnreadCount ?? 0);
      setServerChatUnreadByDepartment(state.chatUnreadByDepartment ?? {});
      setActiveDepartmentId(nextActiveDepartmentId);
      setLoginDepartmentId(nextActiveDepartmentId);
      setNewRequestDepartmentId(nextActiveDepartmentId);
      setSelectedRequestId(nextRequests.find((request) => !isClosedStatus(request.status))?.id ?? "");
      setLoadError("");
    }

    loadState();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    window.localStorage.removeItem(STORAGE_KEY);
  }, [activeDepartmentId, departments, hasLoaded, requests, staff]);

  useEffect(() => {
    const storedPreference = window.localStorage.getItem(SOUND_PREF_KEY);
    if (storedPreference === "off") setIsNotificationSoundOn(false);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SOUND_PREF_KEY, isNotificationSoundOn ? "on" : "off");
  }, [isNotificationSoundOn]);

  useEffect(() => {
    if (!hasLoaded) return;
    const currentIds = new Set(requests.map((request) => request.id));

    if (session?.role !== "IT") {
      knownRequestIdsRef.current = currentIds;
      hasPrimedITNotificationsRef.current = false;
      return;
    }

    const newRequests = requests.filter((request) => request.status === "NEW" && !knownRequestIdsRef.current.has(request.id));
    if (!hasPrimedITNotificationsRef.current) {
      hasPrimedITNotificationsRef.current = true;
      knownRequestIdsRef.current = currentIds;
      return;
    }

    if (newRequests.length > 0 && isNotificationSoundOn) {
      const audio = audioRef.current ?? new Audio("/notification.mp3");
      audioRef.current = audio;
      audio.currentTime = 0;
      void audio.play().catch(() => undefined);
    }

    knownRequestIdsRef.current = currentIds;
  }, [hasLoaded, isNotificationSoundOn, requests, session?.role]);

  useEffect(() => {
    if (!hasLoaded || !session) return;
    let ignore = false;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const state = await apiRequest<AppState>("/api/state");
        if (!ignore) applyState(state, session, { preserveSelectedRequest: true, preserveActiveDepartment: true });
      } catch {
        // Keep the current screen steady; the next poll can recover.
      } finally {
        isPolling = false;
      }
    };

    const intervalId = window.setInterval(poll, IT_POLL_INTERVAL_MS);
    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [activeDepartmentId, hasLoaded, session?.role, session?.departmentId]);

  async function refreshState() {
    const state = await apiRequest<AppState>("/api/state");
    const nextDepartments = state.departments?.length ? state.departments : initialDepartments;
    const nextStaff = state.staff?.length ? state.staff : initialStaff;
    const nextRequests = removeClosedSeedRequests(state.requests ?? initialRequests);
    const nextChatMessages = state.chatMessages ?? [];
    const nextActiveDepartments = nextDepartments.filter((department) => department.isActive);
    const requestedDepartmentId = nextActiveDepartments.some((department) => department.id === state.activeDepartmentId) ? state.activeDepartmentId : "";
    const nextActiveDepartmentId = requestedDepartmentId || nextActiveDepartments[0]?.id || nextDepartments[0]?.id || initialDepartments[0].id;

    setDepartments(nextDepartments);
    setStaff(nextStaff);
    setRequests(nextRequests);
    setChatMessages(nextChatMessages);
    setServerChatUnreadCount(state.chatUnreadCount ?? 0);
    setServerChatUnreadByDepartment(state.chatUnreadByDepartment ?? {});
    setActiveDepartmentId(nextActiveDepartmentId);
    setLoginDepartmentId(nextActiveDepartmentId);
    setNewRequestDepartmentId(nextActiveDepartmentId);
    setSelectedRequestId(nextRequests.find((request) => !isClosedStatus(request.status))?.id ?? "");
    setLoadError("");
  }

  const departmentName = (id: string) => departments.find((department) => department.id === id)?.name ?? "Không rõ";
  const staffName = (id: string | null) => staff.find((member) => member.id === id)?.fullName ?? "Chưa gán";

  const activeDepartments = useMemo(() => departments.filter((department) => department.isActive), [departments]);
  const isApiBusy =
    isLoggingIn ||
    isLoggingOut ||
    isCreatingRequest ||
    isSavingRequest ||
    isAddingDepartment ||
    isAddingStaff ||
    deletingRequestIds.length > 0 ||
    deletingDepartmentIds.length > 0 ||
    deletingStaffIds.length > 0 ||
    ratingRequestIds.length > 0;
  const apiBusyMessage = isLoggingIn
    ? "Đang đăng nhập..."
    : isLoggingOut
      ? "Đang đăng xuất..."
      : isCreatingRequest
        ? "Đang gửi yêu cầu..."
        : isSavingRequest
          ? "Đang lưu xử lý..."
          : isAddingDepartment || isAddingStaff
            ? "Đang cập nhật danh mục..."
            : deletingDepartmentIds.length > 0 || deletingStaffIds.length > 0
              ? "Đang xóa khỏi danh mục..."
              : deletingRequestIds.length > 0
                ? "Đang xóa phiếu..."
                : ratingRequestIds.length > 0
                  ? "Đang lưu đánh giá..."
                  : "Đang xử lý...";

  function pickFirstVisibleRequestId(nextRole: Role, departmentId: string) {
    return (
      requests.find((request) => !isClosedStatus(request.status) && (nextRole === "IT" || request.departmentId === departmentId))?.id ??
      ""
    );
  }

  function resetViewFilters() {
    setQuery("");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoggingIn) return;
    if (!loginRole) {
      showAlert("Vui lòng chọn tài khoản/phòng ban trước khi vào hệ thống.");
      return;
    }

    if (loginRole === "DEPARTMENT" && !loginDepartmentId) {
      showAlert("Vui lòng chọn phòng ban trước khi vào hệ thống.");
      return;
    }

    if (loginRole === "IT" && !loginPassword) {
      showAlert("Vui lòng nhập mật khẩu phòng IT.");
      return;
    }

    const nextDepartmentId = loginRole === "DEPARTMENT" ? loginDepartmentId : activeDepartmentId;
    const loginLabel = loginRole === "IT" ? "Phòng IT" : departmentName(loginDepartmentId);
    const shouldEnter = await askConfirm(`Bạn sẽ đăng nhập bằng tài khoản ${loginLabel}.`, {
      title: "Chắc chưa?",
      confirmLabel: "Đăng nhập"
    });
    if (!shouldEnter) return;

    setIsLoggingIn(true);
    try {
      const result = await apiRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          role: loginRole,
          departmentId: loginRole === "DEPARTMENT" ? loginDepartmentId : undefined,
          password: loginRole === "IT" ? loginPassword : undefined
        })
      });

      setSession(result.session);
      setRole(result.session.role);
      applyState(result.state, result.session);
      resetViewFilters();
      setSelectedRequestId(pickFirstVisibleRequestId(result.session.role, result.session.departmentId ?? nextDepartmentId));
    } catch (error) {
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await apiRequest<{ ok: boolean }>("/api/auth/logout", { method: "POST" }).catch(() => null);
      setSession(null);
      setLoginRole("");
      setLoginPassword("");
      setRole("IT");
      setRequests([]);
      setStaff([]);
      setChatMessages([]);
      setServerChatUnreadCount(0);
      setServerChatUnreadByDepartment({});
      setRecallingChatMessageIds([]);
      setIsChatOpen(false);
      setChatDraft("");
      resetViewFilters();
    } finally {
      setIsLoggingOut(false);
    }
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
      .filter((request) => !isClosedStatus(request.status))
      .filter((request) => isToday(request.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [activeDepartmentId, requests, role]);

  const filteredRequests = useMemo(() => {
    return requests
      .filter((request) => (role === "IT" ? true : request.departmentId === activeDepartmentId))
      .filter((request) => !isClosedStatus(request.status))
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
  }, [selectedRequest?.id]);

  const requestsForMonth = useMemo(() => {
    return requests
      .filter((request) => (role === "IT" ? true : request.departmentId === activeDepartmentId))
      .filter((request) => matchesMonth(request.createdAt, selectedMonth));
  }, [activeDepartmentId, requests, role, selectedMonth]);

  const statusStats = useMemo(() => {
    return (Object.keys(statusLabels) as RequestStatus[]).map((status) => ({
      status,
      count: requestsForMonth.filter((request) => request.status === status).length
    }));
  }, [requestsForMonth]);

  const departmentStats = useMemo(() => {
    const visibleDepartments = role === "IT" ? activeDepartments : activeDepartments.filter((department) => department.id === activeDepartmentId);
    return visibleDepartments
      .map((department) => ({
        name: department.name,
        count: requestsForMonth.filter((request) => request.departmentId === department.id).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [activeDepartmentId, activeDepartments, requestsForMonth, role]);

  const historyRequestsForMonth = useMemo(() => {
    return requestsForMonth
      .filter((request) => isClosedStatus(request.status))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [requestsForMonth]);

  const pendingRatingCount = useMemo(() => {
    return requests.filter((request) => {
      const matchesDepartment =
        role === "DEPARTMENT"
          ? request.departmentId === activeDepartmentId
          : departmentFilter === "ALL" || request.departmentId === departmentFilter;
      return matchesDepartment && request.status === "DONE" && !request.rating;
    }).length;
  }, [activeDepartmentId, departmentFilter, requests, role]);

  useEffect(() => {
    if (!session) return;
    if (session.role === "DEPARTMENT" && session.departmentId) {
      setSelectedChatDepartmentId(session.departmentId);
      return;
    }

    if (session.role === "IT" && !activeDepartments.some((department) => department.id === selectedChatDepartmentId)) {
      setSelectedChatDepartmentId(activeDepartments[0]?.id ?? "");
    }
  }, [activeDepartments, selectedChatDepartmentId, session?.departmentId, session?.role]);

  const activeChatDepartmentId = session?.role === "DEPARTMENT" ? session.departmentId ?? "" : selectedChatDepartmentId;
  const activeChatDepartment = activeDepartments.find((department) => department.id === activeChatDepartmentId);
  const chatMessagesForThread = useMemo(() => {
    if (!activeChatDepartmentId) return [];
    return chatMessages.filter((message) => message.departmentId === activeChatDepartmentId);
  }, [activeChatDepartmentId, chatMessages]);
  const chatUnreadCount = useMemo(() => {
    if (!session) return 0;
    const clientUnreadCount = chatMessages.filter((message) => !message.isRead && message.senderRole !== session.role).length;
    return Math.max(clientUnreadCount, serverChatUnreadCount);
  }, [chatMessages, serverChatUnreadCount, session?.role]);
  const unreadChatCountForDepartment = useCallback(
    (departmentId: string) => {
      if (!session) return 0;
      const clientUnreadCount = chatMessages.filter(
        (message) => message.departmentId === departmentId && !message.isRead && message.senderRole !== session.role
      ).length;
      return Math.max(clientUnreadCount, serverChatUnreadByDepartment[departmentId] ?? 0);
    },
    [chatMessages, serverChatUnreadByDepartment, session?.role]
  );

  useEffect(() => {
    if (!isChatOpen || !session || !activeChatDepartmentId) return;
    const serverUnreadInThread = serverChatUnreadByDepartment[activeChatDepartmentId] ?? 0;
    const hasUnreadInThread = serverUnreadInThread > 0 || chatMessages.some(
      (message) => message.departmentId === activeChatDepartmentId && !message.isRead && message.senderRole !== session.role
    );
    if (!hasUnreadInThread) return;

    const readAt = new Date().toISOString();
    const clientReadCount = chatMessages.filter(
      (message) => message.departmentId === activeChatDepartmentId && !message.isRead && message.senderRole !== session.role
    ).length;
    const readCount = Math.max(clientReadCount, serverChatUnreadByDepartment[activeChatDepartmentId] ?? 0);
    setChatMessages((current) =>
      current.map((message) =>
        message.departmentId === activeChatDepartmentId && !message.isRead && message.senderRole !== session.role
          ? { ...message, isRead: true, readAt }
          : message
      )
    );
    setServerChatUnreadCount((current) => Math.max(0, current - readCount));
    setServerChatUnreadByDepartment((current) => ({
      ...current,
      [activeChatDepartmentId]: 0
    }));

    void apiRequest<{ ok: boolean; count: number }>("/api/chat", {
      method: "PATCH",
      body: JSON.stringify({ departmentId: activeChatDepartmentId })
    }).catch(() => refreshState().catch(() => undefined));
  }, [activeChatDepartmentId, chatMessages, isChatOpen, serverChatUnreadByDepartment, session?.role]);

  async function handleCreateRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreatingRequest) return;
    if (!requesterName.trim() || !newContent.trim()) return;

    const createdAt = new Date().toISOString();
    const id = makeRequestId();
    const departmentId = role === "DEPARTMENT" ? activeDepartmentId : newRequestDepartmentId;
    const draft = {
      requesterName,
      content: newContent,
      priority: newPriority,
      attachmentName,
      attachmentFile
    };
    const request: ITRequest = {
      id,
      departmentId,
      requesterName: draft.requesterName.trim(),
      content: draft.content.trim(),
      priority: draft.priority,
      status: "NEW",
      assignedToId: null,
      resolutionNote: "",
      attachmentName: draft.attachmentName,
      attachmentUrl: "",
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

    setIsCreatingRequest(true);
    setRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
    setSelectedRequestId(request.id);
    setRequesterName("");
    setNewContent("");
    setNewPriority("MEDIUM");
    setAttachmentName("");
    setAttachmentFile(null);

    try {
      const uploaded = draft.attachmentFile ? await uploadAttachment(draft.attachmentFile, id, departmentId) : null;
      const payload: ITRequest = {
        ...request,
        attachmentName: uploaded?.fileName ?? draft.attachmentName,
        attachmentUrl: uploaded?.fileUrl ?? ""
      };
      const created = await apiRequest<ITRequest>("/api/requests", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setRequests((current) => current.map((item) => (item.id === request.id ? created : item)));
      setSelectedRequestId(created.id);
    } catch (error) {
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setSelectedRequestId(pickFirstVisibleRequestId(role, activeDepartmentId));
      setRequesterName(draft.requesterName);
      setNewContent(draft.content);
      setNewPriority(draft.priority);
      setAttachmentName(draft.attachmentName);
      setAttachmentFile(draft.attachmentFile);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setIsCreatingRequest(false);
    }
  }

  async function handleUpdateRequest() {
    if (!selectedRequest) return;
    if (isSavingRequest) return;
    if ((draftStatus === "DONE" || draftStatus === "REJECTED") && !draftNote.trim()) {
      showAlert("Cần nhập ghi chú kết quả hoặc lý do trước khi đóng yêu cầu.");
      return;
    }

    const previousRequest = selectedRequest;
    const optimisticRequest: ITRequest = {
      ...selectedRequest,
      status: draftStatus,
      assignedToId: draftAssignedToId || null,
      resolutionNote: draftNote.trim(),
      updatedAt: new Date().toISOString()
    };
    const nextRequest = requests.find(
      (item) =>
        item.id !== selectedRequest.id &&
        !isClosedStatus(item.status) &&
        (role === "IT" || item.departmentId === activeDepartmentId)
    );

    setIsSavingRequest(true);
    setRequests((current) => current.map((request) => (request.id === selectedRequest.id ? optimisticRequest : request)));
    if (isClosedStatus(optimisticRequest.status)) {
      setSelectedRequestId(nextRequest?.id ?? "");
    }

    try {
      const updated = await apiRequest<ITRequest>(`/api/requests/${selectedRequest.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: draftStatus,
          assignedToId: draftAssignedToId || null,
          resolutionNote: draftNote.trim()
        })
      });

      setRequests((current) => current.map((request) => (request.id === updated.id ? updated : request)));
      if (isClosedStatus(updated.status)) {
        const nextRequest = requests.find(
          (item) => item.id !== updated.id && !isClosedStatus(item.status) && (role === "IT" || item.departmentId === activeDepartmentId)
        );
        setSelectedRequestId(nextRequest?.id ?? "");
      }
    } catch (error) {
      setRequests((current) => current.map((request) => (request.id === previousRequest.id ? previousRequest : request)));
      setSelectedRequestId(previousRequest.id);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setIsSavingRequest(false);
    }
  }

  async function handleAddDepartment() {
    const name = newDepartmentName.trim();
    if (isAddingDepartment) return;
    if (!name) return;
    const department = { id: `dept-${Date.now()}`, name, isActive: true };

    setIsAddingDepartment(true);
    setNewDepartmentName("");
    setDepartments((current) => [...current, department]);
    try {
      const created = await apiRequest<Department>("/api/departments", {
        method: "POST",
        body: JSON.stringify(department)
      });
      setDepartments((current) => current.map((item) => (item.id === department.id ? created : item)));
    } catch (error) {
      setDepartments((current) => current.filter((item) => item.id !== department.id));
      setNewDepartmentName(name);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setIsAddingDepartment(false);
    }
  }

  async function handleDeleteDepartment(departmentId: string) {
    if (deletingDepartmentIds.includes(departmentId)) return;
    if (activeDepartments.length <= 1) {
      showAlert("Cần giữ lại ít nhất 1 phòng ban đang hoạt động.");
      return;
    }

    const department = departments.find((item) => item.id === departmentId);
    if (!department) return;
    const shouldDelete = await askConfirm(`Xóa ${department.name} khỏi danh mục phòng ban?`, {
      title: "Xóa phòng ban",
      confirmLabel: "Xóa",
      tone: "danger"
    });
    if (!shouldDelete) return;

    const previousDepartments = departments;
    const previousActiveDepartmentId = activeDepartmentId;
    const previousLoginDepartmentId = loginDepartmentId;
    const previousNewRequestDepartmentId = newRequestDepartmentId;
    const previousDepartmentFilter = departmentFilter;
    const remainingActiveDepartments = activeDepartments.filter((item) => item.id !== departmentId);
    const fallbackDepartmentId = remainingActiveDepartments[0]?.id ?? "";

    setDeletingDepartmentIds((current) => addPendingId(current, departmentId));
    setDepartments((current) => current.map((item) => (item.id === departmentId ? { ...item, isActive: false } : item)));
    if (activeDepartmentId === departmentId) setActiveDepartmentId(fallbackDepartmentId);
    if (loginDepartmentId === departmentId) setLoginDepartmentId(fallbackDepartmentId);
    if (newRequestDepartmentId === departmentId) setNewRequestDepartmentId(fallbackDepartmentId);
    if (departmentFilter === departmentId) setDepartmentFilter("ALL");

    try {
      await apiRequest<{ ok: boolean }>(`/api/departments/${departmentId}`, { method: "DELETE" });
    } catch (error) {
      setDepartments(previousDepartments);
      setActiveDepartmentId(previousActiveDepartmentId);
      setLoginDepartmentId(previousLoginDepartmentId);
      setNewRequestDepartmentId(previousNewRequestDepartmentId);
      setDepartmentFilter(previousDepartmentFilter);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setDeletingDepartmentIds((current) => removePendingId(current, departmentId));
    }
  }

  async function handleAddStaff() {
    const fullName = newStaffName.trim();
    if (isAddingStaff) return;
    if (!fullName) return;
    const member = { id: `it-${Date.now()}`, fullName, isActive: true };

    setIsAddingStaff(true);
    setNewStaffName("");
    setStaff((current) => [...current, member]);
    try {
      const created = await apiRequest<ITStaff>("/api/staff", {
        method: "POST",
        body: JSON.stringify(member)
      });
      setStaff((current) => current.map((item) => (item.id === member.id ? created : item)));
    } catch (error) {
      setStaff((current) => current.filter((item) => item.id !== member.id));
      setNewStaffName(fullName);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setIsAddingStaff(false);
    }
  }

  async function handleDeleteStaff(staffId: string) {
    if (deletingStaffIds.includes(staffId)) return;
    const member = staff.find((item) => item.id === staffId);
    if (!member) return;
    const shouldDelete = await askConfirm(`Xóa ${member.fullName} khỏi danh sách nhân viên IT?`, {
      title: "Xóa nhân viên IT",
      confirmLabel: "Xóa",
      tone: "danger"
    });
    if (!shouldDelete) return;

    const previousStaff = staff;
    const previousRequests = requests;
    const previousDraftAssignedToId = draftAssignedToId;
    setDeletingStaffIds((current) => addPendingId(current, staffId));
    setStaff((current) => current.filter((item) => item.id !== staffId));
    setRequests((current) =>
      current.map((request) => (request.assignedToId === staffId ? { ...request, assignedToId: null } : request))
    );
    if (draftAssignedToId === staffId) setDraftAssignedToId("");

    try {
      await apiRequest<{ ok: boolean }>(`/api/staff/${staffId}`, { method: "DELETE" });
    } catch (error) {
      setStaff(previousStaff);
      setRequests(previousRequests);
      setDraftAssignedToId(previousDraftAssignedToId);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setDeletingStaffIds((current) => removePendingId(current, staffId));
    }
  }

  async function handleDeleteRequest(requestId: string) {
    if (deletingRequestIds.includes(requestId)) return;
    const request = requests.find((item) => item.id === requestId);
    if (!request) return;

    const shouldDelete = await askConfirm(`Bạn có chắc muốn xóa phiếu ${request.id} của ${request.requesterName}?`, {
      title: "Xóa phiếu",
      confirmLabel: "Xóa",
      tone: "danger"
    });
    if (!shouldDelete) return;

    const previousRequests = requests;
    const previousSelectedRequestId = selectedRequestId;
    const remaining = requests.filter((item) => item.id !== requestId);
    const nextRequest = remaining.find(
      (item) => !isClosedStatus(item.status) && (role === "IT" || item.departmentId === activeDepartmentId)
    );

    setDeletingRequestIds((current) => addPendingId(current, requestId));
    setRequests(remaining);
    if (selectedRequestId === requestId) {
      setSelectedRequestId(nextRequest?.id ?? "");
    }

    try {
      await apiRequest<{ ok: boolean }>(`/api/requests/${requestId}`, { method: "DELETE" });
    } catch (error) {
      setRequests(previousRequests);
      setSelectedRequestId(previousSelectedRequestId);
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setDeletingRequestIds((current) => removePendingId(current, requestId));
    }
  }

  async function handleRateRequest(requestId: string, rating: Rating) {
    if (ratingRequestIds.includes(requestId)) return;
    const previousRequest = requests.find((request) => request.id === requestId);
    if (!previousRequest) return;

    setRatingRequestIds((current) => addPendingId(current, requestId));
    setRequests((current) => current.map((request) => (request.id === requestId ? { ...request, rating } : request)));
    try {
      const updated = await apiRequest<ITRequest>(`/api/requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ rating })
      });
      setRequests((current) => current.map((request) => (request.id === updated.id ? updated : request)));
    } catch (error) {
      setRequests((current) => current.map((request) => (request.id === previousRequest.id ? previousRequest : request)));
      showAlert(error instanceof Error ? error.message : "Không thể xử lý yêu cầu.");
    } finally {
      setRatingRequestIds((current) => removePendingId(current, requestId));
    }
  }

  async function handleSendChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSendingChat) return;
    const content = chatDraft.trim();
    if (!content || !activeChatDepartmentId) return;

    setIsSendingChat(true);
    setChatDraft("");
    try {
      const message = await apiRequest<ChatMessage>("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          departmentId: activeChatDepartmentId,
          content
        })
      });
      setChatMessages((current) => [...current, message]);
      if (message.senderRole !== session?.role && !message.isRead) {
        setServerChatUnreadCount((current) => current + 1);
      }
    } catch (error) {
      setChatDraft(content);
      showAlert(error instanceof Error ? error.message : "Không thể gửi tin nhắn.");
    } finally {
      setIsSendingChat(false);
    }
  }

  async function handleRecallChat(messageId: string) {
    if (recallingChatMessageIds.includes(messageId)) return;
    const recalledMessage = chatMessages.find((message) => message.id === messageId);
    if (!recalledMessage || recalledMessage.senderRole !== session?.role) return;

    setRecallingChatMessageIds((current) => addPendingId(current, messageId));
    setChatMessages((current) => current.filter((message) => message.id !== messageId));
    try {
      await apiRequest<{ ok: boolean; id: string }>("/api/chat", {
        method: "DELETE",
        body: JSON.stringify({ messageId })
      });
    } catch (error) {
      setChatMessages((current) =>
        current.some((message) => message.id === recalledMessage.id)
          ? current
          : [...current, recalledMessage].sort((left, right) => new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime())
      );
      showAlert(error instanceof Error ? error.message : "Không thể thu hồi tin nhắn.");
    } finally {
      setRecallingChatMessageIds((current) => removePendingId(current, messageId));
    }
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
      <>
        <LoginScreen
          departments={activeDepartments}
          loginDepartmentId={loginDepartmentId}
          loginPassword={loginPassword}
          loginRole={loginRole}
          isSubmitting={isLoggingIn}
          setLoginDepartmentId={setLoginDepartmentId}
          setLoginPassword={setLoginPassword}
          setLoginRole={setLoginRole}
          onSubmit={handleLogin}
        />
        <AppDialog dialog={dialog} onClose={closeDialog} />
      </>
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
              <BrandMark className="size-12" />
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
                  options={activeDepartments.map((department) => ({ value: department.id, label: department.name }))}
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
              <Link
                href="/bao-cao-ngay"
                className="flex h-10 items-center gap-2 rounded-md bg-white/16 px-3 text-sm font-extrabold text-white ring-1 ring-white/25 hover:bg-white/24"
              >
                <CalendarCheck2 size={16} />
                Báo cáo ngày
              </Link>

<SoundToggle isOn={isNotificationSoundOn} onToggle={() => setIsNotificationSoundOn((current) => !current)} />
              <SoundToggle isOn={isNotificationSoundOn} onToggle={() => setIsNotificationSoundOn((current) => !current)} />

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
              departments={activeDepartments}
              newContent={newContent}
              newPriority={newPriority}
              newRequestDepartmentId={role === "DEPARTMENT" ? activeDepartmentId : newRequestDepartmentId}
              requesterName={requesterName}
              isSubmitting={isCreatingRequest}
              setAttachmentName={setAttachmentName}
              setAttachmentFile={setAttachmentFile}
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
              isSaving={isSavingRequest}
              onSave={handleUpdateRequest}
            />
          )}

          <TicketBoard
            departmentFilter={departmentFilter}
            departmentName={departmentName}
            departments={activeDepartments}
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
            deletingRequestIds={deletingRequestIds}
            onExport={exportCsv}
            onOpenHistory={() => setIsHistoryOpen(true)}
            historyCount={historyRequestsForMonth.length}
            pendingRatingCount={pendingRatingCount}
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
          ratingRequestIds={ratingRequestIds}
          staffName={staffName}
          onClose={() => setIsHistoryOpen(false)}
          onRateRequest={handleRateRequest}
        />
        <CatalogModal
          isOpen={isCatalogOpen}
          departments={activeDepartments}
          newDepartmentName={newDepartmentName}
          newStaffName={newStaffName}
          isAddingDepartment={isAddingDepartment}
          isAddingStaff={isAddingStaff}
          deletingDepartmentIds={deletingDepartmentIds}
          deletingStaffIds={deletingStaffIds}
          setNewDepartmentName={setNewDepartmentName}
          setNewStaffName={setNewStaffName}
          staff={staff}
          onAddDepartment={handleAddDepartment}
          onAddStaff={handleAddStaff}
          onClose={() => setIsCatalogOpen(false)}
          onDeleteDepartment={handleDeleteDepartment}
          onDeleteStaff={handleDeleteStaff}
        />
      </section>
      <ChatWidget
        activeDepartmentName={activeChatDepartment?.name ?? departmentName(activeChatDepartmentId)}
        chatDraft={chatDraft}
        departments={activeDepartments}
        isOpen={isChatOpen}
        isSending={isSendingChat}
        messages={chatMessagesForThread}
        recallingMessageIds={recallingChatMessageIds}
        role={session.role}
        selectedDepartmentId={activeChatDepartmentId}
        unreadCount={chatUnreadCount}
        unreadCountForDepartment={unreadChatCountForDepartment}
        setChatDraft={setChatDraft}
        setIsOpen={setIsChatOpen}
        setSelectedDepartmentId={setSelectedChatDepartmentId}
        onRecall={handleRecallChat}
        onSubmit={handleSendChat}
      />
      <AppFooter className="relative z-10 mx-auto mt-8 max-w-7xl" />
      <AppDialog dialog={dialog} onClose={closeDialog} />
      <LoadingOverlay isOpen={isApiBusy} message={apiBusyMessage} />
    </main>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200/70 ${className}`}>{children}</div>;
}

function BrandMark({ className = "", imageClassName = "" }: { className?: string; imageClassName?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center ${className}`}>
      <img
        className={`h-full w-full object-contain drop-shadow-[0_1px_1px_rgba(15,23,42,0.22)] ${imageClassName}`}
        src={APP_ICON_SRC}
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}

function AppFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`text-center text-xs font-black leading-5 text-slate-500 ${className}`}>
      <p>{COPYRIGHT_TEXT}</p>
      <p className="text-slate-700">{TEAM_TAGLINE}</p>
    </footer>
  );
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
  isSubmitting,
  setLoginDepartmentId,
  setLoginPassword,
  setLoginRole,
  onSubmit
}: {
  departments: Department[];
  loginDepartmentId: string;
  loginPassword: string;
  loginRole: Role | "";
  isSubmitting: boolean;
  setLoginDepartmentId: (value: string) => void;
  setLoginPassword: (value: string) => void;
  setLoginRole: (value: Role | "") => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const canSubmit = (loginRole === "IT" && Boolean(loginPassword)) || (loginRole === "DEPARTMENT" && Boolean(loginDepartmentId));

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[360px] hero-panel" />
      <section className="relative mx-auto flex w-full flex-1 items-center py-6 sm:max-w-3xl">
        <form className="w-full rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-7" onSubmit={onSubmit}>
          <div className="mb-6 flex items-center gap-3">
            <BrandMark className="size-16" />
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
                disabled={loginRole !== "DEPARTMENT" || isSubmitting}
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
                disabled={isSubmitting}
                autoComplete="current-password"
                required
              />
            </label>
          ) : null}

          <button
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-black text-white shadow-lg shadow-aqua/15 hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            type="submit"
            disabled={!canSubmit || isSubmitting}
          >
            <LogIn size={18} />
            Vào hệ thống
          </button>
        </form>
      </section>
      <AppFooter className="relative z-10 mx-auto w-full max-w-3xl" />
      <LoadingOverlay isOpen={isSubmitting} message="Đang đăng nhập..." />
    </main>
  );
}

function LoadingOverlay({ isOpen, message }: { isOpen: boolean; message: string }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/20 px-4 backdrop-blur-[2px]">
      <div
        className="flex min-w-[220px] items-center gap-3 rounded-lg bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-soft ring-1 ring-slate-200"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="animate-spin text-aqua" size={22} />
        <span>{message}</span>
      </div>
    </div>
  );
}

function AppDialog({ dialog, onClose }: { dialog: DialogState; onClose: (result: boolean) => void }) {
  if (!dialog) return null;

  const isDanger = dialog.kind === "confirm" && dialog.tone === "danger";
  const confirmClassName = isDanger
    ? "bg-red-600 text-white shadow-lg shadow-red-600/20 hover:bg-red-700"
    : "bg-aqua text-white shadow-lg shadow-aqua/20 hover:bg-aqua/90";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm">
      <div
        className="w-[min(460px,calc(100vw-32px))] overflow-hidden rounded-lg bg-white text-slate-900 shadow-soft ring-1 ring-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
      >
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                isDanger ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-aqua/12 text-aqua"
              }`}
            >
              {isDanger ? <Trash2 size={18} /> : <Bell size={18} />}
            </span>
            <h2 id="app-dialog-title" className="text-lg font-black uppercase tracking-wide text-slate-900">
              {dialog.title}
            </h2>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="space-y-2 text-sm font-semibold leading-6 text-slate-600">
            {dialog.message.split("\n").map((line, index) => (
              <p key={`${line}-${index}`}>{line}</p>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
          {dialog.kind === "confirm" ? (
            <button
              className="h-10 rounded-md bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
              type="button"
              onClick={() => onClose(false)}
            >
              {dialog.cancelLabel}
            </button>
          ) : null}
          <button className={`h-10 rounded-md px-4 text-sm font-black ${confirmClassName}`} type="button" onClick={() => onClose(true)}>
            {dialog.kind === "confirm" ? dialog.confirmLabel : "Đã hiểu"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StableTextarea({
  value,
  onValueChange,
  className,
  ...props
}: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onValueChange: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(value);
  const isFocusedRef = useRef(false);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current || value === "") {
      setDraftValue(value);
    }
  }, [value]);

  return (
    <textarea
      {...props}
      className={`${className ?? ""} break-words [overflow-wrap:anywhere]`}
      value={draftValue}
      wrap="soft"
      spellCheck={false}
      autoCorrect="off"
      onFocus={(event) => {
        isFocusedRef.current = true;
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        isFocusedRef.current = false;
        onValueChange(event.currentTarget.value);
        props.onBlur?.(event);
      }}
      onCompositionStart={(event) => {
        isComposingRef.current = true;
        props.onCompositionStart?.(event);
      }}
      onCompositionEnd={(event) => {
        isComposingRef.current = false;
        const nextValue = event.currentTarget.value;
        setDraftValue(nextValue);
        onValueChange(nextValue);
        props.onCompositionEnd?.(event);
      }}
      onChange={(event) => {
        const nextValue = event.target.value;
        setDraftValue(nextValue);
        if (!isComposingRef.current) {
          onValueChange(nextValue);
        }
      }}
    />
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
        {requests.length > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-amber-300 px-1.5 py-0.5 text-center text-[11px] font-black text-slate-900">
            {requests.length}
          </span>
        ) : null}
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

function SoundToggle({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  const Icon = isOn ? Volume2 : VolumeX;

  return (
    <button
      className={`flex size-10 items-center justify-center rounded-md ring-1 ${
        isOn
          ? "bg-white/18 text-white ring-white/24 hover:bg-white/24"
          : "bg-white text-slate-700 ring-white/70 hover:bg-white/90"
      }`}
      type="button"
      title={isOn ? "Tắt âm báo" : "Bật âm báo"}
      aria-label={isOn ? "Tắt âm báo" : "Bật âm báo"}
      aria-pressed={isOn}
      onClick={onToggle}
    >
      <Icon size={18} />
    </button>
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
  isSubmitting,
  setAttachmentName,
  setAttachmentFile,
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
  isSubmitting: boolean;
  setAttachmentName: (value: string) => void;
  setAttachmentFile: (value: File | null) => void;
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
            disabled={lockDepartment || isSubmitting}
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
            disabled={isSubmitting}
            required
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Nội dung</span>
          <StableTextarea
            className="mt-2 min-h-32 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 outline-none focus:border-aqua"
            value={newContent}
            onValueChange={setNewContent}
            disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </label>

          <div className="block">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">File</span>
            <label className="mt-2 flex h-11 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-slate-800 px-3 text-sm font-black text-white shadow-sm hover:bg-slate-700">
              Chọn file
              <input
                className="sr-only"
                type="file"
                disabled={isSubmitting}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setAttachmentFile(file);
                  setAttachmentName(file?.name ?? "");
                }}
              />
            </label>
          </div>
        </div>

        {attachmentName ? <p className="text-xs font-bold text-slate-500">File đã chọn: {attachmentName}</p> : null}

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-black text-white shadow-lg shadow-aqua/15 hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none" type="submit" disabled={isSubmitting}>
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
  isSaving,
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
  isSaving: boolean;
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
            disabled={isSaving}
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
            disabled={isSaving}
          />
        </label>

        <label className="block">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Ghi chú</span>
          <StableTextarea
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-slate-200 bg-white p-3 text-sm font-semibold leading-6 outline-none focus:border-aqua"
            value={draftNote}
            onValueChange={setDraftNote}
            disabled={isSaving}
          />
        </label>

        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-aqua px-4 text-sm font-black text-white shadow-lg shadow-aqua/20 hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none" type="button" onClick={onSave} disabled={isSaving}>
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
  deletingRequestIds,
  onExport,
  onOpenHistory,
  historyCount,
  pendingRatingCount,
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
  deletingRequestIds: string[];
  onExport: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  pendingRatingCount: number;
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
                      <span
                        className="flex max-w-full items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-600 hover:bg-aqua/10 hover:text-aqua"
                        role={request.attachmentUrl ? "link" : undefined}
                        tabIndex={request.attachmentUrl ? 0 : undefined}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (request.attachmentUrl) window.open(attachmentHref(request.attachmentUrl), "_blank", "noopener,noreferrer");
                        }}
                      >
                        <FileText size={12} />
                        <span className="truncate">{request.attachmentName}</span>
                      </span>
                    ) : null}
                  </div>
                </button>

                {role === "IT" && onDeleteRequest ? (
                  <button
                    className={`absolute right-3 top-3 flex size-8 items-center justify-center rounded-md bg-rose-50 text-rose-500 ring-1 ring-rose-100 hover:bg-rose-100 hover:text-rose-700 hover:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                      deletingRequestIds.includes(request.id) ? "animate-pulse" : ""
                    }`}
                    type="button"
                    title="Xóa phiếu"
                    aria-label={`Xóa phiếu ${request.id}`}
                    disabled={deletingRequestIds.includes(request.id)}
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
        className="relative flex h-11 w-full items-center justify-center gap-2 rounded-md bg-white text-sm font-black text-aqua shadow-sm ring-1 ring-aqua/30 hover:bg-aqua/10"
        type="button"
        onClick={onOpenHistory}
      >
        <History size={17} />
        Xem lịch sử
        <span className="rounded-full bg-aqua/12 px-2 py-0.5 text-[11px] text-aqua">{historyCount}</span>
        {role === "DEPARTMENT" && pendingRatingCount > 0 ? (
          <span
            className="absolute -right-2 -top-2 flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-black text-white shadow-lg shadow-red-600/20 ring-2 ring-white"
            aria-label={`${pendingRatingCount} yêu cầu cần đánh giá`}
          >
            {pendingRatingCount}
          </span>
        ) : null}
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
  departments,
  newDepartmentName,
  newStaffName,
  isAddingDepartment,
  isAddingStaff,
  deletingDepartmentIds,
  deletingStaffIds,
  setNewDepartmentName,
  setNewStaffName,
  staff,
  onAddDepartment,
  onAddStaff,
  onClose,
  onDeleteDepartment,
  onDeleteStaff
}: {
  isOpen: boolean;
  departments: Department[];
  newDepartmentName: string;
  newStaffName: string;
  isAddingDepartment: boolean;
  isAddingStaff: boolean;
  deletingDepartmentIds: string[];
  deletingStaffIds: string[];
  setNewDepartmentName: (value: string) => void;
  setNewStaffName: (value: string) => void;
  staff: ITStaff[];
  onAddDepartment: () => void;
  onAddStaff: () => void;
  onClose: () => void;
  onDeleteDepartment: (departmentId: string) => void;
  onDeleteStaff: (staffId: string) => void;
}) {
  if (!isOpen) return null;
  const canDeleteDepartment = departments.length > 1;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        className="w-[min(940px,calc(100vw-32px))] overflow-hidden rounded-lg bg-white text-slate-900 shadow-soft ring-1 ring-slate-200"
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
          <div className="ml-auto hidden items-center gap-2 text-xs font-black text-slate-500 sm:flex">
            <span className="rounded bg-slate-100 px-2 py-1">{departments.length} phong ban</span>
            <span className="rounded bg-slate-100 px-2 py-1">{staff.length} IT</span>
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

        <div className="grid max-h-[calc(100vh-150px)] gap-4 overflow-auto px-5 py-4 lg:grid-cols-2">
          <section className="min-w-0 rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">Phòng ban</h3>
              <span className="rounded bg-white px-2 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">{departments.length}</span>
            </div>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onAddDepartment();
              }}
            >
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-aqua"
                placeholder="Phòng ban mới"
                value={newDepartmentName}
                onChange={(event) => setNewDepartmentName(event.target.value)}
                disabled={isAddingDepartment}
              />
              <button
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-aqua text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                type="submit"
                title="Thêm phòng ban"
                disabled={isAddingDepartment || !newDepartmentName.trim()}
              >
                <Plus size={18} />
              </button>
            </form>

            <div className="thin-scrollbar max-h-[46vh] space-y-2 overflow-auto pr-1">
              {departments.length ? (
                departments.map((department) => (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-slate-200" key={department.id}>
                    <span className="min-w-0 truncate text-sm font-black text-slate-700">{department.name}</span>
                    <button
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 ${
                        deletingDepartmentIds.includes(department.id) ? "animate-pulse" : ""
                      }`}
                      type="button"
                      title="Xóa phòng ban"
                      disabled={!canDeleteDepartment || deletingDepartmentIds.includes(department.id)}
                      onClick={() => onDeleteDepartment(department.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-white p-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Chưa có phòng ban.</p>
              )}
            </div>
          </section>

          <section className="min-w-0 rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-800">Nhân viên IT</h3>
              <span className="rounded bg-white px-2 py-1 text-xs font-black text-slate-500 ring-1 ring-slate-200">{staff.length}</span>
            </div>
            <form
              className="mb-3 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onAddStaff();
              }}
            >
              <input
                className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-aqua"
                placeholder="Nhân viên IT mới"
                value={newStaffName}
                onChange={(event) => setNewStaffName(event.target.value)}
                disabled={isAddingStaff}
              />
              <button
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-800 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="submit"
                title="Thêm nhân viên IT"
                disabled={isAddingStaff || !newStaffName.trim()}
              >
                <Plus size={18} />
              </button>
            </form>

            <div className="thin-scrollbar max-h-[46vh] space-y-2 overflow-auto pr-1">
              {staff.length ? (
                staff.map((member) => (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 ring-1 ring-slate-200" key={member.id}>
                    <span className="min-w-0 truncate text-sm font-black text-slate-700">{member.fullName}</span>
                    <button
                      className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                        deletingStaffIds.includes(member.id) ? "animate-pulse" : ""
                      }`}
                      type="button"
                      title="Xóa nhân viên IT"
                      disabled={deletingStaffIds.includes(member.id)}
                      onClick={() => onDeleteStaff(member.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="rounded-md bg-white p-3 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">Chưa có nhân viên IT.</p>
              )}
            </div>
          </section>
        </div>

        <div className="hidden">
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
              disabled={isAddingDepartment}
            />
            <button className="flex size-10 items-center justify-center rounded-md bg-aqua text-white" type="submit" title="Thêm phòng ban">
              <Plus size={18} />
            </button>
            {isAddingDepartment ? <span className="self-center text-xs font-black text-aqua">Đang thêm...</span> : null}
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
              disabled={isAddingStaff}
            />
            <button className="flex size-10 items-center justify-center rounded-md bg-slate-800 text-white hover:bg-slate-700" type="submit" title="Thêm nhân viên IT">
              <Plus size={18} />
            </button>
            {isAddingStaff ? <span className="self-center text-xs font-black text-slate-500">Đang thêm...</span> : null}
          </form>

          <div className="thin-scrollbar max-h-[44vh] space-y-2 overflow-auto pr-1">
            {staff.map((member) => (
              <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200" key={member.id}>
                <span className="min-w-0 truncate text-sm font-black text-slate-700">{member.fullName}</span>
                <button
                  className={`flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    deletingStaffIds.includes(member.id) ? "animate-pulse" : ""
                  }`}
                  type="button"
                  title="Xóa nhân viên IT"
                  disabled={deletingStaffIds.includes(member.id)}
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
  ratingRequestIds,
  staffName,
  onClose,
  onRateRequest
}: {
  historyRequests: ITRequest[];
  departmentName: (id: string) => string;
  isOpen: boolean;
  role: Role;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  ratingRequestIds: string[];
  staffName: (id: string | null) => string;
  onClose: () => void;
  onRateRequest: (requestId: string, rating: Rating) => void;
}) {
  if (!isOpen) return null;

  function exportHistoryCsv() {
    const header = ["Người gửi", "Phòng ban", "Thời gian nhờ", "Trạng thái", "Đánh giá"];
    header.splice(2, 0, "Người phụ trách");
    const rows = historyRequests.map((request) => [
      request.requesterName,
      departmentName(request.departmentId),
      staffName(request.assignedToId),
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
        className="w-[min(1280px,calc(100vw-32px))] overflow-visible rounded-lg bg-white text-slate-900 shadow-soft ring-1 ring-slate-200"
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
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Người gửi</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Phòng ban</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Người phụ trách</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Thời gian nhờ</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Trạng thái</th>
                    <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3">Đánh giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyRequests.map((request) => (
                    <tr className="bg-white hover:bg-slate-50" key={request.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-black text-slate-800">{request.requesterName}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">{departmentName(request.departmentId)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">{staffName(request.assignedToId)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-600">{formatDateTime(request.createdAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${statusTone[request.status]}`}>
                          {statusLabels[request.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          {request.status === "DONE" ? (
                            <>
                              <StarRating
                                value={request.rating}
                                interactive={role === "DEPARTMENT" && !request.rating && !ratingRequestIds.includes(request.id)}
                                onChange={(rating) => onRateRequest(request.id, rating)}
                              />
                              {request.rating ? (
                                <span className="whitespace-nowrap text-xs font-black text-slate-500">{request.rating}/5</span>
                              ) : (
                                <span className="whitespace-nowrap text-xs font-bold text-slate-400">Chưa đánh giá</span>
                              )}
                            </>
                          ) : (
                            <span className="whitespace-nowrap text-xs font-bold text-slate-400">Không áp dụng</span>
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
function ChatWidget({
  activeDepartmentName,
  chatDraft,
  departments,
  isOpen,
  isSending,
  messages,
  recallingMessageIds,
  role,
  selectedDepartmentId,
  unreadCount,
  unreadCountForDepartment,
  setChatDraft,
  setIsOpen,
  setSelectedDepartmentId,
  onRecall,
  onSubmit
}: {
  activeDepartmentName: string;
  chatDraft: string;
  departments: Department[];
  isOpen: boolean;
  isSending: boolean;
  messages: ChatMessage[];
  recallingMessageIds: string[];
  role: Role;
  selectedDepartmentId: string;
  unreadCount: number;
  unreadCountForDepartment: (departmentId: string) => number;
  setChatDraft: (value: string) => void;
  setIsOpen: (value: boolean) => void;
  setSelectedDepartmentId: (value: string) => void;
  onRecall: (messageId: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="w-[min(420px,calc(100vw-40px))] overflow-hidden rounded-lg bg-white text-slate-900 shadow-soft ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="truncate text-sm font-black uppercase tracking-wide">Tin nhắn nội bộ</p>
              <p className="mt-0.5 truncate text-xs font-bold text-white/65">{role === "IT" ? activeDepartmentName : "Phòng IT"}</p>
            </div>
            <button
              className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
              type="button"
              aria-label="Đóng tin nhắn"
              onClick={() => setIsOpen(false)}
            >
              <X size={17} />
            </button>
          </div>

          {role === "IT" ? (
            <div className="thin-scrollbar flex max-h-28 gap-2 overflow-auto border-b border-slate-200 bg-slate-50 p-3">
              {departments.map((department) => {
                const departmentUnreadCount = unreadCountForDepartment(department.id);
                const isSelected = selectedDepartmentId === department.id;
                return (
                  <button
                    className={`relative shrink-0 rounded-md px-3 py-2 text-xs font-black ring-1 ${
                      isSelected ? "bg-aqua text-white ring-aqua" : "bg-white text-slate-600 ring-slate-200 hover:bg-aqua/10 hover:text-aqua"
                    }`}
                    type="button"
                    key={department.id}
                    onClick={() => setSelectedDepartmentId(department.id)}
                  >
                    {department.name}
                    {departmentUnreadCount > 0 ? (
                      <span className="absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-black text-white ring-2 ring-white">
                        {departmentUnreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="thin-scrollbar flex max-h-[380px] min-h-[260px] flex-col gap-3 overflow-auto bg-white p-4">
            {messages.length ? (
              messages.map((message) => {
                const isMine = message.senderRole === role;
                const isRecalling = recallingMessageIds.includes(message.id);
                return (
                  <div className={`flex ${isMine ? "justify-end" : "justify-start"}`} key={message.id}>
                    <div
                      className={`max-w-[82%] rounded-lg px-3 py-2 shadow-sm ring-1 ${
                        isMine ? "bg-aqua text-white ring-aqua/20" : "bg-slate-50 text-slate-700 ring-slate-200"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-3 text-[11px] font-black opacity-75">
                        <span>{message.senderName}</span>
                        <span className="flex items-center gap-1.5">
                          {formatDateTime(message.sentAt)}
                          {isMine ? (
                            <button
                              className="flex size-5 items-center justify-center rounded bg-white/15 text-current hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                              type="button"
                              title="Thu hồi tin nhắn"
                              aria-label="Thu hồi tin nhắn"
                              disabled={isRecalling}
                              onClick={() => onRecall(message.id)}
                            >
                              {isRecalling ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                            </button>
                          ) : null}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap break-words text-sm font-semibold leading-6">{message.content}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid flex-1 place-items-center rounded-md bg-slate-50 p-4 text-center text-sm font-bold text-slate-400 ring-1 ring-slate-200">
                Chưa có tin nhắn.
              </div>
            )}
          </div>

          <form className="flex gap-2 border-t border-slate-200 bg-slate-50 p-3" onSubmit={onSubmit}>
            <input
              className="h-11 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400 focus:border-aqua"
              placeholder="Nhập tin nhắn..."
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              disabled={isSending || !selectedDepartmentId}
            />
            <button
              className="flex size-11 shrink-0 items-center justify-center rounded-md bg-aqua text-white shadow-lg shadow-aqua/20 hover:bg-aqua/90 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
              type="submit"
              aria-label="Gửi tin nhắn"
              disabled={isSending || !chatDraft.trim() || !selectedDepartmentId}
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      ) : null}

      <button
        className="relative flex size-14 items-center justify-center rounded-lg bg-aqua text-white shadow-soft ring-1 ring-aqua/30 transition hover:-translate-y-0.5 hover:bg-aqua/90 hover:shadow-lg hover:shadow-aqua/25"
        type="button"
        aria-label="Mở tin nhắn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <MessageCircle size={25} />
        {unreadCount > 0 ? (
          <span className="absolute -right-2 -top-2 flex min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[11px] font-black text-white shadow-lg shadow-red-600/20 ring-2 ring-white">
            {unreadCount}
          </span>
        ) : null}
      </button>
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
