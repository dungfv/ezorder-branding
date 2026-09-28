# Brief: Website giới thiệu sản phẩm EZ Order Printer

> Giao cho Claude Code. Đọc toàn bộ brief trước khi bắt đầu. Những mục đánh dấu `TODO` là thông tin chưa có: dùng placeholder hợp lý, gom lại và liệt kê trong README.

## 1. Bối cảnh

EZ Order Printer là một ứng dụng Shopify để tạo, in, tải và gửi email các loại hóa đơn. Cần xây một website marketing **nhẹ, nhanh, chuẩn SEO, đẹp mắt** để giới thiệu sản phẩm và dẫn người dùng về trang cài đặt trên Shopify App Store.

Tính năng sản phẩm (dùng làm nội dung cho trang chủ):
- Quản lý templates hóa đơn
- Các loại chứng từ: Invoice/Receipt, Packing slip, Return, Refund/Credit note, Draft order
- Render và in hóa đơn; tải về dạng PDF
- Gửi email cho orders/draft orders kèm file PDF
- Gửi email tự động theo webhook Shopify (có cấu hình)
- Đa tiền tệ, đa ngôn ngữ
- Khách hàng tải hóa đơn ngay trên online store
- In trực tiếp trong Shopify admin
- In và tải trong Shopify POS
- (Định hướng) Tuân thủ hóa đơn EU và e-invoicing/Peppol: chỉ nhắc như roadmap, không hứa là đã có

## 2. Tech stack (đã chốt)

| Hạng mục | Lựa chọn |
|---|---|
| Framework | **Astro** (bản ổn định mới nhất), output **static** |
| CSS | **Tailwind CSS** |
| Nội dung blog | **Astro Content Collections**, Markdown/MDX, có schema frontmatter |
| CMS | **Pages CMS** (app.pagescms.org), cấu hình bằng `.pages.yml` ở root repo |
| Repo | **GitHub** |
| Hosting | **Cloudflare Pages** (Git integration với GitHub) |
| Tìm kiếm blog | **Pagefind** (index lúc build, chạy client-side) |
| Tài liệu | Giữ nguyên site VitePress hiện có tại `docs.<domain>` (TODO: domain). Site này chỉ liên kết sang, không đụng tới docs |

Nguyên tắc: **mặc định không có JavaScript phía client.** Chỉ dùng island (`client:*`) khi thật sự cần (vd menu mobile, toggle tháng/năm ở trang pricing), và ưu tiên JS thuần hoặc CSS.

## 3. Các trang

### 3.1 Trang chủ `/`
Landing kiểu SaaS, đẹp và hiện đại:
- Hero: tiêu đề, mô tả ngắn, CTA chính "Install on Shopify" (link App Store, TODO: URL), CTA phụ "View pricing", ảnh hoặc mockup hóa đơn
- Dải "Built for Shopify / Shopify POS"
- Lưới tính năng (theo mục 1), mỗi mục có icon
- Section giải thích các loại chứng từ, kèm gallery mẫu hóa đơn (dùng ảnh placeholder)
- Section "How it works" (3 bước)
- Section tự động hóa email theo webhook
- Section đa tiền tệ, đa ngôn ngữ, POS
- Testimonials (placeholder, TODO: review thật từ App Store)
- FAQ (có JSON-LD `FAQPage`)
- CTA cuối trang

### 3.2 Pricing `/pricing`
- Bảng các gói (TODO: tên gói, giá, giới hạn; tạm dùng 3 gói placeholder: Free / Pro / Business). Giá phải khớp với listing trên App Store
- Toggle Monthly/Yearly nếu có giá năm
- Bảng so sánh tính năng chi tiết
- FAQ về billing (thanh toán qua Shopify, trial, đổi gói)
- Dữ liệu gói lưu trong một file (`src/data/pricing.ts` hoặc JSON) để sửa dễ, có thể chỉnh qua Pages CMS

### 3.3 About / Contact `/about`
- Giới thiệu đội ngũ và sứ mệnh (placeholder)
- Thông tin liên hệ: email hỗ trợ (TODO), link docs, link App Store
- Form liên hệ: chưa chốt dịch vụ. Tạm dùng `mailto:`, và dựng sẵn component form để sau này gắn Formspree, Web3Forms hoặc Cloudflare Pages Function. Ghi phương án này vào README

### 3.4 Blog
- `/blog`: danh sách bài, **phân trang** bằng `paginate()` với route `src/pages/blog/[...page].astro` (trang 1 là `/blog`, các trang sau là `/blog/2`…), 10 bài mỗi trang, có điều hướng trước/sau và số trang
- `/blog/[slug]`: trang chi tiết, gồm mục lục (từ `headings`), thời gian đọc, ngày đăng/cập nhật, tác giả, tags, bài liên quan
- `/blog/tag/[tag]/[...page]`: trang theo tag, có phân trang
- Tìm kiếm bằng Pagefind
- `/rss.xml` qua `@astrojs/rss`
- Bỏ qua các bài có `draft: true` khi build production
- Schema frontmatter: `title`, `description`, `pubDate`, `updatedDate?`, `author`, `tags[]`, `cover?` (ảnh + alt), `draft` (mặc định false)
- Tạo 3 bài mẫu có nội dung thật, nhắm keyword SEO:
  1. Cách tùy biến Shopify invoice template
  2. Hướng dẫn in packing slip và receipt trên Shopify POS
  3. Hóa đơn VAT ở EU: các trường bắt buộc theo Điều 226 và xu hướng e-invoicing/Peppol

