# Bước 7 — Khai báo biến trên GitHub, deploy lần đầu, kiểm tra

## 7.1 Tạo environment `production` và thêm 4 biến

Các biến deploy nằm trong **environment** `production`. Chỉ job có dòng `environment: production` (job `deploy` trong workflow) mới đọc được chúng.

**Tạo environment:**
1. Repo GitHub → **Settings** → **Environments** → **New environment** → Name: `production` (chữ thường, đúng chính tả) → **Configure environment**.
2. Mục **Deployment branches and tags** → chọn **Selected branches and tags** → **Add deployment branch or tag rule** → nhập `main` → **Add rule**. ⚠️ Bước này thay cho giới hạn nhánh trong trust policy: thiếu nó thì workflow từ nhánh khác cũng mượn được role AWS.
3. (Tuỳ chọn) **Required reviewers**: bật nếu muốn có người duyệt trước mỗi lần deploy. Lưu ý: bật thì bài lưu từ Pages CMS cũng phải chờ duyệt mới lên site.

**Thêm biến:** vẫn trong trang environment `production` → mục **Environment variables** → **Add environment variable** (⚠️ không phải Environment secrets):

| Name | Value (từ bảng giá trị) |
|---|---|
| `AWS_REGION` | region của bucket, vd `us-west-1` |
| `AWS_DEPLOY_ROLE_ARN` | ARN role ở bước 6, vd `arn:aws:iam::123456789012:role/ezorder-website-github-deploy` |
| `S3_BUCKET` | tên bucket, vd `ezorder-website-prod` (chỉ tên, không có `s3://`) |
| `CLOUDFRONT_DISTRIBUTION_ID` | vd `E1ABCDEF23456` |

Không giá trị nào là bí mật, nên dùng **Variables**. Tên biến phải **đúng từng ký tự** như trên, vì workflow đọc `vars.AWS_REGION`, `vars.S3_BUCKET`…

Nếu trước đó đã tạo biến trùng tên ở mức repository (tab Variables của *Secrets and variables → Actions*), hãy xoá đi để khỏi nhầm; biến của environment sẽ được ưu tiên.

## 7.2 Chạy deploy

Tab **Actions** → workflow **Build and deploy** → **Run workflow** → Branch: `main` → **Run workflow**.

Workflow (`.github/workflows/build-and-deploy.yml`) làm:
1. **build**: `npm ci` → `npm run check` → `npm run build` (Astro + index Pagefind).
2. **deploy** (chỉ khi push lên `main`, chạy trong environment `production`):
   - Đăng nhập AWS bằng OIDC. Log bước *Configure AWS Credentials* sẽ hiện `Authenticated as assumedRoleId …`.
   - Upload `/_astro/*` trước với `Cache-Control: public,max-age=31536000,immutable` (file có hash trong tên, không bao giờ đổi).
   - Upload trang HTML, RSS, sitemap, Pagefind với `max-age=0, s-maxage=31536000`: trình duyệt luôn hỏi lại, CloudFront giữ cache đến lần deploy sau. Xoá khỏi bucket các trang đã bị xoá khỏi site.
   - Tạo invalidation `/*` để CloudFront lấy bản mới.

Mất khoảng 2–4 phút. Job đỏ thì xem [Xử lý lỗi](10-troubleshooting.md).

## 7.3 Kiểm tra trên domain CloudFront

Dùng **Distribution domain name** (vd `https://d123abc.cloudfront.net`). DNS thật chưa đổi nên `ezorder.io` vẫn là trang cũ.

| Kiểm tra | Kết quả đúng |
|---|---|
| Mở `https://d123abc.cloudfront.net/` | Trang chủ hiển thị đủ ảnh, font |
| Mở `/about` | Tự chuyển sang `/about/` |
| Mở `/khong-ton-tai/` | Trang 404 của site |
| Trang `/blog/`, gõ "peppol" vào ô tìm kiếm | Có kết quả |
| Trình duyệt → DevTools → Console | Không có lỗi đỏ (CSP) |
| DevTools → Network → chọn trang HTML → Response Headers | Có `content-security-policy`, `strict-transport-security`, `x-frame-options: DENY` |
| Chọn một file `/_astro/….css` | `cache-control: public,max-age=31536000,immutable` |

Hoặc dùng terminal:

```bash
curl -sI https://d123abc.cloudfront.net/about        # 301, location: /about/
curl -sI https://d123abc.cloudfront.net/nope/        # 404
curl -sI https://d123abc.cloudfront.net/ | grep -i -E "content-security|strict-transport"
```

## 7.4 Từ giờ trở đi

Mỗi lần có commit lên `main` (push từ máy hoặc lưu trong Pages CMS), site tự deploy. Push nhánh khác hoặc mở PR chỉ **build để kiểm tra**, không deploy.

➡️ Tiếp theo: [Bước 8 — Pages CMS](08-pages-cms.md)
