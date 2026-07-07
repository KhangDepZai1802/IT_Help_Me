# 🔄 03 — Workflow: "IT Help Me!"

## 1. Sơ đồ trạng thái của 1 Yêu cầu (Request Status Flow)

```
                ┌─────────────┐
                │  MỚI GỬI    │  ← Phòng ban tạo yêu cầu
                │   (NEW)     │
                └──────┬──────┘
                       │  IT nhận + assign người phụ trách
                       ▼
                ┌─────────────┐
                │ ĐANG XỬ LÝ  │
                │(IN_PROGRESS)│
                └──────┬──────┘
                       │
           ┌───────────┴────────────┐
           ▼                        ▼
   ┌───────────────┐      ┌────────────────────────┐
   │  HOÀN THÀNH   │      │ TỪ CHỐI/KHÔNG THỰC HIỆN │
   │    (DONE)     │      │      ĐƯỢC (REJECTED)    │
   └───────────────┘      └────────────────────────┘
```

- Mỗi lần đổi trạng thái → ghi 1 dòng vào `RequestStatusHistory` (xem `02-database-design.md`).
- Trạng thái `DONE` và `REJECTED` bắt buộc phải có `resolution_note` (ghi chú kết quả / lý do).

## 2. User Flow — Phòng ban (Requester)

1. Truy cập web → đăng nhập bằng tài khoản chung của phòng ban.
2. Vào trang **"Gửi yêu cầu mới"**:
   - Chọn/gõ thêm phòng ban (thường đã tự động điền theo tài khoản đăng nhập).
   - Nhập tên người gửi (text tự do).
   - Nhập nội dung yêu cầu (textarea).
   - Chọn mức độ ưu tiên (mặc định Trung bình).
   - Đính kèm file/ảnh (tuỳ chọn).
   - Bấm **Gửi**.
3. Vào trang **"Lịch sử yêu cầu của tôi"**:
   - Xem danh sách các yêu cầu đã gửi + trạng thái hiện tại + ghi chú kết quả (nếu có).
   - Lọc theo ngày/trạng thái.

## 3. User Flow — IT (Staff)

1. Đăng nhập bằng tài khoản IT.
2. Vào **Dashboard**:
   - Thấy badge/số lượng yêu cầu "Mới gửi" chưa xử lý.
   - Danh sách toàn bộ yêu cầu, lọc theo phòng ban / trạng thái / khoảng ngày.
3. Mở 1 yêu cầu:
   - Gán người phụ trách (chọn từ danh sách `ITStaff`).
   - Đổi trạng thái → "Đang xử lý".
   - Khi xong: đổi trạng thái → "Hoàn thành" + nhập ghi chú kết quả.
   - Nếu không làm được: đổi trạng thái → "Từ chối/Không thực hiện được" + lý do.
4. Vào trang **Thống kê**:
   - Xem số lượng yêu cầu theo phòng ban.
   - Xem số lượng theo trạng thái.
5. Vào trang **Quản lý danh mục**:
   - Thêm/sửa phòng ban.
   - Thêm/sửa/xoá tên nhân viên IT (danh sách để assign).
6. Xuất Excel danh sách yêu cầu (theo bộ lọc hiện tại).

## 4. Sơ đồ luồng màn hình (Sitemap)

```
/login                         → Đăng nhập (chọn loại tài khoản: Phòng ban / IT)

[Phòng ban]
/dept/new-request               → Form gửi yêu cầu mới
/dept/history                   → Lịch sử yêu cầu của phòng ban mình

[IT]
/it/dashboard                   → Danh sách + lọc + badge yêu cầu mới
/it/requests/:id                → Chi tiết 1 yêu cầu (assign, đổi trạng thái, ghi chú)
/it/stats                       → Thống kê
/it/settings/departments        → Quản lý danh mục phòng ban
/it/settings/staff               → Quản lý danh mục nhân viên IT
```

## 5. Quy tắc nghiệp vụ quan trọng cần nhớ khi code

- Trạng thái `NEW` là mặc định, không cho phòng ban tự đổi trạng thái (chỉ IT được đổi).
- `resolution_note` bắt buộc nhập khi chuyển sang `DONE` hoặc `REJECTED` (validate ở form).
- Mỗi lần đổi `status` → tự động tạo record `RequestStatusHistory`, không update đè.
- File đính kèm lưu trên Supabase Storage, DB chỉ lưu URL.
- Phòng ban chỉ xem được yêu cầu **của chính phòng ban mình** (filter theo `department_id` gắn với account đăng nhập).