### 3.5 Trang phụ
- `404`
- `/privacy`, `/terms` (placeholder)

## 4. SEO (bắt buộc)

- Component `<SEO>` dùng chung: `title`, `description`, canonical, Open Graph, Twitter card, `og:image` mặc định và theo từng bài
- `@astrojs/sitemap`; `robots.txt` trỏ tới sitemap
- JSON-LD: `Organization` + `WebSite` (toàn site), `SoftwareApplication` (trang chủ), `Offer` (pricing), `BlogPosting` + `BreadcrumbList` (bài viết), `FAQPage`
- Trang phân trang có canonical riêng và title dạng "Blog – Page 2"
- HTML ngữ nghĩa: mỗi trang một `h1`, `alt` cho ảnh, landmarks
- Ảnh dùng `astro:assets` (`<Image>`), định dạng WebP/AVIF, có width/height, lazy-load
- Font: tự host hoặc Google Fonts có `display=swap`, preload font chính
- **Chuẩn bị sẵn i18n** (cấu hình i18n routing của Astro, ngôn ngữ mặc định `en`, không có prefix URL) để sau này thêm ngôn ngữ và `hreflang`. Giai đoạn này chỉ làm tiếng Anh (TODO: xác nhận các ngôn ngữ cần thêm)

## 5. Hiệu năng và chất lượng

- Lighthouse ≥ 95 cho cả 4 hạng mục (Performance, Accessibility, Best Practices, SEO), cả mobile lẫn desktop
- Hỗ trợ dark mode theo `prefers-color-scheme`
- Responsive từ 360px trở lên, không có scroll ngang
- Đạt WCAG AA về độ tương phản
- Có script `npm run check` (astro check) và build không có warning

## 6. Pages CMS

Tạo `.pages.yml` để người không biết code sửa được:
- Collection **Blog** (`src/content/blog`), khớp schema frontmatter ở trên, có trường media cho ảnh cover
- File **Pricing** (dữ liệu gói)
- File **Site settings** (tên site, mô tả, link App Store, email hỗ trợ, link social)
- Thư mục media: `src/assets/uploads` hoặc `public/uploads` (chọn phương án tương thích với `astro:assets` và ghi rõ trong README)

## 7. Deploy

- Cloudflare Pages kết nối với repo GitHub: framework preset Astro, build command `npm run build`, output `dist`, đặt `NODE_VERSION` phù hợp
- Push lên `main` sẽ deploy production; các nhánh và PR có preview
- Bước build Pagefind chạy sau `astro build`
- File `_headers` để cache tài nguyên tĩnh dài hạn và thêm các security header cơ bản

## 8. Cấu trúc gợi ý

```
src/
  components/   (SEO, Header, Footer, PricingTable, FeatureGrid, Pagination, ...)
  layouts/      (BaseLayout, BlogPostLayout)
  content/blog/
  content.config.ts
  data/         (site.ts, pricing.ts, features.ts, faq.ts)
  pages/        (index, pricing, about, 404, privacy, terms, blog/..., rss.xml.ts)
  assets/
public/
.pages.yml
```

## 9. Thiết kế

- Phong cách hiện đại, sạch, chuyên nghiệp, hợp với SaaS B2B trên Shopify. Tránh vẻ "template mặc định"
- Định nghĩa design tokens (màu, font, spacing) trong cấu hình Tailwind/CSS variables (TODO: màu brand và logo; tạm tự chọn một bảng màu và wordmark bằng chữ)
- Không dùng logo hay tài sản thương hiệu Shopify ngoài những gì hướng dẫn thương hiệu của Shopify cho phép (vd badge chính thức). Nếu cần thì để placeholder

## 10. Kết quả bàn giao

1. Repo Astro chạy được: `npm install`, `npm run dev`, `npm run build`
2. Toàn bộ các trang ở mục 3, có nội dung placeholder chất lượng
3. `README.md` gồm: cách chạy, cách deploy lên Cloudflare Pages, cách kết nối Pages CMS, cách viết bài blog, và **danh sách tất cả các `TODO`** cần tôi cung cấp
4. Báo cáo Lighthouse sau khi build (hoặc hướng dẫn tự kiểm tra)

## 11. Cách làm việc

- Lập kế hoạch và tạo khung trước, sau đó làm lần lượt từng trang
- Commit theo từng bước hợp lý
- Gặp điểm chưa rõ thì chọn phương án đơn giản và hợp lý nhất, ghi lại trong README, không dừng lại chờ hỏi
