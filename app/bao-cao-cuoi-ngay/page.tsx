"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";
import {
  ClipboardList,
  CheckCircle2,
  Hourglass,
  AlertCircle,
  CalendarClock,
  CalendarDays,
  UserRound,
  Package,
  Bike,
  Users,
  FileText,
  Globe2,
  Target,
  TrendingUp,
  PenLine,
  Plus,
  Trash2,
  Save,
  Download,
  Loader2,
  StickyNote,
} from "lucide-react";
import { toBlob } from "html-to-image";

/* ============================================================
 * Types
 * ============================================================ */

type TaskStatus = "done" | "inprogress" | "pending";
type IconKey = "package" | "bike" | "team" | "doc" | "globe" | "generic";

type EODTask = {
  id: string;
  icon: IconKey;
  project: string;
  code: string; // ví dụ "1.1", "2.3" — tự đặt theo cách bạn đánh số
  description: string;
  due: string; // yyyy-mm-dd, để trống nếu không có hạn ("–")
  note: string; // dòng ghi chú nhỏ, tuỳ chọn
  support: string; // "Hỗ trợ: ..." tuỳ chọn
  status: TaskStatus;
  deadlineAdjusted: boolean;
};

type ReportForm = {
  reportDate: string; // yyyy-mm-dd
  companyName: string;
  recipient: string;
  intro: string;
  tasks: EODTask[];
  tomorrowPlan: string[];
  owner: string;
};

/* ============================================================
 * Constants
 * ============================================================ */

const WEEKDAY_LABELS = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

const ICON_OPTIONS: { value: IconKey; label: string; Icon: typeof Package }[] = [
  { value: "package", label: "Sản phẩm / Đóng gói", Icon: Package },
  { value: "bike", label: "Xe đạp / Abraham", Icon: Bike },
  { value: "team", label: "Nội bộ / Đội nhóm", Icon: Users },
  { value: "doc", label: "Tài liệu / Guideline", Icon: FileText },
  { value: "globe", label: "Website / Online", Icon: Globe2 },
  { value: "generic", label: "Khác", Icon: ClipboardList },
];

function iconFor(key: IconKey) {
  return ICON_OPTIONS.find((o) => o.value === key)?.Icon ?? ClipboardList;
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  done: "Đã hoàn thành",
  inprogress: "Đang thực hiện",
  pending: "Chưa thực hiện",
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  done: "bg-emerald-700 text-white",
  inprogress: "bg-amber-500 text-emerald-950",
  pending: "bg-red-700 text-white",
};

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "done", label: "Đã hoàn thành" },
  { value: "inprogress", label: "Đang thực hiện" },
  { value: "pending", label: "Chưa thực hiện" },
];

type Accent = "green" | "amber" | "rose";

const ACCENT_RIBBON: Record<Accent, string> = {
  green: "from-emerald-950 to-emerald-800",
  amber: "from-amber-600 to-amber-500",
  rose: "from-red-800 to-red-700",
};

const ACCENT_BADGE_BG: Record<Accent, string> = {
  green: "bg-emerald-950",
  amber: "bg-amber-500",
  rose: "bg-red-800",
};

const ACCENT_ICON_CIRCLE: Record<Accent, string> = {
  green: "bg-emerald-800",
  amber: "bg-amber-500",
  rose: "bg-red-700",
};

const SECTION_META: Record<
  TaskStatus,
  { number: number; title: string; accent: Accent; HeaderIcon: typeof CheckCircle2 }
> = {
  done: { number: 1, title: "Kết quả đã hoàn thành", accent: "green", HeaderIcon: CheckCircle2 },
  inprogress: { number: 2, title: "Công việc đang triển khai", accent: "amber", HeaderIcon: Hourglass },
  pending: { number: 3, title: "Chưa thực hiện", accent: "rose", HeaderIcon: AlertCircle },
};

