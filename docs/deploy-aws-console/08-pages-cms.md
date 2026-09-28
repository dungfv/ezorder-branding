# Bước 8 — Kết nối Pages CMS

Pages CMS là giao diện web để sửa nội dung. Mỗi lần bấm **Save** là một commit vào GitHub; commit lên `main` sẽ kích hoạt deploy (bước 7). Cấu hình CMS nằm ở file `.pages.yml` trong repo, không cần làm gì thêm trong code.

## 8.1 Kết nối repo

1. Mở [app.pagescms.org](https://app.pagescms.org) → **Sign in with GitHub**.
2. Cài **Pages CMS GitHub App**: chọn tổ chức (vd `uppush`) → **Only select repositories** → chọn đúng repo website → **Install**. Chỉ cấp quyền cho repo này, không chọn "All repositories".
3. Quay lại Pages CMS → chọn repo → nhánh `main`.
4. Menu trái sẽ có: **Blog**, **Pricing**, **Site settings**.

## 8.2 Mời người viết bài

Trong Pages CMS, mục **Collaborators** (hoặc Settings của project) → mời bằng **email**. Người được mời đăng nhập bằng link gửi qua email, **không cần tài khoản GitHub**.

## 8.3 Thử một lần trên nhánh riêng (nên làm trước khi giao cho người khác)

1. Trong Pages CMS, đổi nhánh → tạo nhánh mới `cms-test`.
2. **Blog** → mở một bài → sửa một câu, upload một **Cover image** mới, điền **Alt text** → **Save**.
3. Mở một bài cũ khác (vd bài EU VAT có bảng) → **Save** không sửa gì → xem trên GitHub commit đó có làm hỏng bảng hay blockquote không.
4. GitHub → tab **Actions**: workflow của nhánh `cms-test` chỉ **build** (không deploy). Nếu **xanh** thì nội dung hợp lệ.
5. GitHub → tạo Pull Request `cms-test` → `main` → merge (hoặc đóng nếu chỉ thử) → xoá nhánh.

## 8.4 Quy tắc cho người viết bài

- **Draft (hidden from the live site)**: tick khi chưa muốn đăng. Bài vẫn được lưu nhưng không xuất hiện trên site, RSS hay sitemap.
- **Title** tối đa 120 ký tự, **Description** tối đa 220 ký tự. Vượt quá thì build lỗi.
- **Cover image**: nên dùng ảnh 1200×630. Ảnh này cũng là ảnh khi chia sẻ lên mạng xã hội. Nếu có cover thì **bắt buộc** điền Alt text.
- **Tags**: dùng chữ Latin (tiếng Anh). Tag chỉ có ký tự không phải Latin sẽ làm build lỗi.
- **Pricing**: giá phải khớp với listing trên Shopify App Store. Bảng so sánh: mỗi dòng phải có số giá trị bằng số gói.
- Sau khi Save trên `main`: khoảng 3 phút sau site cập nhật. Nếu không thấy, xem tab Actions trên GitHub.

➡️ Tiếp theo: [Bước 9 — Chuyển DNS](09-dns-route53-cutover.md)
