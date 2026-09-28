# Bước 9 — Chuyển DNS từ GoDaddy sang Route 53

⚠️ **Bước duy nhất ảnh hưởng tới hệ thống đang chạy**: app Shopify (`app.ezorder.io`), CDN, docs và email đều dùng DNS của `ezorder.io`. Làm chậm, đối chiếu kỹ, chọn giờ ít người dùng.

**Vì sao phải chuyển:** domain gốc `ezorder.io` cần bản ghi **ALIAS** trỏ tới CloudFront. GoDaddy DNS không hỗ trợ ALIAS ở domain gốc, còn Route 53 thì có. Domain **vẫn đăng ký ở GoDaddy**, chỉ đổi **nameserver**.

## 9.0 Các bản ghi hiện có (tra ngày 28/09/2026), phải giữ nguyên

| Bản ghi | Trỏ tới | Nếu mất |
|---|---|---|
| `app` CNAME | AWS load balancer của app (k8s) | **App Shopify chết** |
| `cdn` CNAME | CloudFront (ảnh, logo) | Mất logo/ảnh trong app |
| `docs` CNAME | CloudFront | Mất site docs |
| MX `@` | GoDaddy email (secureserver.net) | **Mất email** `@ezorder.io` |
| TXT `@` (SPF) | `v=spf1 include:secureserver.net -all` | Email bị vào spam |
| TXT `_dmarc` | 2 bản ghi (lỗi sẵn) | — (sẽ gộp lại, xem 9.4) |
| Mọi CNAME bắt đầu bằng `_` | Xác thực ACM (site này, app, cdn, docs) | **Chứng chỉ không gia hạn được**, HTTPS hỏng sau vài tháng |
| Các bản ghi email khác (`autodiscover`, `email`, `_sip`…) nếu có | GoDaddy email | Lỗi cấu hình email client |

## 9.1 Chuẩn bị (trước 1 ngày)

1. GoDaddy → `ezorder.io` → **DNS** → mục **DNSSEC**: nếu đang **bật**, **tắt** đi và chờ tắt xong. Chuyển nameserver khi DNSSEC còn bật sẽ làm domain không phân giải được.
2. GoDaddy → DNS → menu **⋯** / **Import/Export** → **Export Zone File**. Lưu file `.txt` này làm bản sao lưu.
3. Hạ **TTL** các bản ghi quan trọng (`app`, `@`, `www`, MX) xuống **600 giây** (hoặc thấp nhất GoDaddy cho phép). Chờ ít nhất bằng TTL cũ (thường 1 giờ) trước khi chuyển.

## 9.2 Tạo hosted zone và import

1. AWS console → **Route 53** → **Hosted zones** → **Create hosted zone**.
   - Domain name: `ezorder.io` · Type: **Public hosted zone** → **Create hosted zone**.
2. Trong hosted zone → **Import zone file** → dán nội dung file export → **Import**.
3. **Đối chiếu từng dòng** giữa file export và danh sách trong Route 53, nhất là mọi bản ghi ở bảng 9.0. Bỏ qua bản ghi **NS** và **SOA** của GoDaddy (Route 53 tự có NS/SOA riêng; đừng sửa chúng).
4. Ghi lại **4 nameserver** Route 53 ở bản ghi **NS** của zone, dạng `ns-123.awsdns-45.com`, `ns-678.awsdns-90.net`…

## 9.3 Trỏ ezorder.io và www tới CloudFront

1. **Xoá** các bản ghi được import cho `ezorder.io` loại A (`3.33.130.190`, `15.197.148.33`, là trang parking của GoDaddy) và `www` loại CNAME. Chúng trùng tên với bản ghi sắp tạo.
2. **Create record**, tạo **4 bản ghi** (mỗi bản ghi: bật **Alias**, **Route traffic to**: *Alias to CloudFront distribution* → chọn distribution ở bước 4):

| Record name | Record type | Alias |
|---|---|---|
| *(để trống)* | A | Yes → CloudFront |
| *(để trống)* | AAAA | Yes → CloudFront |
| `www` | A | Yes → CloudFront |
| `www` | AAAA | Yes → CloudFront |

Nếu distribution không có trong danh sách: kiểm tra đã thêm `ezorder.io` và `www.ezorder.io` vào **Alternate domain names** ở bước 4.3 chưa.

## 9.4 Sửa DMARC

Hiện có **2** bản ghi TXT ở `_dmarc`, và điều này làm DMARC vô hiệu. Giữ **một**:

```
v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;
```

Xoá bản ghi còn lại (`v=DMARC1; p=none;`). Nếu không chắc về chính sách email, hỏi người quản lý email trước khi đổi.

## 9.5 Đổi nameserver ở GoDaddy

1. GoDaddy → **My Products** → `ezorder.io` → **Domain Settings** (hoặc DNS) → **Nameservers** → **Change nameservers**.
2. Chọn **I'll use my own nameservers** → nhập **4 nameserver Route 53** (bỏ dấu chấm cuối nếu có) → **Save** → xác nhận cảnh báo.
3. Thời gian lan truyền: thường 1–4 giờ, tối đa 48 giờ. Trong lúc này một số người vẫn thấy site cũ, điều này bình thường.

## 9.6 Kiểm tra sau khi chuyển

| Kiểm tra | Kết quả đúng |
|---|---|
| Mở app EZ Order Printer trong Shopify admin | Hoạt động bình thường |
| Gửi email tới `support@ezorder.io` | Nhận được |
| `https://ezorder.io/` | Site mới |
| `https://www.ezorder.io/pricing/` | Chuyển sang `https://ezorder.io/pricing/` |
| `https://ezorder.io/faq/` | Trang FAQ (link từ màn hình xác thực email trong app) |
| Ảnh/logo trong app (`cdn.ezorder.io`) | Hiển thị |

Kiểm tra từ nhiều nơi: [dnschecker.org](https://dnschecker.org) → nhập `ezorder.io`, loại NS/A.

## 9.7 Sau khi ổn định

1. **Google Search Console** → Add property → **Domain** `ezorder.io` → thêm bản ghi TXT xác minh vào Route 53 → Verify → mục **Sitemaps** → gửi `https://ezorder.io/sitemap-index.xml`.
2. Tăng TTL trở lại (vd 3600) cho các bản ghi đã hạ ở 9.1.
3. Đo tốc độ: [PageSpeed Insights](https://pagespeed.web.dev/) với `https://ezorder.io/`.

## Lưu ý về SES (`mailer.ezorder.io`)

Nếu đang cấu hình SES gửi mail từ `mailer.ezorder.io`, thêm các bản ghi DKIM/SPF của SES vào **nơi đang quản lý DNS thật tại thời điểm đó**: GoDaddy trước khi đổi nameserver, Route 53 sau khi đổi. Đừng làm hai việc xen kẽ nhau.

## Nếu có sự cố: quay lại

GoDaddy → Nameservers → **Default (GoDaddy nameservers)**. Các bản ghi cũ vẫn còn ở GoDaddy nên mọi thứ trở lại như trước sau khi lan truyền. Vì vậy **đừng xoá bản ghi ở GoDaddy** cho đến khi Route 53 chạy ổn định vài tuần.

➡️ Xem thêm: [Xử lý lỗi](10-troubleshooting.md) · [Vận hành](11-operations.md)
