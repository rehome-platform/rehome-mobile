# ReHome Mobile — Hướng dẫn Phase 6 (Thử đồ AI · Cộng đồng · Chat · Thông báo · App Tổ chức)

> Phase 6 theo kế hoạch: 18/11 – 23/11/2026, luồng **L-08** (thử đồ AI), **L-09** (chiến dịch, cộng đồng) và phần tổ chức của **L-10** (tổ chức tự quản hồ sơ, chiến dịch, bài viết; đổi thông tin pháp lý). Mobile đi trước lịch (Phase 5 xong UI 21/10) → làm từ **22/10**; nối API thật Phase 1–5 làm **sau** khi xong UI Phase 6 (mục 1).
> Nguồn: _Tài liệu tổng quan_ (F-072 … F-107; L-08, L-09, L-10; mục 11 "3 chiến dịch đồng thời"), _Thiết kế Database_ (TryOnImage, Campaign, CommunityPost, CommunityPostPhoto, PostLike, PostComment, Follow, ViolationReport, Conversation, Message, Notification), _API_CONTRACT_ (API 96 – 126), wireframe của lead (**AI-01 → AI-06**, **CD-01 → CD-06**, **CH-01 → CH-02**, **PR-05**; phía tổ chức **OC-01 → OC-04**, **OB-01 → OB-05**, **OM-01 → OM-03**, **OP-01 → OP-05**, **OA-06**).
> Quy ước như `CLAUDE.md` và PHASE2–5_GUIDE. File này chỉ ghi phần **mới**.
> Ký hiệu: **[GIẢ ĐỊNH]** · **[CHỜ BE]** · **[CHỜ LEAD]** · **[KIỂM TRA]**.
> **Trạng thái BE (Claude đọc code `develop` `a0c6abe`, 21/10):** **chưa có controller** nào của API 96–126, chưa có `/uploads`, chưa có `GET /api/organizations/me`, chưa có WebSocket/STOMP. → Phase 6 làm **toàn bộ bằng mock**. **Entity / enum đã có và khớp guide** (đặt tên field mock theo đây): `Category.tryonSlot` = `TOP | BOTTOM | DRESS` · `TryOnModelType` = `MALE | FEMALE` · `TryOnImage {modelType, topProduct, bottomProduct, dressProduct, imageUrl, createdAt}` · `Campaign {description, startTime, endTime, locationName, latitude, longitude, preferredItemTypes (chuỗi), status = OPEN}` — **không** `title`, `coverUrl` (0.5 A16) · `Conversation {type, member, counterpartId}` · `Notification {title, body, isRead}` — **không** đích (0.5 A19). Web (`rehome-frontend`) hiện chỉ có README → chưa có cách nối chat realtime nào để theo (0.5 A18 giữ REST + tự hỏi lại).
> **Kế hoạch (chốt 21/10):** làm xong UI Phase 6 (mock) **rồi mới** quay lại nối API thật từng phase (Phase 1 tổ chức → 2 → 3 → 4 → 5), gom danh sách API cần gấp gửi BE.

---

## 0. Phase 6 gồm những gì và thế nào là "xong"

Phase 6 lớn nhất từ trước tới giờ → chia **2 phần**, làm phần A trước:

- **Phần A — Member** (F-072 … F-092): thử đồ AI, tab Cộng đồng, chat, thông báo. Nằm trong nhóm `(member)` đã có.
- **Phần B — Tổ chức** (F-096 … F-107 + màn trạng thái hồ sơ): khung 4 tab tổ chức, chiến dịch, bài viết, tin nhắn, hồ sơ, đổi pháp lý. Nằm trong nhóm `(org)`, **phụ thuộc** việc còn dở của Phase 1 (`feature/org-real-api` bước 4, 7, 8, 9 — cần `GET /api/organizations/me`).

### 0.1. Ngoài phạm vi (đừng làm)

