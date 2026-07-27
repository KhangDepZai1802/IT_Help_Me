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
2. Giao diện dashboard tập trung vào các nghiệp vụ chính: gửi yêu cầu, Tickets, xử lý IT, thống kê, danh mục, lịch sử; trang báo cáo ngày đã tăng tương phản chữ/placeholder sang gần đen để dễ đọc; đăng nhập vẫn giữ UX chọn phòng ban để vào, riêng IT nhập mật khẩu.
3. Đã có session cookie httpOnly ký HMAC và route protection backend: chưa login không thấy ticket; phòng ban chỉ xem/tạo/rating ticket của mình; IT mới quản trị danh mục, xử lý, xóa và import dữ liệu.
4. Prisma schema PostgreSQL/Supabase đã có các model helpdesk và `DailyReport`; migration history đã được baseline, migration tạo bảng báo cáo ngày đã áp dụng thành công.
5. Runtime Prisma dùng `@prisma/adapter-pg`; `DATABASE_URL` được normalize thêm `uselibpqcompat=true` khi URL có `sslmode=require` để tránh lỗi SSL self-signed của `pg`.
6. Local `master` đã merge commit remote `e613376` vào merge commit `e704e95`, có thêm trang `/bao-cao-cuoi-ngay`; production Vercel vẫn đang ở deployment `dpl_J2iWbtJDo3suarFPLbS7U9ftJaS4` của bản trước vì lần redeploy mới chưa được phép chạy.

## VIỆC TIẾP THEO

1. Tối ưu latency production: cấu hình Vercel function region gần Supabase hơn và giảm số query dư trên các API nóng.
2. Xuất Excel server-side bằng `exceljs` hoặc `xlsx` nếu cần file `.xlsx` chuẩn thay vì CSV.
3. Cân nhắc chuyển xóa nhân viên IT sang soft delete hoặc ràng buộc nghiệp vụ rõ hơn.
4. Không commit hoặc chia sẻ `.env`/`.env.local`; nếu lộ password DB/service key thì rotate trong Supabase và cập nhật lại Vercel env.
5. Dùng `prisma migrate deploy` cho các thay đổi schema tiếp theo; ưu tiên cấu hình `DIRECT_URL` khi kết nối trực tiếp Supabase ổn định, hiện Prisma CLI có fallback sang `DATABASE_URL`.
6. Redeploy merge commit `e704e95` lên Vercel khi giới hạn sử dụng Codex cho phép, smoke-test `/bao-cao-cuoi-ngay` cùng các API chính; sau đó Ban Giám đốc/Quản lý IT rà soát bản production.

## BLOCKERS

- Direct Supabase host dạng IPv6 không dùng được trên máy local hiện tại: test IPv6 literal trả `ENETUNREACH`; dùng Session Pooler IPv4 thay thế.
- Redeploy Vercel của merge commit `e704e95` bị chặn trước khi lệnh chạy vì tài khoản Codex chạm giới hạn sử dụng; cần chạy lại sau khi quota được mở hoặc người dùng tự chạy `npx vercel --prod --yes`.

---

## NHẬT KÝ SESSION

### [2026-07-16] Session 31 - Codex
- **Làm được:** Pull `origin/master`, merge commit `e613376` vào local `master` bằng merge commit `e704e95`; xử lý xung đột duy nhất tại `app/bao-cao-ngay/page.tsx` bằng cách ưu tiên phiên bản remote, giữ các commit local về Prisma/tài liệu; khôi phục worklog sau stash.
- **File thay đổi chính:** `app/bao-cao-cuoi-ngay/page.tsx`, `app/bao-cao-ngay/page.tsx`, `components/portal-shell.tsx`, `05-WORKLOG.md`; merge commit còn giữ các thay đổi local trước đó.
- **Đã test:** Xác nhận `e613376` là ancestor của `HEAD`; `npm.cmd run build` thành công, gồm encoding, TypeScript và 16 route, có `/bao-cao-cuoi-ngay`.
- **Lưu ý/cảnh báo cho người sau:** Chưa redeploy được vì yêu cầu chạy Vercel bị hệ thống chặn do hết giới hạn sử dụng Codex trước khi lệnh thực thi; production chưa đổi và chưa thể smoke-test route mới. Local `master` đang ahead `origin/master` 3 commit, chưa push vì người dùng chỉ yêu cầu pull và redeploy.

### [2026-07-16] Session 30 - Codex
- **Làm được:** Build và redeploy commit `b533781` lên Vercel production; deployment `dpl_J2iWbtJDo3suarFPLbS7U9ftJaS4` đạt `READY` và được alias về `https://it-help-me.vercel.app`.
- **File thay đổi chính:** `05-WORKLOG.md`; không thay đổi mã ứng dụng trong session này.
- **Đã test:** `npm.cmd run build` thành công, gồm kiểm tra encoding, TypeScript và 15 route; Vercel production build thành công tại region `iad1`; smoke test `/`, `/bao-cao-ngay`, `/api/auth/session`, `/api/daily-reports` đều trả HTTP 200.
- **Lưu ý/cảnh báo cho người sau:** Bản production hiện đã có thay đổi tăng tương phản của `/bao-cao-ngay`; bước tiếp theo là người dùng nghiệp vụ rà soát trực quan và chốt các ưu tiên 0–60 ngày.

