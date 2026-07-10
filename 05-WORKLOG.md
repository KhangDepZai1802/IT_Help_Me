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
2. Giao diện dashboard tập trung vào các nghiệp vụ chính: gửi yêu cầu, Tickets, xử lý IT, thống kê, danh mục, lịch sử; đăng nhập vẫn giữ UX chọn phòng ban để vào, riêng IT nhập mật khẩu.
3. Đã có session cookie httpOnly ký HMAC và route protection backend: chưa login không thấy ticket; phòng ban chỉ xem/tạo/rating ticket của mình; IT mới quản trị danh mục, xử lý, xóa và import dữ liệu.
4. Prisma schema PostgreSQL/Supabase đã có các model chính: `Department`, `ITStaff`, `Account`, `Request`, `RequestAttachment`, `RequestStatusHistory`, `ChatMessage`; enum `RequestStatus` có `NEW`, `ACCEPTED`, `IN_PROGRESS`, `DONE`, `REJECTED`.
5. Runtime Prisma dùng `@prisma/adapter-pg`; `DATABASE_URL` được normalize thêm `uselibpqcompat=true` khi URL có `sslmode=require` để tránh lỗi SSL self-signed của `pg`.
6. Production Vercel `https://it-help-me.vercel.app` đã deploy lại bản icon/footer TeamIT Gustino; `public/it.png` đã được làm nền trong suốt và header/login không còn khung trắng quanh logo.

## VIỆC TIẾP THEO

1. Tối ưu latency production: cấu hình Vercel function region gần Supabase hơn và giảm số query dư trên các API nóng.
2. Xuất Excel server-side bằng `exceljs` hoặc `xlsx` nếu cần file `.xlsx` chuẩn thay vì CSV.
3. Cân nhắc chuyển xóa nhân viên IT sang soft delete hoặc ràng buộc nghiệp vụ rõ hơn.
4. Không commit hoặc chia sẻ `.env`/`.env.local`; nếu lộ password DB/service key thì rotate trong Supabase và cập nhật lại Vercel env.
5. Thêm migration workflow chính thức thay cho `prisma db push` khi schema bắt đầu ổn định.
6. Kiểm tra lại production trên trình duyệt; nếu favicon/logo còn bản cũ thì hard refresh hoặc xóa cache trình duyệt.

## BLOCKERS

- Direct Supabase host dạng IPv6 không dùng được trên máy local hiện tại: test IPv6 literal trả `ENETUNREACH`; dùng Session Pooler IPv4 thay thế.

---

## NHẬT KÝ SESSION

### [2026-07-10] Session 25 - Codex
- **Làm được:** Redeploy Vercel cho bản icon/footer mới; sau phản hồi icon còn nền trắng vuông, đã làm sạch `public/it.png` thành PNG nền trong suốt, crop bớt nền caro cũ, xóa khung trắng/padding/ring khỏi `BrandMark`, rồi deploy lại production.
- **File thay đổi chính:** `components/portal-shell.tsx`, `public/it.png`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run build` thành công, bao gồm `check:encoding`; `npx.cmd vercel --prod` thành công với deployment cuối `dpl_5UunxueTNNZf5PwRBDw2vpAFr1du` và alias `https://it-help-me.vercel.app`; smoke test `curl.exe -I https://it-help-me.vercel.app/api/state` trả `200 OK`; tải `https://it-help-me.vercel.app/it.png` về kiểm tra `size=1134x1151`, `A00=0`, `length=620174`.
- **Lưu ý/cảnh báo cho người sau:** Deployment trước đó trong cùng lượt là `dpl_C1qzpWxGYjSpqnYKEhkFXF2H74rP` nhưng đã bị supersede bởi `dpl_5UunxueTNNZf5PwRBDw2vpAFr1du`; nếu trình duyệt còn favicon cũ thì do cache.

### [2026-07-10] Session 24 - Codex
- **Làm được:** Thêm icon TeamIT Gustino từ `public/it.png` vào metadata favicon/apple/shortcut icon, thay logo lucide cũ ở header dashboard và màn hình đăng nhập bằng ảnh icon mới, thêm footer bản quyền `© 2026 Bản quyền thuộc về TeamIT Gustino` và tagline `Team IT Gustino – Xử lý cực pro!` ở cuối giao diện đăng nhập/dashboard.
- **File thay đổi chính:** `app/layout.tsx`, `components/portal-shell.tsx`, `public/it.png`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run build` thành công, bao gồm `npm run check:encoding`; chạy thử `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000` lên `Ready` tại `http://127.0.0.1:3000` trong phiên trực tiếp.
- **Lưu ý/cảnh báo cho người sau:** Chưa deploy production trong session này; dev server khi tách nền bằng `Start-Process` thoát sau khi log `Ready`, nên nếu cần xem live local hãy chạy lệnh dev trực tiếp trong terminal.