const STAT_TONES = {
  green: { ring: "ring-emerald-800/10", icon: "bg-emerald-800 text-white" },
  gold: { ring: "ring-amber-500/10", icon: "bg-amber-500 text-white" },
  red: { ring: "ring-red-700/10", icon: "bg-red-700 text-white" },
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

// Parse "yyyy-mm-dd" theo local time, tránh lệch ngày do new Date(string)
// bị trình duyệt hiểu là UTC midnight.
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

function companyInitials(name: string) {
  const letters = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean);
  return (letters.slice(0, 2).join("") || "TD").toUpperCase();
}
type MorningTask = {
  id: string;
  project: string;
  category?: string;
  description?: string;
  content?: string;
  due: string;
  owner?: string;
  support?: string;
  status: TaskStatus;
};

type MorningReport = {
  reportDate: string;
  recipient: string;
  owner: string;
  priorityTasks: MorningTask[];
  followupTasks: MorningTask[];
};

// Dữ liệu báo cáo sáng đến từ API (JSON lưu tự do, không được validate ở
// backend) — không thể tin tưởng 100% rằng `status` luôn là một trong ba
// giá trị hợp lệ. Nếu gặp giá trị lạ/rỗng, ép về "pending" thay vì để task
// rơi ra ngoài mọi nhóm (không có ribbon, không có badge) như trước đây.
function normalizeStatus(raw: unknown): TaskStatus {
  if (raw === "done" || raw === "inprogress" || raw === "pending") return raw;
  return "pending";
}

function mapMorningToEODTasks(morning: MorningReport): EODTask[] {
  const fromPriority = morning.priorityTasks.map((t): EODTask => ({
    id: uid("t"),
    icon: "generic",
    project: t.project,
    code: "",
    description: t.description ?? "",
    due: t.due,
    note: t.category ? `Hạng mục: ${t.category}` : "",
    support: t.owner ?? "",
    status: normalizeStatus(t.status),
    deadlineAdjusted: false,
  }));

  const fromFollowup = morning.followupTasks.map((t): EODTask => ({
    id: uid("t"),
    icon: "generic",
    project: t.project,
    code: "",
    description: t.content ?? "",
    due: t.due,
    note: "",
    support: t.support ?? "",
    status: normalizeStatus(t.status),
    deadlineAdjusted: false,
  }));

  return [...fromPriority, ...fromFollowup];
}
function emptyForm(): ReportForm {
  const today = todayISO();
  return {
    reportDate: today,
    companyName: "Thống Đạt Group",
    recipient: "",
    intro: "Dưới đây là báo cáo tổng hợp tiến độ công việc đến cuối ngày.",
    tasks: [
      {
        id: uid("t"),
        icon: "generic",
        project: "",
        code: "1.1",
        description: "",
        due: today,
        note: "",
        support: "",
        status: "done",
        deadlineAdjusted: false,
      },
    ],
    tomorrowPlan: [""],
    owner: "",
  };
}

