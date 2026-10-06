<p align="center"><img src="docs/icon.png" width="112" alt="VRC Nook"></p>

<h1 align="center">VRC Nook</h1>

<p align="center">Ứng dụng đồng hành nhẹ nhàng, ấm cúng, tất cả trong một cho VRChat trên Windows: bạn bè, nhật ký game, Chatbox trong game, bàn phím cho VR và công cụ tạo emoji động.</p>

<p align="center">
<a href="README.md">English</a> · <a href="README.th.md">ไทย</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a> · <a href="README.ru.md">Русский</a> · <b>Tiếng Việt</b> · <a href="README.zh.md">中文</a>
</p>

---

## Tải về

Tải `VRCNook.exe` từ [bản phát hành mới nhất](https://github.com/iriewiew/vrc-nook/releases/latest) rồi chạy. Không cần cài đặt.
Hãy đặt file trong thư mục có quyền ghi như Documents. Đừng dùng Program Files, vì ứng dụng tự ghi đè để cập nhật.

**Yêu cầu:** Windows 10/11 có Microsoft Edge WebView2 (Windows 11 có sẵn).

## Nhẹ

- **Một file khoảng 23 MB.** Không cần cài đặt, không cần cài thêm runtime (đã kèm sẵn Python).
- **Không kèm trình duyệt.** Giao diện chạy trên WebView2 có sẵn trong Windows, nên ứng dụng không phải mang theo cả Chromium.
- **Nhẹ nhàng với VRChat API.**
  - Mọi yêu cầu chạy nền đều đi qua một hàng đợi có giới hạn tần suất.
  - Ảnh được lưu đệm trên đĩa và tải ở kích thước nhỏ.
  - Ảnh của bạn bè ngoại tuyến chỉ tải khi mở hồ sơ.
- **Êm khi chạy nền.** Nhật ký game chỉ đọc các dòng mới, và ứng dụng có thể nằm ở khay hệ thống.
- **Dữ liệu ở một nơi:** tất cả nằm trong `%APPDATA%\VRCNook`. Có thể xóa `cache\` bất cứ lúc nào.

## Tính năng

### Bạn bè & mạng xã hội
- **Danh sách bạn bè theo thời gian thực** qua WebSocket của VRChat. Bạn bè được chia nhóm: ở thế giới công khai, ở thế giới riêng tư, trực tuyến trên web và ngoại tuyến.
- **Chế độ xem:** đổi kiểu hiển thị và xem lần trực tuyến gần nhất của từng người.
- **Thẻ hồ sơ:** banner, khung hồ sơ, huy hiệu, tiểu sử, liên kết, bạn chung và lịch sử đổi tên.
  - Ghi chú cá nhân đồng bộ với VRChat.
  - Thao tác: mời, xin lời mời, Boop kèm emoji, yêu thích, chặn hoặc tắt tiếng.
- **Bảng tin:** bạn bè đổi trạng thái, vị trí, avatar và tên hiển thị.
- **Thông báo:** lời mời, lời mời kết bạn, thông báo nhóm. Có thể trả lời bằng tin nhắn mẫu (kèm ảnh nếu có VRC+).
- **Thông báo Windows** và biểu tượng ở khay hệ thống. Có thể tự mở cùng Windows.

### Nhật ký game
- **Đọc log VRChat theo thời gian thực:** vào thế giới, người chơi vào/ra, video, ảnh chụp, sticker, mất kết nối và nhiều hơn nữa.
- **Bộ lọc:** chọn loại sự kiện muốn hiển thị.
- **Lịch sử lâu dài:** lưu trong cơ sở dữ liệu SQLite trên máy. VRChat tự xóa log cũ, nhưng VRC Nook vẫn giữ lại.
- **Lịch sử thế giới:** mọi thế giới và instance bạn đã ghé, kèm những người đã gặp.

### Nội dung VRChat
- **Thế giới và phòng:** xem thế giới, tạo instance, mở thế giới trong VRChat, xem cửa hàng của thế giới.
- **Yêu thích:** bạn bè, thế giới và avatar.
- **Sự kiện:** lịch sự kiện của VRChat và Jams.
- **Nhóm:** xem và quản lý (thành viên, lời mời, yêu cầu, cấm, instance của nhóm).
- **Avatar:**
  - Đổi avatar, xem dung lượng file và hiệu năng theo từng nền tảng.
  - Tìm avatar công khai qua avtrdb.com.
- **Kho đồ:** biểu tượng VRC+, ảnh, prints, emoji, sticker và props.
- **Tìm kiếm:** người dùng, thế giới, nhóm và sự kiện. Chỉ cần dán liên kết hoặc ID.
- **Tài khoản của tôi:** sửa tiểu sử, liên kết và trạng thái. Quản lý danh sách chặn và tắt tiếng.

### Tạo emoji động
- **Nguồn:** GIF động, WebP động hoặc nhiều ảnh (mỗi ảnh một khung hình).
- **Chỉnh sửa:**
  - Chọn đoạn khung hình và số khung hình.
  - Xóa phông bằng chroma key (bấm vào ảnh xem trước để chọn màu).
- **Kết quả:** tự tạo sprite sheet 1024×1024 theo định dạng của VRChat.
- **Xem trước:** xem từng kiểu hoạt ảnh bằng ảnh xem trước chính thức của VRChat, rồi tải lên ngay.

### Chatbox trong game (OSC)
- **Trang chat:** gõ trong ứng dụng và chữ sẽ hiện ở Chatbox trong game, có lịch sử gửi.
- **Trạng thái:** hiện "đang nhập…" trong game khi bạn gõ. Âm thanh thông báo có thể bật/tắt.

### Bàn phím ảo cho VR
- **Thiết kế cho VR:** phím lớn, đổi được kích thước, có nút sao chép, dán và chọn tất cả.
- **Bàn phím nổi tách rời:**
  - Luôn nằm trên mọi cửa sổ và không chiếm tiêu điểm.
  - **Chế độ chat trong game:** gửi lên Chatbox.
  - **Chế độ bàn phím Windows:** gõ vào bất kỳ ứng dụng nào, có nút Task View.
- **Bố cục:** Thái, Anh, hiragana và katakana, Hàn, Nga, Việt, bính âm tiếng Trung và emoji.
  - Tiếng Hàn tự ghép âm tiết.
  - Tiếng Việt và bính âm có phím dấu thanh.
- **Cài đặt:** chọn các bố cục mà phím đổi ngôn ngữ sẽ xoay vòng.

### Tùy biến
- **7 ngôn ngữ giao diện:** ไทย, English, 日本語, 한국어, Русский, Tiếng Việt, 中文
- **Giao diện:** sáng và tối, cùng màu chuyển sắc tùy chọn.
- **Phông chữ:** Noto Sans Thai và các Google Fonts khác. Có thể đổi cỡ chữ.
- **Cửa sổ:** luôn ở trên cùng, thu nhỏ xuống khay.

### Cập nhật
- **Tự kiểm tra:** khi mở, ứng dụng kiểm tra GitHub Releases và cập nhật chỉ với một cú bấm.
- **Xác minh:** chỉ tải từ kho mã này, và chỉ cài khi SHA-256 của file khớp.

## Quyền riêng tư & bảo mật

- **Không lưu mật khẩu.** Mật khẩu được gửi thẳng tới VRChat.
  - Chỉ lưu cookie phiên, được mã hóa bằng Windows DPAPI nên chỉ tài khoản Windows của bạn giải mã được.
- **Cookie đăng nhập chỉ gửi tới `api.vrchat.cloud`.** Nếu bị chuyển hướng sang máy chủ khác, cookie sẽ bị gỡ bỏ.
- **Mọi dữ liệu nằm trên máy bạn** tại `%APPDATA%\VRCNook`:
  - cài đặt
  - cơ sở dữ liệu nhật ký game
  - ghi chú và lịch sử chat
  - bộ nhớ đệm ảnh
- **Kết nối khác:**
  - [avtrdb.com](https://avtrdb.com): chỉ khi tìm avatar công khai, và chỉ gửi từ khóa tìm kiếm.
  - Google Fonts: chỉ khi chọn phông chữ web.
  - `assets.vrchat.com`: ảnh xem trước hiệu ứng.
  - `api.github.com`: kiểm tra cập nhật.

## Thư mục dữ liệu

```
%APPDATA%\VRCNook\
├─ session.bin     phiên đăng nhập đã mã hóa
├─ settings.json   cài đặt
├─ data.db         nhật ký game, bảng tin, ghi chú, lịch sử tên, lịch sử chat (SQLite)
├─ debug.log       nhật ký lỗi
└─ cache\          ảnh và dữ liệu hồ sơ (có thể xóa)
```

## Build từ mã nguồn

```powershell
pip install -r requirements.txt
python vrclog_mac.py          # chạy
.\build.ps1                   # build dist\VRCNook.exe
```

Mô tả từng file có trong [README tiếng Anh](README.md#build-from-source).

## Ghi công

- Tác giả: **iriewiew**
- Biểu tượng: [Lucide](https://lucide.dev) (ISC License)
- Ý tưởng công cụ tạo emoji động từ [VRCEmoji](https://github.com/Wakamu/VRCEmoji) của Wakamu. Viết hoàn toàn mới, không dùng chung mã nguồn.
- Tài liệu API: [vrchat.community](https://vrchat.community)
- Ý tưởng lấy cảm hứng từ [VRCX](https://github.com/vrcx-team/VRCX). VRC Nook được viết hoàn toàn mới và không dùng chung mã nguồn.

## Giấy phép

[MIT](LICENSE) © iriewiew

> VRC Nook là công cụ do người hâm mộ làm, không liên kết và không được VRChat Inc. chứng thực.
> Ứng dụng dùng VRChat API, vốn không được hỗ trợ chính thức cho ứng dụng bên thứ ba. Bạn tự chịu rủi ro khi sử dụng và cần tuân thủ Điều khoản dịch vụ của VRChat.
