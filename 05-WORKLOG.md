# 📓 WORKLOG — IT HELP ME! (file phối hợp giữa các session AI)

> **File này là nguồn sự thật chung cho Claude và các AI khác.** Đọc TRƯỚC khi làm, cập nhật SAU khi làm.

## ⚠️ QUY TẮC BẮT BUỘC (đọc mỗi lần)

1. **TRƯỚC khi bắt đầu session:** đọc hết file này — phần `TRẠNG THÁI HIỆN TẠI` + `VIỆC TIẾP THEO` + entry mới nhất trong `NHẬT KÝ SESSION`.
2. **Chọn việc:** làm theo `VIỆC TIẾP THEO`. Nếu muốn làm khác, ghi rõ lý do vào nhật ký.
3. **SAU khi làm xong (hoặc trước khi hết session):**
   - Cập nhật `TRẠNG THÁI HIỆN TẠI` (1-2 dòng).
   - Cập nhật `VIỆC TIẾP THEO` (việc kế cho người sau — càng cụ thể càng tốt).
   - **Thêm 1 entry mới** vào đầu `NHẬT KÝ SESSION` (mới nhất ở trên).
   - **GIỮ GỌN (bắt buộc):** chỉ giữ **6 mục gần nhất** ở `TRẠNG THÁI HIỆN TẠI` và **6 entry gần nhất** ở `NHẬT KÝ SESSION`. Khi thêm mục/entry mới → **xóa mục/entry cũ nhất** để file không phình to (đỡ tốn token đọc lại mỗi phiên).
   - Nếu có blocker/lỗi chưa fix → ghi vào `BLOCKERS`.
4. **Luôn để app build được** (`npm run build`) trước khi kết thúc. Nếu để dở, ghi rõ "đang dở, chưa build".
5. Chi tiết nghiệp vụ/DB/workflow đầy đủ: xem `01-business-analysis.md`, `02-database-design.md`, `03-workflow.md`. Quy ước code & tech stack: xem `04-CLAUDE.md` (đọc 1 lần để nắm nền).

**Format 1 entry nhật ký:**
```
### [YYYY-MM-DD] Session N — <Claude|Codex|...>
- **Làm được:** ...
- **File thay đổi chính:** ...
- **Đã test:** ... (build? chạy? smoke test gì?)
- **Lưu ý/cảnh báo cho người sau:** ...
```

---

## 📍 TRẠNG THÁI HIỆN TẠI

1. Dự án chưa khởi tạo code — mới hoàn thành xong bộ tài liệu phân tích nghiệp vụ, thiết kế DB, workflow, và quy ước AI (5 file docs).
2. Chưa chọn giữa NextAuth hay session tự viết cho phần đăng nhập — cần chốt ở session code đầu tiên.
3. Chưa tạo project Supabase, chưa có `DATABASE_URL` thật.
4. Chưa khởi tạo repo Next.js.

## ➡️ VIỆC TIẾP THEO

1. Khởi tạo project Next.js (App Router + TypeScript + Tailwind).
2. Tạo project Supabase free tier, lấy connection string, cấu hình Prisma + chạy migration đầu tiên theo schema ở `02-database-design.md`.
3. Seed dữ liệu mẫu: vài phòng ban mặc định (Kế toán, HR, Marketing), 1 tài khoản IT, 1-2 tài khoản phòng ban để test.
4. Dựng trang `/login` + luồng auth cơ bản (chốt NextAuth Credentials provider hoặc tự viết — xem mục 6 của `04-CLAUDE.md`).

## 🚧 BLOCKERS

- (chưa có)

---

## 📜 NHẬT KÝ SESSION (mới nhất ở trên)

### [2026-07-07] Session 1 — Claude
- **Làm được:** Thu thập yêu cầu chi tiết qua hỏi đáp với người dùng; tạo bộ 5 file docs nền tảng: `01-business-analysis.md`, `02-database-design.md`, `03-workflow.md`, `04-CLAUDE.md`, `05-WORKLOG.md`.
- **File thay đổi chính:** Tạo mới cả 5 file trên (chưa có code).
- **Đã test:** Không áp dụng (chưa có code).
- **Lưu ý/cảnh báo cho người sau:** Chưa code gì cả — bắt đầu từ "VIỆC TIẾP THEO" ở trên. Thông báo Zalo đã quyết định để Phase 2, KHÔNG làm ở MVP (lý do: ZNS cần đăng ký Official Account + phê duyệt template + tính phí, không đơn giản/miễn phí như mong muốn ban đầu).