/* ============================================================
 * Form atoms
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
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-300 focus:border-emerald-600"
    />
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-600 [color-scheme:light]"
    />
  );
}

function StatusSelect({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
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

function IconSelect({ value, onChange }: { value: IconKey; onChange: (v: IconKey) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IconKey)}
      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-emerald-600"
    >
      {ICON_OPTIONS.map((opt) => (
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
      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
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

/* ============================================================
 * Export-only presentational atoms
 * Chữ trong các component "Export*" bên dưới được thiết kế TO hơn hẳn
 * bản UI nhập liệu (vì ảnh xuất ra sẽ bị co giãn để lấp khung 9:16 và
 * người xem thường xem trên màn hình điện thoại nhỏ).
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
    <div className={`flex flex-col items-center gap-2 rounded-xl bg-white px-3 py-5 ring-1 ${t.ring}`}>
      <span className={`flex size-14 items-center justify-center rounded-full ${t.icon}`}>
        <Icon size={26} strokeWidth={2.4} />
      </span>
      <span className="text-4xl font-black text-slate-900 tabular-nums">{value}</span>
      <span className="text-center text-sm font-bold leading-tight text-slate-500">{label}</span>
    </div>
  );
}

function ExportSectionRibbon({
  number,
  title,
  accent,
  HeaderIcon,
}: {
  number: number;
  title: string;
  accent: Accent;
  HeaderIcon: typeof CheckCircle2;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-lg">
      <div className={`flex w-14 shrink-0 items-center justify-center text-2xl font-black text-white ${ACCENT_BADGE_BG[accent]}`}>
        {number}
      </div>
      <div
        className={`flex flex-1 items-center justify-between bg-gradient-to-r px-5 py-3.5 ${ACCENT_RIBBON[accent]}`}
        style={{ clipPath: "polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%)" }}
      >
        <span className="text-lg font-black uppercase tracking-wider text-white">{title}</span>
        <HeaderIcon size={22} className="text-white/90" />
      </div>
    </div>
  );
}

// LƯU Ý: card này chỉ dùng trong khung xuất ảnh có kích thước pixel cố
// định (1080px), không phải trang web responsive thật, nên KHÔNG dùng
// prefix "sm:" — luôn là bố cục hàng ngang bất kể kích thước màn hình
// người xem ảnh. Cỡ chữ đã tăng đáng kể so với bản gốc để đọc rõ trên
// điện thoại (ảnh sẽ được co giãn lấp đầy khung 9:16 khi xuất).
function ExportTaskRow({ task, accent }: { task: EODTask; accent: Accent }) {
  const RowIcon = iconFor(task.icon);
  return (
    <div className="flex flex-row items-center gap-6 border-b border-slate-100 py-6 last:border-b-0">
      <span
        className={`flex size-16 shrink-0 items-center justify-center rounded-full text-white ${ACCENT_ICON_CIRCLE[accent]}`}
      >
        <RowIcon size={30} />
      </span>

      <div className="min-w-0 shrink-0 basis-[240px]">
        <p className="text-3xl font-black leading-snug text-emerald-900 break-words">{task.project || "—"}</p>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold leading-snug text-slate-700 break-words">
          {task.code ? <span className="mr-2 font-black text-slate-400">{task.code}</span> : null}
          {task.description || "—"}
        </p>
        {task.support ? (
          <p className="mt-1.5 text-lg font-bold text-slate-500 break-words">Hỗ trợ: {task.support}</p>
        ) : null}
        {task.note ? (
          <p className="mt-1.5 flex items-start gap-2 text-lg font-semibold italic text-slate-400 break-words">
            <StickyNote size={19} className="mt-1 shrink-0" />
            {task.note}
          </p>
        ) : null}
      </div>

      <div className="flex w-52 shrink-0 items-center gap-2.5 text-xl font-bold text-slate-600">
        <CalendarDays size={24} className="shrink-0 text-emerald-800" />
        {formatDateDisplay(task.due) || "–"}
      </div>

      <div className="w-48 shrink-0">
        <span
          className={`inline-flex w-full items-center justify-center rounded-lg px-3 py-3.5 text-center text-lg font-black leading-tight ${STATUS_BADGE[task.status]}`}
        >
          {STATUS_LABEL[task.status]}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * Export card — bản render off-screen dùng để chụp ảnh PNG
 * ============================================================ */

const EXPORT_IMAGE_WIDTH = 1080;
const EXPORT_IMAGE_HEIGHT = 1920; // Tỉ lệ 9:16 chuẩn story/Zalo — KHÔNG đổi,
// khung ảnh xuất ra luôn giữ đúng tỉ lệ này dù nội dung dài hay ngắn.
const EXPORT_IMAGE_PADDING = 24;
const EXPORT_CONTENT_WIDTH = EXPORT_IMAGE_WIDTH - EXPORT_IMAGE_PADDING * 2;
// Giới hạn mức phóng to tối đa để tránh chữ bị quá khổ khi nội dung ngắn,
// và mức thu nhỏ tối thiểu để chữ KHÔNG bị bé đến mức khó đọc khi nội
// dung dài (đây là phần quan trọng nhất để chữ luôn to, dễ nhìn trên
// điện thoại — nếu nội dung quá dài để vừa khung ở mức thu nhỏ tối
// thiểu, ảnh sẽ tràn nhẹ ra ngoài khung thay vì ép chữ nhỏ xíu).
const EXPORT_MAX_SCALE = 1.6;
const EXPORT_MIN_SCALE = 0.72;

const ReportExportCard = forwardRef<
  HTMLDivElement,
  { form: ReportForm; contentRef: { current: HTMLDivElement | null } }
