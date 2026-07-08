# WORKLOG - IT HELP ME!

> File phối hợp giữa các session AI. Đọc trước khi làm, cập nhật sau khi làm.

## Quy Tắc Bắt Buộc

1. Trước khi bắt đầu session: đọc phần `TRẠNG THÁI HIỆN TẠI`, `VIỆC TIẾP THEO`, và entry mới nhất trong `NHẬT KÝ SESSION`.
2. Chọn việc theo `VIỆC TIẾP THEO`. Nếu làm khác, ghi rõ lý do vào nhật ký.
3. Sau khi làm xong:
   - Cập nhật `TRẠNG THÁI HIỆN TẠI`.
   - Cập nhật `VIỆC TIẾP THEO`.
   - Thêm 1 entry mới vào đầu `NHẬT KÝ SESSION`.
   - Giữ gọn: tối đa 6 mục trạng thái và 6 entry nhật ký gần nhất.
   - Nếu có lỗi chưa fix, ghi vào `BLOCKERS`.
4. Luôn đảm bảo app build được (`npm run build`) trước khi kết thúc session. Nếu chưa build được, ghi rõ lý do.
5. Nghiệp vụ/DB/workflow: xem `01-business-analysis.md`, `02-database-design.md`, `03-workflow.md`. Quy ước code & tech stack: xem `04-CLAUDE.md`.

**Format 1 entry nhật ký:**

```md
### [YYYY-MM-DD] Session N - <Claude|Codex|...>
- **Làm được:** ...
- **File thay đổi chính:** ...
- **Đã test:** ...
- **Lưu ý/cảnh báo cho người sau:** ...
```

---

## TRẠNG THÁI HIỆN TẠI

1. Đã khởi tạo Next.js App Router + TypeScript + Tailwind CSS cho MVP `IT Help Me!`.
2. Giao diện dashboard hiện tập trung vào các card nghiệp vụ chính: gửi yêu cầu, Tickets, xử lý IT, thống kê, danh mục và lịch sử.
3. App hiện chạy với dữ liệu mẫu/localStorage: phòng ban gửi yêu cầu; IT xem/lọc/assign/cập nhật/xóa ticket; lịch sử lưu yêu cầu hoàn thành/từ chối theo tháng; phòng ban đánh giá sao một lần cho yêu cầu hoàn thành.
4. Đã tách cổng đăng nhập demo cho 2 loại tài khoản: phòng ban thường chỉ vào giao diện phòng ban đã chọn; phòng IT cần mật khẩu `123456` và có thể xem cả giao diện IT lẫn phòng ban.
5. Đã thêm `prisma/schema.prisma` theo thiết kế PostgreSQL/Supabase trong tài liệu, nhưng chưa kết nối DB thật vì chưa có `DATABASE_URL` Supabase.
6. Đã deploy production lên Vercel: `https://it-help-me.vercel.app` (deployment mới nhất: `https://it-help-boc1ylbsa-thongdat.vercel.app`).

## VIỆC TIẾP THEO

1. Tạo Supabase project, điền `DATABASE_URL` vào `.env.local`, chạy Prisma migration đầu tiên.
2. Thay dữ liệu mẫu/localStorage bằng API routes/server actions dùng Prisma.
3. Làm auth/session thật cho 2 role: tài khoản phòng ban và tài khoản IT; thay mật khẩu demo hard-code bằng auth thật.
4. Kết nối Supabase Storage cho file đính kèm.
5. Xuất Excel server-side bằng `exceljs` hoặc `xlsx` nếu cần file `.xlsx` chuẩn thay vì CSV.
6. Kiểm tra lại production sau khi nối DB/Supabase và cấu hình biến môi trường trên Vercel.

## BLOCKERS

- Chưa có Supabase `DATABASE_URL` và storage keys nên chưa thể migrate/kết nối DB thật.

---

## NHẬT KÝ SESSION

