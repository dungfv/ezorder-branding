# Hướng dẫn deploy ezorder.io bằng AWS console

Tài liệu từng bước để đưa website marketing (repo này) lên **AWS S3 + CloudFront**, deploy tự động bằng **GitHub Actions** (xác thực OIDC, không dùng access key), và cho người không biết code sửa bài qua **Pages CMS**. Toàn bộ thao tác AWS làm trên **AWS console**.

> Tên nút/trường trên console giữ nguyên tiếng Anh. Giao diện AWS thay đổi theo thời gian: nếu không thấy đúng vị trí, hãy tìm theo **tên trường**.

## Kiến trúc

```
Người viết bài ─► Pages CMS ─► commit vào GitHub (nhánh main)
                                       │
                     GitHub Actions: npm ci → check → build
                                       │  OIDC → IAM role (credentials tạm 1 giờ)
                     aws s3 sync ──────┴──► tạo CloudFront invalidation
                                                     │
      Route 53 (ALIAS ezorder.io, www) ──► CloudFront ──► S3 bucket (private, OAC)
```

## Thứ tự thực hiện

| # | Bước | Làm ở đâu | Ảnh hưởng site đang chạy? |
|---|---|---|---|
| 1 | [Tạo repo GitHub, push code](01-github-repository.md) | GitHub | Không |
| 2 | [Tạo chứng chỉ TLS (ACM)](02-acm-certificate.md) | AWS + GoDaddy | Không |
| 3 | [Tạo S3 bucket](03-s3-bucket.md) | AWS | Không |
| 4 | [Tạo CloudFront (function, headers, distribution)](04-cloudfront-distribution.md) | AWS | Không |
| 5 | [Tạo OIDC Identity Provider cho GitHub](05-github-oidc-provider.md) | AWS IAM | Không |
| 6 | [Tạo IAM role để deploy](06-iam-deploy-role.md) | AWS IAM | Không |
| 7 | [Khai báo biến GitHub, deploy lần đầu, kiểm tra](07-github-variables-first-deploy.md) | GitHub | Không |
| 8 | [Kết nối Pages CMS](08-pages-cms.md) | Pages CMS | Không |
| 9 | [Chuyển DNS GoDaddy → Route 53](09-dns-route53-cutover.md) | AWS + GoDaddy | **Có, làm cuối cùng, cẩn thận** |
| — | [Xử lý lỗi thường gặp](10-troubleshooting.md) | | |
| — | [Vận hành hằng ngày](11-operations.md) | | |

Bước 1–8 không đụng tới domain thật, có thể làm và thử thoải mái. Chỉ bước 9 mới đưa `ezorder.io` sang hệ thống mới.

## Bảng ghi lại các giá trị (điền dần khi làm)

Không có giá trị nào dưới đây là bí mật, có thể ghi thẳng vào file này.

| Giá trị | Lấy ở bước | Dùng ở bước | Giá trị của bạn |
|---|---|---|---|
| AWS Account ID (12 số) | Góc phải trên console | 4, 6 | |
| Region của bucket (vd `us-west-1`) | 3 | 7 | |
| GitHub repo (`owner/repo`) | 1 | 6 | `dungfv/ezorder-branding` |
| GitHub environment | 7 | 6 | `production` |
| ACM certificate ARN (us-east-1) | 2 | 4 | |
| S3 bucket name | 3 | 4, 6, 7 | |
| CloudFront distribution ID (vd `E1ABC…`) | 4 | 6, 7 | |
| CloudFront domain (vd `d123abc.cloudfront.net`) | 4 | 7, 9 | |
| OIDC provider ARN | 5 | 6 | |
| IAM role ARN | 6 | 7 | |

## Về file CloudFormation trong repo

`infra/cloudformation-website-hosting.yml` tạo **tự động** toàn bộ các tài nguyên ở bước 3–6. Tài liệu này là cách **làm tay** tương đương. Chỉ chọn **một** trong hai cách. Nếu đã làm tay thì **đừng** chạy thêm stack, vì sẽ sinh ra bộ tài nguyên thứ hai (và báo lỗi trùng OIDC provider, trùng domain CloudFront).

Code CloudFront Function và chuỗi CSP trong tài liệu này giống hệt trong template. Nếu sửa một bên, hãy sửa cả bên kia.

## Chi phí ước tính

S3 + CloudFront cho site marketing khoảng vài USD/tháng. Route 53: $0.50/hosted zone/tháng cộng phí query rất nhỏ. ACM, IAM, OIDC: miễn phí. Không bật WAF thì không tốn thêm (WAF khoảng $5+/tháng).
