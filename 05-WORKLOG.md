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
2. Giao diện dashboard tập trung vào các nghiệp vụ chính; `/bao-cao-ngay` đã được thiết kế lại mobile-first, ưu tiên mô tả/nội dung công việc, chữ thân bài màu đen và xuất PNG 1080px khít chiều cao nội dung thay vì ép vào khung 9:16.
3. Đã có session cookie httpOnly ký HMAC và route protection backend: chưa login không thấy ticket; phòng ban chỉ xem/tạo/rating ticket của mình; IT mới quản trị danh mục, xử lý, xóa và import dữ liệu.
4. Prisma schema PostgreSQL/Supabase đã có các model helpdesk, `DailyReport` và `WorkReport`; migration của `DailyReport` đã áp dụng, nhưng production còn thiếu 2 migration `WorkReport`.
5. Runtime Prisma dùng `@prisma/adapter-pg`; `DATABASE_URL` được normalize thêm `uselibpqcompat=true` khi URL có `sslmode=require` để tránh lỗi SSL self-signed của `pg`.
6. Local `master` đã merge commit remote `678539a` vào merge commit `62ab2db`; production Vercel đang ở deployment `dpl_ggiYhpKoNVgwYSmqKGPjX97JcKoM` và được alias tại `https://it-help-me.vercel.app`.

## VIỆC TIẾP THEO

1. Người dùng rà soát giao diện/ảnh xuất mới của `/bao-cao-ngay`; khi được chốt thì deploy lên Vercel và smoke-test lại trên điện thoại thật/Zalo.
2. Tối ưu latency production: cấu hình Vercel function region gần Supabase hơn và giảm số query dư trên các API nóng.
3. Xuất Excel server-side bằng `exceljs` hoặc `xlsx` nếu cần file `.xlsx` chuẩn thay vì CSV.
4. Cân nhắc chuyển xóa nhân viên IT sang soft delete hoặc ràng buộc nghiệp vụ rõ hơn.
5. Không commit hoặc chia sẻ `.env`/`.env.local`; dùng `prisma migrate deploy` cho thay đổi schema và ưu tiên `DIRECT_URL` khi kết nối trực tiếp ổn định.
6. Áp dụng 2 migration `20260723151258_add_work_report` và `20260725093556_add_owner_to_workreport_unique` bằng `prisma migrate deploy`, rồi kiểm tra lại đọc/lưu báo cáo sáng và chiều trên production.

## BLOCKERS

- Direct Supabase host dạng IPv6 không dùng được trên máy local hiện tại: test IPv6 literal trả `ENETUNREACH`; dùng Session Pooler IPv4 thay thế.
- Database production chưa áp dụng 2 migration `WorkReport`, khiến `/api/work-reports` trả HTTP 500 và không thể lưu báo cáo; chưa chạy migration trong session chẩn đoán vì người dùng chưa yêu cầu sửa.

---

## NHẬT KÝ SESSION

### [2026-07-28] Session 34 - Codex
- **Làm được:** Cài skill `ui-ux-pro-max` từ `nextlevelbuilder/ui-ux-pro-max-skill`; áp dụng workflow mobile-first để thiết kế lại form và ảnh xuất `/bao-cao-ngay`: mô tả/nội dung công việc thành khối toàn chiều ngang, đổi bảng theo dõi thành card, chữ thân bài gần đen, thống kê 3 cột, vùng chạm tối thiểu 44px; ảnh PNG rộng 1080px tự lấy đúng chiều cao nội dung, không còn viền nền/scale ép 9:16; sửa palette trạng thái chưa thực hiện từ `rose-*` không tồn tại sang `red-*`.
- **File thay đổi chính:** `app/bao-cao-ngay/page.tsx`, `05-WORKLOG.md`; skill được cài ngoài repo tại `C:\Users\khang\.codex\skills\ui-ux-pro-max`.
- **Đã test:** `npx.cmd tsc --noEmit` thành công; `npm.cmd run build` thành công với encoding, TypeScript và 17 route; Chrome DevTools mô phỏng đúng 375px xác nhận `scrollWidth=375`; tự điền 4 công việc ưu tiên và 1 công việc theo dõi, xuất PNG thực tế `1080x2604`, kiểm tra trực quan ảnh khít nội dung và badge đỏ hiển thị đúng.
- **Lưu ý/cảnh báo cho người sau:** Chưa deploy thay đổi UI lên Vercel vì người dùng chưa yêu cầu deploy; production vẫn ở deployment ghi trong trạng thái hiện tại. Hai migration `WorkReport` vẫn chưa được áp dụng và không thuộc thay đổi UI của session này.

