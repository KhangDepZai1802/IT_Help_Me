import type { Department, ITRequest, ITStaff } from "@/lib/types";

export const initialDepartments: Department[] = [
  { id: "dept-accounting", name: "Kế toán", isActive: true },
  { id: "dept-hr", name: "Nhân sự", isActive: true },
  { id: "dept-marketing", name: "Marketing", isActive: true },
  { id: "dept-sales", name: "Kinh doanh", isActive: true },
  { id: "dept-warehouse", name: "Kho vận", isActive: true }
];

export const initialStaff: ITStaff[] = [
  { id: "it-minh", fullName: "Minh Nguyễn", isActive: true },
  { id: "it-linh", fullName: "Linh Trần", isActive: true },
  { id: "it-khoa", fullName: "Khoa Phạm", isActive: true }
];

const now = new Date("2026-07-07T09:20:00+07:00");

export const initialRequests: ITRequest[] = [
  {
    id: "REQ-260707-001",
    departmentId: "dept-accounting",
    requesterName: "Mai Anh",
    content: "Máy in phòng Kế toán bị kẹt giấy liên tục, cần IT kiểm tra trước giờ chốt báo cáo.",
    priority: "HIGH",
    status: "NEW",
    assignedToId: null,
    resolutionNote: "",
    attachmentName: "printer-error.jpg",
    createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    history: [
      {
        id: "his-001",
        requestId: "REQ-260707-001",
        oldStatus: null,
        newStatus: "NEW",
        changedById: null,
        note: "Tạo yêu cầu",
        changedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
      }
    ]
  },
  {
    id: "REQ-260707-002",
    departmentId: "dept-hr",
    requesterName: "Quỳnh Chi",
    content: "Cần cấp tài khoản email công ty cho nhân sự mới onboard trong chiều nay.",
    priority: "URGENT",
    status: "ACCEPTED",
    assignedToId: "it-minh",
    resolutionNote: "",
    attachmentName: "",
    createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
    history: [
      {
        id: "his-002a",
        requestId: "REQ-260707-002",
        oldStatus: null,
        newStatus: "NEW",
        changedById: null,
        note: "Tạo yêu cầu",
        changedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "his-002b",
        requestId: "REQ-260707-002",
        oldStatus: "NEW",
        newStatus: "ACCEPTED",
        changedById: "it-minh",
        note: "Đã tiếp nhận",
        changedAt: new Date(now.getTime() - 90 * 60 * 1000).toISOString()
      }
    ]
  }
];
