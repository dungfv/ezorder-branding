# Bước 2 — Tạo chứng chỉ TLS bằng ACM

CloudFront chỉ nhận chứng chỉ nằm ở region **US East (N. Virginia) — us-east-1**, dù bucket và mọi thứ khác ở region nào.

## 2.1 Yêu cầu chứng chỉ

1. AWS console → **Certificate Manager**.
2. Góc phải trên, đổi region sang **US East (N. Virginia)**. ⚠️ Bước hay quên nhất.
3. **Request** → **Request a public certificate** → Next.
4. **Fully qualified domain name**: `ezorder.io` → **Add another name to this certificate** → `www.ezorder.io`.
5. **Validation method**: **DNS validation**.
6. **Key algorithm**: RSA 2048 (mặc định).
7. **Request**.

## 2.2 Thêm bản ghi xác thực vào GoDaddy

DNS của `ezorder.io` hiện vẫn ở GoDaddy, nên bản ghi xác thực được thêm ở GoDaddy.

1. Mở chứng chỉ vừa tạo → mục **Domains**: mỗi domain có một **CNAME name** và **CNAME value**. Thường cả hai domain dùng chung một cặp.
2. GoDaddy → **My Products** → `ezorder.io` → **DNS** → **Add New Record**:
   - Type: **CNAME**
   - Name: phần **trước** `.ezorder.io` của CNAME name. Ví dụ CNAME name là `_3f2a…9c.ezorder.io.` thì chỉ nhập `_3f2a…9c` (GoDaddy tự thêm đuôi domain).
   - Value: nguyên CNAME value, dạng `_7b1d…e4.xxxx.acm-validations.aws.` (dấu chấm cuối có hay không đều được).
   - TTL: mặc định.
3. **Save**. Nếu hai domain có CNAME khác nhau, thêm cả hai.

> Copy bằng nút copy của console và dán vào **Notepad/TextEdit ở chế độ text thuần** trước, để không dính khoảng trắng hay ký tự lạ.

## 2.3 Chờ cấp chứng chỉ

Trạng thái chuyển từ **Pending validation** sang **Issued**, thường sau 5–30 phút. Copy **ARN** (dạng `arn:aws:acm:us-east-1:<account>:certificate/…`) vào bảng giá trị.

**Giữ các bản ghi CNAME này mãi mãi.** ACM dùng chúng để tự gia hạn chứng chỉ hằng năm. Khi chuyển DNS sang Route 53 (bước 9) phải có mặt chúng ở đó.

➡️ Tiếp theo: [Bước 3 — S3 bucket](03-s3-bucket.md)