>(function ReportExportCard({ form, contentRef }, ref) {
  const today = {
    weekday: weekdayLabel(form.reportDate),
    dateStr: formatDateDisplay(form.reportDate),
  };

  const grouped: Record<TaskStatus, EODTask[]> = {
    done: form.tasks.filter((t) => t.status === "done"),
    inprogress: form.tasks.filter((t) => t.status === "inprogress"),
    pending: form.tasks.filter((t) => t.status === "pending"),
  };

  const stats = {
    total: form.tasks.length,
    done: grouped.done.length,
    inprogress: grouped.inprogress.length,
    pending: grouped.pending.length,
    adjusted: form.tasks.filter((t) => t.deadlineAdjusted).length,
  };

  const visiblePlan = form.tomorrowPlan.map((n) => n.trim()).filter(Boolean);

  return (
    <div
      ref={ref}
      style={{ width: EXPORT_IMAGE_WIDTH, height: EXPORT_IMAGE_HEIGHT }}
      className="relative overflow-hidden bg-slate-100"
    >
      <div
        ref={contentRef}
        style={{ width: EXPORT_CONTENT_WIDTH }}
        className="absolute overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200"
      >
        {/* Header */}
        <header className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-9 pb-9 pt-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 text-base font-black text-amber-400">
              {companyInitials(form.companyName)}
            </span>
            <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.25em] text-white">
              {form.companyName}
              <span className="text-amber-400/70">•</span>
              <span className="text-white/70">Báo cáo công việc</span>
            </p>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div className="max-w-lg">
              <h1 className="text-6xl font-black uppercase leading-[1.05] tracking-tight text-white">
                Báo cáo cuối ngày
              </h1>
              <p className="mt-2.5 text-base font-bold uppercase tracking-wide text-emerald-200/80">
                Tổng hợp kết quả triển khai ngày {today.dateStr}
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-emerald-800/60 px-4 py-3.5 ring-1 ring-white/10">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-400">
                <CalendarDays size={22} />
              </span>
              <p className="text-base font-black leading-tight text-white">
                {today.weekday},
                <br />
                ngày {today.dateStr}
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-amber-400 via-amber-200 to-transparent" />
        </header>

        {/* Body */}
        <div className="space-y-6 px-8 py-8">
          <div className="flex items-start gap-4 rounded-xl bg-emerald-50/70 p-5 ring-1 ring-emerald-100">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-950 text-white">
              <UserRound size={26} />
            </span>
            <div>
              <p className="text-xl font-black text-emerald-950">
                Kính gửi {form.recipient || "..."},
              </p>
              <p className="mt-1 text-base font-semibold text-slate-500">{form.intro}</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            <ExportStatCard label="Tổng đầu việc" value={stats.total} Icon={ClipboardList} tone="green" />
            <ExportStatCard label="Đã hoàn thành" value={stats.done} Icon={CheckCircle2} tone="green" />
            <ExportStatCard label="Đang thực hiện" value={stats.inprogress} Icon={Hourglass} tone="gold" />
            <ExportStatCard label="Chưa thực hiện" value={stats.pending} Icon={AlertCircle} tone="red" />
            <ExportStatCard label="Điều chỉnh deadline" value={stats.adjusted} Icon={CalendarClock} tone="green" />
          </div>

          {(["done", "inprogress", "pending"] as TaskStatus[]).map((status) => {
            const meta = SECTION_META[status];
            const list = grouped[status];
            if (!list.length) return null;
            return (
              <div key={status} className="space-y-3">
                <ExportSectionRibbon
                  number={meta.number}
                  title={meta.title}
                  accent={meta.accent}
                  HeaderIcon={meta.HeaderIcon}
                />
                <div className="rounded-xl bg-white px-5 ring-1 ring-slate-200">
                  {list.map((task) => (
                    <ExportTaskRow key={task.id} task={task} accent={meta.accent} />
                  ))}
                </div>
              </div>
            );
          })}

          <div className="relative overflow-hidden rounded-xl border border-amber-300/70 bg-amber-50/50 p-5">
            <TrendingUp size={84} className="pointer-events-none absolute -right-2 -top-2 text-amber-200" />
            <div className="relative mb-3 flex items-center gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-white">
                <Target size={18} />
              </span>
              <p className="text-base font-black uppercase tracking-wide text-emerald-950">Định hướng ngày mai</p>
            </div>
            {visiblePlan.length ? (
              <ul className="relative space-y-2 pl-1">
                {visiblePlan.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-lg font-semibold text-slate-600">
                    <span className="mt-2.5 size-2 shrink-0 rounded-full bg-amber-500" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="relative text-lg font-semibold italic text-slate-400">Chưa có định hướng</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-3 bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-8 py-5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-amber-400">
            <PenLine size={18} />
          </span>
          <p className="text-base font-bold text-white">
            Người phụ trách: <span className="font-black">{form.owner || "—"}</span>
          </p>
        </footer>
      </div>
    </div>
  );
});

/* ============================================================
 * Main page — form nhập liệu
 * ============================================================ */

export default function BaoCaoCuoiNgayFormPage() {
  const [form, setForm] = useState<ReportForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  // Trên iOS Safari / trong app Zalo, ta không thể tự tải ảnh xuống —
  // phải mở ảnh ra để người dùng tự nhấn giữ và lưu. previewUrl lưu
  // đường dẫn ảnh đó để hiển thị cho người dùng.
  const [previewUrl, setPreviewUrl] = useState<string>("");

  /* ---- Chọn người dùng để lấy đúng báo cáo sáng (nhiều người dùng chung form) ---- */
  const [morningOwners, setMorningOwners] = useState<string[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [loadingMorning, setLoadingMorning] = useState(false);
  const [morningLoadError, setMorningLoadError] = useState("");

  // Bước 1: khi mở trang, chỉ lấy DANH SÁCH TÊN đã gửi báo cáo sáng hôm nay
  // (chưa lấy nội dung công việc), để hỏi người dùng "Bạn là ai?".
  useEffect(() => {
    async function loadOwners() {
      try {
        const res = await fetch(`/api/work-reports?date=${todayISO()}&type=morning`);
        if (!res.ok) return;
        const result: { owners: string[] } = await res.json();
        setMorningOwners(result.owners ?? []);
      } catch {
        // im lặng — không chặn người dùng nhập tay nếu fetch lỗi
      } finally {
        setOwnersLoading(false);
      }
    }
    loadOwners();
  }, []);

  // Bước 2: khi người dùng chọn đúng tên mình, mới lấy nội dung công việc
  // của riêng người đó trong báo cáo sáng, rồi tự động điền vào form.
  async function handleSelectOwner(owner: string) {
    setSelectedOwner(owner);
    setMorningLoadError("");
    setLoadingMorning(true);
    try {
      const res = await fetch(
        `/api/work-reports?date=${todayISO()}&type=morning&owner=${encodeURIComponent(owner)}`,
      );
      if (!res.ok) {
        setMorningLoadError("Không tìm thấy báo cáo sáng của " + owner + ".");
        return;
      }
      const morning: MorningReport = await res.json();
      setForm((prev) => ({
        ...prev,
        recipient: morning.recipient || prev.recipient,
        owner: morning.owner || owner,
        tasks: mapMorningToEODTasks(morning),
      }));
    } catch {
      setMorningLoadError("Không thể tải báo cáo sáng. Vui lòng thử lại.");
    } finally {
      setLoadingMorning(false);
    }
  }

  // Trường hợp không thấy tên mình trong danh sách (ví dụ chưa viết báo cáo
  // sáng, hoặc gõ tên khác lúc sáng) — cho phép bỏ qua và điền tay từ đầu.
  function handleSkipOwnerPicker() {
    setSelectedOwner("__manual__");
  }

  const exportCardRef = useRef<HTMLDivElement>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof ReportForm>(key: K, value: ReportForm[K]) {
    // flushSync ép React commit ngay, đảm bảo card xuất ảnh (render off-screen)
    // luôn khớp với giá trị vừa gõ trước khi có thể bấm "Xuất ảnh".
    flushSync(() => {
      setForm((prev) => ({ ...prev, [key]: value }));
    });
    setSaveSuccess(false);
  }

  // ---- Tasks ----
  function addTask() {
    update("tasks", [
      ...form.tasks,
      {
        id: uid("t"),
        icon: "generic",
        project: "",
        code: "",
        description: "",
        due: form.reportDate,
        note: "",
        support: "",
        status: "pending",
        deadlineAdjusted: false,
      },
    ]);
  }
  function updateTask(id: string, patch: Partial<EODTask>) {
    update(
      "tasks",
      form.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  }
  function removeTask(id: string) {
    update("tasks", form.tasks.filter((t) => t.id !== id));
  }

  // ---- Định hướng ngày mai ----
  function addPlanItem() {
    update("tomorrowPlan", [...form.tomorrowPlan, ""]);
  }
  function updatePlanItem(index: number, value: string) {
    const next = [...form.tomorrowPlan];
    next[index] = value;
    update("tomorrowPlan", next);
  }
  function removePlanItem(index: number) {
    update(
      "tomorrowPlan",
      form.tomorrowPlan.filter((_, i) => i !== index),
    );
  }

  const stats = useMemo(() => {
    const done = form.tasks.filter((t) => t.status === "done").length;
    const inprogress = form.tasks.filter((t) => t.status === "inprogress").length;
    const pending = form.tasks.filter((t) => t.status === "pending").length;
    const adjusted = form.tasks.filter((t) => t.deadlineAdjusted).length;
    return { total: form.tasks.length, done, inprogress, pending, adjusted };
  }, [form.tasks]);

  /* ---- Xuất ảnh PNG (tương thích di động: Web Share API + fallback iOS) ---- */
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

      // Reset transform/scale trước khi đo, để lấy đúng chiều cao tự nhiên
      // của nội dung (chưa co giãn).
      exportContent.style.transform = "none";
      exportContent.style.left = "0px";
      exportContent.style.top = "0px";

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      const naturalContentHeight = exportContent.scrollHeight;
      const availableWidth = EXPORT_IMAGE_WIDTH - EXPORT_IMAGE_PADDING * 2;
      const availableHeight = EXPORT_IMAGE_HEIGHT - EXPORT_IMAGE_PADDING * 2;

      // Co giãn nội dung để lấp đầy khung ảnh cố định tỉ lệ 9:16 mà không
      // làm méo tỉ lệ chữ/khoảng cách — chỉ scale đều theo chiều cao,
      // giới hạn trong khoảng [EXPORT_MIN_SCALE, EXPORT_MAX_SCALE]. Nhờ
      // EXPORT_MIN_SCALE được nâng lên, chữ sẽ không bao giờ bị ép nhỏ
      // đến mức khó đọc — nếu nội dung quá dài, ảnh sẽ hơi tràn khỏi
      // khung 1920px thay vì thu nhỏ chữ quá mức.
      const rawScale = availableHeight / naturalContentHeight;
      const scale = Math.min(EXPORT_MAX_SCALE, Math.max(EXPORT_MIN_SCALE, rawScale));

      const scaledWidth = availableWidth * scale;
      const scaledHeight = naturalContentHeight * scale;
      const left = Math.max(0, (EXPORT_IMAGE_WIDTH - scaledWidth) / 2);
      const top = Math.max(0, (EXPORT_IMAGE_HEIGHT - scaledHeight) / 2);

      // Nếu nội dung (sau khi scale ở mức tối thiểu cho phép) vẫn cao hơn
      // khung ảnh cố định, ta giãn khung ảnh ra theo chiều cao thực tế
      // thay vì cắt mất nội dung — vẫn giữ đúng chiều rộng 1080px, chỉ
      // chiều cao vượt 1920 khi thật sự cần (trường hợp danh sách rất dài).
      const finalCanvasHeight = Math.max(EXPORT_IMAGE_HEIGHT, top * 2 + scaledHeight + EXPORT_IMAGE_PADDING);
      exportFrame.style.height = `${finalCanvasHeight}px`;

      exportContent.style.left = `${left}px`;
      exportContent.style.top = `${top}px`;
      exportContent.style.transform = `scale(${scale})`;
      exportContent.style.transformOrigin = "top left";

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      // Dùng toBlob thay vì toPng: ảnh 1080x1920 x2 pixel ratio dưới dạng
      // base64 dataURL khá nặng, dễ khiến trình duyệt di động (đặc biệt
      // Safari) treo hoặc rớt link tải. Blob nhẹ hơn và ổn định hơn.
      const blob = await toBlob(exportFrame, {
        width: EXPORT_IMAGE_WIDTH,
        height: finalCanvasHeight,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f1f5f9",
      });

      // Khôi phục lại chiều cao khung cố định 9:16 cho lần render tiếp theo.
      exportFrame.style.height = `${EXPORT_IMAGE_HEIGHT}px`;

      if (!blob) {
        throw new Error("Không thể tạo ảnh.");
      }

      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `bao-cao-cuoi-ngay-${form.reportDate}_${stamp}.png`;
      const objectUrl = URL.createObjectURL(blob);

      // Thử tải xuống trực tiếp bằng thẻ <a download> — cách này hoạt động
      // trên hầu hết trình duyệt di động hiện nay (Chrome/Android, Safari
      // bản mới, webview trong Zalo).
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

  /* ---- Lưu báo cáo ---- */
  async function handleSubmit() {
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/work-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type: "evening", stats }),
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
        {/* ===== Chọn người dùng để lấy đúng báo cáo sáng ===== */}
        {!ownersLoading && selectedOwner === "" ? (
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <p className="mb-3 text-sm font-black uppercase tracking-wide text-emerald-950">
              Bạn là ai?
            </p>
            {morningOwners.length ? (
              <>
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  Chọn đúng tên bạn để tự động lấy công việc từ báo cáo sáng nay.
                </p>
                <div className="flex flex-wrap gap-2">
                  {morningOwners.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelectOwner(name)}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                    >
                      {name}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleSkipOwnerPicker}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-50"
                  >
                    Không thấy tên tôi
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-3 text-xs font-semibold text-slate-500">
                  Chưa có ai gửi báo cáo sáng hôm nay. Bạn có thể điền tay từ đầu.
                </p>
                <button
                  type="button"
                  onClick={handleSkipOwnerPicker}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Điền tay từ đầu
                </button>
              </>
            )}
          </div>
        ) : null}

        {loadingMorning ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
            Đang tải công việc từ báo cáo sáng...
          </div>
        ) : null}

        {morningLoadError ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 ring-1 ring-red-100">
            {morningLoadError}
          </div>
        ) : null}

        {selectedOwner && selectedOwner !== "__manual__" ? (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600 ring-1 ring-slate-200">
            <span>
              Đang điền theo báo cáo sáng của:{" "}
              <span className="font-black text-emerald-800">{selectedOwner}</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedOwner("")}
              className="text-xs font-black text-emerald-700 hover:underline"
            >
              Đổi
            </button>
          </div>
        ) : null}

        {/* ===== Header nhập liệu ===== */}
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-3">
            <div className="border-l-4 border-emerald-800 pl-4">
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-700">
                End of Day
              </p>
              <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                Báo cáo cuối ngày
              </h1>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Đơn vị</FieldLabel>
                <TextField value={form.companyName} onChange={(v) => update("companyName", v)} />
              </div>
              <div>
                <FieldLabel>Ngày báo cáo</FieldLabel>
                <DateField value={form.reportDate} onChange={(v) => update("reportDate", v)} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl bg-emerald-950 px-4 py-3 shadow-md sm:self-end">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-amber-400">
              <CalendarDays size={20} />
            </span>
            <p className="text-sm font-black leading-tight text-white">
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
              <TextField value={form.recipient} onChange={(v) => update("recipient", v)} placeholder="Sếp Tuấn" />
            </div>
            <div>
              <FieldLabel>Lời dẫn</FieldLabel>
              <TextField value={form.intro} onChange={(v) => update("intro", v)} />
            </div>
          </div>
        </div>

        {/* ===== Thống kê (tự tính, chỉ xem) ===== */}
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          <ExportStatCard label="Tổng đầu việc" value={stats.total} Icon={ClipboardList} tone="green" />
          <ExportStatCard label="Đã hoàn thành" value={stats.done} Icon={CheckCircle2} tone="green" />
          <ExportStatCard label="Đang thực hiện" value={stats.inprogress} Icon={Hourglass} tone="gold" />
          <ExportStatCard label="Chưa thực hiện" value={stats.pending} Icon={AlertCircle} tone="red" />
          <ExportStatCard label="Điều chỉnh deadline" value={stats.adjusted} Icon={CalendarClock} tone="green" />
        </div>

        {/* ===== Danh sách công việc (gộp 1 danh sách, tự nhóm theo trạng thái khi xuất ảnh) ===== */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-wide text-emerald-950">
              Danh sách công việc trong ngày
            </p>
            <p className="text-xs font-semibold text-slate-400">
              Đổi "Trạng thái" để công việc tự chuyển đúng mục khi xuất ảnh
            </p>
          </div>

          <div className="space-y-3">
            {form.tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-slate-200 p-3">
               <div className="grid grid-cols-1 gap-2 sm:grid-cols-[100px_140px_1fr_70px] sm:items-start">
  <div>
    <FieldLabel>Mã đầu việc</FieldLabel>
    <TextField
      value={task.code}
      onChange={(v) => updateTask(task.id, { code: v })}
      placeholder="1.1"
    />
  </div>
  <div>
    <FieldLabel>Loại</FieldLabel>
    <IconSelect value={task.icon} onChange={(v) => updateTask(task.id, { icon: v })} />
  </div>
  <div>
    <FieldLabel>Dự án</FieldLabel>
    <TextField
      value={task.project}
      onChange={(v) => updateTask(task.id, { project: v })}
      placeholder="Hạt Dẻ Ông Lý"
    />
  </div>
  <div className="flex items-end justify-center">
    <RemoveRowButton onClick={() => removeTask(task.id)} label="Xoá công việc" />
  </div>
</div>

                <div className="mt-2">
                  <FieldLabel>Mô tả</FieldLabel>
                  <TextField
                    value={task.description}
                    onChange={(v) => updateTask(task.id, { description: v })}
                    placeholder="Nghiên cứu kích thước, thiết kế mẫu layout bao bì..."
                  />
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <FieldLabel>Hạn</FieldLabel>
                    <DateField value={task.due} onChange={(v) => updateTask(task.id, { due: v })} />
                  </div>
                  <div>
                    <FieldLabel>Hỗ trợ (tuỳ chọn)</FieldLabel>
                    <TextField
                      value={task.support}
                      onChange={(v) => updateTask(task.id, { support: v })}
                      placeholder="Văn Phú"
                    />
                  </div>
                  <div>
                    <FieldLabel>Trạng thái</FieldLabel>
                    <StatusSelect value={task.status} onChange={(v) => updateTask(task.id, { status: v })} />
                  </div>
                </div>

                <div className="mt-2">
                  <FieldLabel>Ghi chú (tuỳ chọn)</FieldLabel>
                  <TextField
                    value={task.note}
                    onChange={(v) => updateTask(task.id, { note: v })}
                    placeholder="Dời deadline sang ngày 16/07/2026"
                  />
                </div>

                <label className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                  <input
                    type="checkbox"
                    checked={task.deadlineAdjusted}
                    onChange={(e) => updateTask(task.id, { deadlineAdjusted: e.target.checked })}
                    className="size-3.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Đầu việc này đã điều chỉnh deadline
                </label>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <AddRowButton onClick={addTask} label="Thêm công việc" />
          </div>
        </div>

        {/* ===== Định hướng ngày mai & Người phụ trách ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-950 text-white">
                <Target size={16} />
              </span>
              <p className="text-sm font-black uppercase tracking-wide text-emerald-950">
                Định hướng ngày mai
              </p>
            </div>
            <div className="space-y-2">
              {form.tomorrowPlan.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="size-1.5 shrink-0 rounded-full bg-amber-500" />
                  <div className="flex-1">
                    <TextField value={item} onChange={(v) => updatePlanItem(index, v)} />
                  </div>
                  <RemoveRowButton onClick={() => removePlanItem(index)} label="Xoá định hướng" />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <AddRowButton onClick={addPlanItem} label="Thêm định hướng" />
            </div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <FieldLabel>Người phụ trách</FieldLabel>
            <TextField value={form.owner} onChange={(v) => update("owner", v)} placeholder="Thùy Dung" />
          </div>
        </div>

        {/* ===== Trạng thái lưu / lỗi ===== */}
        {saveError ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 ring-1 ring-red-100">
            {saveError}
          </div>
        ) : null}
        {saveSuccess ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 ring-1 ring-emerald-100">
            Đã lưu báo cáo thành công!
          </div>
        ) : null}

        {/* Hướng dẫn lưu ảnh trên iOS khi không dùng được Web Share API */}
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