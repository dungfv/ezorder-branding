# Bước 1 — Tạo repo GitHub và push code

## 1.1 Tạo repo

1. github.com → **New repository**.
2. Owner: tổ chức của bạn (vd `uppush`). Repository name: vd `ezorder-website`.
3. Visibility: **Private** (Pages CMS và GitHub Actions đều chạy với repo private).
4. **Không** tick "Add a README", ".gitignore", "license" (repo local đã có sẵn).
5. **Create repository**.

Ghi `owner/repo` (vd `uppush/ezorder-website`) vào bảng giá trị. Viết **đúng chữ hoa/thường**, vì IAM role ở bước 6 so khớp chính xác chuỗi này.

## 1.2 Push code từ máy

```bash
cd ~/code/ezorder-workspace/ezorder-branding
git remote add origin git@github.com:<owner>/<repo>.git
git push -u origin main
```

Sau khi push, tab **Actions** sẽ chạy workflow **Build and deploy**:
- Job **build** phải xanh.
- Job **deploy** sẽ **đỏ** vì chưa cấu hình AWS. Điều này bình thường, đến bước 7 sẽ xanh.

## 1.3 Cấu hình nhánh `main`

Settings → **Rules → Rulesets** (hoặc Branches → Branch protection rules) → tạo rule cho `main`:

| Tuỳ chọn | Đặt | Lý do |
|---|---|---|
| Block force pushes | Bật | Tránh mất lịch sử |
| Restrict deletions | Bật | Tránh xoá nhầm nhánh |
| Require a pull request before merging | **Tắt** | Pages CMS commit thẳng vào `main`; bật lên thì CMS không lưu được |
| Require status checks | Tuỳ chọn | Không bắt buộc |

## 1.4 Kiểm tra quyền Actions

Settings → **Actions → General**:
- Actions permissions: **Allow all actions** (hoặc ít nhất cho phép `actions/*` và `aws-actions/*`).
- Workflow permissions: để mặc định **Read repository contents**. Workflow tự khai báo quyền `id-token: write` cho riêng job deploy.

➡️ Tiếp theo: [Bước 2 — Chứng chỉ ACM](02-acm-certificate.md)
