"use client";

import { forwardRef, useMemo, useRef, useState, type ReactNode } from "react";
import { Loader2, Save, Star, Wrench, Camera, Download } from "lucide-react";
import { toPng } from "html-to-image";
/* ============================================================
 * Types — di chuyển sang @/lib/types nếu bạn muốn dùng chung
 * ============================================================ */

type TaskStatus = "done" | "inprogress" | "notdone";

type TaskRow = {
  task: string;
  description: string;
  result: string;
  hours: string;
  status: TaskStatus | null;
};

type SelfRatingKey =
  "understanding" | "practice" | "performance" | "initiative";

type ReportForm = {
  reportDate: string; // yyyy-mm-dd
  fullName: string;
  internId: string;
  mentor: string;
  position: string;
  team: string;
  project: string;

  learnedItems: string[]; // mục 1 — 3 dòng
  learnedChecklist: Record<string, boolean>;
  learnedOther: string;

  appliedItems: string[]; // mục 2 — 3 dòng
  appliedChecklist: Record<string, boolean>;
  appliedOther: string;

  tasks: TaskRow[]; // mục 3 — 5 dòng

  achievements: {
    workflowCount: string;
    chatbotCount: string;
    landingCount: string;
    contentCount: string;
    dataCount: string;
    fixCount: string;
    other: string;
  };

  difficulties: string[]; // mục 5 — 2 dòng
  planTomorrow: string[]; // 3 dòng

  selfRating: Record<SelfRatingKey, number>;
  selfNote: string;

  mentorComment: string;
  mentorOverallRating: number;
  mentorSignature: string;
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

const LEARNED_CHECKLIST_LEFT = [
  "Học các khóa học N8N (workflow)",
  "Học về tự động hóa workflow",
  "Học cách tạo bot chat (Chatbot AI, Messenger Bot)",
  "Tìm hiểu về tích hợp API",
  "Tìm hiểu quy trình hỗ trợ kỹ thuật",
];

const LEARNED_CHECKLIST_RIGHT = [
  "Học về kiến thức xây dựng và quản lý cộng đồng Fanpage",
  "Học về CRM/AMIS",
  "Thiết lập website/landing page",
  "Tìm hiểu quy trình vận hành bán hàng",
];

const APPLIED_CHECKLIST_LEFT = [
  "Tạo workflow tự động trên N8N",
  "Tạo chatbot / automation",
  "Tích hợp API / kết nối hệ thống",
  "Thiết lập kịch bản tự động",
  "Thực hành nhập liệu và vận hành CRM/AMIS",
];

const APPLIED_CHECKLIST_RIGHT = [
  "Tạo nội dung & quản lý bài đăng Fanpage",
  "Thiết kế landing page/website",
  "Kết nối N8N với công cụ khác (Google Sheets, CRM, Telegram...)",
];

const STATUS_OPTIONS: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "done", label: "Hoàn thành", dot: "bg-emerald-500" },
  { value: "inprogress", label: "Đang làm", dot: "bg-amber-500" },
  { value: "notdone", label: "Chưa xong", dot: "bg-rose-500" },
];

const SELF_RATING_LABELS: { key: SelfRatingKey; label: string }[] = [
  { key: "understanding", label: "Hiểu bài / Kiến thức" },
  { key: "practice", label: "Thực hành / Ứng dụng" },
  { key: "performance", label: "Hiệu suất làm việc" },
  { key: "initiative", label: "Mức độ chủ động" },
];

