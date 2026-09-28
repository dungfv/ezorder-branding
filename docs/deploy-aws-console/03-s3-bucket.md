# Bước 3 — Tạo S3 bucket (private)

Bucket chỉ chứa file build (`dist/`). Người dùng **không** truy cập bucket trực tiếp. Chỉ CloudFront đọc được, qua Origin Access Control ở bước 4.

## 3.1 Tạo bucket

1. AWS console → **S3** → đổi region về nơi bạn muốn, vd `us-west-1` (cùng region với app) → **Create bucket**.
2. **Bucket type**: General purpose.
3. **Bucket name**: tên duy nhất toàn cầu, vd `ezorder-website-prod`.
4. **Object Ownership**: **ACLs disabled (recommended)**.
5. **Block Public Access settings**: giữ **Block all public access** được tick. ⚠️ Không bỏ tick.
6. **Bucket Versioning**: tuỳ chọn. Bật thì có thể khôi phục file cũ, tốn thêm chút dung lượng.
7. **Default encryption**: **SSE-S3** (mặc định).
8. **Create bucket**.

Ghi **tên bucket** và **region** vào bảng giá trị.

## 3.2 Những thứ KHÔNG làm

- **Không** bật **Static website hosting** (tab Properties). CloudFront dùng REST endpoint của bucket kèm OAC; website endpoint không hỗ trợ OAC.
- **Không** tự viết bucket policy lúc này. CloudFront sẽ đưa ra policy chuẩn sau khi tạo distribution (bước 4.4).
- **Không** upload file bằng tay. GitHub Actions sẽ upload.

➡️ Tiếp theo: [Bước 4 — CloudFront](04-cloudfront-distribution.md)
