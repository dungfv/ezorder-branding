# Xử lý lỗi thường gặp

## IAM / OIDC

| Thông báo | Nguyên nhân | Cách sửa |
|---|---|---|
| Tạo role: *"Invalid value. This field can only contain alphanumeric characters, or any of the following: _+=,.@:-/"* | Audience của provider (hoặc ô GitHub org/repo/branch) có backtick, dấu nháy, khoảng trắng hay `*` do copy-paste | Sửa Audience theo [5.3](05-github-oidc-provider.md#53-kiểm-tra-lại-audience); gõ tay các ô GitHub. Hoặc tạo role bằng **Custom trust policy** ([6.2](06-iam-deploy-role.md#62-cách-thay-thế-tạo-bằng-custom-trust-policy)) |
| Tạo provider: *"Provider with url … already exists"* | Tài khoản đã có provider GitHub | Dùng provider có sẵn, không tạo mới |
| Actions: *"Not authorized to perform sts:AssumeRoleWithWebIdentity"* | `sub` trong trust policy không khớp: sai `owner/repo`, sai hoa/thường, sai nhánh, hoặc chạy từ nhánh khác `main` | Sửa trust policy ([6.3](06-iam-deploy-role.md#63-kiểm-tra-trust-policy)) cho đúng `repo:<owner>/<repo>:ref:refs/heads/main` |
| Như trên, và job có dòng `environment:` | Khi job dùng environment, `sub` thành `repo:<owner>/<repo>:environment:<tên>` | Bỏ `environment` trong workflow, hoặc đổi `sub` cho khớp |
| Actions: *"Credentials could not be loaded"* / *"Could not load credentials from any providers"* | Job thiếu quyền `id-token: write`, hoặc biến `AWS_DEPLOY_ROLE_ARN` trống/sai tên | Giữ `id-token: write` trong job deploy; kiểm tra tab **Variables** |
| Actions: *"No OpenIDConnect provider found in your account for https://token.actions.githubusercontent.com"* | Chưa tạo provider, hoặc ARN provider trong trust policy sai | Kiểm tra IAM → Identity providers và dòng `Federated` |
| Actions: *"Incorrect token audience"* | Audience của provider không phải `sts.amazonaws.com` | Sửa Audience (5.3) |

## Upload S3 / invalidation

| Thông báo | Nguyên nhân | Cách sửa |
|---|---|---|
| `An error occurred (AccessDenied) when calling the ListObjectsV2 operation` | Inline policy thiếu `s3:ListBucket` trên `arn:aws:s3:::<BUCKET>` (không có `/*`) | Sửa policy ([6.4](06-iam-deploy-role.md#64-gắn-quyền-deploy-inline-policy)) |
| `AccessDenied … PutObject` / `DeleteObject` | Thiếu `/*` ở resource thứ hai, hoặc sai tên bucket | Sửa policy |
| `NoSuchBucket` | Biến `S3_BUCKET` sai | Chỉ ghi tên bucket, không có `s3://` hay dấu `/` |
| `AccessDenied … CreateInvalidation` / `NoSuchDistribution` | Sai Distribution ID trong policy hoặc biến | Đối chiếu ID ở CloudFront → Distributions |
| Job deploy không chạy | Push từ nhánh khác `main`, hoặc là PR | Đúng thiết kế: chỉ push lên `main` mới deploy |

## CloudFront

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Không thấy chứng chỉ trong **Custom SSL certificate** | Chứng chỉ không ở **us-east-1**, chưa **Issued**, hoặc không có đủ `ezorder.io` + `www.ezorder.io` | Tạo lại đúng region; chờ Issued |
| Lỗi *"CNAMEAlreadyExists"* khi thêm alternate domain | Domain đang được gắn ở một distribution khác (có thể của tài khoản khác) | Gỡ khỏi distribution cũ, hoặc liên hệ AWS Support |
| Mọi trang đều ra **AccessDenied** XML | Chưa dán bucket policy (4.4), hoặc distribution chưa gắn OAC | Làm lại 4.4; kiểm tra tab Origins → Origin access = OAC |
| Trang chủ được nhưng `/about/` ra 403 hoặc 404 | Function chưa **Publish** hoặc chưa gắn vào **Viewer request** | CloudFront → Functions → Publish; Distribution → Behaviors → Edit → Function associations |
| URL sai hiện lỗi XML thay vì trang 404 đẹp | Chưa tạo Error pages 403/404 (4.5) | Tạo 2 custom error response |
| Deploy xong nhưng vẫn thấy nội dung cũ | Invalidation chưa xong (1–2 phút), hoặc trình duyệt cache | Chờ; tải lại bằng Cmd/Ctrl+Shift+R; xem tab **Invalidations** |
| Ảnh không hiện, DevTools báo `content-type: application/octet-stream` | Upload tay bằng console, không qua workflow (thiếu content-type) | Chỉ deploy qua workflow; hoặc chạy lại workflow |
| Console DevTools báo *"Refused to … because it violates the Content Security Policy"* | Thêm script/dịch vụ bên ngoài mà CSP chưa cho phép | Sửa CSP trong response headers policy ([Vận hành](11-operations.md#sửa-header-bảo-mật-csp)) |

## Pages CMS / build

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Bấm Save báo lỗi push / protected branch | `main` đang bật "Require a pull request" | Tắt rule đó ([1.3](01-github-repository.md#13-cấu-hình-nhánh-main)) |
| Save được nhưng site không đổi, job **build** đỏ | Nội dung vi phạm schema: tiêu đề hơn 120 ký tự, cover thiếu alt, tag không phải chữ Latin, bảng giá thiếu giá trị… | Mở log job build: thông báo lỗi ghi rõ file và trường; sửa lại trong CMS |
| Bài đã lưu nhưng không hiện | Đang tick **Draft** | Bỏ tick Draft |

## DNS

| Hiện tượng | Nguyên nhân | Cách sửa |
|---|---|---|
| Sau khi đổi nameserver, domain không phân giải | DNSSEC còn bật ở GoDaddy | Tắt DNSSEC; hoặc tạm quay về nameserver GoDaddy |
| App/email hỏng sau khi đổi | Thiếu bản ghi khi import | So file export với Route 53, thêm bản ghi thiếu (xem bảng 9.0) |
| Một số người vẫn thấy site cũ | Đang lan truyền DNS / TTL cũ | Chờ tối đa 48 giờ |
