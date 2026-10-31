# Thêm ảnh bằng tay

Mỗi nội dung (mục trong danh sách bên trái) có một thư mục ảnh. Code đọc thư mục lúc render, nên **chỉ cần bỏ file vào đúng thư mục, không phải sửa code**.

## Quy ước

- Đường dẫn: `public/images/<mục>/<số>-<tên>/`.
- Ảnh được sắp **theo tên file** (01, 02, 10 sắp đúng thứ tự số). Nên đặt tên `01.jpg`, `02.jpg`, `03.jpg`...
- **Ảnh `01` là ảnh nằm trong frame Figma của nội dung đó** và là ảnh hiện đầu tiên. Cắt ảnh (crop) theo thiết kế chỉ áp dụng cho ảnh này.
- Có nhiều ảnh thì tự chuyển bằng hiệu ứng morph (WebGL) lần lượt, mỗi ảnh 4 giây. Chỉ có 1 ảnh thì đứng yên. Thư mục trống thì khung ảnh để trống.
- Tất cả ảnh được tải sẵn khi vào web (ảnh của trang đang xem trước, màn hình loading chỉ hiện ở lần tải đầu của phiên). Không cần khai báo thêm; ảnh nào bỏ vào thư mục cũng được tải.
- Định dạng nhận: `.jpg` `.jpeg` `.png` `.webp` `.avif`. Ảnh được hiển thị và tải về đúng chất lượng gốc, không nén lại, nên hãy nén/giảm kích thước ảnh trước khi thêm vào (ảnh 4096px nặng 8–12 MB sẽ làm trang tải chậm).
- Khi chạy `npm run dev`, thêm file xong tải lại trang là thấy. Bản production cần build lại.
- Không dùng thư mục này cho ảnh Trang chủ và About: các ảnh đó có tên cố định (xem cuối trang).

## Danh sách thư mục

Cột "Layer trong Figma" là tên layer ảnh nằm bên phải thiết kế, ở cùng hàng với frame đó: tìm đúng tên trong panel Layers để xuất ảnh. Cột "Hiện có" là số ảnh đang có trong thư mục (chọn từ ảnh bắt được trên tab Figma, gán theo nội dung ảnh nên có thể sai trang: kiểm tra và thay nếu cần).

| Thư mục | Nội dung | Hiện có | Layer trong Figma |
| ------- | -------- | ------- | ----------------- |
| `competition/1-wico` | Gold Award - WICO 2026 | 5 | `IMG_1410` (ảnh `01`), `IMG_1220`, `z8055…`, `IMG_1450`, `IMG_1422`, `IMG_1453`, `IMG_1474` |
| `competition/2-ican` | iCAN 2026 | 1 | `image 3`: chỉ một ảnh, không chuyển ảnh |
| `competition/3-hssic` | High School Social Impact Challenge | 6 | `DSC_3264`, `DSC_3316`, `DSC_3104`, `DSC_3137`, `DSC_3226`, `DSC_3218`, `DSC_3343`, `DSC_3431` |
| `competition/4-rmit` | RMIT Tech Camp | 3 | `55368061898_…`, `55367909406_…`, `55367918486_…`, `807193d3-…`, `b519e29b-…` |
| `competition/5-buildhub` | Build@HUB Hackathon | 2 | `IMG_0652`, `IMG_0444`, `IMG_0815`, `IMG_0843`, `2. Competition` |
| `performing/1-thang-long` | Thang Long Water Puppet Theater | 3 | `DSC06895`, `DSC06916`, `DSC06927`, `DSC06936`, `DSC06957` |
| `performing/2-vietnam-puppet` | Vietnam Puppet Theater | 4 | `DSC04706`, `DSC04721`, `DSC04751`, `DSC04792`, `DSC04796`, `DSC04810`, `DSC04883`, `DSC04934`, `DSC04966` |
| `performing/3-cai-luong` | Hanoi Cai Luong Theater | 1 | `1905plv-6534`, `1905plv-6554`, `1905plv-6580` |
| `performing/4-little-sun` | Little Sun Theater Troupe | 1 | `DSC05107`, `DSC05125`, `DSC05136`, `DSC05168` |
| `culture-writing/1-gom-show` | GOm Show | 3 | `image 4`, `image 5` (và ảnh trong frame) |
| `culture-writing/2-cnn-zoom` | CNN ZOOM | 1 | `image 7`: chỉ một ảnh, không chuyển ảnh |
| `culture-writing/4-midsummer` | Vibrant CNN Showcase – “A Midsummer Night’s Dream” | 0 | ảnh trong Drive 4.4 (thư mục trống thì khung ảnh để trống) |
| `culture-writing/3-life-so-drama` | Life’s So Drama | 6 | `IMG_7059` … `IMG_7064` |
| `community-services/1-up-project` | The Up Project | 5 | `486801181_…`, `IMG_0109`, `IMG_6993`, `IMG_7360`, `kéo co` |
| `community-services/2-scribbles` | Scribbles Season 11 | 6 | `scb 3`, `scb 4`, `scb 5`, `IMG_7806`, `Rectangle 11` |
| `community-services/3-nha-em` | Nha Em Bakery | 1 | một ảnh (poster), không chuyển ảnh |
| `community-services/4-school-prom` | School Prom Event | 5 | trong Figma chỉ có các khung trống `Rectangle 6`–`10`, chưa có ảnh |

Tên layer lấy từ panel Layers của Figma. Các hàng ảnh nằm bên phải frame, ngang hàng với frame tương ứng.

## PDF và nhạc (cũng đọc theo thư mục, không phải sửa code)

| Thư mục / file | Dùng ở | Cách hoạt động |
| -------------- | ------ | -------------- |
| `public/zoom/*.pdf` | nút **Read the Issues** của mục CNN ZOOM | Mỗi PDF là một số báo, tiêu đề lấy từ tên file (vd `Issue 21 (2022) - Fiesta.pdf`). Muốn có ảnh bìa thì thêm ảnh cùng tên (`Issue 21 (2022) - Fiesta.jpg`). Chưa có PDF nào thì nút mở thư mục Drive. |
| `public/audio/a-midsummer-nights-dream.mp3` | nút **Soundtrack** của mục Midsummer | Bấm để phát/dừng. Chưa có file thì nút mở file nhạc trên Drive. |

## Ảnh cố định (không đọc theo thư mục)

| File | Dùng ở |
| ---- | ------ |
| `public/images/about/hero.jpg` | cột "about me" ở Trang chủ và ảnh đầu trang About |
| `public/images/home/competition.jpg`, `performing.jpg`, `culture-writing.jpg`, `community.jpg` | 4 cột còn lại của Trang chủ |
| `public/images/about/gallery-01.jpg` … `gallery-06.jpg` | lưới ảnh của trang About |
| `public/icons/*.svg` | các mũi tên |

Đổi các ảnh này thì giữ nguyên tên file; nếu đổi tên, sửa trong `app/page.tsx` hoặc `app/about/page.tsx`.
