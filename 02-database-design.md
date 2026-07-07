# 🗄️ 02 — Database Design: "IT Help Me!"

> DB: **PostgreSQL** (hosted trên **Supabase free tier**), truy cập qua **Prisma ORM** trong Next.js.

## 1. Sơ đồ tổng quan (mối quan hệ)

```
Department (Phòng ban)
   └─< Request (Yêu cầu) >─── assigned_to ───> ITStaff (Nhân viên IT)
            └─< RequestAttachment (File đính kèm)
            └─< RequestStatusHistory (Lịch sử đổi trạng thái) >─ changed_by ─> ITStaff

Account (Tài khoản đăng nhập)
   - type: DEPARTMENT | IT
   - Department account: liên kết 1-1 với Department
   - IT account: dùng chung 1 tài khoản IT, hoặc mỗi ITStaff có account riêng (xem mục 5)
```

## 2. Bảng `Department` (Phòng ban)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID / serial (PK) | |
| name | String, unique | VD: "Kế toán", "HR", "Marketing" |
| is_active | Boolean, default true | Cho phép "ẩn" phòng ban cũ thay vì xoá hẳn |
| created_at | DateTime | |

## 3. Bảng `ITStaff` (Nhân viên IT — để assign việc)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| full_name | String | Tên nhân viên IT, IT tự nhập/sửa trên web |
| is_active | Boolean, default true | |
| created_at | DateTime | |

## 4. Bảng `Account` (Tài khoản đăng nhập)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| username | String, unique | |
| password_hash | String | Hash bằng bcrypt |
| role | Enum: `DEPARTMENT`, `IT` | |
| department_id | FK → Department, nullable | Chỉ có giá trị nếu role = DEPARTMENT |
| created_at | DateTime | |

> Ghi chú thiết kế: vì chỉ có 2 loại tài khoản (phòng ban dùng chung + IT), MVP có thể chỉ tạo **1 tài khoản/phòng ban** và **1 tài khoản IT chung**. Field `full_name` người gửi vẫn nhập tay ở form Request (không gắn với account cá nhân) — đúng như yêu cầu "text tự do không cần dropdown".

## 5. Bảng `Request` (Yêu cầu — bảng trung tâm)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| department_id | FK → Department | Phòng ban gửi |
| requester_name | String | Tên người gửi (text tự do) |
| content | Text | Nội dung yêu cầu (text tự do, không giới hạn) |
| priority | Enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT` | Default `MEDIUM` |
| status | Enum: `NEW`, `IN_PROGRESS`, `DONE`, `REJECTED` | Default `NEW` |
| assigned_to_id | FK → ITStaff, nullable | Ai đang phụ trách |
| resolution_note | Text, nullable | Ghi chú kết quả xử lý / lý do từ chối |
| created_at | DateTime | Ngày giờ gửi yêu cầu |
| updated_at | DateTime | Cập nhật mỗi lần đổi trạng thái |

**Enum status gợi ý:**
- `NEW` = Mới gửi
- `IN_PROGRESS` = Đang xử lý
- `DONE` = Hoàn thành
- `REJECTED` = Từ chối / Không thực hiện được

## 6. Bảng `RequestAttachment` (File đính kèm)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| request_id | FK → Request | |
| file_url | String | Lưu trên Supabase Storage (free tier), lưu URL vào DB |
| file_name | String | Tên file gốc |
| uploaded_at | DateTime | |

## 7. Bảng `RequestStatusHistory` (Lịch sử đổi trạng thái — phục vụ "lưu lịch sử")

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | UUID (PK) | |
| request_id | FK → Request | |
| old_status | Enum status, nullable | |
| new_status | Enum status | |
| changed_by_id | FK → ITStaff, nullable | |
| note | Text, nullable | Ghi chú tại thời điểm đổi trạng thái |
| changed_at | DateTime | Chính xác ngày/giờ đổi — phục vụ yêu cầu "lưu lịch sử theo ngày tháng năm" |

> Bảng này **quan trọng** vì nó trả lời trực tiếp yêu cầu ban đầu: "lưu lại lịch sử những lần nhờ vả... vào ngày tháng năm nào" — không chỉ lưu trạng thái cuối cùng mà lưu cả tiến trình.

## 8. Prisma Schema (bản nháp tham khảo)

```prisma
enum AccountRole {
  DEPARTMENT
  IT
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RequestStatus {
  NEW
  IN_PROGRESS
  DONE
  REJECTED
}

model Department {
  id        String    @id @default(uuid())
  name      String    @unique
  isActive  Boolean   @default(true)
  createdAt DateTime  @default(now())
  requests  Request[]
  accounts  Account[]
}

model ITStaff {
  id         String    @id @default(uuid())
  fullName   String
  isActive   Boolean   @default(true)
  createdAt  DateTime  @default(now())
  requests   Request[] @relation("AssignedRequests")
  histories  RequestStatusHistory[]
}

model Account {
  id           String       @id @default(uuid())
  username     String       @unique
  passwordHash String
  role         AccountRole
  departmentId String?
  department   Department?  @relation(fields: [departmentId], references: [id])
  createdAt    DateTime     @default(now())
}

model Request {
  id              String        @id @default(uuid())
  departmentId    String
  department      Department    @relation(fields: [departmentId], references: [id])
  requesterName   String
  content         String
  priority        Priority      @default(MEDIUM)
  status          RequestStatus @default(NEW)
  assignedToId    String?
  assignedTo      ITStaff?      @relation("AssignedRequests", fields: [assignedToId], references: [id])
  resolutionNote  String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  attachments     RequestAttachment[]
  statusHistory   RequestStatusHistory[]
}

model RequestAttachment {
  id         String   @id @default(uuid())
  requestId  String
  request    Request  @relation(fields: [requestId], references: [id])
  fileUrl    String
  fileName   String
  uploadedAt DateTime @default(now())
}

model RequestStatusHistory {
  id           String        @id @default(uuid())
  requestId    String
  request      Request       @relation(fields: [requestId], references: [id])
  oldStatus    RequestStatus?
  newStatus    RequestStatus
  changedById  String?
  changedBy    ITStaff?      @relation(fields: [changedById], references: [id])
  note         String?
  changedAt    DateTime      @default(now())
}
```

## 9. Ghi chú vận hành

- Supabase free tier: đủ dùng cho quy mô vài người dùng nội bộ, không lo giới hạn.
- Toàn bộ migration quản lý bằng `prisma migrate` — mỗi lần đổi schema phải chạy migration và ghi chú vào `05-WORKLOG.md`.
