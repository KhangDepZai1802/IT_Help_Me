# 🤖 04 — CLAUDE.md — Hướng dẫn cho AI khi làm việc trên dự án "IT Help Me!"

> File này giúp Claude (hoặc AI khác) hiểu nhanh dự án khi bắt đầu 1 session mới, không cần đọc lại toàn bộ lịch sử chat.

## 1. Dự án là gì

**"IT Help Me!"** — web nội bộ đơn giản để các phòng ban trong công ty gửi yêu cầu/nhờ vả cho phòng IT, thay thế Google Form. Lưu lịch sử toàn bộ yêu cầu theo ngày tháng năm.

Chi tiết nghiệp vụ đầy đủ: xem `01-business-analysis.md`.
Chi tiết database: xem `02-database-design.md`.
Chi tiết luồng sử dụng: xem `03-workflow.md`.

## 2. Tech stack đã chốt

| Thành phần | Công nghệ |
|---|---|
| Framework | **Next.js (App Router)**, TypeScript |
| Styling | **Tailwind CSS** |
| ORM | **Prisma** |
| Database | **PostgreSQL** (hosted trên **Supabase** free tier) |
| File storage | Supabase Storage (cho file đính kèm) |
| Deploy | **Vercel** (free tier) |
| Auth | Đơn giản — 2 loại tài khoản (Phòng ban / IT), session-based, không cần OAuth phức tạp |
| Xuất Excel | Thư viện `exceljs` hoặc `xlsx` phía server/API route |
| Ngôn ngữ giao diện | Tiếng Việt |

## 3. Quy ước code

- Cấu trúc thư mục theo chuẩn Next.js App Router: `app/`, `components/`, `lib/`, `prisma/`.
- Tất cả truy vấn DB đi qua Prisma Client, không viết raw SQL trừ khi thật cần thiết.
- Enum trạng thái/priority định nghĩa trong Prisma schema, dùng chung constant ở frontend (không hard-code chuỗi tiếng Việt rải rác — tạo 1 file `lib/constants.ts` map enum ↔ nhãn tiếng Việt).
- Mỗi thay đổi schema DB → chạy `npx prisma migrate dev --name <ten_migration>` và ghi vào WORKLOG.
- Biến môi trường (`DATABASE_URL`, Supabase keys...) để trong `.env.local`, **không commit** file này lên Git.

## 4. Quy tắc bắt buộc khi làm việc (đọc kỹ)

1. **Trước khi code**: đọc `05-WORKLOG.md` — mục "TRẠNG THÁI HIỆN TẠI" và "VIỆC TIẾP THEO".
2. **Sau khi code xong** (hoặc trước khi hết session): cập nhật `05-WORKLOG.md` theo đúng format quy định trong chính file đó.
3. Luôn đảm bảo project **build được** (`npm run build`) trước khi kết thúc session. Nếu chưa xong, ghi rõ "đang dở, chưa build" vào WORKLOG.
4. Không tự ý đổi tech stack đã chốt ở mục 2 nếu không có lý do rõ ràng — nếu đổi, phải cập nhật lại chính file này.

## 5. Những điều đã quyết định, KHÔNG cần hỏi lại

- Không cần tài khoản riêng cho từng nhân viên (chỉ tài khoản chung theo phòng ban + 1 tài khoản IT).
- Không cần phân quyền admin/thường trong nội bộ IT.
- Tên người gửi yêu cầu là text tự do, không phải dropdown.
- Loại yêu cầu là text tự do (textarea), không phải dropdown cố định.
- Thông báo Zalo là **Phase 2**, chưa làm ở bản MVP — MVP chỉ cần thông báo trên web.

## 6. Việc còn để ngỏ / cần xác nhận thêm với người dùng (nếu gặp lại trong tương lai)

- Tên miền/URL Vercel cụ thể sẽ dùng.
- Có cần trạng thái "Đã hủy" (do phòng ban tự huỷ yêu cầu) hay không — hiện tại chưa có trong scope.
- Cơ chế đăng nhập cụ thể: dùng NextAuth (Credentials provider) hay tự viết session đơn giản — cần chốt khi bắt đầu code phần auth.