- **Phía Moderator**: xác minh tổ chức (TC-01 → TC-06), xử lý báo cáo vi phạm (VP-01/02), trả lời hộp thư kho (MC-01/02) → **web**.
- **Admin** (L-11) → web, Phase 7.
- **Chạy nền thật** cho thử đồ khi app bị tắt hẳn, **thông báo đẩy** khi app đóng (FCM) → không làm ở Phase 6 (mục 0.4 A#5, A#18). Thông báo trong app + badge thì làm.
- **Bản đồ thật** (react-native-maps) — mặc định **không làm**, dùng danh sách + mở Google Maps (mục 0.4 A#13). Làm nếu lead yêu cầu (mục 2).

### 0.2. Danh sách màn hình — Phần A (Member)

| Mã | Màn hình | Route đề xuất (dưới `src/app/(member)/`) | API | F |
|---|---|---|---|---|
| BR-04 | **Bật** nút "Thử đồ AI" (Phase 3 đã ẩn) | `products/[id].js` (đã có) | 50 | F-072 |
| AI-01 | Phòng thử đồ: mới mở (thiếu 1 slot) / đủ bộ | `tryon/index.js?productId=` | 50 | F-072 … F-074, F-077 |
| AI-02 | Chọn món còn thiếu: có gợi ý / không có gợi ý | `tryon/pick.js?slot=&excludeId=` | 96, 49 | F-075, F-076 |
| AI-03 | Đang tạo ảnh (có "Chạy nền") | trạng thái trong `tryon/index.js` | 97 | F-078 |
| AI-04 | Kết quả thử đồ | `tryon/result/[id].js` | 97/98, 51 | F-079 |
| AI-05 | Bộ sưu tập thử đồ | `tryon/collection/index.js` | 98 | F-080 |
| AI-06 | Xem ảnh / xác nhận xoá | `tryon/collection/[id].js` | 98, 99, 51 | F-080, F-081 |
| CD-01 | Tab Cộng đồng (newsfeed, chip Tất cả / Đang theo dõi / Chiến dịch, nút Bản đồ) | `(tabs)/community.js` (đã có, đang EmptyState) | 104, (chiến dịch) | F-086 |
| CD-02 | Bài viết + bình luận | `posts/[id].js` | 105 – 108, 103 | F-086, F-087 |
| CD-03 | Hồ sơ tổ chức (công khai) | `organizations/[id].js` | 100, 103, 104, (chiến dịch) | F-082, F-085 |
| CD-04 | Chiến dịch | `campaigns/[id].js` | 102 | F-083 |
| CD-05 | Tổ chức gần bạn | `organizations/nearby.js` | 101 | F-084 |
| CD-06 | Báo cáo vi phạm: chọn lý do / đã gửi | `report.js?targetType=&targetId=` | 109 | F-088 |
| CH-01 | Tin nhắn (danh sách hội thoại) | `messages/index.js` | 110 | F-089, F-090 |
| CH-02 | Phòng chat — với tổ chức / với hộp thư kho | `messages/[id].js` | 111 – 113 | F-089, F-090 |
| PR-05 | Thông báo | `notifications.js` | 114 – 116 | F-092 |
| PR-01 | **Bật** "Ảnh thử đồ đã lưu", "Tổ chức đang theo dõi", "Tin nhắn" (+ badge); chuông thông báo | `(tabs)/account.js` (đã có) | 98, 110, 114 | — |

> **Không trùng route:** `organizations/nearby.js` (tên cố định) được ưu tiên hơn `organizations/[id].js` — giống `returns/new` ở Phase 5. `tryon/collection/…` tách khỏi `tryon/index` / `tryon/pick` / `tryon/result/[id]`.
> Guest xem được: CD-01 (trừ chip Đang theo dõi), CD-02, CD-03, CD-04. Cần đăng nhập: thử đồ, thích / bình luận / theo dõi / báo cáo, tổ chức gần bạn, chat, thông báo → Guest bấm thì hỏi đăng nhập + `pendingRedirect` (Phase 3).

### 0.3. Danh sách màn hình — Phần B (Tổ chức)

Theo mẫu đã có ở Phase 1: route tổ chức nằm dưới **`(org)/org/…`** (như `(org)/org/registration`) để **không trùng URL** với `(member)/posts/…`, `(member)/campaigns/…`.

| Mã | Màn hình | Route đề xuất (dưới `src/app/(org)/org/`) | API | F |
|---|---|---|---|---|
| OA-06 | Trạng thái hồ sơ: Chờ xác minh / Bị từ chối (Phase 1 bước 7, 8) | `status.js` | `GET /api/organizations/me` [CHỜ BE] | F-005 |
| — | Khung 4 tab (VERIFIED): Chiến dịch · Bài viết · Tin nhắn · Hồ sơ | `(tabs)/_layout.js` + `campaigns.js` `posts.js` `messages.js` `profile.js` | — | — |
| OC-01 | Chiến dịch của tổ chức (Đang diễn ra / Đã đóng, khoá tạo khi 3/3) | `(tabs)/campaigns.js` | 122 | F-099, F-103 |
| OC-02 / OC-04 | Tạo / sửa chiến dịch | `campaigns/new.js`, `campaigns/[id]/edit.js` | 119, 120 | F-098, F-100 |
| OC-03 | Chi tiết chiến dịch (Sửa · Đóng sớm) | `campaigns/[id]/index.js` | 102, 121 | F-101 |
| OB-01 | Bài viết đã đăng (⋯ Sửa / Xoá) | `(tabs)/posts.js` | 126, 125 | F-106, F-107 |
| OB-02 / OB-03 | Đăng / sửa bài viết | `posts/new.js`, `posts/[id]/edit.js` | 123, 124 | F-104, F-105 |
| OB-05 | Bình luận của một bài (chỉ đọc) | `posts/[id]/comments.js` | 107 | F-107 |
| OM-01 | Tin nhắn với Member | `(tabs)/messages.js` | 110 | F-089 |
| — | Phòng chat (dùng chung màn CH-02) | `messages/[id].js` | 112, 113 | F-089 |
| OM-03 | Thông báo của tổ chức (dùng chung màn PR-05) | `notifications.js` | 114 – 116 | F-093 |
| OP-01 | Hồ sơ tổ chức (thông tin thường + pháp lý) | `(tabs)/profile.js` | `GET /api/organizations/me` | — |
| OP-02 | Sửa thông tin thường | `profile/edit.js` | 117 | F-096 |
| OP-04 | Đổi thông tin pháp lý | `profile/legal-change.js` | 118 | F-097 |
| OP-05 | Trạng thái yêu cầu đổi pháp lý: Chờ duyệt / Đã duyệt / Bị từ chối | `profile/legal-change-status.js` | [CHỜ BE] API đọc yêu cầu | F-097 |

> ✅ **Đã chốt (21/10): toàn bộ chức năng tổ chức làm trên mobile** (theo tài liệu đăng ký đề tài "Organization Mobile App" + wireframe OB/OC/OM/OP). Tài liệu tổng quan đang ghi F-096 … F-107 là **Web** → chỉ là chỗ ghi sai của tài liệu, báo lead sửa cột nền tảng cho khớp (không ảnh hưởng việc code).

### 0.4. Định nghĩa "xong"

**Phần A** (mock: `MOCK.tryon`, `MOCK.community`, `MOCK.chat`, `MOCK.notifications` = true):

1. BR-04: nút **Thử đồ AI** chỉ hiện với món thử được (theo slot của danh mục); bấm mở AI-01 với món đang xem khoá vào đúng slot (Áo / Quần / Đầm).
2. AI-01: chọn người mẫu Nữ / Nam; thiếu slot → nút Tạo ảnh mờ + câu nhắc; đủ (Áo + Quần, hoặc Đầm) → bấm được.
3. AI-02: tab Gợi ý / Tất cả; gợi ý rỗng → tự chuyển tab Tất cả + câu giải thích; chọn xong quay lại AI-01 đúng slot.
4. AI-03: chờ có đếm giây, **Chạy nền** được (rời màn vẫn tạo tiếp, xong báo toast + có trong bộ sưu tập), **Huỷ** được; lỗi → thử lại.
5. AI-04: ảnh + nhãn "ẢNH DỰNG BẰNG AI"; Mua lẻ từng món; **Thêm cả outfit vào giỏ** (bỏ qua món đã có trong giỏ, báo món không còn bán).
6. AI-05/06: lưới ảnh, nhãn "1 MÓN ĐÃ BÁN"; xem ảnh + món trong ảnh (còn bán / đã bán); xoá có hỏi.
7. CD-01: 3 chip; Guest không có chip Đang theo dõi; thích bài cập nhật ngay (lạc quan), lỗi thì trả lại.
8. CD-02: bình luận gửi được, danh sách tự thêm; theo dõi / bỏ theo dõi tổ chức; báo cáo.
9. CD-03/04: hồ sơ tổ chức, danh sách chiến dịch của tổ chức, chi tiết chiến dịch, **Chỉ đường**, **Nhắn tin**.
10. CD-05: xin quyền vị trí, danh sách tổ chức gần có khoảng cách + số chiến dịch đang nhận; từ chối quyền vẫn dùng được.
11. CD-06: chọn lý do (bắt buộc) + mô tả → Đã gửi.
12. CH-01/02: danh sách hội thoại có số chưa đọc; phòng chat gửi được, tin mới tự hiện (tự hỏi lại khi đang mở); ô nhập **không bị bàn phím che**; mở chat từ trang tổ chức / chiến dịch / đơn / ký gửi đúng hội thoại.
13. PR-05: danh sách thông báo nhóm Hôm nay / Trước đó; bấm mở đúng màn liên quan; Đánh dấu đã đọc; chuông + badge ở tab Cá nhân.

**Phần B** (mock `MOCK.organization` + `MOCK.orgContent` = true):

14. Đăng nhập tổ chức: PENDING / REJECTED → màn trạng thái (OA-06); VERIFIED → khung 4 tab.
15. OC: danh sách 2 chip; tạo chiến dịch (khoá khi đủ 3 đang chạy); sửa (ngày bắt đầu khoá khi đang chạy); đóng sớm có hỏi.
16. OB: danh sách bài + số thích / bình luận; đăng / sửa (≤ 2000 ký tự, ≤ 5 ảnh); xoá có hỏi (nêu số thích, bình luận sẽ mất); xem bình luận.
17. OM: tin nhắn với Member (tổ chức không tự mở hội thoại); thông báo tổ chức.
18. OP: hồ sơ tách "thông tin thường" (sửa ngay) và "pháp lý" (cần duyệt); sửa thường có kiểm lỗi; đổi pháp lý chọn mục → form tương ứng → gửi → màn trạng thái yêu cầu.

Chung: không chuỗi trạng thái rải rác, không mã màu trong màn hình, không so chữ trong message lỗi; số "3 chiến dịch", "2000 ký tự", "5 ảnh" để ở constants (BE quyết định cuối).

### 0.5. Quyết định đang áp dụng và chỗ lệch (báo lead)

**Phần A**

| # | Wireframe / tài liệu | Mobile làm | Lý do |
|---|---|---|---|
| A1 | Thanh tab 5 mục có **"Thử đồ"** (CD-01, PR-05, BR-03) | Giữ **4 tab**; thử đồ mở từ **BR-04**, bộ sưu tập mở từ **Cá nhân → Ảnh thử đồ đã lưu** | L-08 + CLAUDE.md "thử đồ mở từ trang sản phẩm" [CHỜ LEAD — đã treo từ Phase 1] |
| A2 | CLAUDE.md / đề tài: "ảnh < 120 giây, **xử lý bất đồng bộ**"; AI-03 có "Bước 2/3 — dựng dáng · ~14 giây" | API 97 là **một request đồng bộ** → hiện vòng chờ + **đếm giây đã chờ**, không hiện bước / % giả; timeout riêng **150 giây** cho request này | Contract không có tiến độ; BE trả ảnh khi xong [CHỜ BE nếu chuyển sang tạo job + hỏi lại] |
| A3 | AI-03 "**Chạy nền, báo tôi khi xong**" | Request chạy trong `tryonJobStore` (ngoài màn hình) → Member rời màn vẫn chạy; xong → toast "Ảnh thử đồ đã xong · Xem" + dấu chấm ở "Ảnh thử đồ đã lưu". **Tắt hẳn app** thì mất kết nối — ảnh vẫn được BE lưu nếu tạo xong (F-079) | Không có API job; không làm thông báo đẩy (0.1) |
| A4 | AI-03 nút **Huỷ** | Huỷ = huỷ request (`AbortController`) + về AI-01; chữ nhỏ "Nếu máy chủ đã tạo xong, ảnh vẫn có trong bộ sưu tập" | Huỷ phía app không dừng được model đang chạy [CHỜ BE] |
| A5 | AI-04 "**Chia sẻ**" | Ẩn ở Phase 6 [GIẢ ĐỊNH] (chia sẻ ảnh cần tải ảnh về máy + thư viện native) | Tránh build lại chỉ vì một nút; làm sau nếu lead muốn (`expo-sharing` + `expo-file-system`) |
| A6 | AI-04 "Tạo lại" | Giữ: gọi lại API 97 cùng bộ đồ (tạo ảnh mới, ảnh cũ vẫn trong bộ sưu tập) | — |
| A7 | AI-02 "Tất cả quần · 48" | Tab Tất cả = API 49 lọc theo **slot** — [CHỜ BE] tham số `tryonSlot`; chưa có thì lọc theo **danh mục có slot đó** (API 44 `tryonSlot`, gửi từng `categoryId`) | API 49 chỉ nhận một `categoryId` |
| A8 | AI-01 ảnh người mẫu Nữ / Nam | Ảnh người mẫu tĩnh trong app (`assets/tryon/model-female.png`, `model-male.png`) [GIẢ ĐỊNH] — hoặc ảnh BE cung cấp | Contract không có API ảnh người mẫu [CHỜ BE] |
| A9 | Đầm (DB `dress_product_id`) — API 96 chỉ có slot TOP / BOTTOM | Món đang xem là **Đầm** → AI-01 chỉ một ô, đủ bộ ngay, không mở AI-02 | DB / API 97 hỗ trợ `dressProductId` |
| A10 | CD-01 chip **Tất cả** (mọi tổ chức) | Chỉ hiện khi BE có newsfeed công khai; tạm: Tất cả = bài mới của mọi tổ chức **trong mock** [CHỜ BE] | API 104 bỏ trống `organizationId` = **bài của tổ chức đang theo dõi**, Guest bị 401 |
| A11 | CD-01 chip **Chiến dịch** | Danh sách chiến dịch đang nhận đồ — [CHỜ BE] `GET /campaigns?status=OPEN`; tạm dùng API 101 (gần bạn) gom chiến dịch | Không có API liệt kê chiến dịch công khai |
| A12 | Nhãn **"CHIẾN DỊCH"** trên bài viết (bài gắn chiến dịch) | Ẩn | Bảng CommunityPost không có `campaign_id` [CHỜ BE] |
| A13 | CD-05 **bản đồ** + nút "Danh sách", ô "Tìm theo khu vực" | **Danh sách** theo khoảng cách + mỗi dòng **Chỉ đường** (mở Google Maps); ẩn ô tìm khu vực | Bản đồ trong app cần `react-native-maps` + Google Maps API key Android + build lại [CHỜ LEAD]; không có API tìm theo khu vực |
| A14 | CD-02 bình luận có **Thích**, **Trả lời**, **Sửa · Xoá** bình luận của mình | Chỉ xem + viết bình luận | API 107/108 không có thích / trả lời / sửa / xoá bình luận [CHỜ BE] |
| A15 | CD-04 "Mọi chiến dịch của tổ chức đều nhận đồ tại đây" (địa điểm tổ chức) | Hiện **địa điểm của chiến dịch** (`locationName`, toạ độ) BE trả | Bảng Campaign có địa điểm + toạ độ riêng; lead cần chốt chiến dịch có địa điểm riêng hay luôn là điểm nhận của tổ chức [CHỜ LEAD] |
| A16 | CD-04 / OC-02 **Tên chiến dịch**, **Ảnh bìa** | Hiện nếu BE trả; chưa có thì tiêu đề = dòng đầu của mô tả, không ảnh bìa | Bảng Campaign không có `title`, `cover_url` [CHỜ BE] |
| A17 | CH-02 nút **Ảnh**, **Đơn** (đính kèm), "Đã xem" | Chỉ tin nhắn chữ; ẩn đính kèm và "Đã xem" | Bảng Message chỉ có `content`; API không trả `readAt` [CHỜ BE] |
| A18 | Chat realtime (CLAUDE.md: STOMP/WebSocket "theo web") | Phase 6: **REST + tự hỏi lại** (3 giây khi đang mở phòng, 30 giây ở danh sách, khi app quay lại); STOMP làm nhánh riêng khi BE gửi địa chỉ + topic (mục 2) | API 113 ghi REST là nơi lưu chính và là đường dự phòng |
| A19 | PR-05 bấm thông báo "mở thẳng màn liên quan" | Một hàm `notificationRoute(n)` duy nhất; thông báo thiếu đích thì chỉ đánh dấu đã đọc | Bảng Notification **không có** `targetType/targetId` [CHỜ BE] |
| A20 | CD-06 lý do = danh sách + mô tả | Gửi BE **một chuỗi** `reason` = "<lý do>: <mô tả>" (như trả hàng Phase 5) | API 109 chỉ có `reason` |
| A22 | AI-02 gợi ý "Chân váy chữ A" ở tab **quần** | Mock xếp theo **danh mục**: "Váy đầm" = slot ĐẦM → chân váy không vào tab quần | Chân váy thuộc slot BOTTOM hay DRESS tuỳ BE đặt `Category.tryonSlot` [CHỜ BE] |
| A23 | CD-03 / CD-04 nút **Nhắn tin** mở hội thoại | Tạm toast "sắp có" (`MESSAGE_SOON` trong `communityRules`) — nhánh 5 thay bằng `useOpenConversation` | Chat làm ở nhánh 5 |
| A21 | Hộp thư kho "Kho ReHome" (một hộp) | Mỗi **kho** là một hội thoại (`MEMBER_WAREHOUSE` + `warehouseId`), tên "Kho Quận 7"; mở từ đơn / ký gửi thì đúng kho đó; từ CH-01 nút "Hỏi kho" chọn kho [GIẢ ĐỊNH] | Bảng Conversation: `counterpart_id` = `Warehouse.id` [CHỜ LEAD/BE] |

**Phần B**

| # | Wireframe / tài liệu | Mobile làm | Lý do |
|---|---|---|---|
| B1 | OC-01 mỗi chiến dịch "48 lượt thích · 7 bình luận"; OC-03 "1.842 lượt xem" | Ẩn | Chiến dịch không có thích / bình luận / lượt xem trong DB |
| B2 | OC-02 "**Lưu nháp**" | Ẩn | Không có trạng thái nháp (Campaign chỉ OPEN / CLOSED) [CHỜ BE] |
| B3 | OC-02 loại đồ: chip có sẵn | Chip gợi ý (8 loại theo wireframe) + **tự nhập thêm**; gửi mảng chuỗi | API 119 `preferredItemTypes[]`; DB `varchar` → [KIỂM TRA] BE lưu nối chuỗi |
| B4 | OC-04 "Ngày bắt đầu đã khoá (chiến dịch đang chạy) — chỉ dời được ngày kết thúc" | Làm đúng vậy (khoá ở app) | BE có thể chưa chặn [CHỜ BE] |
| B5 | OB-01 "1 bị báo cáo"; OB-02 "Gắn với chiến dịch" | Ẩn cả hai | Không có field [CHỜ BE] (cùng A12) |
| B6 | OB-05 bình luận "Người dùng ẩn" (đã bị gỡ, hiện mờ) | Chỉ hiện bình luận VISIBLE (API 107) | API chỉ trả VISIBLE |
| B7 | OP-01/02 "Giờ nhận đồ", "Điện thoại", logo, tên hiển thị — sửa ngay | Làm theo API 117 (PATCH), **trường nào BE nhận thì cho sửa** [KIỂM TRA] | Contract ví dụ chỉ có `description` |
| B8 | OP-04 đổi pháp lý: người đại diện (có CCCD, ngày cấp, nơi cấp), tên pháp lý (+ giấy tờ), loại hình | **Dùng lại component** của đăng ký tổ chức (Phase 1: khối đại diện, `LegalDocCard`, chọn loại hình); gửi `proposedChanges` theo đúng tên field của body đăng ký | API 118 nhận `proposedChanges` tự do [CHỜ BE tên field] |
| B9 | OP-05 trạng thái yêu cầu đổi pháp lý | Làm màn; dữ liệu từ mock — [CHỜ BE] API đọc yêu cầu (`GET /organizations/me/legal-change-requests`) | Contract chỉ có POST |
| B10 | OA-06 Bị từ chối: "chỉ cần bổ sung phần thiếu, giấy tờ đã đạt giữ nguyên" | Mở lại 4 bước **điền sẵn toàn bộ**, đánh dấu giấy tờ "chưa đạt" nếu BE trả; gửi `PUT` cả body | API PUT nhận cả body (CLAUDE.md "Tổ chức" bước 3) |
| B11 | OM-01 "Tổ chức không tự nhắn trước" | Đúng vậy — không có nút tạo hội thoại ở phía tổ chức | API 111 chỉ cho Member |

---

## 1. Nhánh Git

| Thứ tự | Nhánh | Nội dung | Ngày (gợi ý) |
|---|---|---|---|
| 0 | — | ✅ Đã đọc BE `a0c6abe` (21/10): chưa có API 96–126, `/uploads`, `GET /api/organizations/me`, STOMP; entity khớp guide; điền mục 5.2 | 21/10 |
| 1 | `feature/tryon` | ✅ PR #33 — constants, `tryonRules`, mock thử đồ, `tryonJobStore`, AI-01 → AI-04, bật nút ở BR-04 | 22–23/10 |
| 2 | `feature/tryon-collection` | ✅ PR #34 — AI-05, AI-06, dòng "Ảnh thử đồ đã lưu" ở PR-01 | 24/10 |
| 3 | `feature/community` | ✅ PR #35 — mock cộng đồng, tab Cộng đồng CD-01, CD-02, CD-03, CD-04, theo dõi, "Tổ chức đang theo dõi" ở PR-01 | 24–26/10 |
| 4 | `feature/community-nearby-report` | ✅ PR #36 — CD-05, CD-06 | 27/10 |
| 5 | `feature/chat` | ✅ PR #37 — mock chat, CH-01, CH-02 (dùng chung cho tổ chức), bật **mọi nút "Nhắn cho kho / Nhắn tin"** đã ẩn từ Phase 2–5 | 28–29/10 |
| 6 | `feature/notifications` | ✅ PR #38 — mock thông báo (sinh từ các mock khác), PR-05, chuông + badge | 30/10 |
| 7 | `feature/org-shell` | (cần `GET /api/organizations/me` hoặc mock) màn trạng thái OA-06, khung 4 tab, OP-01 | 31/10 |
| 8 | `feature/org-campaigns` | OC-01 → OC-04 | 01–02/11 |
| 9 | `feature/org-posts` | OB-01 → OB-05 | 03/11 |
| 10 | `feature/org-messages-profile` | OM-01, OM-03, OP-02, OP-04, OP-05 | 04–05/11 |
| — | nối API thật Phase 1 → 5 (rà soát từng phase) | sau khi xong UI Phase 6 (kế hoạch chốt 21/10) | từ 06/11 |
| — | `feature/chat-realtime` (tuỳ chọn) | STOMP khi BE có | khi BE xong |
| — | `feature/community-map` (tuỳ chọn) | bản đồ thật ở CD-05 nếu lead muốn | khi lead chốt |

Nhánh 7 trùng việc với `feature/org-real-api` (Phase 1, bước 4, 7, 8, 9): **làm trên nhánh mới từ `develop`**, nhánh cũ đã merge thì không làm tiếp (quy ước Git trong CLAUDE.md).

**Nhánh 1–2 (thử đồ) đã làm khác / thêm:**

- Route: `tryon/index.js?productId=` (AI-01 + AI-03 **cùng một màn** — job đang chạy thì hiện màn chờ / lỗi), `tryon/pick.js?slot=&excludeId=`, `tryon/result/[id].js`, `tryon/collection/index.js`, `tryon/collection/[id].js`.
- `stores/tryonJobStore.js`: một việc tạo ảnh chạy ngoài màn (`AbortController` ngoài state). Đang mở phòng thử đồ (`watching`) → xong tự `replace` sang kết quả; đã rời → hộp **"Ảnh thử đồ đã xong" [Để sau] [Xem]** (Alert thay toast vì Toast Android không có nút) + `hasNew` → badge "Mới" ở PR-01 tới khi mở bộ sưu tập. Huỷ → không báo lỗi. `authStore.signOut` gọi `reset()`.
- `features/tryon/store/tryonDraftStore.js`: bộ đồ AI-01 ↔ AI-02 + người mẫu đã chọn (RAM); mở phòng với món khác → bộ mới.
- Slot lấy từ `product.tryonSlot` (mock thêm `tryonSlot` vào `CATEGORIES` của `catalogApi.mock` và `toSummary` của `productsApi.mock`) [CHỜ BE câu 5]. Ảnh người mẫu chưa có → khung + icon (A8).
- Mock: chờ 5–10 giây, lỗi 502 **chỉ** qua Khung Mock "Lần tạo ảnh sau bị lỗi"; "Áo len cổ lọ" (`sp-004`) → không có gợi ý; 4 ảnh mẫu (1 ảnh có món đã bán `sp-sold`). Ảnh kết quả là ảnh ngẫu nhiên (picsum).
- AI-04 "Thêm cả outfit vào giỏ": app **tự lọc trước** món đã có trong giỏ / không còn bán (BE chưa có `code` phân biệt 2 lỗi 409), thêm lần lượt; còn lỗi thì tính "không còn bán". Hết món để thêm → nút **Xem giỏ hàng**. Câu "tách thành n đơn" khi khác kho. **Tạo lại** = gọi lại API 97 cùng bộ đồ rồi về phòng thử đồ.
- AI-05: nhãn MỚI (24 giờ) / "n MÓN ĐÃ BÁN"; đang tạo → ô đầu "Đang tạo…". AI-06: Thêm giỏ / Mua ngay / ĐÃ BÁN; xoá có hỏi.

**Nhánh 3 (cộng đồng) đã làm khác / thêm:**

- Route: `(tabs)/community.js`, `posts/[id].js`, `organizations/[id].js`, `organizations/following.js` (PR-01 "Tổ chức đang theo dõi"), `campaigns/[id].js`. Nút header CD-01 là **"Gần bạn"** (→ CD-05) thay "Bản đồ".
- `utils/askLogin.js` (hỏi đăng nhập + `pendingRedirect`, dùng chung); `utils/format.js` thêm `formatRelative` ("n phút / giờ / ngày trước", "Hôm qua").
- Mock dữ liệu chung cho phía tổ chức (nhánh 7–10): 4 tổ chức (Member theo dõi 2), 5 chiến dịch (1 CLOSED), 7 bài viết, bình luận mẫu, báo cáo; field mock chưa có ở BE: `organization` trong bài / chiến dịch, `title`, `coverUrl`, `address`, `receivingHours` (chiến dịch), `photoUrls`, `likeCount`, `likedByMe`, `commentCount`, `logoUrl`, `orgTypeLabel`, `operationScopeLabel`, `donationPoint`, `followerCount`, `isFollowing`, `isMine` (bình luận).
- Thích **lạc quan** sửa cache theo tiền tố `["community","feed"]` (gồm cả bài của một tổ chức `orgPosts`) + `post(id)`; theo dõi lạc quan ở `org(id)` + bài viết của tổ chức. Bình luận gửi xong tải lại bình luận + số bình luận.
- `PostPhotos` lưới dùng `width: "49.3%"` + `aspectRatio` (đừng dùng `flexBasis` % + `aspectRatio` — ô bị rộng 0).
- CD-03 tab Bài viết tải từng trang bằng nút "Xem thêm bài viết" (màn cuộn ScrollView, không lồng FlatList).

**Nhánh 4 (CD-05, CD-06) đã làm khác / thêm:**

- `utils/location.js` `getCoords()` → `{lat, lng}` · `{denied: true}` · `null` (lỗi GPS) — dùng lại được (KG-03 Phase 2 vẫn giữ hàm riêng, chưa gộp). Android chỉ hỏi quyền **một lần** cho app; đã cho từ Phase 1/2 thì không hỏi lại.
- CD-05 danh sách sắp theo khoảng cách (mock tính haversine, bán kính 5 km [KIỂM TRA]); **không bản đồ** — **hoãn theo quyết định 22/10** (cần lead chốt + Google Maps API key cho Android + build lại; xem 0.5 A13). Khung Mock "Dùng vị trí mẫu (Quận 1)" khi máy test ở xa.
- CD-06 route `report.js?targetType=&targetId=` một màn cho 3 loại; khối tóm tắt lấy từ cache bài viết / chiến dịch / tổ chức; "Lý do khác" bắt buộc ≥ 10 ký tự [GIẢ ĐỊNH]; gửi xong màn "Đã gửi" + Đóng.

**Nhánh 5 (chat) đã làm khác / thêm:**

- Route `messages/index.js`, `messages/[id].js?draft=`; `ConversationListScreen` / `ChatRoomScreen` nhận `viewer` để phía tổ chức dùng lại (nhánh 10).
- Hộp thư kho = **mỗi kho một hội thoại** (A21), ghim đầu danh sách; tên = tên kho. Nhãn "Hộp thư kho" / "Đã xác minh"; giờ tin cuối `formatChatTime` ("HH:mm / Hôm qua / T.x / dd/MM").
- Gửi **lạc quan** (id tạm, "Đang gửi…" → giờ; lỗi → "Chưa gửi được · Gửi lại"); phòng đang mở hỏi lại **3 giây** (`useFocusEffect` bật / tắt), danh sách + badge tab Cá nhân **30 giây**; có tin mới của đối tác khi đang mở → `markRead` [CHỜ BE API đánh dấu đã đọc].
- `useOpenConversation({type, counterpartId, draft, from})`: tạo / lấy hội thoại (API 111) rồi vào phòng; câu soạn sẵn **không tự gửi**; Guest → hỏi đăng nhập. Mock thêm hội thoại vào danh sách ngay khi mở (kể cả chưa gửi tin) — BE quyết định cách hiện.
- Nút đã bật: CD-03 / CD-04 **Nhắn tin**; `MessageWarehouseButton` "**Nhắn cho kho**" ở chi tiết đơn (BR-11), yêu cầu trả hàng (RT-02 — không hợp lệ thì "Khiếu nại kết luận / nhắn cho kho"), sản phẩm ký gửi (KG-09). Cần `warehouseId` ở đơn / yêu cầu trả / sản phẩm ký gửi [CHỜ BE — API 63, 80, 22 chưa trả]; mock trả kèm. Chưa bật: KG-12 Phase 2, VI-05 "Nhắn hỗ trợ" (chưa rõ gửi về kho nào — câu 27).
- Tab Cá nhân bỏ hẳn nhóm "Sắp có" (mục cuối là Tin nhắn); dòng **Tin nhắn · n chưa đọc**.
- Chỉ tin chữ (A17); bàn phím không che ô nhập trên máy test → **chưa cần** `react-native-keyboard-controller`.

**Nhánh 6 (thông báo) đã làm khác / thêm:**

- Loại theo enum `NotificationType` của BE (`ORDER_UPDATE`, `WALLET_EVENT`, `TERM_EXPIRY`, `VERIFICATION_RESULT`, `QUEUE_TASK`); icon theo loại. Đích `targetType/targetId` (mock có) [CHỜ BE câu 17].
- `mockNotify` (trong `notificationApi.mock`, không import mock khác) được gọi từ: `ordersApi.mock.mockAdvanceOrder` (đóng gói / đang giao / đã giao / hoàn thành), `walletApi.mock.mockRefund` + kết quả `createPayout`, `returnsApi.mock.mockReturnAction`, `withdrawalApi.mock.mockWithdrawalAction`. **Thử đồ xong không sinh thông báo** (BE không có loại tương ứng; app đã có hộp "Ảnh thử đồ đã xong").
- Chuông `BellButton` (header tab Cá nhân, cạnh ⚙): số chưa đọc hỏi lại 60 giây + mỗi lần tab được mở lại. Màn `NotificationListScreen` (`SectionList` Hôm nay / Trước đó) nhận `viewer`, `backHref` cho phía tổ chức.

---

## 2. Thư viện

**Bắt buộc:** không có. **Quyết định (21/10): hạn chế thư viện native** — mỗi thư viện native bắt **build lại dev build** và **team test qua tunnel phải cài lại APK mới**.

| Thư viện | Dùng cho | Ghi chú |
|---|---|---|
| `dayjs/plugin/relativeTime` + `dayjs/locale/vi` | "2 giờ trước", "Hôm qua" | Có sẵn trong `dayjs`, chỉ cần `dayjs.extend` + `dayjs.locale("vi")` một lần ở `utils/format.js` |
| ~~`expo-image`~~ | Feed nhiều ảnh | **Không cài ở Phase 6** — `Image` có sẵn đủ dùng với mock; cân nhắc lại khi nối API thật nếu feed giật |

**Kiểm bàn phím ở màn chat** (CH-02, CD-02, OB-02): Expo SDK 58 Android bật edge-to-edge → `KeyboardAvoidingView` có thể không đẩy ô nhập lên [KIỂM TRA trên máy thật]. Thử `KeyboardAvoidingView behavior="padding"` trước; **chỉ khi** ô nhập vẫn bị che mới cài `react-native-keyboard-controller` (native → build lại một lần, ở nhánh `feature/community` hoặc `feature/chat`).

**Tuỳ chọn (cần lead đồng ý / BE sẵn sàng):**

| Thư viện | Dùng cho | Điều kiện |
|---|---|---|
| `react-native-maps` | Bản đồ CD-05 (0.5 A13) | Google Maps API key Android (giới hạn theo package `com.rehome.mobile` + SHA-1) khai trong `app.json` → build lại. Key nằm trong app (không phải secret theo nghĩa server) nhưng **vẫn để trong biến môi trường / EAS secret, không commit** |
| `@stomp/stompjs` | Chat realtime (0.5 A18) | BE gửi URL WebSocket + topic + cách gửi token. React Native có sẵn `WebSocket`; có thể cần polyfill `TextEncoder` [KIỂM TRA] |
| `expo-notifications` | Thông báo đẩy khi app đóng | Cần FCM (`google-services.json`) + BE gửi push → để sau Phase 6 |

---

## 3. Cấu trúc thư mục thêm mới

```
src/
├─ constants/tryon.js                 # TRYON_SLOT, MODEL_TYPE, TRYON_LIMITS (timeout)
├─ constants/community.js             # CAMPAIGN_STATUS(+LABEL), POST_LIMITS, REPORT_TARGET, REPORT_REASONS, CAMPAIGN_ITEM_TYPES, ORG_LIMITS
├─ constants/chat.js                  # CONVERSATION_TYPE
├─ constants/notification.js          # NOTIFICATION_TYPE(+icon/nhãn)
├─ stores/tryonJobStore.js            # việc tạo ảnh đang chạy (ngoài màn hình) — 0.5 A3
├─ features/tryon/
│  ├─ api/ tryonApi.js · .real.js · .mock.js · queryKeys.js
│  ├─ utils/ tryonRules.js            # slotOf, canTryOn, isOutfitComplete, buildTryonPayload
│  ├─ hooks/ useTryonJob.js · useTryonImages.js
│  ├─ components/ SlotCard.js · ModelPicker.js · OutfitItemRow.js · AiBadge.js · TryonMockPanel.js (__DEV__)
│  └─ screens/ TryonRoomScreen.js · PickItemScreen.js · TryonResultScreen.js · CollectionScreen.js · TryonImageScreen.js
├─ features/community/                # dùng chung Member (xem) + Tổ chức (quản lý)
│  ├─ api/ communityApi.js · .real.js · .mock.js · queryKeys.js   # tổ chức, chiến dịch, bài viết, bình luận, theo dõi, báo cáo
│  ├─ utils/ communityRules.js        # campaignTitleOf, campaignDaysLeft, buildReportReason
│  ├─ components/ PostCard.js · PostPhotos.js · LikeButton.js · CommentItem.js · CommentComposer.js
│  │              OrgHeader.js · FollowButton.js · CampaignCard.js · CampaignInfo.js · VerifiedBadge.js
│  └─ screens/ CommunityScreen.js · PostDetailScreen.js · OrgProfileScreen.js · CampaignScreen.js
│              NearbyOrgsScreen.js · ReportScreen.js
├─ features/chat/
│  ├─ api/ chatApi.js · .real.js · .mock.js · queryKeys.js
│  ├─ hooks/ useOpenConversation.js (POST /conversations rồi mở phòng) · useMessages.js
│  ├─ components/ ConversationRow.js · MessageBubble.js · ChatInput.js · ChatNotice.js
│  └─ screens/ ConversationListScreen.js · ChatRoomScreen.js       # dùng cho cả (member) và (org)
├─ features/notifications/
│  ├─ api/ notificationApi.js · .real.js · .mock.js
│  ├─ utils/ notificationRoute.js     # 0.5 A19 — một chỗ duy nhất
│  ├─ components/ NotificationRow.js · BellButton.js
│  └─ screens/ NotificationListScreen.js                          # dùng cho cả (member) và (org)
├─ features/orgPortal/                # Phần B — tổ chức đã xác minh
│  ├─ api/ orgPortalApi.js · .real.js · .mock.js                  # /organizations/me, chiến dịch & bài viết của tôi, đổi pháp lý
│  ├─ schemas.js                      # campaignSchema, postSchema, orgProfileSchema, legalChangeSchema
│  ├─ components/ CampaignForm.js · PostForm.js · ItemTypePicker.js · ProfileInfoRow.js · LegalFieldTag.js
│  └─ screens/ OrgStatusScreen.js · OrgCampaignsScreen.js · CampaignFormScreen.js · OrgCampaignDetailScreen.js
│              OrgPostsScreen.js · PostFormScreen.js · PostCommentsScreen.js
│              OrgProfileScreen.js · OrgProfileEditScreen.js · LegalChangeScreen.js · LegalChangeStatusScreen.js
└─ app/
   ├─ (member)/ tryon/index.js · pick.js · result/[id].js · collection/index.js · collection/[id].js
   │            posts/[id].js · organizations/[id].js · organizations/nearby.js · campaigns/[id].js · report.js
   │            messages/index.js · messages/[id].js · notifications.js
   └─ (org)/org/ status.js · (tabs)/_layout.js · (tabs)/campaigns.js · (tabs)/posts.js · (tabs)/messages.js · (tabs)/profile.js
                 campaigns/new.js · campaigns/[id]/index.js · campaigns/[id]/edit.js
                 posts/new.js · posts/[id]/edit.js · posts/[id]/comments.js
                 messages/[id].js · notifications.js · profile/edit.js · profile/legal-change.js · profile/legal-change-status.js
```

Component dùng **chung hai vai** (chat, thông báo, `PostCard`, `CampaignInfo`) nằm trong `features/…`, route của từng vai chỉ là file mỏng gọi cùng một screen. Khác nhau ở vai (vd tổ chức không có nút báo cáo, không có nút theo dõi) → truyền prop `viewer="member" | "org"`, không copy màn hình.

---

## 4. Hằng số và quy tắc

### 4.1. `src/constants/tryon.js`

```js
export const TRYON_SLOT = { TOP: "TOP", BOTTOM: "BOTTOM", DRESS: "DRESS" }; // [KIỂM TRA] tên BE ở Category.tryonSlot
export const TRYON_SLOT_LABEL = { TOP: "Áo", BOTTOM: "Quần", DRESS: "Đầm" };
export const MODEL_TYPE = { FEMALE: "FEMALE", MALE: "MALE" };
export const MODEL_TYPE_LABEL = { FEMALE: "Nữ", MALE: "Nam" };
export const TRYON_LIMITS = { REQUEST_TIMEOUT_MS: 150000 }; // > 120 giây theo yêu cầu đề tài
```

### 4.2. `features/tryon/utils/tryonRules.js`

```js
// Slot của món lấy từ danh mục (API 44 tryonSlot) — [CHỜ BE] API 50 trả kèm
export const slotOf = (product) => product.tryonSlot ?? null;
export const canTryOn = (product) => !!slotOf(product) && product.status === "ON_SALE"; // + ảnh đã tách nền nếu BE trả cờ
export const otherSlot = (slot) => (slot === "TOP" ? "BOTTOM" : slot === "BOTTOM" ? "TOP" : null);

// Đủ bộ: Áo + Quần, hoặc Đầm (F-077, CLAUDE.md)
export const isOutfitComplete = ({ top, bottom, dress }) => !!dress || (!!top && !!bottom);

export const buildTryonPayload = ({ modelType, top, bottom, dress }) =>
  dress ? { modelType, dressProductId: dress.id }
        : { modelType, topProductId: top.id, bottomProductId: bottom.id };
```

### 4.3. `src/constants/community.js`

```js
export const CAMPAIGN_STATUS = { OPEN: "OPEN", CLOSED: "CLOSED" }; // DB. API 102 ví dụ "ACTIVE" → [KIỂM TRA]
export const CAMPAIGN_STATUS_LABEL = { OPEN: "Đang nhận đồ", CLOSED: "Đã đóng" };
export const POST_LIMITS = { MAX_CHARS: 2000, MAX_PHOTOS: 5 };          // OB-02 [GIẢ ĐỊNH tới khi BE chốt]
export const ORG_LIMITS = { MAX_OPEN_CAMPAIGNS: 3, DESCRIPTION_MAX: 300 }; // mục 11 tài liệu; OP-02
export const REPORT_TARGET = { POST: "POST", CAMPAIGN: "CAMPAIGN", ORGANIZATION_ACCOUNT: "ORGANIZATION_ACCOUNT" };
export const REPORT_REASONS = [
  { key: "SCAM", label: "Nội dung lừa đảo, kêu gọi tiền sai mục đích" },
  { key: "HATE", label: "Ngôn từ thù ghét hoặc quấy rối" },
  { key: "VIOLENT", label: "Hình ảnh phản cảm, bạo lực" },
  { key: "SPAM", label: "Spam hoặc quảng cáo không liên quan" },
  { key: "IMPERSONATION", label: "Mạo danh tổ chức khác" },
  { key: "OTHER", label: "Lý do khác" },
];
export const CAMPAIGN_ITEM_TYPES = ["Áo khoác", "Áo len", "Khăn, mũ", "Đồ trẻ em 3–12 tuổi", "Quần dài", "Giày dép", "Chăn, màn", "Đồ dùng học tập"];
```

`buildReportReason(key, detail)` giống `buildReasonText` của Phase 5 — "Lý do khác" thì **bắt buộc** mô tả.

### 4.4. `src/constants/notification.js` + `notificationRoute`

```js
export const NOTIFICATION_TYPE = {
  ORDER_UPDATE: "ORDER_UPDATE", WALLET_EVENT: "WALLET_EVENT", TERM_EXPIRY: "TERM_EXPIRY",
  VERIFICATION_RESULT: "VERIFICATION_RESULT", QUEUE_TASK: "QUEUE_TASK",
};
```

```js
// features/notifications/utils/notificationRoute.js — MỘT chỗ duy nhất (0.5 A19)
// [CHỜ BE] targetType/targetId; mock có sẵn để test
export function notificationRoute(n) {
  switch (n.targetType) {
    case "ORDER": return `/orders/${n.targetId}`;
    case "CONSIGNMENT_FORM": return `/consign-forms/${n.targetId}`;
    case "PRODUCT": return `/my-products/${n.targetId}`;
    case "RETURN_REQUEST": return `/returns/${n.targetId}`;
    case "WITHDRAWAL": return `/withdrawals/${n.targetId}`;
    case "PAYOUT": return `/wallet/payouts/${n.targetId}`;
    case "CAMPAIGN": return `/campaigns/${n.targetId}`;
    default: return null; // không có đích → chỉ đánh dấu đã đọc
  }
}
```

Phía tổ chức có bảng đích riêng (`/org/profile/legal-change-status`, `/org/posts/{id}/comments`…) — truyền `viewer` vào hàm, vẫn một file.

### 4.5. Thời gian

`formatRelative(at)`: < 1 phút "Vừa xong" · < 60 phút "n phút" · cùng ngày "n giờ" · hôm qua "Hôm qua" · trong tuần "T.5" · còn lại `dd/MM`. Đặt ở `utils/format.js`, dùng cho bài viết, bình luận, chat, thông báo.

---

## 5. Lớp API

### 5.1. `src/config/env.js`

```js
export const MOCK = {
  // … Phase 1–5 giữ nguyên
  tryon: true,          // API 96–99
  community: true,      // API 100–109 (xem công khai + thích, bình luận, theo dõi, báo cáo)
  chat: true,           // API 110–113
  notifications: true,  // API 114–116
  orgContent: true,     // API 117–126 + đổi pháp lý (phía tổ chức)
};
```

Axios: request API 97 truyền `timeout: TRYON_LIMITS.REQUEST_TIMEOUT_MS` + `signal` (huỷ được) — **chỉ cho request này**, không đổi timeout chung.

### 5.2. Bảng API Phase 6 (theo API_CONTRACT — [KIỂM TRA] với code BE)

| API | Method + path | Body / query | Trả về (contract) | Lỗi (contract) | BE thật |
|---|---|---|---|---|---|
| 96 | `GET /tryon/suggestions` | `excludeProductId, slot (TOP\|BOTTOM)` | `[{id, name, currentPrice}]` | 400 slot sai | ❌ |
| 97 | `POST /tryon/images` | `{modelType, topProductId, bottomProductId}` \| `{modelType, dressProductId}` | `{id, modelType, topProductId, bottomProductId, imageUrl, createdAt}` | 409 `INCOMPLETE_OUTFIT` (**trong message**) · 502 model lỗi / quá giờ | ❌ |
| 98 | `GET /tryon/images` | `page, size` | page `{content:[{id, imageUrl}]}` | 401 | ❌ |
| 99 | `DELETE /tryon/images/{id}` | — | `null` | 404 | ❌ |
| 100 | `GET /organizations/{id}` | — | `{id, displayName, description, isFollowing}` | 404 (chưa VERIFIED cũng 404) | ❌ |
| 101 | `GET /organizations/nearby` | `lat, lng` | `[{organizationId, displayName, donationPoint{address}, distanceKm, activeCampaigns[{id, endTime}]}]` | 400 | ❌ |
| 102 | `GET /campaigns/{id}` | — | `{id, description, startTime, endTime, locationName, status}` | 404 | ❌ |
| 103 | `POST` / `DELETE /organizations/{id}/follow` | — | `null` | 404 | ❌ |
| 104 | `GET /posts` | `organizationId?, page, size` | page `{content:[{id, organizationId, content, status}]}` | 401 newsfeed khi chưa đăng nhập | ❌ |
| 105 | `GET /posts/{id}` | — | `{id, content, likeCount, commentCount, likedByMe}` | 404 | ❌ |
| 106 | `POST` / `DELETE /posts/{id}/like` | — | `null` | 404 | ❌ |
| 107 | `GET /posts/{id}/comments` | `page, size` | page `{content:[{id, content, status}]}` | 404 | ❌ |
| 108 | `POST /posts/{id}/comments` | `{content}` | `{id, content, status}` | 400 · 404 | ❌ |
| 109 | `POST /violation-reports` | `{targetType, targetId, reason}` | `{id, status}` | 400 · 404 | ❌ |
| 110 | `GET /conversations` | — | `[{id, type, counterpart{id, displayName}, lastMessage, unreadCount}]` | 401 | ❌ |
| 111 | `POST /conversations` | `{type, counterpartId}` | `{id, type}` (đã có thì trả hội thoại cũ) | 404 | ❌ |
| 112 | `GET /conversations/{id}/messages` | `page, size` (mới nhất trước) | page `{content:[{id, senderId, content, createdAt}]}` | 403 · 404 | ❌ |
| 113 | `POST /conversations/{id}/messages` | `{content}` | `{id, content, createdAt}` | 400 · 404 | ❌ |
| 114 | `GET /notifications` | `page, size` | page `{content:[{id, type, message, isRead, createdAt}]}` | 401 | ❌ |
| 115 | `PATCH /notifications/{id}/read` | — | `null` | 404 | ❌ |
| 116 | `PATCH /notifications/read-all` | — | `null` | 401 | ❌ |
| 117 | `PATCH /organizations/me` | thông tin thường | `{id, …}` | 401 | ❌ |
| 118 | `POST /organizations/me/legal-change-requests` | `{proposedChanges:{…}}` | `{id, status:"PENDING"}` | 400 | ❌ |
| 119 | `POST /campaigns` | `{description, startTime, endTime, locationName, latitude, longitude, preferredItemTypes[]}` | `{id, status:"OPEN"}` | 400 · 409 `CAMPAIGN_LIMIT_REACHED` (**trong message**) | ❌ |
| 120 | `PUT /campaigns/{id}` | như 119 | `{id, …}` | 404 · 409 không OPEN | ❌ |
| 121 | `POST /campaigns/{id}/close` | — | `{id, status:"CLOSED"}` | 404 | ❌ |
| 122 | `GET /organizations/me/campaigns` | `status, page, size` | page `{content:[{id, description, status}]}` | 401 | ❌ |
| 123 | `POST /posts` | `{content, photoUrls[]}` | `{id, status}` | 400 | ❌ |
| 124 | `PUT /posts/{id}` | `{content, photoUrls?}` | `{id, content}` | 403 · 404 | ❌ |
| 125 | `DELETE /posts/{id}` | — | `null` | 403 · 404 | ❌ |
| 126 | `GET /organizations/me/posts` | `page, size` | page `{content:[{id, content, likeCount, commentCount}]}` | 401 | ❌ |
| — | `GET /api/organizations/me` | — | `verificationStatus`, lý do từ chối, hồ sơ | — | **chưa có** (CLAUDE.md) |
| — | `POST /uploads` | multipart | `{url}` | — | **chưa có** |

**Thiếu so với wireframe** (gom vào mục 11): API 50 thiếu `tryonSlot` / cờ ảnh tách nền; API 98 thiếu món trong ảnh (tên, giá, trạng thái còn bán), `modelType`, `createdAt`; API 100 thiếu logo, loại hình, phạm vi, ngày xác minh, điểm nhận đồ (địa chỉ, toạ độ, giờ nhận), số người theo dõi, số chiến dịch / bài viết; không có API chiến dịch công khai của **một tổ chức** và **tất cả** chiến dịch đang mở; API 102 thiếu tên, ảnh bìa, loại đồ cần, tổ chức (id, tên, logo), toạ độ, giờ nhận; API 104/105 thiếu thông tin tổ chức (tên, logo), ảnh, `createdAt`, số thích / bình luận, `likedByMe` (ở danh sách); API 107 thiếu người bình luận (tên, avatar), `createdAt`, `isMine`; API 110 thiếu avatar, cờ đã xác minh, thời gian tin cuối, tin cuối là của ai; API 112 không có cách đánh dấu đã đọc; API 114 thiếu `title`/`body` (DB có), đích (`targetType/targetId`), số chưa đọc; API 122/126 thiếu `createdAt`, ảnh, số theo trạng thái (cho chip "Đang diễn ra · 3").

### 5.3. Tên hàm (real và mock giống hệt)

```
// tryonApi
getSuggestions({ slot, excludeProductId })
getSlotProducts({ slot, page, size })        // tab "Tất cả" (0.5 A7)
createTryonImage(payload, { signal })        // payload từ buildTryonPayload
getTryonImages({ page, size })
getTryonImage(id)                            // [CHỜ BE] — real tạm tìm trong cache danh sách
deleteTryonImage(id)

// communityApi
getOrganization(id) · getNearbyOrganizations({ lat, lng }) · getOrgCampaigns(orgId, { status })
getCampaign(id) · getOpenCampaigns({ page, size })
follow(orgId) · unfollow(orgId) · getMyFollowing()          // PR-01 "Tổ chức đang theo dõi" [CHỜ BE]
getPosts({ scope: "ALL" | "FOLLOWING", organizationId, page, size }) · getPost(id)
like(postId) · unlike(postId)
getComments(postId, { page, size }) · addComment(postId, content)
report({ targetType, targetId, reason })

// chatApi
getConversations() · openConversation({ type, counterpartId }) · getMessages(id, { page, size })
sendMessage(id, content) · markRead(id)                        // markRead [CHỜ BE]

// notificationApi
getNotifications({ page, size }) · markRead(id) · markAllRead() · getUnreadCount()   // đếm [CHỜ BE]

// orgPortalApi (phía tổ chức)
getMyOrg() · updateMyOrg(patch) · submitLegalChange(proposedChanges) · getLegalChangeRequests()
getMyCampaigns({ status, page, size }) · createCampaign(body) · updateCampaign(id, body) · closeCampaign(id)
getMyPosts({ page, size }) · createPost(body) · updatePost(id, body) · deletePost(id)
```

### 5.4. Mock "sống"

- **Thử đồ** (`tryonApi.mock.js`): dùng sản phẩm mock Phase 3 (thêm `tryonSlot` cho từng sản phẩm: áo / quần / đầm, vài món **không** thử được). `createTryonImage` chờ **5–10 giây** (đủ thấy AI-03 + kịp bấm Chạy nền, test nhiều lần không quá lâu), tôn trọng `signal` (huỷ → ném lỗi huỷ); ảnh kết quả = ảnh sản phẩm áo (giả). **Không lỗi ngẫu nhiên** (tránh hỏng lúc demo) — chỉ trả **502** khi bấm Khung Mock "Lần sau lỗi". Bộ sưu tập mẫu 4 ảnh, 1 ảnh có món đã bán. Gợi ý: trả 0 món khi `excludeProductId` là món đặc biệt (để thấy AI-02 không gợi ý).
- **Cộng đồng** (`communityApi.mock.js`): 4–5 tổ chức (tên theo wireframe), mỗi tổ chức 1–3 chiến dịch (OPEN / CLOSED), 10–15 bài viết có ảnh, bình luận mẫu; Member mock đang theo dõi 2 tổ chức. Thích / bỏ thích, bình luận, theo dõi đổi dữ liệu thật trong RAM. `getNearbyOrganizations` tính khoảng cách thật từ toạ độ mock (haversine) để thấy sắp xếp.
- **Chat** (`chatApi.mock.js`): hội thoại mẫu như CH-01 (1 hộp thư kho + 4 tổ chức); `sendMessage` thêm tin; **2–4 giây sau tự trả lời** một câu mẫu (để thấy tự hỏi lại chạy) [chỉ mock]. `unreadCount` giảm khi mở phòng.
- **Thông báo** (`notificationApi.mock.js`): danh sách mẫu như PR-05 / OM-03 + hàm `mockNotify({type, title, body, targetType, targetId})`. **Gọi `mockNotify` từ các mock khác** khi có sự kiện: đơn đổi trạng thái (Phase 4 Khung Mock), hoàn tiền / rút tiền xong (Phase 4/5), yêu cầu trả được duyệt (Phase 5), tạo ảnh thử đồ xong. Như vậy bấm Khung Mock ở màn nào thì chuông cũng có thông báo — đúng cảm giác app thật.
- **Tổ chức** (`orgPortalApi.mock.js`): tổ chức mock "Quỹ Hạt Mầm Xanh" VERIFIED (đổi được sang PENDING / REJECTED bằng Khung Mock ở màn đăng nhập tổ chức / OrgHome), 3 chiến dịch OPEN (để thấy khoá tạo) + 5 CLOSED, 4 bài viết; tạo / sửa / đóng / xoá đổi dữ liệu và **dùng chung kho dữ liệu với `communityApi.mock`** (bài tổ chức đăng thì Member thấy ngay ở CD-01). Đổi pháp lý: tạo yêu cầu PENDING; Khung Mock "Moderator duyệt / từ chối".
- Mỗi hàm `await sleep(300–800ms)` (trừ thử đồ).

### 5.5. React Query

```js
export const tryonKeys = { images: ["tryon","images"], image: (id) => ["tryon","image",id],
  suggestions: (slot, ex) => ["tryon","suggest",slot,ex], slotProducts: (slot) => ["tryon","slot",slot] };
export const communityKeys = { feed: (scope) => ["community","feed",scope], post: (id) => ["community","post",id],
  comments: (id) => ["community","comments",id], org: (id) => ["community","org",id],
  orgCampaigns: (id) => ["community","orgCampaigns",id], campaign: (id) => ["community","campaign",id],
  openCampaigns: ["community","openCampaigns"], nearby: (lat, lng) => ["community","nearby",lat,lng],
  following: ["community","following"] };
export const chatKeys = { list: ["chat","list"], messages: (id) => ["chat","messages",id] };
export const notificationKeys = { list: ["notifications","list"], unread: ["notifications","unread"] };
export const orgKeys = { me: ["org","me"], campaigns: (s) => ["org","campaigns",s], posts: ["org","posts"],
  legalChanges: ["org","legalChanges"] };
```

| Thao tác | Cách cập nhật |
|---|---|
| Thích / bỏ thích | **Lạc quan**: `onMutate` sửa `likedByMe`, `likeCount` trong `post(id)` **và** mọi trang `feed(*)` có bài đó; `onError` trả lại; `onSettled` không cần tải lại cả feed |
| Theo dõi / bỏ theo dõi | Lạc quan ở `org(id)`; xong invalidate `feed("FOLLOWING")`, `following` |
| Bình luận | Thêm vào đầu trang 1 của `comments(id)` từ response; tăng `commentCount` |
| Gửi tin nhắn | Hiện ngay bong bóng "đang gửi" (id tạm), xong thay bằng tin thật; lỗi → bong bóng đỏ "Gửi lại" |
| Tạo ảnh thử đồ xong | invalidate `tryon.images` |
| Đọc thông báo | Sửa `isRead` trong cache + giảm `unread` |
| Tạo / sửa / đóng chiến dịch, đăng / sửa / xoá bài (tổ chức) | invalidate `org.*` **và** `community.*` liên quan |

**Tự hỏi lại** (không có realtime):
- Phòng chat đang mở: `refetchInterval: 3000` (dừng khi rời màn / app nền).
- Danh sách hội thoại + badge tin nhắn: 30 giây khi đang ở tab Cá nhân / màn tin nhắn; + khi app quay lại `active`.
- Số thông báo chưa đọc: 60 giây + khi app quay lại `active` + sau mỗi thao tác Khung Mock.

---

## 6. Business rules áp dụng trên app

| Quy tắc | Nguồn | App làm gì |
|---|---|---|
| Thử đồ mở **từ trang sản phẩm**; món đang xem **khoá** vào slot | F-072, F-074 | AI-01 slot của món đang xem không đổi được (nhãn "MÓN BẠN ĐANG XEM") |
| Outfit = **Áo + Quần, hoặc Đầm**; chưa đủ thì chặn nút tạo ảnh | F-077, CLAUDE.md | `isOutfitComplete`; nút mờ + câu nhắc |
| Chỉ gợi ý / chọn món **ON_SALE** | API 96 | Tab Tất cả dùng API 49 (chỉ ON_SALE) |
| Ảnh trả về **< 120 giây** | đề tài | Timeout 150 giây; quá → lỗi + Thử lại |
| Ảnh **tự lưu** khi tạo xong; xoá ảnh không ảnh hưởng sản phẩm / đơn | F-079, F-081, AI-06 | Câu nhắc ở AI-04, AI-06 |
| Ảnh AI chỉ để hình dung, **không phản ánh size thật** | AI-01/03/04 | Nhãn "ẢNH DỰNG BẰNG AI" + câu nhắc |
| Món trong outfit đã bán → báo khi thêm vào giỏ, bỏ món đó | L-08 unhappy | AI-04/06 "Không còn khả dụng", thêm outfit chỉ thêm món còn bán |
| Chỉ hiện **tổ chức đã xác minh** | F-082, API 100 | 404 → `EmptyState` "Tổ chức không còn hoạt động" |
| Quyên góp: **Member tự mang đồ tới**, ReHome không vận chuyển, **không ghi nhận** | L-09, API 102, CD-04 | Câu nhắc ở CD-04; không có nút "Quyên góp" |
| Chiến dịch hết hạn tự đóng | F-102 | Hiện theo `status` + "Còn n ngày"; CLOSED → nhãn "Đã đóng" |
| Tối đa **3 chiến dịch đang chạy** / tổ chức | F-099, mục 11 | OC-01 khoá nút tạo + "Khoá vì đang có 3 / 3 chiến dịch"; vẫn xử lý 409 |
| Báo cáo dùng chung cho bài viết / chiến dịch / tài khoản tổ chức; người bị báo cáo **không biết ai** báo | F-088, CD-06 | Một màn `report.js` theo `targetType` |
| Chat tổ chức **chỉ mở khi Member bấm Nhắn tin**; tổ chức không tự nhắn trước; hội thoại đã có thì dùng lại | API 111, OM-01, CH-01 | `openConversation` rồi `router.push` phòng |
| Hộp thư kho: mọi Moderator trong kho thấy chung, **không hiện tên từng người** | F-091, CH-02 | Tên người gửi phía kho = "Nhân viên ReHome" |
| Cảnh báo an toàn trong chat | CH-02 | "ReHome không bao giờ hỏi mật khẩu hay mã OTP" (hộp thư kho); "Bạn đang nhắn với tổ chức, không phải ReHome…" (tổ chức) |
| Thông tin thường sửa **ngay**; thông tin pháp lý phải **Moderator duyệt**, hồ sơ công khai giữ thông tin cũ tới khi duyệt | F-096, F-097, OP-04 | OP-01 tách 2 khối; nhãn "cần duyệt" |

---

## 7. Spec từng màn hình — Phần A (Member)

Chung: loading, `ErrorBox` + "Thử lại", kéo tải lại, lỗi mạng, 403/404 → `EmptyState`. Ảnh dùng `expo-image` (nếu đã cài) có ô giữ chỗ. Thời gian dùng `formatRelative`.

### BR-04 · Bật nút Thử đồ AI

- `canTryOn(product)` → nút phụ **Thử đồ AI** (icon `sparkles-outline`) dưới khối giá hoặc cạnh "Thêm vào giỏ" (không chiếm chân màn). Guest → hỏi đăng nhập.
- Bấm → `router.push("/tryon?productId=<id>")`.

### AI-01 / AI-03 · Phòng thử đồ (`tryon/index.js?productId=`)

- Header: ← · "Phòng thử đồ" · nút **Bộ sưu tập** (→ AI-05).
- **Người mẫu**: `ChipGroup` Nữ / Nam (mặc định Nữ [GIẢ ĐỊNH]; nhớ lựa chọn lần trước trong RAM).
- Khung lớn: ảnh người mẫu tĩnh (0.5 A8) + nhãn "Người mẫu nữ — chưa có outfit" / "— sẵn sàng tạo ảnh".
- `SlotCard` × 2 (Áo, Quần) hoặc × 1 (Đầm — 0.5 A9):
  - Slot của món đang xem: ảnh, tên, giá, nhãn **MÓN BẠN ĐANG XEM**, không có ✕.
  - Slot còn lại trống: viền đứt "+ Chưa chọn" + nút **Chọn quần / Chọn áo** → AI-02.
  - Đã chọn: ảnh, tên, giá, ✕ (bỏ chọn), **Đổi món khác** (→ AI-02).
- Footer: **Tạo ảnh thử đồ** (mờ khi chưa đủ bộ) + chữ nhỏ: chưa đủ "Cần đủ cả áo và quần mới tạo được ảnh. Hãy chọn thêm một chiếc quần." / đủ "Mất khoảng 30 giây. Ảnh chỉ để hình dung, không phản ánh size thật trên người bạn."
- Món chọn ở AI-02 truyền về qua state của màn (hoặc `tryonDraftStore` nhỏ) — **không** qua params dài.
- Món đang xem không thử được (vào thẳng bằng link) → `EmptyState` "Món này chưa hỗ trợ thử đồ".

**Đang tạo (AI-03)** — cùng màn, sau khi bấm Tạo ảnh:
- `useTryonJob.start(payload)` → `tryonJobStore` giữ `{status: "RUNNING", startedAt, payload, controller}`.
- Khung: vòng xoay + "Đang ghép outfit lên người mẫu" + "Thường mất 20 – 40 giây…" + **"Đã chờ 14 giây"** (đếm từ `startedAt`) — không thanh %/bước giả (0.5 A2).
- Thẻ tóm tắt: 2 ảnh nhỏ + "Áo khoác dạ nữ + Quần jeans ống rộng trên người mẫu nữ".
- NoteBox "Ảnh do mô hình AI dựng ra… Không phản ánh form dáng và size thật…".
- Footer: **Chạy nền, báo tôi khi xong** (→ `router.back()`, job chạy tiếp) · **Huỷ** (`Alert` → `controller.abort()` → về trạng thái AI-01; 0.5 A4).
- Xong: đang ở màn → `router.replace("/tryon/result/<id>")`; đã rời màn → `showToast("Ảnh thử đồ đã xong")` có nút **Xem** (hoặc toast + dấu chấm ở PR-01 "Ảnh thử đồ đã lưu").
- Lỗi 502 / quá 150 giây → khối lỗi "Chưa tạo được ảnh. Máy chủ AI đang bận hoặc quá giờ." + **Thử lại** (giữ nguyên bộ đồ). 409 thiếu bộ → quay về AI-01.
- Chỉ **một** job chạy cùng lúc: đang chạy mà mở phòng thử đồ khác → dải "Đang tạo một ảnh khác… · Xem" và nút Tạo ảnh mờ.

### AI-02 · Chọn món còn thiếu (`tryon/pick.js?slot=&excludeId=`)

- Header: ✕ · "Chọn quần" / "Chọn áo".
- Dải "Ghép với: <ảnh> <tên món đang xem> · <thương hiệu>".
- Chip **Gợi ý · n** / **Tất cả <quần> · n**:
  - Gợi ý (API 96): chữ "Hệ thống chọn theo tông màu và kiểu dáng hợp với áo bạn đang xem. Bạn vẫn đổi sang tab Tất cả để tự chọn."
  - Gợi ý rỗng → chip Gợi ý mờ "Gợi ý · 0", **tự mở** tab Tất cả + NoteBox "Chưa có món nào hợp tông để gợi ý — hàng ký gửi là đồ cũ nên kho không phải lúc nào cũng có đủ. Dưới đây là toàn bộ quần đang bán, bạn tự chọn nhé."
  - Tất cả: lưới cuộn vô hạn (0.5 A7), bỏ chính món đang xem.
- Lưới 2 cột `ProductCard` (dùng lại Phase 3) — bấm chọn (viền đậm), bấm lại bỏ chọn.
- Footer **Chọn <tên món>** (mờ "Chọn một món để tiếp tục" khi chưa chọn) → trả về AI-01, `router.back()`.

### AI-04 · Kết quả (`tryon/result/[id].js`)

- Header: ← · "Kết quả thử đồ" · **Tạo lại** (0.5 A6). (Chia sẻ ẩn — 0.5 A5.)
- Ảnh lớn + `AiBadge` "ẢNH DỰNG BẰNG AI" + dải dưới ảnh "Ảnh minh họa cách phối đồ. Không phản ánh form dáng và size thật trên người bạn." Bấm ảnh → xem toàn màn (pinch-zoom không bắt buộc).
- `OutfitItemRow` từng món: ảnh, tên, giá, nút **Mua lẻ** (→ `products/[id]`); món không còn bán → mờ + "Không còn khả dụng".
- Chữ nhỏ "Ảnh đã tự lưu vào bộ sưu tập của bạn".
- Footer **Thêm cả outfit vào giỏ — <tổng các món còn bán>** + chữ nhỏ "Hai món ở hai kho khác nhau, khi đặt sẽ tách thành 2 đơn." (chỉ khi khác kho):
  - Gọi `addToCart` lần lượt; `ALREADY_IN_CART` bỏ qua (coi như đã có); `PRODUCT_NOT_AVAILABLE` → ghi lại.
  - Xong: toast "Đã thêm n món vào giỏ" (+ "1 món không còn bán" nếu có) + nút **Xem giỏ**.
  - Mọi món đều đã có trong giỏ → nút thành **Xem giỏ hàng**.

### AI-05 · Bộ sưu tập (`tryon/collection/index.js`)

- Header: ← · "Bộ sưu tập thử đồ". (Nút "Chọn" để xoá nhiều: ẩn ở Phase 6 [GIẢ ĐỊNH] — xoá từng ảnh ở AI-06.)
- Dải "n ảnh · lưu tự động khi bạn tạo".
- Lưới 2 cột ảnh dọc (tỉ lệ 3:4): nhãn **MỚI** (ảnh tạo trong 24 giờ [GIẢ ĐỊNH]) / **1 MÓN ĐÃ BÁN** · dưới ảnh "Áo khoác dạ + Quần jeans" · "dd/MM/YYYY · còn mua được / không mua đủ được" (cần thông tin món — mục 11 câu 4).
- Đang có job chạy → ô đầu lưới là ô "Đang tạo…" có vòng xoay.
- Rỗng: `EmptyState` "Chưa có ảnh thử đồ nào. Mở một sản phẩm và bấm Thử đồ AI." + nút **Khám phá sản phẩm**.

### AI-06 · Xem ảnh (`tryon/collection/[id].js`)

- Header: ← · "dd/MM/YYYY · Áo khoác dạ + Quần jeans" · 🗑.
- Ảnh lớn + `AiBadge`.
- **Sản phẩm trong ảnh này**: từng món (nhãn CÒN MUA ĐƯỢC / ĐÃ BÁN) + **Thêm giỏ** · **Mua ngay** (→ checkout Phase 3) hoặc "Không còn khả dụng".
- Chữ nhỏ: "Giá và tình trạng còn hàng lấy theo sàn hiện tại — có thể khác lúc bạn thử đồ."
- 🗑 → `Alert` "Xoá ảnh thử đồ này? Ảnh biến mất khỏi Bộ sưu tập, không khôi phục được. Việc này không ảnh hưởng tới sản phẩm hay bất kỳ đơn hàng nào." [Giữ lại] [Xoá ảnh — destructive] → `deleteTryonImage` → `router.back()` + toast.

### CD-01 · Tab Cộng đồng (`(tabs)/community.js`)

- Header: "Cộng đồng" · nút **Bản đồ** (→ CD-05; Guest → hỏi đăng nhập) · (Member) chuông thông báo nếu chọn đặt chuông ở đây [GIẢ ĐỊNH — mặc định đặt ở tab Cá nhân].
- Chip: **Tất cả** · **Đang theo dõi** (chỉ Member) · **Chiến dịch** (0.5 A10, A11). Nhớ chip đang chọn trong state.
- Bài viết (`PostCard`): avatar + tên tổ chức + `VerifiedBadge` · "2 giờ trước · <phạm vi/khu vực>" · nội dung (6 dòng, "Xem thêm") · `PostPhotos` (1 ảnh lớn / 2–4 ảnh lưới) · hàng cuối **♡ 48** (`LikeButton`) · **Bình luận 7** · bấm thân → CD-02; bấm tên tổ chức → CD-03.
- Chip Chiến dịch: `CampaignCard` (tên / dòng đầu mô tả, tổ chức, "Nhận tới dd/MM · còn n ngày", khoảng cách nếu có) → CD-04.
- Rỗng: Đang theo dõi "Bạn chưa theo dõi tổ chức nào. Xem tổ chức gần bạn để bắt đầu." + nút **Tổ chức gần bạn**; Tất cả "Chưa có bài viết nào".
- Tab nằm trong `(tabs)` → `Screen edges={["top"]}`, `padded={false}` (FlatList kéo tải lại).

### CD-02 · Bài viết (`posts/[id].js`)

- Header: ← · "Bài viết" · **Báo cáo** (Member; → `report?targetType=POST&targetId=`).
- Đầu bài: tổ chức + thời gian + `FollowButton` (Theo dõi / Đang theo dõi).
- Nội dung đầy đủ + ảnh (bấm xem to, lướt ngang).
- Hàng **♥ Đã thích · 49** / **♡ Thích · 48** + "Bình luận · 7".
- Danh sách bình luận (`CommentItem`: avatar, tên, thời gian, nội dung; bình luận của mình hiện tên "Bạn"; 0.5 A14), cuộn vô hạn.
- `CommentComposer` cố định đáy: "Viết bình luận…" + **Gửi** (mờ khi trống; 1–500 ký tự [GIẢ ĐỊNH]); Guest → bấm ô nhập thì hỏi đăng nhập. Gửi xong cuộn tới bình luận mới.
- Bàn phím không che ô nhập (mục 2).

### CD-03 · Hồ sơ tổ chức (`organizations/[id].js`)

- Header: ← · "Tổ chức" · **Báo cáo** (→ `targetType=ORGANIZATION_ACCOUNT`).
- Đầu: logo + tên + `VerifiedBadge` "Đã xác minh" · "Quỹ từ thiện · Toàn quốc" · nút **Theo dõi** + **Nhắn tin** (→ `openConversation({type: MEMBER_ORGANIZATION, counterpartId})`).
- Khối **Nhận đồ tại**: địa chỉ · "cách 3,2 km" (nếu có vị trí) · giờ nhận · **Chỉ đường**.
- "Người theo dõi 1.204" (nếu BE trả).
- Chip **Chiến dịch · 3** / **Bài viết · 18**: danh sách chiến dịch (ĐANG NHẬN lên trước, ĐÃ ĐÓNG mờ) / bài viết của tổ chức (API 104 `organizationId`).
- 404 → "Tổ chức không còn hoạt động trên ReHome".

### CD-04 · Chiến dịch (`campaigns/[id].js`)

- Header: ← · "Chiến dịch" · **Báo cáo** (→ `targetType=CAMPAIGN`).
- Ảnh bìa (nếu có) + nhãn **ĐANG NHẬN ĐỒ** / **ĐÃ ĐÓNG**.
- Tên (0.5 A16) · tổ chức + Đã xác minh (bấm → CD-03).
- Khối "Nhận đồ tới hết **30/11/2026** · Còn 50 ngày" (đã đóng: "Đã đóng dd/MM").
- **Loại đồ đang cần** (chip đọc). **Mô tả**.
- **Mang đồ tới đâu**: `locationName`, địa chỉ, giờ nhận, "Cách bạn khoảng 3,2 km" (0.5 A15).
- Footer: **Chỉ đường** (`Linking.openURL` Google Maps theo toạ độ — như KG-04 Phase 2) · **Nhắn tin** (với tổ chức).
- Chữ nhỏ cuối: "Bạn tự mang đồ tới — ReHome không vận chuyển và không nhận đồ hộ."

### CD-05 · Tổ chức gần bạn (`organizations/nearby.js`)

- Xin quyền vị trí như KG-03 (Phase 2, `expo-location` đã có). Từ chối → NoteBox "Bật vị trí để xem tổ chức gần bạn" + nút **Mở cài đặt** (`Linking.openSettings()`); không có toạ độ thì không gọi API 101 (API bắt buộc lat/lng).
- Dải "n tổ chức gần bạn · trong bán kính 5 km" ([KIỂM TRA] bán kính BE dùng).
- Danh sách: tên + Đã xác minh · "Quỹ từ thiện · T2–T7 · 08:00–17:00" · "2 chiến dịch đang nhận đồ" · **3,2 km** · nút **Chỉ đường**; bấm dòng → CD-03.
- Bản đồ: 0.5 A13.

### CD-06 · Báo cáo vi phạm (`report.js?targetType=&targetId=`)

- Header: ← · "Báo cáo vi phạm".
- Khối tóm tắt đối tượng (đổi theo `targetType`): "Bài viết của <tổ chức> · "<trích nội dung>…"" / "Chiến dịch <tên>" / "Tổ chức <tên>".
- **Chọn lý do** (`RadioCard` cột, `REPORT_REASONS`, bắt buộc) + **Mô tả thêm** (không bắt buộc; "Lý do khác" thì bắt buộc).
- NoteBox "Người bị báo cáo không biết ai đã báo cáo."
- Footer **Gửi báo cáo** → `report(...)` → trạng thái **Đã gửi**: ✓ "Đã gửi báo cáo. Moderator sẽ xem xét trong thời gian sớm nhất." + **Đóng** (`router.back()`).

### CH-01 · Tin nhắn (`messages/index.js`)

- Header: ← · "Tin nhắn" · (tuỳ chọn) nút **Hỏi kho** (0.5 A21).
- `ConversationRow`: avatar (kho = icon kho) · tên + "Hộp thư kho" / "Đã xác minh" · thời gian tin cuối · tin cuối ("Bạn: …" nếu của mình) · badge số chưa đọc. Hộp thư kho ghim đầu [GIẢ ĐỊNH].
- Chữ nhỏ cuối: "Hội thoại với tổ chức chỉ xuất hiện sau khi bạn bấm Nhắn tin ở trang tổ chức."
- Rỗng: "Chưa có tin nhắn nào."

### CH-02 · Phòng chat (`messages/[id].js` — dùng chung `ChatRoomScreen` cho tổ chức)

- Header: ← · tên đối tác + "Hộp thư kho · Giờ hỗ trợ 8:00–17:00" hoặc "Đã xác minh · Tổ chức".
- `ChatNotice` ghim đầu (mục 6): hộp thư kho "Hỏi về đơn hàng, ký gửi, hoàn tiền. ReHome không bao giờ hỏi mật khẩu hay mã OTP." / tổ chức "Bạn đang nhắn với tổ chức, không phải ReHome. Hỏi về đơn hàng hoặc ký gửi hãy dùng Hộp thư kho."
- Danh sách `FlatList inverted` (API trả mới nhất trước — khớp `inverted`), nhóm theo ngày ("Hôm qua", "Hôm nay"), `MessageBubble` phải (mình) / trái (đối tác; phía kho tên "Nhân viên ReHome"), giờ `HH:mm`; cuộn lên tải trang cũ hơn.
- `ChatInput` cố định đáy: ô nhiều dòng (tối đa 4 dòng hiển thị, 1–1000 ký tự [GIẢ ĐỊNH]) + **Gửi**. Ẩn nút Ảnh / Đơn (0.5 A17).
- Gửi lạc quan (mục 5.5); mở phòng → `markRead` (nếu BE có) + giảm badge.
- **Mở từ ngữ cảnh** (`useOpenConversation`): gọi `openConversation` rồi `router.push("/messages/<id>")`; có thể truyền **tin mở đầu soạn sẵn** vào ô nhập (không tự gửi), vd từ đơn: "Cho mình hỏi về đơn OD-…".
- **Bật lại các nút đã ẩn** (Phase 2–5) — dùng `useOpenConversation({type: MEMBER_WAREHOUSE, counterpartId: warehouseId, draft})`: KG-10 "Nhắn cho kho", KG-12 "Nhắn cho kho", BR-11/12 "Nhắn cho kho" / "Báo cho kho", RT-02 "Nhắn cho kho", VI-05 "Nhắn hỗ trợ" (kho? → [CHỜ LEAD] hỗ trợ ví gửi về đâu), RT-02 "Khiếu nại kết luận" (gửi về kho của đơn, soạn sẵn "Khiếu nại kết luận yêu cầu <mã>"). Ghi lại từng chỗ vào guide của phase đó.

### PR-05 · Thông báo (`notifications.js` — dùng chung cho tổ chức)

- Chuông + badge chưa đọc: đặt ở header **tab Cá nhân** (bên trái ⚙) [GIẢ ĐỊNH]; phía tổ chức đặt ở header tab Hồ sơ.
- Header: ← · "Thông báo" · **Đánh dấu đã đọc** (mờ khi không còn chưa đọc).
- Nhóm **Hôm nay** / **Trước đó**; `NotificationRow`: icon theo `type` · tiêu đề (đậm khi chưa đọc + chấm) · nội dung 2 dòng · thời gian.
- Bấm → `markRead` + `notificationRoute(n)` → `router.push`; không có đích thì chỉ đánh dấu.
- Rỗng: "Chưa có thông báo nào".

### PR-01 · Bật các dòng

- **Ảnh thử đồ đã lưu** → `tryon/collection` (+ chấm khi có ảnh mới từ job chạy nền).
- **Tổ chức đang theo dõi** → danh sách đơn giản (dùng lại `ConversationRow`-like / `OrgRow`) [CHỜ BE `getMyFollowing`]; chưa có API → mở tab Cộng đồng chip Đang theo dõi.
- **Tin nhắn · n chưa đọc** → `messages`.

---

## 8. Spec từng màn hình — Phần B (Tổ chức)

### Điều hướng tổ chức (sửa `_layout.js` + `authStore`)

Đây là bước 4, 7, 8, 9 còn dở của `feature/org-real-api` (CLAUDE.md "Khi BE xong tổ chức"):
- Đăng nhập role ORGANIZATION → `authStore` gọi `orgPortalApi.getMyOrg()` (**không** gọi `/members/me`) → lưu `org.verificationStatus`.
- `_layout.js`: `Stack.Protected` — chưa nộp hồ sơ → `(org)/org/registration`; `PENDING` / `REJECTED` → `(org)/org/status`; `VERIFIED` → `(org)/org/(tabs)`.
- Chưa có `GET /api/organizations/me` → mock (`MOCK.organization`) + Khung Mock ở màn trạng thái để đổi trạng thái.
- ⚠️ Đã có `(org)/org/index.js` (`OrgHomeScreen`, Phase 1). Khi thêm `(org)/org/(tabs)/…`, `index.js` chỉ còn làm **chuyển hướng** theo trạng thái (chưa nộp → `registration`, PENDING/REJECTED → `status`, VERIFIED → `(tabs)/campaigns`) — không để hai màn cùng là `/org`.

### OA-06 · Trạng thái hồ sơ (`(org)/org/status.js`)

- **Chờ xác minh**: "ReHome cho tổ chức" · "Hồ sơ đang chờ xác minh · gửi dd/MM · thường 1–2 ngày làm việc" + kéo tải lại / nút **Kiểm tra lại** + **Đăng xuất**.
- **Bị từ chối**: "Hồ sơ chưa được duyệt" · ngày · **Lý do từ chối** · **Giấy tờ đã nộp** (✓ đạt / ✕ chưa đủ — nếu BE trả) · "Gửi lại thì chỉ cần bổ sung phần thiếu…" · nút **Bổ sung hồ sơ** → 4 bước đăng ký điền sẵn → `PUT` (0.5 B10).

### Khung 4 tab (`(org)/org/(tabs)/_layout.js`)

Chiến dịch · Bài viết · Tin nhắn · Hồ sơ — khai báo bằng mảng như `TABS` của Member; icon `megaphone`, `newspaper`, `chatbubbles`, `business` (outline / đặc).

### OC-01 · Chiến dịch của tổ chức (`(tabs)/campaigns.js`)

- Chip **Đang diễn ra · 3** / **Đã đóng · 5**.
- `CampaignCard` (dùng chung): tên · "Nhận tới dd/MM · còn n ngày" · nhãn · nút **Mở** → OC-03.
- Footer **Tạo chiến dịch mới**; đang có `ORG_LIMITS.MAX_OPEN_CAMPAIGNS` chiến dịch OPEN → mờ + "Khoá vì đang có 3 / 3 chiến dịch".

### OC-02 / OC-04 · Tạo / sửa chiến dịch (`campaigns/new.js`, `campaigns/[id]/edit.js`)

Một `CampaignForm` cho cả hai (như `ConsignFormFields`):
- **Tên chiến dịch \*** (nếu BE có — 0.5 A16) · **Ảnh bìa** (`PhotoPicker` 1 ảnh; nếu BE có) · **Mô tả \*** (nhiều dòng) · **Nhận đồ từ ngày — đến ngày \*** (2 `DateField`; chữ nhỏ "Hết ngày cuối, chiến dịch tự đóng — không cần bạn làm gì.") · **Loại đồ đang cần \*** (`ItemTypePicker`: chip `CAMPAIGN_ITEM_TYPES` chọn nhiều + "Thêm loại khác"; chữ nhỏ "Chọn càng đúng, người quyên góp càng ít mang nhầm đồ…") · **Địa điểm nhận đồ** (chỉ đọc = điểm nhận của tổ chức; gửi `locationName`, `latitude`, `longitude` từ hồ sơ — 0.5 A15).
- Sửa: dữ liệu điền sẵn; **ngày bắt đầu khoá** khi đã bắt đầu (0.5 B4) + chữ nhỏ; nút Lưu mờ khi chưa sửa.
- Footer: **Đăng chiến dịch** / **Lưu thay đổi** (+ **Huỷ**). 409 `CAMPAIGN_LIMIT_REACHED` → `Alert` + về OC-01.
- `campaignSchema` (zod 4): mô tả 20–2000 ký tự [GIẢ ĐỊNH], ngày kết thúc > ngày bắt đầu, ngày bắt đầu ≥ hôm nay (khi tạo), ≥ 1 loại đồ.

### OC-03 · Chi tiết chiến dịch (`campaigns/[id]/index.js`)

- Như CD-04 (dùng chung `CampaignInfo`), thêm: header nút **Sửa**; footer **Sửa chiến dịch** · **Đóng sớm** (`Alert` "Đóng chiến dịch? Chiến dịch biến khỏi Cộng đồng ngay, không chờ tới dd/MM." → `closeCampaign`). Chiến dịch CLOSED → không có 2 nút.

### OB-01 · Bài viết đã đăng (`(tabs)/posts.js`)

- Header "Bài viết đã đăng" + **+ Đăng bài**.
- Thẻ: ảnh nhỏ · ngày · nội dung 2 dòng · ⋯ (`Alert`/sheet: **Sửa** · **Xem bình luận** · **Xoá**) · hàng "♥ 86 · Bình luận 12".
- Xoá → `Alert` "Xoá bài viết này? Bài “<trích>” cùng **41 lượt thích và 7 bình luận** sẽ biến mất khỏi Cộng đồng. Không khôi phục được." [Giữ lại] [Xoá bài].
- Rỗng: "Chưa có bài viết nào. Chia sẻ hoạt động của tổ chức để người quyên góp tin tưởng hơn." + **Đăng bài đầu tiên**.

### OB-02 / OB-03 · Đăng / sửa bài (`posts/new.js`, `posts/[id]/edit.js`)

- **Nội dung \*** (nhiều dòng, đếm "0 / 2000") · **Ảnh · tối đa 5 ảnh** (`PhotoPicker`; ảnh đang tải lên hiện %) · (gắn chiến dịch: ẩn — 0.5 B5).
- Footer **Huỷ** · **Đăng bài** (mờ khi trống) / **Lưu thay đổi** (mờ khi chưa sửa). Thoát khi đã nhập → "Bỏ bài đang soạn?".
- Gửi: upload ảnh mới (`uploadFile`) → `createPost` / `updatePost` (ảnh cũ là URL giữ nguyên — như KG-05 Phase 2).

### OB-05 · Bình luận (`posts/[id]/comments.js`)

- Header "Bình luận · n" · dải bài viết (ảnh, trích, ngày, ♥).
- Danh sách bình luận chỉ đọc (dùng chung `CommentItem`). (Tổ chức trả lời bình luận: không có trong F-code → không làm.)

### OM-01 · Tin nhắn (`(tabs)/messages.js`) và phòng chat (`messages/[id].js`)

- Dùng chung `ConversationListScreen` / `ChatRoomScreen` với `viewer="org"`: đối tác là Member (tên + "Thành viên"), không có `ChatNotice` an toàn của kho, không có nút tạo hội thoại (0.5 B11). Chữ nhỏ: "Hội thoại chỉ mở khi Member bấm Nhắn tin."

### OM-03 · Thông báo (`notifications.js`)

- Dùng chung `NotificationListScreen` (`viewer="org"`): kết quả xác minh / đổi pháp lý (`VERIFICATION_RESULT`), kết quả xử lý báo cáo trên nội dung của mình, chiến dịch sắp hết hạn.

### OP-01 · Hồ sơ tổ chức (`(tabs)/profile.js`)

- Đầu: logo + tên + "Đã xác minh dd/MM/YYYY".
- **Thông tin thường** (sửa ngay): Tên hiển thị · Logo · Mô tả · Điện thoại · Địa điểm nhận đồ + giờ nhận → nút **Sửa thông tin thường** (OP-02).
- **Thông tin pháp lý** (nhãn "cần duyệt" từng dòng): Tên pháp lý · Loại hình · Người đại diện · Giấy tờ "3 tệp đã xác minh" → nút **Đổi pháp lý** (OP-04). Có yêu cầu đang chờ → dải "Yêu cầu đổi pháp lý đang chờ duyệt · Xem" (→ OP-05) và nút Đổi pháp lý mờ [GIẢ ĐỊNH: một yêu cầu một lúc].
- Cuối: chuông Thông báo · Đổi mật khẩu (AU-07 dùng chung) · **Đăng xuất**.

### OP-02 · Sửa thông tin thường (`profile/edit.js`)

- Đổi ảnh đại diện (logo) · **Tên hiển thị \*** · **Mô tả \*** (≤ 300 ký tự, đếm) · **Số điện thoại \*** (số di động 10 số hoặc số bàn 11 số như OA-01) · **Giờ nhận đồ \*** (ngày trong tuần + giờ, dùng lại khối giờ của OA-04).
- NoteBox "Thông tin thường — sửa xong áp dụng ngay, không cần Moderator duyệt."
- Lỗi: hộp đầu "Có lỗi, kiểm tra lại" + lỗi dưới từng ô (OP-02 Lỗi validate). **Lưu thay đổi** mờ khi chưa sửa → `updateMyOrg` (chỉ gửi trường đã đổi) → toast + về OP-01.

### OP-04 · Đổi thông tin pháp lý (`profile/legal-change.js`)

- NoteBox "Gửi xong, hồ sơ công khai giữ nguyên thông tin cũ cho tới khi Moderator duyệt. Chiến dịch và bài viết vẫn chạy bình thường."
- **Chọn thông tin muốn đổi** (`Checkbox`): Người đại diện theo pháp luật · Tên pháp lý · Loại hình. Tích mục nào hiện form mục đó; chữ nhỏ "Khai lại đầy đủ như lúc đăng ký, không sửa từng phần."
- Từng form **dùng lại component đăng ký tổ chức** (0.5 B8), mỗi form có dòng "Hiện tại: …":
  1. Người đại diện mới: họ tên, chức vụ, SĐT, email, CCCD 2 mặt (chụp / thư viện), họ tên trên thẻ, số CCCD, ngày cấp, nơi cấp.
  2. Tên pháp lý mới + giấy tờ pháp lý mới (`LegalDocCard`).
  3. Loại hình mới (danh sách như OA-01) + chữ "Đổi loại hình thì phải nộp giấy tờ tương ứng".
- Footer **Gửi yêu cầu** (mờ khi chưa tích mục nào) → upload tệp → `submitLegalChange({...})` → `router.replace("/org/profile/legal-change-status")`.

### OP-05 · Trạng thái yêu cầu (`profile/legal-change-status.js`)

- **Chờ duyệt**: "Đã gửi dd/MM · thường xử lý trong 1–2 ngày làm việc. Hồ sơ công khai vẫn giữ thông tin cũ cho tới khi duyệt xong." + bảng thông tin đã khai (nhãn "cần duyệt").
- **Đã duyệt · đã áp dụng**: ngày duyệt + bảng (nhãn "✓ áp dụng") + **Xem hồ sơ tổ chức**.
- **Bị từ chối**: ngày + bảng + **Lý do từ chối** + **Gửi lại yêu cầu** (OP-04 điền sẵn).

---

## 9. Tự kiểm tra trước khi push

**Thử đồ**
- [x] BR-04: món áo / quần / đầm có nút Thử đồ; món không thử được không có nút; Guest → đăng nhập → quay lại đúng món.
- [x] AI-01: thiếu quần → nút mờ + câu nhắc; chọn quần ở AI-02 (gợi ý / tất cả) → đủ bộ; đầm → chỉ một ô, bấm được ngay; đổi Nữ / Nam.
- [x] AI-02 món "không có gợi ý" → tự sang tab Tất cả + câu giải thích.
- [x] AI-03: đồng hồ "Đã chờ n giây" chạy; **Chạy nền** → đi xem màn khác → toast "Ảnh thử đồ đã xong · Xem" → mở đúng ảnh; **Huỷ** → về AI-01; Khung Mock "Lần sau lỗi" → khối lỗi + Thử lại.
- [x] AI-04: Thêm cả outfit → giỏ có 2 món (badge tăng), lần 2 → "Xem giỏ hàng"; một món đã bán (Khung Mock Phase 3) → báo, chỉ thêm món còn bán.
- [x] AI-05/06: ảnh mới lên đầu; nhãn "1 MÓN ĐÃ BÁN"; xoá có hỏi, xoá xong biến khỏi lưới.

**Cộng đồng**
- [x] Tab Cộng đồng: 3 chip; Guest không có Đang theo dõi; kéo tải lại; cuộn vô hạn.
- [ ] Thích → số tăng ngay; tắt mạng rồi thích → số trả lại + toast lỗi.
- [x] CD-02: bình luận → hiện ngay, số bình luận tăng ở cả feed; bàn phím không che ô nhập.
- [x] Theo dõi ở CD-02 / CD-03 → chip Đang theo dõi có bài của tổ chức đó.
- [x] CD-04: Chỉ đường mở Google Maps đúng điểm; Nhắn tin mở đúng hội thoại (bấm 2 lần không tạo 2 hội thoại).
- [x] CD-05: cho / từ chối quyền vị trí; danh sách sắp theo khoảng cách.
- [x] CD-06: chưa chọn lý do không gửi được; "Lý do khác" bắt buộc mô tả; Đã gửi → Đóng về đúng màn.

**Chat & thông báo**
- [x] CH-01 badge chưa đọc; mở phòng → badge giảm.
- [x] CH-02: gửi → bong bóng hiện ngay; mock tự trả lời sau vài giây → tự hiện (không cần kéo); gửi lỗi (Khung Mock "lỗi lần gửi sau" thay cho tắt mạng) → "Gửi lại".
- [x] Mở chat từ BR-11, RT-02, KG-10/12 → đúng kho của đơn / món, ô nhập có tin soạn sẵn.
- [x] Bấm Khung Mock ở BR-11 (giao hàng) → chuông có thông báo mới → bấm mở đúng đơn; Đánh dấu đã đọc.

**Tổ chức**
- [ ] Đăng nhập tổ chức PENDING / REJECTED / VERIFIED (Khung Mock) → đúng màn.
- [ ] OC: 3 chiến dịch đang chạy → nút tạo khoá; đóng 1 → mở khoá; tạo mới → Member thấy ở CD-01 chip Chiến dịch.
- [ ] OC-04: ngày bắt đầu khoá khi đang chạy; ngày kết thúc < bắt đầu → lỗi.
- [ ] OB: đăng bài có ảnh → Member thấy ở CD-01; sửa; xoá có hỏi (nêu số thích / bình luận).
- [ ] OM: tin Member gửi ở CH-02 hiện ở OM-01 (mock dùng chung kho).
- [ ] OP-02 lỗi dưới ô + hộp đầu; OP-04 tích mục → form hiện; gửi → OP-05 Chờ duyệt → Khung Mock duyệt / từ chối.

---

## 10. Commit, push, Pull Request

Như các phase trước. Gợi ý commit nhánh đầu:

```
feat(tryon): add try-on constants, rules and mock with slow generation
feat(tryon): try-on room with model picker and slot cards (AI-01)
feat(tryon): pick missing item with suggestions fallback (AI-02)
feat(tryon): background generation job, waiting state and result (AI-03, AI-04)
feat(shop): enable try-on button on product detail
```

Mô tả PR: Đã làm · Đang dùng mock · Lệch wireframe (bảng 0.5) · Cách test (Khung Mock) · Ảnh chụp.

---

## 11. Cần hỏi (gom gửi backend / lead)

**Backend — Nguyên (thử đồ 96–99) · Tài (cộng đồng, chat, thông báo, tổ chức 100–126)**

1. **Mã lỗi** trong message (`INCOMPLETE_OUTFIT: …`, `CAMPAIGN_LIMIT_REACHED: …`) → field `code` (cùng câu 1 các phase trước).
2. Bao giờ có API **96–126**, **`/uploads`** (ảnh bài viết, ảnh bìa, giấy tờ đổi pháp lý), **`GET /api/organizations/me`**?
3. **Thử đồ đồng bộ hay bất đồng bộ?** Contract: API 97 trả ảnh luôn (đồng bộ); đề tài: "< 120 giây, xử lý bất đồng bộ". Nếu model mất 30–120 giây, request treo lâu dễ đứt (mạng điện thoại, Render). Đề xuất: `POST` trả `{jobId}` → `GET /tryon/jobs/{id}` hỏi lại (hoặc thông báo khi xong). Huỷ có dừng model không?
4. **API 98** trả thêm: `modelType`, `createdAt`, các món (`id`, `name`, `thumbnailUrl`, `currentPrice`, `status`, `brandName`, `size`, `warehouseId`) để AI-05/06 hiện "còn mua được / đã bán" mà không gọi từng sản phẩm. Có `GET /tryon/images/{id}` không?
5. **API 50** trả `tryonSlot` (TOP / BOTTOM / DRESS) và cờ ảnh đã tách nền (`tryonReady`) để biết món nào thử được. Tên giá trị `tryonSlot` chính xác? API 96 có nhận `DRESS` không?
6. **API 49** lọc theo `tryonSlot` (tab "Tất cả quần") được không?
7. Ảnh **người mẫu** Nam / Nữ: app tự để ảnh tĩnh hay BE trả URL?
8. **Newsfeed công khai** (chip Tất cả, Guest xem được): API 104 có tham số `scope=ALL` không? Hiện bỏ trống `organizationId` = bài tổ chức đang theo dõi, Guest 401.
9. **Chiến dịch công khai**: `GET /campaigns?status=OPEN` (chip Chiến dịch) và `GET /organizations/{id}/campaigns` (CD-03) — có làm không?
10. **API 100** trả thêm: `logoUrl`, `orgType`, `operationScope`, `verifiedAt`, `donationPoint {name, address, latitude, longitude, receivingHours, contactPhone}`, `followerCount`, `campaignCount`, `postCount`. **API 101** bán kính bao nhiêu, trả `logoUrl`, `orgType`, `receivingHours`, toạ độ?
11. **Campaign**: thêm `title`, `coverUrl`? `status` là `OPEN/CLOSED` (DB) hay `ACTIVE` (ví dụ API 102)? API 102 trả thêm `organization {id, displayName, logoUrl}`, `preferredItemTypes`, `latitude/longitude`, giờ nhận? Địa điểm chiến dịch **riêng** hay luôn = điểm nhận của tổ chức (wireframe CD-04)? `preferredItemTypes` lưu thế nào (DB `varchar`, API mảng)?
12. **Bài viết** (API 104/105/126): trả `organization {id, displayName, logoUrl}`, `photoUrls`, `createdAt`, `likeCount`, `commentCount`, `likedByMe` ngay trong **danh sách**. Có gắn bài với chiến dịch (`campaignId`) không? Số báo cáo của bài (OB-01 "1 bị báo cáo")?
13. **Bình luận** (API 107): trả `author {id, fullName, avatarUrl}`, `createdAt`, `isMine`. Có sửa / xoá bình luận của mình, thích bình luận không? Độ dài tối đa?
14. **Theo dõi**: API danh sách tổ chức mình đang theo dõi (PR-01)?
15. **Báo cáo** (API 109): có mã lý do (`reasonCode`) không, hay chỉ chữ? Báo cáo trùng (cùng người, cùng đối tượng) trả gì?
16. **Chat**: `MEMBER_WAREHOUSE` — `counterpartId` là `warehouseId`? Member có nhiều kho thì mỗi kho một hội thoại (0.5 A21)? API 110 trả `avatarUrl`, `verified`, `lastMessageAt`, `lastMessageSenderId`; API 112 trả cách biết tin nào là **của mình** (so `senderId` với id nào — accountId?); có API **đánh dấu đã đọc** / `readAt`? Realtime: URL WebSocket / STOMP, topic, cách gửi token? Tin nhắn có đính kèm ảnh không?
17. **Thông báo** (API 114): trả `title`, `body` (DB có) thay cho `message`; thêm **`targetType`, `targetId`** để mở đúng màn; có API **số chưa đọc**? Danh sách `type` cho tổ chức (kết quả xử lý báo cáo, chiến dịch sắp hết hạn) có thêm loại mới không? Có push (FCM) không?
18. **API 117** nhận những trường nào (`displayName`, `logoUrl`, `description`, `contactPhone`, `donationPoint.receivingHours`…)? Giới hạn mô tả 300 ký tự?
19. **API 118** `proposedChanges` dùng đúng tên field của body đăng ký tổ chức (`legalName`, `orgType`, `representative{…}`, `documents[…]`)? Có API **đọc** yêu cầu của mình + trạng thái + lý do từ chối (OP-05)? Một lúc được mấy yêu cầu?
20. **API 120**: có chặn đổi `startTime` khi chiến dịch đã bắt đầu không? **API 122/126** có số đếm theo trạng thái (chip "Đang diễn ra · 3")?
21. **`GET /api/organizations/me`** (lặp lại từ Phase 1): `verificationStatus` (`null` khi chưa nộp), `rejectionReason`, giấy tờ đạt / chưa đạt, hồ sơ đầy đủ cho OP-01.

**Lead**

22. Giữ **4 tab**, thử đồ mở từ trang sản phẩm + bộ sưu tập ở Cá nhân — chốt? (0.5 A1)
23. ~~Tổ chức làm web hay mobile?~~ → **Đã chốt mobile (21/10).** Nhờ lead sửa cột nền tảng F-096 … F-107 trong tài liệu tổng quan từ "Web" thành "Mobile" cho khớp (mục 0.3).
24. CD-05: danh sách + mở Google Maps, hay cần **bản đồ trong app** (thêm thư viện, API key, build lại)? (0.5 A13)
25. Chia sẻ ảnh thử đồ có cần cho demo không? (0.5 A5)
26. Chiến dịch có địa điểm riêng hay luôn là điểm nhận của tổ chức? (0.5 A15)
27. Hộp thư kho: một hộp chung hay mỗi kho một hộp? "Nhắn hỗ trợ" ở ví gửi về đâu? (0.5 A21)
28. Thông báo đẩy khi app đóng — cần cho demo không (thêm FCM + BE)? (0.1)
