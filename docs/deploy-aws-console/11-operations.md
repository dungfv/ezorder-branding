# Vận hành hằng ngày

## Đăng hoặc sửa nội dung

- **Người viết bài:** sửa trong Pages CMS → Save → khoảng 3 phút sau lên site.
- **Developer:** commit và push lên `main` → tự deploy. Push nhánh khác hoặc mở PR chỉ build để kiểm tra.
- Theo dõi: GitHub → tab **Actions**.

## Quay lại phiên bản trước (rollback)

Chọn một trong hai:
1. **Revert commit** gây lỗi trên GitHub (trang commit → **Revert**, hoặc `git revert <sha>` rồi push). Workflow sẽ deploy lại bản cũ.
2. **Chạy lại một lần deploy cũ:** Actions → chọn lần chạy thành công trước đó trên `main` → mở job **deploy** → **Re-run this job**. Job dùng lại đúng bản build của lần chạy đó (artifact giữ **7 ngày**). Quá 7 ngày thì chọn **Re-run all jobs** để build lại từ commit cũ.

## Xoá cache CloudFront bằng tay

Thường không cần, vì workflow đã tự làm. Khi cần: CloudFront → distribution → tab **Invalidations** → **Create invalidation** → Object paths: `/*` → **Create**. Miễn phí 1.000 đường dẫn mỗi tháng; `/*` tính là 1.

## Sửa header bảo mật (CSP)

Ví dụ khi thêm Formspree hoặc một công cụ analytics:

1. CloudFront → **Policies** → **Response headers** → `ezorder-website-security-headers` → **Edit**.
2. Sửa **Content-Security-Policy**, ví dụ thêm domain của dịch vụ vào `script-src`, `connect-src` hay `form-action`.
3. **Save changes**. Có hiệu lực sau vài phút, **không cần deploy lại code**.
4. Nhớ sửa cùng chuỗi trong `infra/cloudformation-website-hosting.yml` để hai nơi khớp nhau.
5. Nếu thêm analytics: cập nhật trang `/privacy-policy` (mục 4 hiện ghi không dùng analytics).

## Dọn file cũ trong bucket

Workflow **không xoá** file cũ trong `/_astro/`, vì các trang đang cache trong trình duyệt có thể vẫn trỏ tới chúng. Dung lượng tăng rất chậm. Nếu muốn dọn: xoá thư mục `_astro/` trong S3 console rồi chạy lại workflow để upload lại bản hiện tại.

## Theo dõi chi phí

**Billing and Cost Management** → **Budgets** → tạo budget, ví dụ $10/tháng, có cảnh báo email. Chi phí thường gặp: CloudFront (theo lưu lượng), S3 (rất nhỏ), Route 53 ($0.50/zone).

## Không cần làm

- **Xoay vòng key**: OIDC không có key dài hạn.
- **Gia hạn chứng chỉ**: ACM tự gia hạn, miễn là các bản ghi CNAME xác thực vẫn còn trong DNS.