function emptyForm(): ReportForm {
  return {
    reportDate: new Date().toISOString().slice(0, 10),
    fullName: "",
    internId: "",
    mentor: "",
    position: "",
    team: "",
    project: "",

    learnedItems: ["", "", ""],
    learnedChecklist: {},
    learnedOther: "",

    appliedItems: ["", "", ""],
    appliedChecklist: {},
    appliedOther: "",

    tasks: Array.from({ length: 5 }, () => ({
      task: "",
      description: "",
      result: "",
      hours: "",
      status: null,
    })),

    achievements: {
      workflowCount: "",
      chatbotCount: "",
      landingCount: "",
      contentCount: "",
      dataCount: "",
      fixCount: "",
      other: "",
    },

    difficulties: ["", ""],
    planTomorrow: ["", "", ""],

    selfRating: {
      understanding: 0,
      practice: 0,
      performance: 0,
      initiative: 0,
    },
    selfNote: "",

    mentorComment: "",
    mentorOverallRating: 0,
    mentorSignature: "",
  };
}

function weekdayIndex(dateStr: string) {
  // Chuyển Chủ nhật (0) -> vị trí cuối (CN), Thứ 2 (1) -> vị trí đầu (T2)
  const jsDay = new Date(dateStr).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function StarPicker({
  value,
  onChange,
  size = 18,
}: {
  value: number;
  onChange: (next: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          aria-label={`${n} sao`}
          className="text-slate-300 transition hover:scale-110 hover:text-amber-400"
        >
          <Star
            size={size}
            className={n <= value ? "fill-amber-400 text-amber-400" : ""}
          />
        </button>
      ))}
    </div>
  );
}

function SectionCard({
  number,
  title,
  icon,
  children,
}: {
  number: string | number | ReactNode;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white">
          {number}
        </span>
        <h2 className="text-sm font-black uppercase tracking-wide text-slate-800">
          {title}
        </h2>
        {icon ? <span className="ml-auto text-aqua">{icon}</span> : null}
      </div>
      {children}
    </div>
  );
}

function LineInput({
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
      className="w-full border-b border-dotted border-slate-300 bg-transparent py-1.5 text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-300 focus:border-aqua"
    />
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-xs font-semibold text-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-3.5 shrink-0 rounded border-slate-300 text-aqua focus:ring-aqua"
      />
      <span>{label}</span>
    </label>
  );
}

/* ============================================================
 * ReportExportCard — ảnh dọc 9:16, tự co toàn bộ nội dung
 * ============================================================ */

const EXPORT_IMAGE_WIDTH = 1080;
const EXPORT_IMAGE_HEIGHT = 1920;
const EXPORT_IMAGE_PADDING = 10;
const EXPORT_CONTENT_WIDTH = EXPORT_IMAGE_WIDTH - EXPORT_IMAGE_PADDING * 2;
const EXPORT_CONTENT_HEIGHT = EXPORT_IMAGE_HEIGHT - EXPORT_IMAGE_PADDING * 2;

const ACHIEVEMENT_EXPORT_FIELDS: {
  key: keyof ReportForm["achievements"];
  label: string;
}[] = [
  { key: "workflowCount", label: "Workflow tạo mới" },
  { key: "chatbotCount", label: "Chatbot / Automation" },
  { key: "landingCount", label: "Landing page / Website" },
  { key: "contentCount", label: "Bài viết / Nội dung" },
  { key: "dataCount", label: "Dữ liệu nhập / CRM" },
  { key: "fixCount", label: "Lỗi fix / Cải tiến" },
  { key: "other", label: "Kết quả khác" },
];