### [2026-07-15] Session 29 - Codex
- **Làm được:** Tăng độ tương phản toàn bộ chữ trên trang `/bao-cao-ngay` và bản xuất ảnh: nhãn, mô tả, checklist, bảng, dữ liệu nhập chuyển sang `slate-900/950`; placeholder chuyển sang `slate-700` và đậm hơn; giữ nguyên chữ sáng trên nền tối, màu trạng thái và sao chưa chọn.
- **File thay đổi chính:** `app/bao-cao-ngay/page.tsx`, `05-WORKLOG.md`.
- **Đã test:** `npm.cmd run build` thành công, gồm kiểm tra encoding, TypeScript và 15 route.
- **Lưu ý/cảnh báo cho người sau:** Chưa redeploy Vercel trong session này vì người dùng chỉ yêu cầu chỉnh giao diện; thay đổi DOCX đang có trong working tree là của người dùng/session khác và được giữ nguyên.

### [2026-07-15] Session 28 - Codex
- **Làm được:** Rà commit mới pull `33e69f0`, sửa `prisma.config.ts` để ưu tiên `DIRECT_URL` nhưng fallback an toàn sang `DATABASE_URL`; baseline migration cho schema hiện hữu, áp dụng migration tạo `DailyReport`; cài dependency mới, build và redeploy Vercel production.
- **File thay đổi chính:** `prisma.config.ts`, `05-WORKLOG.md`; Supabase thêm bảng/index `DailyReport` và lịch sử migration.
- **Đã test:** `npx.cmd prisma generate` thành công; `prisma migrate diff` xác nhận chỉ thiếu bảng/index `DailyReport`; `prisma migrate deploy` thành công và `prisma migrate status` báo database up to date; `npm.cmd run build` thành công với 15 route; deployment `dpl_8a2DYCZx1eE8gUTXpsvFGyhJG2Yr` READY và alias domain chính; smoke test `/`, `/bao-cao-ngay`, `/api/auth/session`, `/api/daily-reports` đều HTTP 200.
- **Lưu ý/cảnh báo cho người sau:** Migration đầu `20260714140652_nguyenphu` được đánh dấu baseline vì các bảng cũ đã tồn tại; migration `20260714144533_add_intern_daily_report` được áp dụng thực tế. Session làm theo yêu cầu redeploy sau khi pull, khác danh sách `VIỆC TIẾP THEO`; báo cáo DOCX từ Session 26 vẫn chưa commit.

### [2026-07-15] Session 27 - Codex
- **Làm được:** Kiểm tra chênh lệch schema giữa Supabase và Prisma, xác nhận không cần `db push`; build và redeploy bản hiện tại lên Vercel production, alias lại domain chính.
- **File thay đổi chính:** `05-WORKLOG.md`; database không thay đổi vì schema đã đồng bộ.
- **Đã test:** `npx.cmd prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` báo `No difference detected`; `npm.cmd run build` thành công; Vercel build/deploy thành công tại `https://it-help-bqs9mn17t-thongdat.vercel.app` và alias `https://it-help-me.vercel.app`; smoke test production `/`, `/api/auth/session`, `/api/state` đều trả HTTP 200, API trả dữ liệu phòng ban từ Supabase.
- **Lưu ý/cảnh báo cho người sau:** Deployment dùng Vercel region `iad1`; session này làm theo yêu cầu redeploy trực tiếp của người dùng, khác các mục tối ưu trong `VIỆC TIẾP THEO`; repo vẫn có báo cáo DOCX chưa commit từ Session 26.

### [2026-07-11] Session 26 - Codex
- **Làm được:** Rà toàn bộ tài liệu nghiệp vụ, workflow, schema, API và giao diện web hiện tại; lập báo cáo DOCX dành cho Ban Giám đốc, gồm tóm tắt điều hành, quy trình đầu-cuối, ma trận chức năng theo vai trò, dữ liệu/kiểm soát, giá trị quản trị, rủi ro và lộ trình ưu tiên.
- **File thay đổi chính:** `docs/Bao_cao_Tong_quan_Quy_trinh_Nghiep_vu_IT_Help_Me.docx`, `05-WORKLOG.md`.
- **Đã test:** Mở lại DOCX bằng `python-docx`, kiểm tra cấu trúc ZIP/XML, số đoạn/bảng, tiêu đề và chuỗi tiếng Việt trọng yếu; chạy `npm.cmd run build` theo quy định repository.
- **Lưu ý/cảnh báo cho người sau:** Báo cáo phản ánh mã nguồn/tài liệu/worklog hiện hành, không chứa số liệu production thực tế và không phải báo cáo pentest; việc này khác danh sách `VIỆC TIẾP THEO` vì người dùng yêu cầu trực tiếp một báo cáo quản trị DOCX.
