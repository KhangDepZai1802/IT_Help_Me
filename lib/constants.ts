import type { Priority, RequestStatus } from "@/lib/types";

export const priorityLabels: Record<Priority, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp"
};

export const statusLabels: Record<RequestStatus, string> = {
  NEW: "Mới gửi",
  ACCEPTED: "Đã tiếp nhận",
  IN_PROGRESS: "Đang xử lý",
  DONE: "Hoàn thành",
  REJECTED: "Từ chối"
};

export const statusTone: Record<RequestStatus, string> = {
  NEW: "bg-amber-50 text-amber-700 ring-amber-200",
  ACCEPTED: "bg-sky-50 text-sky-700 ring-sky-200",
  IN_PROGRESS: "bg-aqua/10 text-aqua ring-aqua/25",
  DONE: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 ring-rose-200"
};

export const priorityTone: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-aqua/10 text-aqua",
  HIGH: "bg-amber-50 text-amber-700",
  URGENT: "bg-rose-50 text-rose-700"
};
