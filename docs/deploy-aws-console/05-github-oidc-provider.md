# Bước 5 — Tạo OIDC Identity Provider cho GitHub

## OIDC là gì (đọc 1 lần cho hiểu)

Thay vì lưu access key dài hạn trên GitHub, ta cấu hình AWS để **tin các token do GitHub ký**:

```
1. Job deploy chạy  → GitHub cấp cho job một token (JWT) đã ký, ghi rõ:
                      "tôi là repo dungfv/ezorder-branding, environment production"
2. Action aws-actions/configure-aws-credentials gửi token + ARN role lên AWS STS
3. AWS kiểm tra: chữ ký có đúng của GitHub không (nhờ Identity Provider ở bước này)
                 repo/nhánh có khớp trust policy của role không (bước 6)
4. Khớp → AWS trả credentials tạm thời (hết hạn sau ~1 giờ) → aws s3 sync chạy
```

Lợi ích: không có secret nào trên GitHub để lộ, không phải xoay vòng key. Role chỉ dùng được từ **đúng repo, đúng environment `production`** (environment này chỉ cho nhánh `main` deploy).

**Identity Provider** là bước "cho AWS biết cần tin `token.actions.githubusercontent.com`". Mỗi tài khoản AWS chỉ có **một** provider này, dùng chung cho mọi repo GitHub.

## 5.1 Kiểm tra đã có chưa

IAM → menu trái **Identity providers**. Nếu đã có dòng `token.actions.githubusercontent.com`:
- **Không tạo mới.** Mở nó ra, kiểm tra mục **Audiences** có đúng `sts.amazonaws.com` (xem 5.3), copy **ARN**, rồi sang bước 6.

## 5.2 Tạo provider

1. IAM → **Identity providers** → **Add provider**.
2. **Provider type**: **OpenID Connect**.
3. **Provider URL**: `https://token.actions.githubusercontent.com`
4. **Audience**: `sts.amazonaws.com`
5. Nếu có nút **Get thumbprint**, bấm (console mới có thể không có nút này; không sao).
6. **Add provider**.

> ⚠️ **Gõ tay** Provider URL và Audience, đừng copy từ tài liệu hoặc chat. Copy dễ dính dấu backtick `` ` ``, dấu nháy hoặc khoảng trắng. Lúc tạo provider AWS vẫn chấp nhận, nhưng đến bước tạo role sẽ báo lỗi *"Invalid value. This field can only contain alphanumeric characters…"*.

## 5.3 Kiểm tra lại Audience

Mở provider vừa tạo → mục **Audiences** phải có đúng một dòng: `sts.amazonaws.com`. Không có dấu nháy, không có backtick, không có khoảng trắng ở đầu hoặc cuối.

Nếu sai:
1. **Actions → Add audience** → gõ tay `sts.amazonaws.com` → Add.
2. Chọn dòng sai → **Actions → Remove audience**.

Copy **ARN** của provider (dạng `arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com`) vào bảng giá trị.

➡️ Tiếp theo: [Bước 6 — IAM role](06-iam-deploy-role.md)