### [2026-07-09] Session 23 - Codex
- **Làm được:** Sửa lỗi textarea `Nội dung` và `Ghi chú` bị kẹt khi nhập dài bằng `StableTextarea` hỗ trợ composition/bộ gõ tiếng Việt, chống reset draft khi polling cùng phiếu; sửa badge tin nhắn chưa đọc bằng cách trả thêm `chatUnreadByDepartment` từ server và hiển thị badge theo max server/client; giới hạn Prisma pg pool mỗi instance còn `max: 1` để tránh Supabase `EMAXCONNSESSION`; deploy lại production.
- **File thay đổi chính:** `components/portal-shell.tsx`, `lib/server-data.ts`, `lib/prisma.ts`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run check:encoding` thành công; `npm.cmd run build` thành công; `npx.cmd vercel --prod` deploy production thành công và alias lại `https://it-help-me.vercel.app`; smoke test production `curl.exe -I https://it-help-me.vercel.app/api/state` trả `200 OK`.
- **Lưu ý/cảnh báo cho người sau:** Deployment mới `dpl_EAqu7LoZwHoCHZCgvSoNxsjqfXuU`; local smoke test API trước khi giới hạn pool từng gặp `EMAXCONNSESSION`, ưu tiên tránh để nhiều dev server/polling chạy song song.

### [2026-07-09] Session 22 - Codex
- **Làm được:** Thêm nút thu hồi tin nhắn trong bubble chat của chính người gửi; thêm API `DELETE /api/chat` để thu hồi tin nhắn có kiểm tra quyền; lọc và dọn tin nhắn cũ hơn 24 giờ khi tải state/gửi/đánh dấu đã đọc; deploy lại production Vercel.
- **File thay đổi chính:** `app/api/chat/route.ts`, `lib/server-data.ts`, `components/portal-shell.tsx`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run check:encoding` thành công; `npm.cmd run build` thành công; smoke test local gửi rồi thu hồi tin nhắn chat thành công; `npx.cmd vercel --prod` deploy production thành công và alias lại `https://it-help-me.vercel.app`; smoke test production `curl.exe -I https://it-help-me.vercel.app/api/state` trả `200 OK`.
- **Lưu ý/cảnh báo cho người sau:** Deployment mới `dpl_4rqLHRECSeCTqRmEVGM3rcL2HFPN`; tin nhắn chat quá 24 giờ sẽ bị xóa khi có request state/chat.

### [2026-07-09] Session 21 - Codex
- **Làm được:** Xóa 1 tin nhắn smoke test chat có nội dung chứa `UUID fallback` khỏi DB; sửa badge tin nhắn chưa đọc bằng cách lưu thêm `chatUnreadCount` từ server state và hiển thị badge theo giá trị lớn hơn giữa server/client; khi mở đúng thread thì trừ unread count sau khi đánh dấu đã đọc; deploy lại production Vercel.
- **File thay đổi chính:** `components/portal-shell.tsx`, `05-WORKLOG.md`.
- **Đã test:** Script xóa test message báo `Deleted 1 test chat message(s).`; `npm.cmd run check:encoding` thành công; `npm.cmd run build` thành công; `npx.cmd vercel --prod` deploy production thành công và alias lại `https://it-help-me.vercel.app`; smoke test production `curl.exe -I https://it-help-me.vercel.app/api/state` trả `200 OK`.
- **Lưu ý/cảnh báo cho người sau:** Deployment mới `dpl_CP1nbw6ovAtK3jcEhsa9jen23ooG`; vẫn còn latency do Vercel function ở `iad1` xa Supabase.

### [2026-07-09] Session 20 - Codex
- **Làm được:** Sửa tiếp chữ nút modal thông báo `Đã hiểu` và một chuỗi `Không thể` còn bị lỗi dấu; bổ sung guard encoding bắt các từ hỏng cụ thể; sửa lỗi gửi chat khi dev server giữ Prisma Client cũ bằng cách tái tạo client stale và thêm fallback raw SQL có UUID cho `/api/chat`; ẩn badge nhắc đánh giá trên nút `Xem lịch sử` khi đang ở giao diện IT, chỉ hiện cho phòng ban.
- **File thay đổi chính:** `components/portal-shell.tsx`, `app/api/chat/route.ts`, `lib/prisma.ts`, `scripts/check-encoding.mjs`, `05-WORKLOG.md`.
- **Đã test:** `npx.cmd prisma generate` thành công; `npm.cmd run check:encoding` thành công; smoke test local gửi `/api/chat` sau login IT thành công và trả ID tin nhắn; `npm.cmd run build` thành công; `npx.cmd vercel --prod` deploy production thành công và alias lại `https://it-help-me.vercel.app`; smoke test production `curl.exe -I https://it-help-me.vercel.app/api/state` trả `200 OK`.
- **Lưu ý/cảnh báo cho người sau:** Smoke test có gửi một tin nhắn test vào phòng kế toán trên DB local/đang trỏ theo `.env`; production đã deploy ở `dpl_3jDtUVuz6suvCMfmNEnv5B6eQaym`.
