export type Role = "DEPARTMENT" | "IT";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type RequestStatus = "NEW" | "ACCEPTED" | "IN_PROGRESS" | "DONE" | "REJECTED";

export type Rating = 1 | 2 | 3 | 4 | 5;

export type Department = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ITStaff = {
  id: string;
  fullName: string;
  isActive: boolean;
};

export type RequestHistory = {
  id: string;
  requestId: string;
  oldStatus: RequestStatus | null;
  newStatus: RequestStatus;
  changedById: string | null;
  note: string;
  changedAt: string;
};

export type ITRequest = {
  id: string;
  departmentId: string;
  requesterName: string;
  content: string;
  priority: Priority;
  status: RequestStatus;
  assignedToId: string | null;
  resolutionNote: string;
  attachmentName: string;
  rating?: Rating;
  createdAt: string;
  updatedAt: string;
  history: RequestHistory[];
};
