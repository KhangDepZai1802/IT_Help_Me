"use client";

import {
  forwardRef,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  Loader2,
  AlertCircle,
  HelpCircle,
  UserRound,
  TrendingUp,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Download,
} from "lucide-react";
import { toBlob } from "html-to-image";

/* ============================================================
 * Types
 * ============================================================ */

type TaskStatus = "pending" | "inprogress" | "done";

type PriorityTask = {
  id: string;
  project: string;
  category: string;
  description: string;
  due: string; // yyyy-mm-dd
  owner: string;
  status: TaskStatus;
};

type FollowupTask = {
  id: string;
  content: string;
  project: string;
  due: string; // yyyy-mm-dd
  support: string;
  status: TaskStatus;
};

type ReportForm = {
  reportDate: string; // yyyy-mm-dd
  companyName: string;
  subtitle: string;
  recipient: string;
  intro: string;
  priorityTasks: PriorityTask[];
  followupTasks: FollowupTask[];
  notes: string[];
  owner: string;
};

/* ============================================================
 * Constants
 * ============================================================ */

const WEEKDAY_LABELS = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

const STATUS_META: Record<
  TaskStatus,
  { label: string; badge: string; dot: string }
> = {
  pending: { label: "Chưa thực hiện", badge: "bg-rose-700 text-white", dot: "bg-rose-600" },
  inprogress: { label: "Đang thực hiện", badge: "bg-amber-500 text-emerald-950", dot: "bg-amber-500" },
  done: { label: "Đã hoàn thành", badge: "bg-emerald-700 text-white", dot: "bg-emerald-600" },
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "pending", label: "Chưa thực hiện" },
  { value: "inprogress", label: "Đang thực hiện" },
  { value: "done", label: "Đã hoàn thành" },
];

const STAT_TONES = {
  green: { ring: "ring-emerald-800/10", icon: "bg-emerald-800 text-white" },
  gold: { ring: "ring-amber-500/10", icon: "bg-amber-500 text-white" },
  red: { ring: "ring-rose-700/10", icon: "bg-rose-700 text-white" },
  gray: { ring: "ring-slate-400/10", icon: "bg-slate-400 text-white" },
} as const;

/* ============================================================
 * Helpers
 * ============================================================ */