### [2026-07-28] Session 33 - Codex
- **Làm được:** Chẩn đoán lỗi không lưu được báo cáo buổi sáng; xác nhận API production `/api/work-reports` trả HTTP 500 vì database còn thiếu cả 2 migration tạo bảng và unique key của `WorkReport`.
- **File thay đổi chính:** `05-WORKLOG.md`; không thay đổi mã ứng dụng hoặc database.
- **Đã test:** `npx.cmd prisma migrate status` báo chưa áp dụng `20260723151258_add_work_report` và `20260725093556_add_owner_to_workreport_unique`; gọi GET production `/api/work-reports?date=2026-07-28&type=morning` trả HTTP 500; chạy lại `npm.cmd run build` thành công.
- **Lưu ý/cảnh báo cho người sau:** Cần được người dùng yêu cầu sửa trước khi chạy `prisma migrate deploy`; sau migration phải kiểm tra cả lưu mới và cập nhật báo cáo theo từng `owner`. Session này ưu tiên yêu cầu chẩn đoán trực tiếp của người dùng.

### [2026-07-27] Session 32 - Codex
- **Làm được:** Fetch `origin/master`, xác nhận commit `678539a` chưa có ở local, merge commit này vào `master` bằng merge commit `62ab2db`, build và redeploy Vercel production; dọn dấu conflict cũ trong worklog.
- **File thay đổi chính:** `app/bao-cao-cuoi-ngay/page.tsx` (từ commit remote `678539a`), `05-WORKLOG.md`.
- **Đã test:** Xác nhận `678539a` là ancestor của `HEAD`; `npm.cmd run build` thành công với encoding, TypeScript và 17 route; Vercel deployment `dpl_ggiYhpKoNVgwYSmqKGPjX97JcKoM` đạt `READY`; smoke-test `/`, `/bao-cao-cuoi-ngay`, `/api/auth/session`, `/api/state` đều trả HTTP 200.
- **Lưu ý/cảnh báo cho người sau:** Local `master` đang ahead `origin/master` 6 commit do giữ lịch sử local khi remote từng force-update; chưa push vì người dùng chỉ yêu cầu pull và redeploy. Yêu cầu session này được ưu tiên theo chỉ định trực tiếp của người dùng.

### [2026-07-23] Session 27 - Codex
- **Làm được:** Xử lý tiếp 3 problem VS Code còn hiện ở `app/api/work-reports/route.ts` bằng cách bỏ phụ thuộc trực tiếp vào Prisma enum import/delegate type stale: dùng literal type `"MORNING" | "EVENING"` và delegate type cục bộ cho `workReport`.
- **File thay đổi chính:** `app/api/work-reports/route.ts`, `05-WORKLOG.md`.
- **Đã test:** `npx.cmd tsc --noEmit` thành công; `npm.cmd run build` thành công, bao gồm `check:encoding`.
- **Lưu ý/cảnh báo cho người sau:** Prisma Client đã có `ReportType`/`workReport`, nhưng cách viết mới giúp VS Code không còn báo 3 lỗi cũ nếu TypeScript server giữ cache Prisma.

### [2026-07-23] Session 26 - Codex
- **Làm được:** Kiểm tra nguyên nhân VS Code/TypeScript còn báo 3 problem. Lỗi ban đầu đến từ cache `.next/dev/types/routes.d.ts` bị hỏng và Next/Turbopack chọn nhầm workspace root `C:\Users\Acer` do có lockfile nằm trên thư mục project. Đã cấu hình `turbopack.root` về đúng project, sửa file routes cache bị lặp nội dung, và chạy lại `prisma generate` để Prisma Client nhận `ReportType`/`WorkReport`.
- **File thay đổi chính:** `next.config.mjs`, `next-env.d.ts`, `.next/dev/types/routes.d.ts`, `05-WORKLOG.md`; Prisma Client trong `node_modules/@prisma/client` được generate lại.
- **Đã test:** `npx.cmd prisma generate` thành công; `npx.cmd tsc --noEmit` thành công; `npm.cmd run build` thành công, bao gồm `check:encoding`.
- **Lưu ý/cảnh báo cho người sau:** Nếu VS Code vẫn hiện problem cũ, reload TypeScript server hoặc reload window; CLI đã xanh nên đó là cache editor.

### [2026-07-16] Session 31 - Codex
- **Làm được:** Pull `origin/master`, merge commit `e613376` vào local `master` bằng merge commit `e704e95`; xử lý xung đột duy nhất tại `app/bao-cao-ngay/page.tsx` bằng cách ưu tiên phiên bản remote, giữ các commit local về Prisma/tài liệu; khôi phục worklog sau stash.
- **File thay đổi chính:** `app/bao-cao-cuoi-ngay/page.tsx`, `app/bao-cao-ngay/page.tsx`, `components/portal-shell.tsx`, `05-WORKLOG.md`; merge commit còn giữ các thay đổi local trước đó.
- **Đã test:** Xác nhận `e613376` là ancestor của `HEAD`; `npm.cmd run build` thành công, gồm encoding, TypeScript và 16 route, có `/bao-cao-cuoi-ngay`.
- **Lưu ý/cảnh báo cho người sau:** Chưa redeploy được vì yêu cầu chạy Vercel bị hệ thống chặn do hết giới hạn sử dụng Codex trước khi lệnh thực thi; production chưa đổi và chưa thể smoke-test route mới. Local `master` đang ahead `origin/master` 3 commit, chưa push vì người dùng chỉ yêu cầu pull và redeploy.