function ExportSection({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
    >
      <h2 className="mb-2 text-[18px] font-black uppercase tracking-wide text-slate-700">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ExportList({ items }: { items: string[] }) {
  const visibleItems = items.map((item) => item.trim()).filter(Boolean);

  if (!visibleItems.length) {
    return (
      <p className="text-[16px] font-semibold italic text-slate-400">
        Chưa có nội dung
      </p>
    );
  }

  return (
    <ul className="list-disc space-y-1 pl-6 text-[17px] font-semibold leading-snug text-slate-700">
      {visibleItems.map((item, index) => (
        <li
          key={`${item}-${index}`}
          className="whitespace-pre-wrap break-words"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function ExportStars({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(5, value));
  return (
    <span className="whitespace-nowrap text-[20px] tracking-wide text-amber-500">
      {"★".repeat(safeValue)}
      <span className="text-slate-300">{"☆".repeat(5 - safeValue)}</span>
    </span>
  );
}

const ReportExportCard = forwardRef<
  HTMLDivElement,
  {
    form: ReportForm;
    totalHours: number;
    contentRef: { current: HTMLDivElement | null };
  }
>(function ReportExportCard({ form, totalHours, contentRef }, ref) {
  const learnedChecklistItems = [
    ...Object.entries(form.learnedChecklist)
      .filter(([, checked]) => checked)
      .map(([label]) => label),
    ...(form.learnedOther.trim()
      ? [`Kiến thức khác: ${form.learnedOther.trim()}`]
      : []),
  ];

  const appliedChecklistItems = [
    ...Object.entries(form.appliedChecklist)
      .filter(([, checked]) => checked)
      .map(([label]) => label),
    ...(form.appliedOther.trim()
      ? [`Thực hành khác: ${form.appliedOther.trim()}`]
      : []),
  ];

  const visibleTasks = form.tasks.filter(
    (task) =>
      task.task.trim() ||
      task.description.trim() ||
      task.result.trim() ||
      task.hours.trim() ||
      task.status,
  );

  return (
    <div
      ref={ref}
      style={{ width: EXPORT_IMAGE_WIDTH, height: EXPORT_IMAGE_HEIGHT }}
      className="relative overflow-hidden bg-slate-100 text-slate-900"
    >
      <div
        ref={contentRef}
        style={{
          width: EXPORT_CONTENT_WIDTH,
          minHeight: EXPORT_CONTENT_HEIGHT,
          left: EXPORT_IMAGE_PADDING,
          top: EXPORT_IMAGE_PADDING,
          transformOrigin: "top left",
        }}
        className="absolute flex flex-col justify-between rounded-[30px] bg-white p-8 shadow-sm"
      >
        <header className="mb-5 flex items-start justify-between gap-6 border-b-2 border-slate-200 pb-5">
          <div>
            <p className="mb-1 text-[16px] font-black uppercase tracking-[0.22em] text-slate-400">
              Daily Report
            </p>
            <h1 className="text-[36px] font-black uppercase leading-none tracking-wide text-slate-900">
              Báo cáo ngày
            </h1>
            <p className="mt-2 text-[17px] font-bold text-slate-500">
              Learn • Apply • Deliver
            </p>
          </div>
          <div className="rounded-2xl bg-slate-900 px-5 py-3 text-right text-white">
            <p className="text-[13px] font-black uppercase tracking-wider text-slate-300">
              Ngày báo cáo
            </p>
            <p className="mt-1 text-[22px] font-black">
              {form.reportDate || "—"}
            </p>
          </div>
        </header>

        <section className="mb-4 grid grid-cols-3 gap-x-5 gap-y-3 rounded-2xl bg-slate-50 p-4 text-[17px] leading-snug">
          {[
            ["Họ và tên", form.fullName],
            ["Intern ID", form.internId],
            ["Mentor", form.mentor],
            ["Vị trí", form.position],
            ["Team/Phòng ban", form.team],
            ["Dự án/Workspace", form.project],
          ].map(([label, value]) => (
            <p key={label} className="min-w-0 break-words text-slate-700">
              <span className="block text-[13px] font-black uppercase tracking-wide text-slate-400">
                {label}
              </span>
              <span className="font-bold">{value || "—"}</span>
            </p>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-4">
          <ExportSection title="1. Hôm nay học gì?">
            <ExportList items={form.learnedItems} />
            {learnedChecklistItems.length ? (
              <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
                <p className="mb-1 text-[13px] font-black uppercase tracking-wide text-slate-400">
                  Checklist đã chọn
                </p>
                <ExportList items={learnedChecklistItems} />
              </div>
            ) : null}
          </ExportSection>

          <ExportSection title="2. Thực hành – áp dụng">
            <ExportList items={form.appliedItems} />
            {appliedChecklistItems.length ? (
              <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
                <p className="mb-1 text-[13px] font-black uppercase tracking-wide text-slate-400">
                  Checklist đã chọn
                </p>
                <ExportList items={appliedChecklistItems} />
              </div>
            ) : null}
          </ExportSection>
        </div>

        <ExportSection title="3. Công việc đã thực hiện" className="mt-4">
          {visibleTasks.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full table-fixed border-collapse text-[14px] leading-snug">
                <thead>
                  <tr className="bg-slate-100 text-left text-[12px] font-black uppercase tracking-wide text-slate-500">
                    <th className="w-[38px] border-b border-r border-slate-200 px-2 py-2 text-center">
                      #
                    </th>
                    <th className="w-[20%] border-b border-r border-slate-200 px-2 py-2">
                      Công việc
                    </th>
                    <th className="w-[26%] border-b border-r border-slate-200 px-2 py-2">
                      Mô tả
                    </th>
                    <th className="w-[24%] border-b border-r border-slate-200 px-2 py-2">
                      Kết quả
                    </th>
                    <th className="w-[62px] border-b border-r border-slate-200 px-2 py-2 text-center">
                      Giờ
                    </th>
                    <th className="w-[100px] border-b border-slate-200 px-2 py-2">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTasks.map((task, index) => (
                    <tr key={index} className="align-top text-slate-700">
                      <td className="border-r border-t border-slate-200 px-2 py-2 text-center font-black text-slate-400">
                        {index + 1}
                      </td>
                      <td className="whitespace-pre-wrap break-words border-r border-t border-slate-200 px-2 py-2 font-bold">
                        {task.task || "—"}
                      </td>
                      <td className="whitespace-pre-wrap break-words border-r border-t border-slate-200 px-2 py-2">
                        {task.description || "—"}
                      </td>
                      <td className="whitespace-pre-wrap break-words border-r border-t border-slate-200 px-2 py-2">
                        {task.result || "—"}
                      </td>
                      <td className="border-r border-t border-slate-200 px-2 py-2 text-center font-bold">
                        {task.hours || "—"}
                      </td>
                      <td className="break-words border-t border-slate-200 px-2 py-2 font-bold">
                        {STATUS_OPTIONS.find(
                          (status) => status.value === task.status,
                        )?.label ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[16px] font-semibold italic text-slate-400">
              Chưa có công việc
            </p>
          )}
          <p className="mt-2 text-right text-[16px] font-black text-slate-700">
            Tổng thời gian:{" "}
            <span className="text-slate-950">{totalHours || 0} giờ</span>
          </p>
        </ExportSection>

        <ExportSection title="4. Kết quả đạt được" className="mt-4">
          <div className="grid grid-cols-4 gap-2">
            {ACHIEVEMENT_EXPORT_FIELDS.map((field) => (
              <div
                key={field.key}
                className="min-w-0 rounded-xl bg-slate-50 px-3 py-2"
              >
                <p className="text-[12px] font-black uppercase leading-tight tracking-wide text-slate-400">
                  {field.label}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-[17px] font-black text-slate-700">
                  {form.achievements[field.key] || "—"}
                </p>
              </div>
            ))}
          </div>
        </ExportSection>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <ExportSection title="5. Khó khăn / Vấn đề">
            <ExportList items={form.difficulties} />
          </ExportSection>
          <ExportSection title="6. Kế hoạch ngày mai">
            <ExportList items={form.planTomorrow} />
          </ExportSection>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <ExportSection title="7. Tự đánh giá">
            <div className="space-y-2">
              {SELF_RATING_LABELS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-[15px] font-bold text-slate-600">
                    {item.label}
                  </span>
                  <ExportStars value={form.selfRating[item.key]} />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3">
              <p className="mb-1 text-[12px] font-black uppercase tracking-wide text-slate-400">
                Ghi chú tự đánh giá
              </p>
              <p className="whitespace-pre-wrap break-words text-[16px] font-semibold leading-snug text-slate-700">
                {form.selfNote || "—"}
              </p>
            </div>
          </ExportSection>

          <ExportSection title="8. Nhận xét Mentor">
            <p className="whitespace-pre-wrap break-words text-[16px] font-semibold leading-snug text-slate-700">
              {form.mentorComment || "—"}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-[12px] font-black uppercase tracking-wide text-slate-400">
                  Đánh giá tổng thể
                </p>
                <ExportStars value={form.mentorOverallRating} />
              </div>
              <div>
                <p className="text-[12px] font-black uppercase tracking-wide text-slate-400">
                  Mentor ký tên
                </p>
                <p className="mt-1 break-words text-[17px] font-black text-slate-700">
                  {form.mentorSignature || "—"}
                </p>
              </div>
            </div>
          </ExportSection>
        </div>

        <footer className="mt-4 rounded-2xl bg-slate-900 px-5 py-3 text-center text-[13px] font-bold leading-snug text-slate-300">
          Báo cáo trung thực, cụ thể, rõ ràng · Tập trung vào kết quả và giá trị
          tạo ra · Chủ động hỏi khi gặp khó khăn
        </footer>
      </div>
    </div>
  );
});
/* ============================================================ */

export default function InternDailyReportPage() {
  const [form, setForm] = useState<ReportForm>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalHours = useMemo(
    () =>
      form.tasks.reduce((sum, task) => {
        const value = Number(task.hours);
        return sum + (Number.isFinite(value) ? value : 0);
      }, 0),
    [form.tasks],
  );

  function update<K extends keyof ReportForm>(key: K, value: ReportForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateListItem(
    key: "learnedItems" | "appliedItems" | "difficulties" | "planTomorrow",
    index: number,
    value: string,
  ) {
    setForm((prev) => {
      const next = [...prev[key]];
      next[index] = value;
      return { ...prev, [key]: next };
    });
  }

  function updateTask(index: number, patch: Partial<TaskRow>) {
    setForm((prev) => {
      const next = [...prev.tasks];
      next[index] = { ...next[index], ...patch };
      return { ...prev, tasks: next };
    });
  }

  function toggleChecklist(
    key: "learnedChecklist" | "appliedChecklist",
    label: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: { ...prev[key], [label]: !prev[key][label] },
    }));
  }

  const exportCardRef = useRef<HTMLDivElement>(null);
  const exportContentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportImage() {
    const exportFrame = exportCardRef.current;
    const exportContent = exportContentRef.current;
    if (!exportFrame || !exportContent) return;

    setIsExporting(true);
    setSaveError("");

    try {
      // Chờ font và giao diện render hoàn tất để tránh thiếu chữ khi chụp.
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      // Trả nội dung về kích thước thật trước khi đo.
      exportContent.style.transform = "none";
      exportContent.style.left = `${EXPORT_IMAGE_PADDING}px`;
      exportContent.style.top = `${EXPORT_IMAGE_PADDING}px`;

      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );

      const availableWidth = EXPORT_IMAGE_WIDTH - EXPORT_IMAGE_PADDING * 2;
      const availableHeight = EXPORT_IMAGE_HEIGHT - EXPORT_IMAGE_PADDING * 2;
      const contentWidth = exportContent.scrollWidth;
      const contentHeight = exportContent.scrollHeight;

      // Base width của card được thiết kế hẹp hơn khung xuất,
      // nên có thể tự phóng to hoặc thu nhỏ để luôn vừa khung 9:16.
      const widthScale = availableWidth / Math.max(contentWidth, 1);
      const heightScale = availableHeight / Math.max(contentHeight, 1);
      const scale = Math.min(1, widthScale, heightScale);

      const renderedWidth = contentWidth * scale;
      const renderedHeight = contentHeight * scale;

      exportContent.style.transform = `scale(${scale})`;
      exportContent.style.left = `${Math.max((EXPORT_IMAGE_WIDTH - renderedWidth) / 2, EXPORT_IMAGE_PADDING)}px`;
      exportContent.style.top = `${EXPORT_IMAGE_PADDING}px`;

      // Chờ trình duyệt áp dụng transform rồi mới chụp.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );

      const dataUrl = await toPng(exportFrame, {
        width: EXPORT_IMAGE_WIDTH,
        height: EXPORT_IMAGE_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
        backgroundColor: "#f1f5f9",
      });

      const link = document.createElement("a");
      link.download = `bao-cao-ngay-${form.reportDate}-9x16.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Export image failed:", error);
      setSaveError("Không thể xuất ảnh báo cáo. Vui lòng thử lại.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleSubmit() {
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const response = await fetch("/api/daily-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, totalHours }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.message ?? "Không thể lưu báo cáo. Vui lòng thử lại.",
        );
      }
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Đã có lỗi xảy ra.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const activeWeekday = weekdayIndex(form.reportDate);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        {/* ===== Header ===== */}
        <div className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-md border border-slate-200 text-[10px] font-black uppercase text-slate-400">
              LOGO
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wide text-slate-900">
                Báo cáo ngày
              </h1>
              
            </div>
          </div>

          <div className="rounded-md border border-slate-200 px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-black text-slate-500">
              Ngày báo cáo:
              <input
                type="date"
                value={form.reportDate}
                onChange={(e) => update("reportDate", e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-aqua"
              />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-black text-slate-500">
              {WEEKDAYS.map((day, index) => (
                <span key={day} className="flex flex-col items-center gap-1">
                  {day}
                  <span
                    className={`size-3 rounded-full border ${
                      index === activeWeekday
                        ? "border-aqua bg-aqua"
                        : "border-slate-300"
                    }`}
                  />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Thông tin cá nhân ===== */}
        <div className="grid grid-cols-1 gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Họ và tên
            </label>
            <LineInput
              value={form.fullName}
              onChange={(v) => update("fullName", v)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Intern ID
            </label>
            <LineInput
              value={form.internId}
              onChange={(v) => update("internId", v)}
              placeholder="INT-0012"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Người hướng dẫn (Mentor)
            </label>
            <LineInput
              value={form.mentor}
              onChange={(v) => update("mentor", v)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Vị trí
            </label>
            <LineInput
              value={form.position}
              onChange={(v) => update("position", v)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Team/Phòng ban
            </label>
            <LineInput value={form.team} onChange={(v) => update("team", v)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-black uppercase text-slate-500">
              Dự án/Workspace
            </label>
            <LineInput
              value={form.project}
              onChange={(v) => update("project", v)}
            />
          </div>
        </div>

        {/* ===== Mục 1 & 2 ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard number={1} title="Hôm nay học gì?">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              Kiến thức, công cụ, quy trình mới học được hôm nay.
            </p>
            <div className="mb-4 space-y-2">
              {form.learnedItems.map((value, index) => (
                <LineInput
                  key={index}
                  value={value}
                  onChange={(v) => updateListItem("learnedItems", index, v)}
                />
              ))}
            </div>
            <div className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
              Checklist tham khảo
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                {LEARNED_CHECKLIST_LEFT.map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    checked={!!form.learnedChecklist[label]}
                    onChange={() => toggleChecklist("learnedChecklist", label)}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {LEARNED_CHECKLIST_RIGHT.map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    checked={!!form.learnedChecklist[label]}
                    onChange={() => toggleChecklist("learnedChecklist", label)}
                  />
                ))}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>Kiến thức khác:</span>
                  <LineInput
                    value={form.learnedOther}
                    onChange={(v) => update("learnedOther", v)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            number={2}
            title="Hôm nay thực hành – áp dụng gì?"
            icon={<Wrench size={18} />}
          >
            <p className="mb-3 text-xs font-semibold text-slate-500">
              Nội dung đã thực hành, áp dụng kiến thức vào công việc.
            </p>
            <div className="mb-4 space-y-2">
              {form.appliedItems.map((value, index) => (
                <LineInput
                  key={index}
                  value={value}
                  onChange={(v) => updateListItem("appliedItems", index, v)}
                />
              ))}
            </div>
            <div className="mb-2 inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
              Checklist tham khảo
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                {APPLIED_CHECKLIST_LEFT.map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    checked={!!form.appliedChecklist[label]}
                    onChange={() => toggleChecklist("appliedChecklist", label)}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {APPLIED_CHECKLIST_RIGHT.map((label) => (
                  <CheckboxRow
                    key={label}
                    label={label}
                    checked={!!form.appliedChecklist[label]}
                    onChange={() => toggleChecklist("appliedChecklist", label)}
                  />
                ))}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span>Thực hành khác:</span>
                  <LineInput
                    value={form.appliedOther}
                    onChange={(v) => update("appliedOther", v)}
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ===== Mục 3: bảng công việc ===== */}
        <SectionCard number={3} title="Hôm nay đã làm được những công việc gì?">
          <p className="mb-3 text-xs font-semibold text-slate-500">
            Liệt kê các công việc/đầu việc đã hoàn thành trong ngày.
          </p>
          <div className="thin-scrollbar overflow-x-auto rounded-md border border-slate-200">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="border-b border-slate-200 px-3 py-2 w-10">
                    #
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Công việc/Đầu việc
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Mô tả ngắn gọn
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2">
                    Kết quả/Output
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 w-24">
                    Thời gian (giờ)
                  </th>
                  <th className="border-b border-slate-200 px-3 py-2 w-72">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {form.tasks.map((task, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 font-black text-slate-400">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <LineInput
                        value={task.task}
                        onChange={(v) => updateTask(index, { task: v })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <LineInput
                        value={task.description}
                        onChange={(v) => updateTask(index, { description: v })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <LineInput
                        value={task.result}
                        onChange={(v) => updateTask(index, { result: v })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={task.hours}
                        onChange={(e) =>
                          updateTask(index, { hours: e.target.value })
                        }
                        className="w-16 rounded border border-slate-200 px-2 py-1 text-sm font-semibold outline-none focus:border-aqua"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-3">
                        {STATUS_OPTIONS.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"
                          >
                            <input
                              type="radio"
                              name={`status-${index}`}
                              checked={task.status === option.value}
                              onChange={() =>
                                updateTask(index, { status: option.value })
                              }
                              className="size-3.5 text-aqua focus:ring-aqua"
                            />
                            <span
                              className={`size-2 rounded-full ${option.dot}`}
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex justify-end text-xs font-black text-slate-600">
            Tổng thời gian làm việc:&nbsp;
            <span className="text-aqua">{totalHours || 0}</span>&nbsp;giờ
          </div>
        </SectionCard>

        {/* ===== Mục 4 & 5 ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard number={4} title="Kết quả đạt được">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              Những kết quả cụ thể/định lượng đạt được hôm nay (nếu có).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { key: "workflowCount", label: "Workflow tạo mới" },
                { key: "chatbotCount", label: "Chatbot / Automation" },
                { key: "landingCount", label: "Landing page / Website" },
                { key: "contentCount", label: "Bài viết / Nội dung" },
                { key: "dataCount", label: "Dữ liệu nhập / CRM" },
                { key: "fixCount", label: "Lỗi fix / Cải tiến" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="rounded-md border border-slate-200 p-3"
                >
                  <p className="mb-1 text-xs font-black text-slate-600">
                    {item.label}
                  </p>
                  <input
                    value={
                      form.achievements[
                        item.key as keyof typeof form.achievements
                      ]
                    }
                    onChange={(e) =>
                      update("achievements", {
                        ...form.achievements,
                        [item.key]: e.target.value,
                      })
                    }
                    placeholder="..........."
                    className="w-full border-b border-dotted border-slate-300 bg-transparent py-1 text-sm font-semibold outline-none focus:border-aqua"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-xs font-black text-slate-600">
                Khác (ghi rõ):
              </label>
              <LineInput
                value={form.achievements.other}
                onChange={(v) =>
                  update("achievements", { ...form.achievements, other: v })
                }
              />
            </div>
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard number={5} title="Khó khăn / Vấn đề gặp phải">
              <p className="mb-3 text-xs font-semibold text-slate-500">
                Những khó khăn, lỗi, trở ngại trong quá trình làm việc.
              </p>
              <div className="space-y-2">
                {form.difficulties.map((value, index) => (
                  <LineInput
                    key={index}
                    value={value}
                    onChange={(v) => updateListItem("difficulties", index, v)}
                  />
                ))}
              </div>
            </SectionCard>

            <SectionCard
              number={<Camera size={14} />}
              title="Kế hoạch ngày mai"
            >
              <p className="mb-3 text-xs font-semibold text-slate-500">
                Các công việc dự kiến sẽ thực hiện vào ngày mai.
              </p>
              <div className="space-y-2">
                {form.planTomorrow.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-400">
                      {index + 1}.
                    </span>
                    <LineInput
                      value={value}
                      onChange={(v) => updateListItem("planTomorrow", index, v)}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* ===== Tự đánh giá & Mentor ===== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard number="★" title="Tự đánh giá hôm nay">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                {SELF_RATING_LABELS.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-xs font-bold text-slate-600">
                      {item.label}
                    </span>
                    <StarPicker
                      value={form.selfRating[item.key]}
                      onChange={(next) =>
                        update("selfRating", {
                          ...form.selfRating,
                          [item.key]: next,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="rounded-md bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
                <label className="mb-1 block text-xs font-black text-slate-600">
                  Ghi chú tự đánh giá:
                </label>
                <textarea
                  value={form.selfNote}
                  onChange={(e) => update("selfNote", e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-300"
                  placeholder="Cảm nhận, tự nhận xét của bạn..."
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard number="👤" title="Nhận xét của Mentor">
            <p className="mb-3 text-xs font-semibold text-slate-500">
              Nhận xét, góp ý và đánh giá của người hướng dẫn.
            </p>
            <textarea
              value={form.mentorComment}
              onChange={(e) => update("mentorComment", e.target.value)}
              rows={4}
              className="mb-3 w-full resize-none rounded-md border border-slate-200 p-3 text-sm font-semibold text-slate-700 outline-none focus:border-aqua"
              placeholder="Nhận xét của mentor..."
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-600">
                  Đánh giá tổng thể:
                </span>
                <StarPicker
                  value={form.mentorOverallRating}
                  onChange={(next) => update("mentorOverallRating", next)}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-600">
                  Mentor ký tên:
                </span>
                <LineInput
                  value={form.mentorSignature}
                  onChange={(v) => update("mentorSignature", v)}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ===== Ghi chú & Lưu ===== */}
        <div className="rounded-lg bg-slate-900 p-4 text-center text-[11px] font-bold text-slate-300">
          Lưu ý: Báo cáo trung thực, cụ thể, rõ ràng · Tập trung vào kết quả –
          giá trị tạo ra · Hỏi khi gặp khó – không để vấn đề bị kẹt
        </div>

        {saveError ? (
          <div className="rounded-md bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
            {saveError}
          </div>
        ) : null}
        {saveSuccess ? (
          <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-600 ring-1 ring-emerald-100">
            Đã lưu báo cáo thành công!
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Đang xuất ảnh..." : "Xuất ảnh (Zalo)"}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex h-11 items-center gap-2 rounded-md bg-slate-900 px-5 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "Đang lưu..." : "Lưu báo cáo"}
          </button>
        </div>

        <div className="pointer-events-none fixed -left-[9999px] top-0">
          <ReportExportCard
            ref={exportCardRef}
            contentRef={exportContentRef}
            form={form}
            totalHours={totalHours}
          />
        </div>
      </section>
    </main>
  );
}