let idCounter = 0;
function uid(prefix: string) {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Parse "yyyy-mm-dd" as LOCAL date parts (tránh lỗi lệch ngày do
// new Date("yyyy-mm-dd") bị trình duyệt hiểu là UTC midnight).
function parseYMD(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return { y, m, d };
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const { y, m, d } = parseYMD(dateStr);
  if (!y || !m || !d) return "";
  return `${pad2(d)}/${pad2(m)}/${y}`;
}

function weekdayLabel(dateStr: string) {
  if (!dateStr) return "";
  const { y, m, d } = parseYMD(dateStr);
  if (!y || !m || !d) return "";
  return WEEKDAY_LABELS[new Date(y, m - 1, d).getDay()];
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function emptyForm(): ReportForm {
  const today = todayISO();
  return {
    reportDate: today,
    companyName: "Thống Đạt Group",
    subtitle: "Các mục công việc cần làm hôm nay",
    recipient: "",
    intro:
      "Dưới đây là các hạng mục công việc cần theo dõi và triển khai trong ngày hôm nay.",
    priorityTasks: [
      {
        id: uid("p"),
        project: "",
        category: "",
        description: "",
        due: today,
        owner: "",
        status: "inprogress",
      },
    ],
    followupTasks: [
      {
        id: uid("f"),
        content: "",
        project: "",
        due: today,
        support: "-",
        status: "pending",
      },
    ],
    notes: [""],
    owner: "",
  };
}

/* ============================================================
 * Small form atoms
 * ============================================================ */

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1 block text-[11px] font-black uppercase tracking-wide text-slate-400">
      {children}
    </label>
  );
}

function TextField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-300 focus:border-emerald-600 ${className}`}
    />
  );
}

function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-300 focus:border-emerald-600"
    />
  );
}

function DateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600 [color-scheme:light]"
    />
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: TaskStatus;
  onChange: (v: TaskStatus) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskStatus)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-600"
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function RemoveRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50"
    >
      <Trash2 size={15} />
    </button>
  );
}

function AddRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg border border-dashed border-emerald-300 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-50"
    >
      <Plus size={14} />
      {label}
    </button>
  );
}

function FormSection({
  number,
  title,
  children,
}: {
  number: string | number;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
      <div className="mb-4 flex items-stretch overflow-hidden rounded-lg">
        <div className="flex w-11 shrink-0 items-center justify-center bg-amber-500">
          <span className="text-lg font-black text-emerald-950">{number}</span>
        </div>
        <div
          className="flex flex-1 items-center bg-gradient-to-r from-emerald-950 to-emerald-800 px-4 py-2"
          style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 12px) 100%, 0 100%)" }}
        >
          <span className="text-xs font-black uppercase tracking-wider text-white">
            {title}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}

/* ============================================================
 * Export-only presentational atoms (dùng trong ảnh xuất ra)
 * ============================================================ */

function ExportStatCard({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: typeof ClipboardList;
  tone: keyof typeof STAT_TONES;
}) {
  const t = STAT_TONES[tone];
  return (
    <div className={`flex flex-col items-center gap-2 rounded-xl bg-white px-3 py-4 ring-1 ${t.ring}`}>
      <span className={`flex size-11 items-center justify-center rounded-full ${t.icon}`}>
        <Icon size={20} strokeWidth={2.4} />
      </span>
      <span className="text-3xl font-black text-slate-900 tabular-nums">{value}</span>
      <span className="text-center text-[11px] font-bold leading-tight text-slate-500">
        {label}
      </span>
    </div>
  );
}

function ExportRibbon({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg">
      <div className="flex w-12 shrink-0 items-center justify-center bg-amber-500">
        <span className="text-2xl font-black text-emerald-950">{number}</span>
      </div>
      <div
        className="flex flex-1 items-center bg-gradient-to-r from-emerald-950 to-emerald-800 px-4 py-2.5"
        style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)" }}
      >
        <span className="text-sm font-black uppercase tracking-wider text-white">{title}</span>
      </div>
    </div>
  );
}

function ExportBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-center text-xs font-black leading-tight ${meta.badge}`}
    >
      {meta.label}
    </span>
  );
}

function ExportPriorityCard({ index, task }: { index: number; task: PriorityTask }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center sm:gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-base font-black text-white">
        {index}
      </span>
      <div className="min-w-0 flex-1 sm:basis-[220px] sm:flex-none">
        <p className="text-base font-black text-emerald-900">{task.project || "—"}</p>
        <p className="text-sm font-semibold italic text-slate-400">{task.category || "—"}</p>
      </div>
      <div className="min-w-0 flex-1 text-sm font-semibold text-slate-600">
        {task.description || "—"}
      </div>
      <div className="flex shrink-0 flex-col gap-1.5 text-sm font-semibold text-slate-600 sm:w-56">
        <span className="flex items-center gap-2">
          <CalendarDays size={15} className="text-emerald-800" />
          Hạn: <span className="font-black text-rose-600">{formatDateDisplay(task.due) || "—"}</span>
        </span>
        <span className="flex items-center gap-2">
          <UserRound size={15} className="text-emerald-800" />
          Phụ trách: <span className="font-bold text-slate-800">{task.owner || "—"}</span>
        </span>
      </div>
      <div className="shrink-0 sm:w-28">
        <ExportBadge status={task.status} />
      </div>
    </div>
  );
}

/* ============================================================
 * Export card — bản render off-screen, dùng để chụp ảnh PNG
 * ============================================================ */

const EXPORT_IMAGE_WIDTH = 1080;
const EXPORT_IMAGE_PADDING = 10;
const EXPORT_CONTENT_WIDTH = EXPORT_IMAGE_WIDTH - EXPORT_IMAGE_PADDING * 2;

