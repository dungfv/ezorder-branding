# Bước 4 — Tạo CloudFront

Tạo theo thứ tự: **Function → Response headers policy → Distribution → Bucket policy → Error pages**. Function và policy phải có trước để chọn được khi tạo distribution.

## 4.1 CloudFront Function (điều hướng URL)

S3 không tự hiểu `/about/` nghĩa là `/about/index.html`. Function này chạy trước mỗi request và làm 3 việc:
- `www.ezorder.io/...` → 301 sang `https://ezorder.io/...`
- `/about` → 301 sang `/about/` (site dùng URL có dấu `/` cuối)
- `/about/` → đọc file `/about/index.html` (rewrite nội bộ, URL trên trình duyệt không đổi)

**Tạo:**
1. CloudFront → menu trái **Functions** → **Create function**.
2. Name: `ezorder-website-url-rewrite`. Runtime: **cloudfront-js-2.0**. → **Create function**.
3. Tab **Build**: xoá code mẫu, dán đoạn dưới → **Save changes**.
4. Tab **Publish** → **Publish function**. ⚠️ Chưa publish thì distribution không chọn được.

```js
function queryString(request) {
  var parts = [];
  var params = request.querystring;
  for (var key in params) {
    var entry = params[key];
    var values = entry.multiValue ? entry.multiValue : [entry];
    for (var i = 0; i < values.length; i++) {
      parts.push(values[i].value === '' ? key : key + '=' + values[i].value);
    }
  }
  return parts.length ? '?' + parts.join('&') : '';
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : '';
  var uri = request.uri;

  if (host.indexOf('www.') === 0) {
    return redirect('https://' + host.substring(4) + uri + queryString(request));
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') !== -1) {
    return request; // a file: /rss.xml, /_astro/x.css, /pagefind/...
  }
  if (uri.charAt(uri.length - 1) !== '/') {
    return redirect(uri + '/' + queryString(request));
  }
  request.uri = uri + 'index.html';
  return request;
}
```

**Thử (tuỳ chọn):** tab **Test** → Event type: Viewer request → URL path `/about` → **Test function**. Kết quả phải là status **301**, header `location: /about/`. Thử tiếp `/about/`: request URI đổi thành `/about/index.html`.

## 4.2 Response headers policy (header bảo mật)

Thay cho file `_headers` của Cloudflare trước đây.

1. CloudFront → **Policies** → tab **Response headers** → **Create response headers policy**.
2. Name: `ezorder-website-security-headers`.
3. Mục **Security headers**, bật và điền như sau, **tick "Origin override"** cho từng mục:

| Header | Giá trị |
|---|---|
| Strict-Transport-Security | max-age **31536000**; **không** tick includeSubDomains và preload |
| X-Content-Type-Options | bật (nosniff) |
| X-Frame-Options | **DENY** |
| Referrer-Policy | **strict-origin-when-cross-origin** |
| Content-Security-Policy | chuỗi bên dưới (dán thành **một dòng**) |

```
default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self' mailto: https://formspree.io https://api.web3forms.com; frame-ancestors 'none'; base-uri 'self'; object-src 'none'
```

4. Mục **Custom headers** → **Add header** hai lần (tick Origin override):
   - `Permissions-Policy` = `camera=(), microphone=(), geolocation=(), payment=()`
   - `Cross-Origin-Opener-Policy` = `same-origin`
5. **Create**.

> Không bật includeSubDomains cho HSTS: nó sẽ ép mọi subdomain (`app`, `cdn`, `docs`, `mailer`…) phải chạy HTTPS, dễ gây lỗi ngoài ý muốn.

## 4.3 Tạo distribution

CloudFront → **Distributions** → **Create distribution**. Giao diện có thể là wizard nhiều bước hoặc một trang dài; điền đúng các trường sau:

**Origin**
- **Origin domain**: chọn bucket ở bước 3 trong danh sách, dạng `ezorder-website-prod.s3.us-west-1.amazonaws.com`. ⚠️ Không chọn dạng `s3-website-…`.
- **Origin access**: **Origin access control settings (recommended)** → **Create new OAC** → giữ mặc định (Signing behavior: Sign requests) → Create. Nếu wizard mới có lựa chọn "Allow private S3 bucket access to CloudFront", chọn nó.

**Default cache behavior**
- **Viewer protocol policy**: **Redirect HTTP to HTTPS**
- **Allowed HTTP methods**: **GET, HEAD**
- **Compress objects automatically**: **Yes**
- **Cache key and origin requests** → **Cache policy**: **CachingOptimized** (managed). Policy này tuân theo `Cache-Control` mà GitHub Actions gắn cho từng file.
- **Response headers policy**: `ezorder-website-security-headers` (4.2)

**Function associations**
- **Viewer request**: Function type **CloudFront Functions** → chọn `ezorder-website-url-rewrite` (4.1).
- Các dòng khác: No association.

**Web Application Firewall (WAF)**: **Do not enable security protections** (site tĩnh không cần; bật sẽ tốn phí).

**Pricing / Price class**: Nếu console hỏi chọn gói giá cố định (flat-rate plan), chọn **Pay as you go** hoặc gói Free nếu phù hợp nhu cầu. Price class: **Use all edge locations** (hoặc North America, Europe, Asia… để rẻ hơn chút).

**Settings**
- **Alternate domain name (CNAME)**: **Add item** → `ezorder.io`, **Add item** → `www.ezorder.io`
- **Custom SSL certificate**: chọn chứng chỉ ở bước 2. Nếu không thấy, xem [Xử lý lỗi](10-troubleshooting.md#cloudfront).
- **Supported HTTP versions**: tick **HTTP/2** và **HTTP/3**
- **Default root object**: `index.html`
- **IPv6**: On

→ **Create distribution**.

Ghi **Distribution ID** (vd `E1ABCDEF23456`) và **Distribution domain name** (vd `d123abc.cloudfront.net`) vào bảng giá trị.

## 4.4 Cấp quyền cho CloudFront đọc bucket (bucket policy)

Ngay sau khi tạo, console hiện banner "**The S3 bucket policy needs to be updated**" kèm nút **Copy policy**.

1. Bấm **Copy policy**. Nếu lỡ mất banner, dùng mẫu bên dưới và tự thay giá trị.
2. S3 → bucket → tab **Permissions** → **Bucket policy** → **Edit** → dán → **Save changes**.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<BUCKET>/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::<ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>"
        }
      }
    }
  ]
}
```

"Block all public access" vẫn bật. Policy này chỉ cho **đúng distribution của bạn** đọc, không mở public.

## 4.5 Trang lỗi 404

Khi file không tồn tại, S3 (qua OAC) trả **403** chứ không phải 404, nên phải cấu hình cả hai mã.

Distribution → tab **Error pages** → **Create custom error response**, làm **2 lần**:

| HTTP error code | Customize error response | Response page path | HTTP Response code | Error caching minimum TTL |
|---|---|---|---|---|
| 403: Forbidden | Yes | `/404.html` | 404: Not Found | 60 |
| 404: Not Found | Yes | `/404.html` | 404: Not Found | 60 |

## 4.6 Chờ triển khai

Cột **Last modified** hiện "Deploying" trong vài phút, sau đó chuyển sang ngày giờ. Lúc này bucket còn trống nên mở domain sẽ thấy lỗi hoặc 404, điều này bình thường. Bước 7 mới upload nội dung.

➡️ Tiếp theo: [Bước 5 — OIDC Identity Provider](05-github-oidc-provider.md)
