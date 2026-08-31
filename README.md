# 模擬試験システム

## Có gì trong bản này
- Link học sinh: `index.html`
- Link quản lý: `admin.html`
- Học sinh nhập `企業名` + `氏名`
- Chọn đề đã được Admin Publish
- Mặc định 70 phút
- Hết giờ tự khóa và tự nộp, không làm tiếp được
- Học sinh chỉ xem kết quả cơ bản: tổng điểm, đỗ/trượt, đúng/tổng và % từng phần
- Không hiện đáp án đúng cho học sinh
- Admin xem toàn bộ kết quả
- Admin lọc theo doanh nghiệp / tên học sinh / đỗ-trượt
- Admin xem từng phần: ví dụ `衛生管理 8/10 = 80%`
- Tự liệt kê phần dưới 70% vào `重点復習`
- Admin xuất CSV
- Admin upload đề mới bằng CSV
- Admin Publish / Unpublish / Delete đề
- Có thể quản lý nhiều đề, không cần sửa code mỗi lần thêm đề

## Các file cần upload GitHub
- index.html
- admin.html
- style.css
- config.js
- student.js
- admin.js

## Bước 1: Tạo Google Sheet backend
1. Tạo một Google Sheet mới.
2. Mở `Extensions -> Apps Script`.
3. Xóa code mẫu và dán toàn bộ nội dung `apps-script.gs`.
4. Save.
5. Chạy hàm `setupCBT()` một lần và cấp quyền.
6. Trong hàm `setAdminPassword()`, đổi `CHANGE_ME_1234` thành mật khẩu bạn muốn.
7. Chạy `setAdminPassword()` một lần.

## Bước 2: Deploy Apps Script
1. `Deploy -> New deployment`.
2. Type: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Deploy.
6. Copy URL dạng `https://script.google.com/macros/s/.../exec`.

## Bước 3: Dán URL backend vào website
Mở `config.js` và dán URL:
```js
apiUrl: "https://script.google.com/macros/s/.../exec",
```
Sau đó upload file lên GitHub và commit.

## Link sử dụng
- Học sinh:
  `https://TEN-GITHUB.github.io/TEN-REPO/`
- Admin:
  `https://TEN-GITHUB.github.io/TEN-REPO/admin.html`

## Upload đề
Admin -> `新しい試験を追加` -> chọn CSV.

File CSV dùng đúng cột:
`No,Category,Question,A,B,C,D,Correct,Explanation`

Correct = A/B/C/D.

Có file mẫu: `exam-template.csv`.

### Ví dụ chia phần
Bạn có thể xếp:
- Câu 1–10: 衛生管理
- Câu 11–20: HACCP
- Câu 21–30: 食中毒
- Câu 31–40: 異物混入
- Câu 41–55: 安全管理

Hệ thống KHÔNG phụ thuộc vào số câu cố định. Nó tính theo `Category`, nên nếu sau này đổi số lượng câu từng phần vẫn tự tính đúng.

## Lưu ý bảo mật
Admin được bảo vệ bằng mật khẩu kiểm tra ở Google Apps Script. Học sinh không có link/mật khẩu admin thì chỉ dùng được trang thi. Với hệ thống nội bộ lớp học/doanh nghiệp nhỏ, cách này thực dụng và dễ vận hành.


## Bản nhận diện AIDEM / アイデムグローバル / TEAM アイトク
- Header hiển thị theo thứ tự: AIDEM → アイデムグローバル → TEAM アイトク.
- Các hình character người dùng cung cấp được đóng gói trong thư mục `assets/`.
- Character được dùng ở trang chọn đề, sidebar khi thi và trang kết quả.
- Admin page cũng dùng cùng bộ nhận diện.
- Khi upload lên GitHub, nhớ upload nguyên thư mục `assets` cùng các file HTML/CSS/JS.


# FINAL版
- 表示言語：日本語
- ヘッダー：AIDEM → アイデムグローバル → アイトク
- 「TEAM」表記なし
- アイデムグローバル・アイトクはユーザー提供の原本画像を使用
- キャラクターはユーザー提供の原本PNGをそのまま使用（再生成なし）
- 受験時間：70分、時間切れで自動提出
- 学生：企業名・氏名を入力、公開中の試験のみ受験、基本結果のみ閲覧
- 管理者：結果管理、分野別正答率、重点復習、CSV出力、試験追加・公開/非公開
