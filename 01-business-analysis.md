# 📋 01 — Business Analysis: "IT Help Me!"

> Web nội bộ để các phòng ban gửi yêu cầu/nhờ vả cho phòng IT, thay thế Google Form bằng giao diện đơn giản, dễ dùng, có lưu lịch sử.

## 1. Mục tiêu

- Thay thế việc gửi yêu cầu IT qua Google Form / chat / miệng bằng 1 web nội bộ tập trung.
- Lưu lại lịch sử toàn bộ yêu cầu (ai gửi, gửi lúc nào, IT xử lý ra sao, khi nào xong).
- Giúp IT dễ theo dõi, phân công, và có số liệu thống kê.

## 2. Đối tượng sử dụng (2 nhóm tài khoản)

| Nhóm | Mô tả | Quyền hạn |
|---|---|---|
| **Phòng ban (Requester)** | Nhân viên các phòng ban khác (Kế toán, HR, Marketing, ...) | Gửi yêu cầu mới, xem lịch sử yêu cầu **của phòng ban mình** |
| **IT (Staff)** | Nhân viên phòng IT | Xem tất cả yêu cầu, cập nhật trạng thái, giao việc (assign), xem thống kê, xuất Excel |

> Không phân quyền admin/thường trong nội bộ IT — mọi nhân viên IT có quyền như nhau.

## 3. Luồng nghiệp vụ tổng quan

1. Nhân viên phòng ban đăng nhập bằng **tài khoản chung của phòng ban** → điền form gửi yêu cầu.
2. Yêu cầu xuất hiện trên dashboard của IT với trạng thái **"Mới gửi"**.
3. Nhân viên IT nhận/giao (assign) yêu cầu cho 1 thành viên IT cụ thể → chuyển trạng thái **"Đang xử lý"**.
4. Khi xong, IT cập nhật trạng thái **"Hoàn thành"** + ghi chú kết quả xử lý.
   - Nếu không thể thực hiện → chuyển trạng thái **"Từ chối / Không thực hiện được"** + lý do.
5. Phòng ban gửi yêu cầu có thể xem lại trạng thái/lịch sử yêu cầu của mình bất kỳ lúc nào.

## 4. Chi tiết các trường trong 1 "Yêu cầu" (Request)

| Trường | Loại | Bắt buộc | Ghi chú |
|---|---|---|---|
| Phòng ban gửi | Dropdown (có thể thêm mới) | ✅ | VD: Kế toán, HR, Marketing... |
| Tên người gửi | Text tự do | ✅ | Không dùng dropdown, phòng ban tự gõ tên |
| Nội dung yêu cầu | Text tự do (textarea) | ✅ | Vì việc nhờ IT rất đa dạng, không giới hạn loại |
| Mức độ ưu tiên | Dropdown: Thấp / Trung bình / Cao / Khẩn cấp | ✅ | Mặc định "Trung bình" |
| File đính kèm | Upload (ảnh/file) | ❌ | VD: ảnh chụp lỗi máy |
| Trạng thái | Thấp / Đang xử lý / Hoàn thành / Từ chối - Không thực hiện được | Auto | Mặc định "Mới gửi" khi tạo |
| Người phụ trách (assign) | Dropdown chọn nhân viên IT | ❌ (điền sau bởi IT) | |
| Ghi chú kết quả xử lý | Text tự do | ❌ (điền khi hoàn thành/từ chối) | |
| Ngày giờ tạo | Auto | Auto | Dùng để lưu lịch sử theo ngày/tháng/năm |
| Ngày giờ cập nhật trạng thái gần nhất | Auto | Auto | |

## 5. Quản lý danh mục (Master data)

- **Danh sách phòng ban**: có sẵn 1 số phòng ban mặc định (Kế toán, HR, Marketing...), IT có thể thêm phòng ban mới trực tiếp trên web (không cần sửa code).
- **Danh sách nhân viên IT**: IT tự thêm/sửa/xoá tên thành viên trong team để dùng cho việc assign.

## 6. Tính năng cho IT (Dashboard)

- Xem danh sách toàn bộ yêu cầu, **tìm kiếm/lọc** theo: phòng ban, trạng thái, khoảng ngày.
- Cập nhật trạng thái, gán người phụ trách, ghi chú kết quả.
- **Xuất Excel** danh sách yêu cầu (theo bộ lọc hiện tại hoặc toàn bộ).
- **Thống kê**:
  - Số lượng yêu cầu theo phòng ban (phòng nào gửi nhiều nhất).
  - Số lượng yêu cầu theo trạng thái.
  - (Tuỳ chọn mở rộng sau) thời gian xử lý trung bình.

## 7. Thông báo (Notification)

- **MVP (bắt buộc)**: thông báo ngay trên web — badge số lượng yêu cầu mới cho IT; badge trạng thái thay đổi cho phòng ban gửi.
- **Phase 2 (tuỳ chọn, chưa làm ngay)**: gửi thêm qua Zalo. Lý do tạm hoãn: Zalo Notification Service (ZNS) yêu cầu đăng ký Official Account doanh nghiệp, tạo mẫu tin và chờ Zalo duyệt, tính phí theo tin gửi thành công — không đơn giản/miễn phí hoàn toàn như mong muốn ban đầu của dự án. Sẽ đánh giá lại khi có nhu cầu thực tế.

## 8. Ngoài phạm vi (Out of scope) cho bản đầu tiên

- Không có phân quyền admin/nhân viên trong nội bộ IT.
- Không có tài khoản riêng cho từng nhân viên phòng ban (dùng chung 1 tài khoản/phòng ban).
- Không tích hợp Zalo ngay (xem mục 7).

## 9. Tiêu chí thành công (Definition of Done cho MVP)

- [ ] Phòng ban đăng nhập, gửi được yêu cầu (kèm file nếu cần).
- [ ] IT xem được toàn bộ yêu cầu, assign, cập nhật trạng thái, ghi chú kết quả.
- [ ] Phòng ban xem lại được lịch sử + trạng thái yêu cầu của mình.
- [ ] Tìm kiếm/lọc + xuất Excel hoạt động.
- [ ] Thống kê cơ bản theo phòng ban/trạng thái hiển thị đúng.
- [ ] Deploy thành công lên Vercel (free tier), kết nối DB (Supabase free tier).
