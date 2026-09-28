# Bước 6 — Tạo IAM role để GitHub Actions deploy

Role gồm hai phần:
- **Trust policy**: *ai* được mượn role. Ở đây là job GitHub Actions của đúng repo, chạy trong environment `production`.
- **Permissions policy**: mượn xong được *làm gì*. Ở đây là upload lên bucket và tạo invalidation cho distribution.

## 6.1 Tạo role qua wizard

1. IAM → **Roles** → **Create role**.
2. **Trusted entity type**: **Web identity**.
3. **Identity provider**: `token.actions.githubusercontent.com`.
4. **Audience**: `sts.amazonaws.com`.
5. Các ô GitHub, chỉ điền **tên trơn**:

| Ô | Điền | Đừng điền |
|---|---|---|
| GitHub organization | `dungfv` | `https://github.com/dungfv`, có dấu cách |
| GitHub repository | `ezorder-branding` | `dungfv/ezorder-branding` |
| GitHub branch | `main` | `refs/heads/main`, `*` |

> Wizard sinh `sub` theo **nhánh** (`…:ref:refs/heads/main`). Workflow của ta chạy job deploy trong **environment** `production`, nên sau khi tạo xong **bắt buộc** sửa `sub` ở bước 6.3.

6. **Next** → trang **Add permissions**: bỏ qua, không chọn gì → **Next**.
7. **Role name**: `ezorder-website-github-deploy`. Description: tuỳ ý.
8. **Create role**.

> Nếu wizard báo lỗi *"Invalid value…"* ở ô Audience: provider đang lưu audience sai, sửa theo [bước 5.3](05-github-oidc-provider.md#53-kiểm-tra-lại-audience). Hoặc dùng cách 6.2.

## 6.2 (Cách thay thế) Tạo bằng Custom trust policy

Dùng khi wizard lỗi. Create role → **Trusted entity type**: **Custom trust policy** → dán JSON ở 6.3 (đã thay giá trị) → Next → bỏ qua permissions → đặt tên → Create role.

## 6.3 Kiểm tra trust policy

Mở role → tab **Trust relationships** → **Edit trust policy**. Nội dung phải **đúng như dưới**. Wizard tạo `sub` dạng `ref:refs/heads/main` và có thể dùng `StringLike`; hãy sửa `sub` thành dạng **environment** và dùng **`StringEquals`**:

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
          "token.actions.githubusercontent.com:sub": "repo:dungfv@22865175/ezorder-branding@1392203605:environment:production"
        }
      }
    }
  ]
}
```

- `<ACCOUNT_ID>`: 12 số tài khoản AWS.
- `sub` phải **giống hệt** giá trị GitHub gửi, phân biệt hoa thường. GitHub hiện dùng định dạng **có kèm ID**: `repo:<owner>@<owner_id>/<repo>@<repo_id>:environment:<environment>`. Với repo này là `repo:dungfv@22865175/ezorder-branding@1392203605:environment:production` (đã xác minh từ token thật ngày 28/09/2026). Repo tạo từ lâu có thể vẫn dùng định dạng cũ `repo:<owner>/<repo>:environment:<environment>`.
- ID không đổi khi đổi tên repo, và repo tạo lại với tên cũ sẽ có ID khác, nên định dạng này an toàn hơn. Nếu **tạo repo mới** (hoặc xoá rồi tạo lại) thì `repo_id` đổi, phải cập nhật trust policy.
- Không chắc `sub` là gì: xem mục 6.6.
- Vì sao là `environment:production` chứ không phải `ref:refs/heads/main`: khi job có dòng `environment: production`, GitHub gửi `sub` theo environment. Giới hạn "chỉ nhánh `main`" được đặt ở phía GitHub (Deployment branches của environment, bước 7.1).
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

## 6.6 Xem `sub` thật mà GitHub gửi

Cách chắc chắn nhất khi `Not authorized to perform sts:AssumeRoleWithWebIdentity`: in claim của token ngay trong job deploy. Thêm bước này **trước** `aws-actions/configure-aws-credentials` (job phải có `id-token: write` và `environment: production`); bước này chỉ in phần nội dung đã giải mã, không in token:

```yaml
      - name: Debug OIDC claims (temporary)
        run: |
          curl -sSf -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com" \
          | node -e "
              const { value } = JSON.parse(require('fs').readFileSync(0, 'utf8'));
              const c = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString());
              console.log(JSON.stringify({ sub: c.sub, aud: c.aud, environment: c.environment }, null, 2));
            "
```

Copy nguyên giá trị `sub` in ra rồi dán vào trust policy (6.3). Deploy chạy được thì gỡ bước này đi.

Cách không cần sửa code: CloudTrail → Event history (region = `AWS_REGION`) → Event name `AssumeRoleWithWebIdentity` → sự kiện lỗi `AccessDenied` → trường `userIdentity.userName`. Sự kiện có thể trễ 5–15 phút.

➡️ Tiếp theo: [Bước 7 — Biến GitHub và deploy lần đầu](07-github-variables-first-deploy.md)