const ReportExportCard = forwardRef<
  HTMLDivElement,
  { form: ReportForm; contentRef: { current: HTMLDivElement | null } }
>(function ReportExportCard({ form, contentRef }, ref) {
  const today = {
    weekday: weekdayLabel(form.reportDate),
    dateStr: formatDateDisplay(form.reportDate),
  };

  const allTasks = [...form.priorityTasks, ...form.followupTasks];
  const count = (status: TaskStatus) =>
    allTasks.filter((t) => t.status === status).length;

  const stats = {
    total: allTasks.length,
    dueToday: allTasks.length,
    done: count("done"),
    inprogress: count("inprogress"),
    pending: count("pending"),
  };

  const visibleNotes = form.notes.map((n) => n.trim()).filter(Boolean);
  const visibleFollowups = form.followupTasks.filter(
    (t) => t.content.trim() || t.project.trim(),
  );

  return (
    <div
      ref={ref}
      style={{ width: EXPORT_IMAGE_WIDTH }}
      className="relative overflow-hidden bg-slate-100"
    >
      <div
        ref={contentRef}
        style={{
          width: EXPORT_CONTENT_WIDTH,
          left: EXPORT_IMAGE_PADDING,
          top: EXPORT_IMAGE_PADDING,
        }}
        className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200"
      >
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-9 py-8">
          <div
            className="pointer-events-none absolute right-9 top-5 h-16 w-24 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.5) 1.4px, transparent 1.4px)",
              backgroundSize: "10px 10px",
            }}
          />
          <span className="absolute right-9 top-6 flex size-14 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
            <TrendingUp size={26} />
          </span>

          <div className="flex items-end justify-between gap-4">
            <div className="max-w-lg">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-amber-400">
                {form.companyName || "Báo cáo"}
                <span className="text-amber-400/60">•</span>
                <span className="text-white/70">Báo cáo công việc</span>
              </p>
              <h1 className="text-5xl font-black uppercase leading-[1.05] tracking-tight text-white">
                Báo cáo
                <br />
                đầu ngày
              </h1>
              <p className="mt-2 text-sm font-bold uppercase tracking-wide text-emerald-200/80">
                {form.subtitle}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-px w-16 bg-amber-400/70" />
                <Sparkles size={14} className="text-amber-400" />
                <span className="h-px w-16 bg-amber-400/70" />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-amber-500 px-4 py-3 shadow-lg shadow-black/10">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-amber-400">
                <CalendarDays size={20} />
              </span>
              <p className="text-sm font-black leading-tight text-emerald-950">
                {today.weekday},
                <br />
                ngày {today.dateStr}
              </p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="space-y-5 px-8 py-7">
          <div className="flex items-start gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/80">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-white">
              <UserRound size={22} />
            </span>
            <div>
              <p className="text-lg font-black text-emerald-950">
                Kính gửi {form.recipient || "..."},
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                {form.intro}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-2.5">
            <ExportStatCard label="Tổng đầu việc" value={stats.total} Icon={ClipboardList} tone="green" />
            <ExportStatCard label="Hạn trong ngày" value={stats.dueToday} Icon={CalendarDays} tone="gold" />
            <ExportStatCard label="Đã hoàn thành" value={stats.done} Icon={CheckCircle2} tone="green" />
            <ExportStatCard label="Đang thực hiện" value={stats.inprogress} Icon={Loader2} tone="gold" />
            <ExportStatCard label="Chưa thực hiện" value={stats.pending} Icon={AlertCircle} tone="red" />
            <ExportStatCard label="Chưa cập nhật" value={0} Icon={HelpCircle} tone="gray" />
          </div>

          <div className="space-y-3">
            <ExportRibbon number={1} title="Ưu tiên thực hiện hôm nay" />
            <div className="space-y-3">
              {form.priorityTasks.map((task, i) => (
                <ExportPriorityCard key={task.id} index={i + 1} task={task} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <ExportRibbon number={2} title="Công việc theo dõi / bổ sung" />
            <div className="overflow-hidden rounded-xl ring-1 ring-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-emerald-950 text-[11px] font-black uppercase tracking-wide text-white">
                  <tr>
                    <th className="w-12 px-3 py-3 text-center">STT</th>
                    <th className="px-3 py-3">Nội dung công việc</th>
                    <th className="px-3 py-3">Dự án / Hạng mục</th>
                    <th className="px-3 py-3">Hạn hoàn thành</th>
                    <th className="w-16 px-3 py-3 text-center">Hỗ trợ</th>
                    <th className="w-32 px-3 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {visibleFollowups.length ? (
                    visibleFollowups.map((row, i) => (
                      <tr key={row.id}>
                        <td className="px-3 py-3 text-center font-black text-slate-400">{i + 1}</td>
                        <td className="whitespace-pre-wrap break-words px-3 py-3 font-semibold text-slate-700">
                          {row.content || "—"}
                        </td>
                        <td className="px-3 py-3 font-bold text-emerald-900">{row.project || "—"}</td>
                        <td className="px-3 py-3 font-black text-rose-600">
                          {formatDateDisplay(row.due) || "—"}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold text-slate-400">
                          {row.support || "-"}
                        </td>
                        <td className="px-3 py-3">
                          <ExportBadge status={row.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-3 py-4 text-center text-sm font-semibold italic text-slate-400">
                        Chưa có công việc theo dõi / bổ sung
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="rounded-xl border border-amber-300/70 bg-amber-50/60 p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-white">
                  <ClipboardList size={16} />
                </span>
                <p className="text-sm font-black uppercase tracking-wide text-emerald-950">Lưu ý</p>
              </div>
              {visibleNotes.length ? (
                <ul className="space-y-1.5 pl-1">
                  {visibleNotes.map((note, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                      {note}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-semibold italic text-slate-400">Chưa có lưu ý</p>
              )}
            </div>

            <div className="flex min-w-[180px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 px-6 py-4 text-center ring-1 ring-slate-200/80">
              <span className="flex size-12 items-center justify-center rounded-full bg-emerald-950 text-white">
                <UserRound size={22} />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Người phụ trách</p>
              <p className="text-lg font-black text-emerald-950">{form.owner || "—"}</p>
              <span className="mt-1 flex items-center gap-2">
                <span className="h-px w-8 bg-amber-400/70" />
                <Sparkles size={12} className="text-amber-400" />
                <span className="h-px w-8 bg-amber-400/70" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ============================================================
 * Main page — form nhập liệu
 * ============================================================ */

export default function BaoCaoDauNgayFormPage() {
  const [form, setForm] = useState<ReportForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Trên iOS Safari (kể cả trong webview Zalo), thẻ <a download> đôi khi
  // không tự tải được. previewUrl lưu link ảnh vừa mở ở tab mới để hiển
  // thị hướng dẫn "nhấn giữ để lưu" cho người dùng trong trường hợp đó.
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const exportCardRef = useRef<HTMLDivElement>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof ReportForm>(key: K, value: ReportForm[K]) {
    // flushSync ép React commit state ngay lập tức (thay vì gộp/hoãn batch),
    // đảm bảo DOM của card xuất ảnh luôn phản ánh đúng giá trị vừa gõ
    // trước khi người dùng kịp bấm "Xuất ảnh".
    flushSync(() => {
      setForm((prev) => ({ ...prev, [key]: value }));
    });
    setSaveSuccess(false);
  }

  // ---- Priority tasks ----
  function addPriorityTask() {
    update("priorityTasks", [
      ...form.priorityTasks,
      {
        id: uid("p"),
        project: "",
        category: "",
        description: "",
        due: form.reportDate,
        owner: form.owner,
        status: "inprogress",
      },
    ]);
  }
  function updatePriorityTask(id: string, patch: Partial<PriorityTask>) {
    update(
      "priorityTasks",
      form.priorityTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }
  function removePriorityTask(id: string) {
    update("priorityTasks", form.priorityTasks.filter((t) => t.id !== id));
  }

  // ---- Followup tasks ----
  function addFollowupTask() {
    update("followupTasks", [
      ...form.followupTasks,
      {
        id: uid("f"),
        content: "",
        project: "",
        due: form.reportDate,
        support: "-",
        status: "pending",
      },
    ]);
  }
  function updateFollowupTask(id: string, patch: Partial<FollowupTask>) {
    update(
      "followupTasks",
      form.followupTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }
  function removeFollowupTask(id: string) {
    update("followupTasks", form.followupTasks.filter((t) => t.id !== id));
  }

  // ---- Notes ----
  function addNote() {
    update("notes", [...form.notes, ""]);
  }
  function updateNote(index: number, value: string) {
    const next = [...form.notes];
    next[index] = value;
    update("notes", next);
  }
  function removeNote(index: number) {
    update(
      "notes",
      form.notes.filter((_, i) => i !== index),
    );
  }

  const stats = useMemo(() => {
    const all = [...form.priorityTasks, ...form.followupTasks];
    const count = (status: TaskStatus) => all.filter((t) => t.status === status).length;
    return {
      total: all.length,
      done: count("done"),
      inprogress: count("inprogress"),
      pending: count("pending"),
    };
  }, [form.priorityTasks, form.followupTasks]);

  /* ---- Xuất ảnh PNG và tải xuống — tương thích iOS & Android ---- */
  async function handleExportImage() {
    const exportFrame = exportCardRef.current;
    const exportContent = exportContentRef.current;
    if (!exportFrame || !exportContent) return;

    setIsExporting(true);
    setSaveError("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    try {
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const contentHeight = exportContent.scrollHeight;
      const finalHeight = contentHeight + EXPORT_IMAGE_PADDING * 2;
      exportFrame.style.height = `${finalHeight}px`;

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      // Dùng toBlob thay vì toPng: ảnh 1080px x2 pixel ratio dưới dạng
      // base64 dataURL khá nặng, dễ khiến trình duyệt di động (đặc biệt
      // Safari) treo hoặc rớt link tải. Blob nhẹ hơn và ổn định hơn.
      const blob = await toBlob(exportFrame, {
        width: EXPORT_IMAGE_WIDTH,
        height: finalHeight,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f1f5f9",
      });

      if (!blob) {
        throw new Error("Không thể tạo ảnh.");
      }

      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `bao-cao-dau-ngay-${form.reportDate}_${stamp}.png`;
      const objectUrl = URL.createObjectURL(blob);

      // Thử tải xuống trực tiếp bằng thẻ <a download> — cách này hoạt
      // động trên Android/Chrome và hầu hết trình duyệt di động hiện nay.
      const link = document.createElement("a");
      link.download = filename;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      const isIOS =
        typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);

      if (isIOS) {
        // Một số phiên bản Safari/webview trên iOS vẫn bỏ qua thuộc tính
        // `download`. Mở thêm ảnh ở tab mới để chắc chắn người dùng luôn
        // lưu được, dù trình duyệt có tải tự động hay không.
        window.open(objectUrl, "_blank");
        setPreviewUrl(objectUrl);
      } else {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
      }
    } catch (error) {
      console.error("Export image failed:", error);
      setSaveError("Không thể xuất ảnh báo cáo. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  }

  /* ---- Lưu báo cáo (tuỳ backend của bạn) ---- */
  async function handleSubmit() {
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/daily-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stats }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Không thể lưu báo cáo. Vui lòng thử lại.");
      }
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Đã có lỗi xảy ra.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-4">
        {/* ===== Header nhập liệu ===== */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="border-l-4 border-emerald-800 pl-4">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                Daily Brief
              </p>
              <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                Báo cáo đầu ngày
              </h1>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <FieldLabel>Đơn vị</FieldLabel>
                <TextField value={form.companyName} onChange={(v) => update("companyName", v)} />
              </div>
              <div>
                <FieldLabel>Phụ đề</FieldLabel>
                <TextField value={form.subtitle} onChange={(v) => update("subtitle", v)} />
              </div>
              <div>
                <FieldLabel>Ngày báo cáo</FieldLabel>
                <DateField value={form.reportDate} onChange={(v) => update("reportDate", v)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl bg-amber-500 px-4 py-3 shadow-md shadow-amber-500/20 sm:self-end">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-amber-400">
              <CalendarDays size={20} />
            </span>
            <p className="text-sm font-black leading-tight text-emerald-950">
              {weekdayLabel(form.reportDate) || "—"},
              <br />
              ngày {formatDateDisplay(form.reportDate) || "—"}
            </p>
          </div>
        </div>

        {/* ===== Lời gửi ===== */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px_1fr]">
            <div>
              <FieldLabel>Kính gửi</FieldLabel>
              <TextField
                value={form.recipient}
                onChange={(v) => update("recipient", v)}
                placeholder="Sếp Tuấn"
              />
            </div>
            <div>
              <FieldLabel>Lời dẫn</FieldLabel>
              <TextField value={form.intro} onChange={(v) => update("intro", v)} />
            </div>
          </div>
        </div>

        {/* ===== Thống kê (tự tính, chỉ xem) ===== */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          <ExportStatCard label="Tổng đầu việc" value={stats.total} Icon={ClipboardList} tone="green" />
          <ExportStatCard label="Hạn trong ngày" value={stats.total} Icon={CalendarDays} tone="gold" />
          <ExportStatCard label="Đã hoàn thành" value={stats.done} Icon={CheckCircle2} tone="green" />
          <ExportStatCard label="Đang thực hiện" value={stats.inprogress} Icon={Loader2} tone="gold" />
          <ExportStatCard label="Chưa thực hiện" value={stats.pending} Icon={AlertCircle} tone="red" />
          <ExportStatCard label="Chưa cập nhật" value={0} Icon={HelpCircle} tone="gray" />
        </div>

        {/* ===== Mục 1: Ưu tiên hôm nay ===== */}
        <FormSection number={1} title="Ưu tiên thực hiện hôm nay">
          <div className="space-y-3">
            {form.priorityTasks.map((task, index) => (
              <div
                key={task.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[28px_1fr_1fr_1fr_140px_140px_32px] sm:items-start"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-emerald-950 text-xs font-black text-white sm:mt-1">
                  {index + 1}
                </span>
                <div>
                  <FieldLabel>Dự án</FieldLabel>
                  <TextField
                    value={task.project}
                    onChange={(v) => updatePriorityTask(task.id, { project: v })}
                    placeholder="Hạt Dẻ Ông Lý"
                  />
                </div>
                <div>
                  <FieldLabel>Hạng mục</FieldLabel>
                  <TextField
                    value={task.category}
                    onChange={(v) => updatePriorityTask(task.id, { category: v })}
                    placeholder="Website"
                  />
                </div>
                <div>
                  <FieldLabel>Mô tả</FieldLabel>
                  <TextField
                    value={task.description}
                    onChange={(v) => updatePriorityTask(task.id, { description: v })}
                    placeholder="Sửa web, kiểm thử."
                  />
                </div>
                <div>
                  <FieldLabel>Hạn</FieldLabel>
                  <DateField
                    value={task.due}
                    onChange={(v) => updatePriorityTask(task.id, { due: v })}
                  />
                </div>
                <div>
                  <FieldLabel>Phụ trách</FieldLabel>
                  <TextField
                    value={task.owner}
                    onChange={(v) => updatePriorityTask(task.id, { owner: v })}
                    placeholder="Khả Doanh"
                  />
                </div>
                <div className="flex items-end justify-center sm:pt-5">
                  <RemoveRowButton
                    onClick={() => removePriorityTask(task.id)}
                    label="Xoá công việc ưu tiên"
                  />
                </div>
                <div className="sm:col-span-7">
                  <FieldLabel>Trạng thái</FieldLabel>
                  <div className="max-w-[220px]">
                    <StatusSelect
                      value={task.status}
                      onChange={(v) => updatePriorityTask(task.id, { status: v })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <AddRowButton onClick={addPriorityTask} label="Thêm công việc ưu tiên" />
          </div>
        </FormSection>

        {/* ===== Mục 2: Theo dõi / bổ sung ===== */}
        <FormSection number={2} title="Công việc theo dõi / bổ sung">
          <div className="space-y-3">
            {form.followupTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1.4fr_1fr_140px_100px_160px_32px] sm:items-start"
              >
                <div>
                  <FieldLabel>Nội dung công việc</FieldLabel>
                  <TextField
                    value={task.content}
                    onChange={(v) => updateFollowupTask(task.id, { content: v })}
                    placeholder="Hỗ trợ người dùng khi dùng web ca trưởng."
                  />
                </div>
                <div>
                  <FieldLabel>Dự án / Hạng mục</FieldLabel>
                  <TextField
                    value={task.project}
                    onChange={(v) => updateFollowupTask(task.id, { project: v })}
                    placeholder="Hạt Dẻ Ông Lý"
                  />
                </div>
                <div>
                  <FieldLabel>Hạn hoàn thành</FieldLabel>
                  <DateField
                    value={task.due}
                    onChange={(v) => updateFollowupTask(task.id, { due: v })}
                  />
                </div>
                <div>
                  <FieldLabel>Hỗ trợ</FieldLabel>
                  <TextField
                    value={task.support}
                    onChange={(v) => updateFollowupTask(task.id, { support: v })}
                    placeholder="-"
                  />
                </div>
                <div>
                  <FieldLabel>Trạng thái</FieldLabel>
                  <StatusSelect
                    value={task.status}
                    onChange={(v) => updateFollowupTask(task.id, { status: v })}
                  />
                </div>
                <div className="flex items-end justify-center sm:pt-5">
                  <RemoveRowButton
                    onClick={() => removeFollowupTask(task.id)}
                    label="Xoá công việc theo dõi"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <AddRowButton onClick={addFollowupTask} label="Thêm công việc theo dõi" />
          </div>
        </FormSection>

        {/* ===== Lưu ý & người phụ trách ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-white">
                <ClipboardList size={16} />
              </span>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-950">Lưu ý</p>
            </div>
            <div className="space-y-2">
              {form.notes.map((note, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                  <div className="flex-1">
                    <TextField value={note} onChange={(v) => updateNote(index, v)} />
                  </div>
                  <RemoveRowButton onClick={() => removeNote(index)} label="Xoá lưu ý" />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <AddRowButton onClick={addNote} label="Thêm lưu ý" />
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <FieldLabel>Người phụ trách</FieldLabel>
            <TextField value={form.owner} onChange={(v) => update("owner", v)} placeholder="Khả Doanh" />
          </div>
        </div>

        {/* ===== Trạng thái lưu / lỗi ===== */}
        {saveError ? (
          <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
            {saveError}
          </div>
        ) : null}
        {saveSuccess ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 ring-1 ring-emerald-100">
            Đã lưu báo cáo thành công!
          </div>
        ) : null}

        {/* Hướng dẫn lưu ảnh trên iOS khi thẻ tải xuống không tự chạy */}
        {previewUrl ? (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 ring-1 ring-amber-100">
            Ảnh báo cáo đã mở ở tab mới — nhấn giữ vào ảnh và chọn "Lưu vào Ảnh" để lưu.
          </div>
        ) : null}

        {/* ===== Nút hành động ===== */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? "Đang xuất ảnh..." : "Xuất ảnh (Zalo)"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-700 px-5 text-sm font-black text-white shadow-md shadow-emerald-800/25 transition hover:from-emerald-900 hover:to-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Đang lưu..." : "Lưu báo cáo"}
          </button>
        </div>

        {/* ===== Card ẩn để xuất ảnh ===== */}
        <div className="pointer-events-none fixed -left-[9999px] top-0">
          <ReportExportCard ref={exportCardRef} contentRef={exportContentRef} form={form} />
        </div>
      </div>
    </main>
  );
}