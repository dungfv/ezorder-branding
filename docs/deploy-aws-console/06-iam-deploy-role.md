# Bước 6 — Tạo IAM role để GitHub Actions deploy

Role gồm hai phần:
- **Trust policy**: *ai* được mượn role. Ở đây là GitHub Actions, đúng repo, đúng nhánh `main`.
- **Permissions policy**: mượn xong được *làm gì*. Ở đây là upload lên bucket và tạo invalidation cho distribution.

## 6.1 Tạo role qua wizard

1. IAM → **Roles** → **Create role**.
2. **Trusted entity type**: **Web identity**.
3. **Identity provider**: `token.actions.githubusercontent.com`.
4. **Audience**: `sts.amazonaws.com`.
5. Các ô GitHub, chỉ điền **tên trơn**:

| Ô | Điền | Đừng điền |
|---|---|---|
| GitHub organization | `uppush` | `https://github.com/uppush`, có dấu cách |
| GitHub repository | `ezorder-website` | `uppush/ezorder-website` |
| GitHub branch | `main` | `refs/heads/main`, `*` |

6. **Next** → trang **Add permissions**: bỏ qua, không chọn gì → **Next**.
7. **Role name**: `ezorder-website-github-deploy`. Description: tuỳ ý.
8. **Create role**.

> Nếu wizard báo lỗi *"Invalid value…"* ở ô Audience: provider đang lưu audience sai, sửa theo [bước 5.3](05-github-oidc-provider.md#53-kiểm-tra-lại-audience). Hoặc dùng cách 6.2.

## 6.2 (Cách thay thế) Tạo bằng Custom trust policy

Dùng khi wizard lỗi. Create role → **Trusted entity type**: **Custom trust policy** → dán JSON ở 6.3 (đã thay giá trị) → Next → bỏ qua permissions → đặt tên → Create role.

## 6.3 Kiểm tra trust policy

Mở role → tab **Trust relationships** → **Edit trust policy**. Nội dung phải như dưới. Wizard có thể tạo `StringLike`; hãy đổi thành **`StringEquals`** để khoá đúng nhánh `main`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:uppush/ezorder-website:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

- `<ACCOUNT_ID>`: 12 số tài khoản AWS.
- `repo:uppush/ezorder-website:...`: đúng `owner/repo` ở bước 1, **phân biệt hoa/thường**.
- **Update policy**.

## 6.4 Gắn quyền deploy (inline policy)

Tab **Permissions** → **Add permissions** → **Create inline policy** → chọn tab **JSON** → dán (thay `<BUCKET>`, `<ACCOUNT_ID>`, `<DISTRIBUTION_ID>`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::<BUCKET>"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::<BUCKET>/*"
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
    }
  ]
}
```

→ **Next** → Policy name: `deploy-site` → **Create policy**.

Lưu ý: dòng đầu là `arn:aws:s3:::<BUCKET>` (**không** có `/*`); dòng thứ hai **có** `/*`. Nhầm hai dòng này sẽ gây `AccessDenied`.

## 6.5 Lấy ARN của role

Đầu trang role có **ARN** dạng `arn:aws:iam::<ACCOUNT_ID>:role/ezorder-website-github-deploy`. Copy vào bảng giá trị.

➡️ Tiếp theo: [Bước 7 — Biến GitHub và deploy lần đầu](07-github-variables-first-deploy.md)