### [2026-07-08] Session 5 - Codex
- **Làm được:** Tách cổng đăng nhập theo tài khoản phòng ban/IT; thêm mật khẩu demo cho IT (`123456`); khóa phòng ban thường chỉ xem đúng giao diện/phòng ban; IT xem được cả hai giao diện. Cập nhật Tickets để ẩn yêu cầu hoàn thành/từ chối sang Lịch sử; thêm xóa ticket cho IT có xác nhận; thêm bảng Lịch sử theo tháng cho yêu cầu hoàn thành/từ chối; phòng ban đánh giá sao 1 lần cho yêu cầu hoàn thành; ẩn Excel ở giao diện phòng ban; sửa dropdown tháng trong modal Lịch sử không bị che; deploy production lại lên Vercel.
- **File thay đổi chính:** `components/portal-shell.tsx`, `lib/types.ts`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run build` thành công local; Vercel production build/deploy thành công. URL production: `https://it-help-me.vercel.app`; deployment URL: `https://it-help-boc1ylbsa-thongdat.vercel.app`.
- **Lưu ý/cảnh báo cho người sau:** Auth hiện vẫn là demo client-side/localStorage, mật khẩu IT đang hard-code trong frontend nên không dùng như bảo mật thật. Khi nối DB/auth cần chuyển sang session server-side, route protection và phân quyền backend.

### [2026-07-07] Session 4 - Codex
- **Làm được:** Thêm lọc tháng dùng chung cho Thống kê và Lịch sử trạng thái; thêm danh sách nhân viên IT hiện có trong Danh mục với nút xóa; đổi chuông thông báo thành dropdown hover hiển thị các yêu cầu hôm nay chưa hoàn tất; thay input file mặc định bằng nút custom để bỏ chữ “No file chosen”.
- **File thay đổi chính:** `components/portal-shell.tsx`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run build` thành công; `http://localhost:3000` trả `200 OK`.
- **Lưu ý/cảnh báo cho người sau:** Xóa nhân viên IT trong bản localStorage hiện sẽ gỡ assign khỏi các ticket đang gán cho người đó. Khi nối DB thật cần chuyển logic này thành soft delete hoặc kiểm tra ràng buộc nghiệp vụ.

### [2026-07-07] Session 3 - Codex
- **Làm được:** Chỉnh UI theo phản hồi: bỏ toàn bộ chữ Portal/Welcome, bỏ các module không cần thiết, chuyển search vào card Tickets, giữ phần xanh phía trên như hiệu ứng trang trí và tập trung vào bố cục card nghiệp vụ.
- **File thay đổi chính:** `components/portal-shell.tsx`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run build` thành công; `http://localhost:3000` trả `200 OK`.
- **Lưu ý/cảnh báo cho người sau:** Không thêm lại dãy module kiểu Hardware/Software nếu chưa có nhu cầu nghiệp vụ thật.

### [2026-07-07] Session 2 - Codex
- **Làm được:** Khởi tạo project Next.js/Tailwind/Prisma; dựng portal MVP một màn hình với role Phòng ban/IT, form gửi yêu cầu, danh sách/lọc ticket, xử lý IT, thống kê, danh mục nhanh, export CSV; áp dụng tone màu `#14B8A6`, `#FACC15`, `#EC4899`.
- **File thay đổi chính:** `package.json`, `app/`, `components/portal-shell.tsx`, `lib/`, `prisma/schema.prisma`, `.env.example`, `.gitignore`.
- **Đã test:** `npm.cmd run build` thành công; dev server trả `200 OK` tại `http://localhost:3000`.
- **Lưu ý/cảnh báo cho người sau:** App đang dùng dữ liệu mẫu lưu localStorage để thao tác ngay; bước kế tiếp là nối Prisma/Supabase và auth thật. `npm install` có 5 cảnh báo audit mức moderate, chưa chạy `npm audit fix --force` để tránh breaking changes.

### [2026-07-07] Session 1 - Claude
- **Làm được:** Thu thập yêu cầu chi tiết; tạo bộ 5 file docs nền tảng: `01-business-analysis.md`, `02-database-design.md`, `03-workflow.md`, `04-CLAUDE.md`, `05-WORKLOG.md`.
- **File thay đổi chính:** Tạo mới 5 file docs.
- **Đã test:** Không áp dụng vì chưa có code.
- **Lưu ý/cảnh báo cho người sau:** Thông báo Zalo để Phase 2, không làm trong MVP.
