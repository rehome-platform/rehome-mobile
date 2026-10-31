# ReHome Mobile — Phase 7: App Tổ chức · Nối API thật · Ổn định trước bảo vệ (02/11 – 27/11/2026)

> **Bảo vệ từ 28/11/2026.** Từ hôm nay (01/11) còn **4 tuần**. Đây là phase cuối của mobile.
> Nguồn: _Tài liệu tổng quan sau Review 2_ (95 UC, 167 F; L-09, L-10; UC-91…95; F-096…107, F-163…167) · _Kế hoạch triển khai code sau Review 2_ · _Mô tả API sau Review 2_ (API 100–126, 150–154) · **wireframe bản 31/10** (canvas "ReHome — Wireframe toàn hệ thống", ghi chú L-09 "Quyết định 30/10") · `CLAUDE.md` + `PHASE6_GUIDE.md` (bản 01/11, mục 0.6).
> File này **không thay** PHASE6_GUIDE: spec từng màn tổ chức vẫn ở PHASE6_GUIDE mục 8. File này ghi **kế hoạch**, **chỗ đổi theo wireframe 31/10**, và **việc phải hỏi BE / lead**.
> Ký hiệu như cũ: **[GIẢ ĐỊNH]** · **[CHỜ BE]** · **[CHỜ LEAD]** · **[KIỂM TRA]**.
> **Đã đối chiếu với code 01/11** (mobile `develop` `262844b`, BE `develop` `7af1966`): mục 0, 2, 3.2–3.4, 4, 7 đã sửa theo code thật (đường dẫn file:dòng ghi kèm). PHASE6_GUIDE đã đổi OD-01 / OD-02 → **OC-07 / OC-08**, route và spec khớp file này.

---

## 0. Tình hình tới 01/11

| Phần | Trạng thái |
|---|---|
| Phase 1–5 phía Member | Xong UI. Đã nối thật: auth, hồ sơ, địa chỉ, ký gửi (Phase 2), sàn / giỏ / đặt hàng / thanh toán ví + MoMo + VNPay / đơn / ví / trả hàng (Phase 3–5) — `env.js:16-24` đều `false`. **Còn mock:** `withdrawals` (rút hàng + hàng xuống cấp, `env.js:25`) dù BE **đã có** `ItemWithdrawalRequestController`, `DegradedItemCaseController` |
| Phase 6 phần A (Member) | Xong UI, **mock**: `tryon`, `community`, `chat`, `notifications` (`env.js:26-29`) |
| Đăng ký tổ chức | Bước 1–2, 6 của `feature/org-real-api` xong; **7–8 xong phần lớn** trong `OrgHomeScreen` (`/org` đọc `GET /api/organizations/me`, hiện chưa nộp / PENDING / REJECTED + lý do / VERIFIED; nộp lại mới điền sẵn bước 1 — `OrgHomeScreen.js:41-145`). **Còn:** bước 3 (`authApi.getMe` của tổ chức vẫn lấy email từ JWT — `authApi.real.js:59-66`), 4 (điều hướng theo trạng thái), 9 (khung 4 tab) |
| Phase 6 phần B (Tổ chức) | **Chưa làm**. `OrgHomeScreen` còn câu "sẽ mở ở phiên bản tới" (`OrgHomeScreen.js:139-144`) |
| BE (`develop` `7af1966`) | **Có:** `GET /api/organizations/me` (trả đủ `representative`, `documents`), `PUT /me/registration`, `GET /organizations/options`, `POST /uploads` (+ `/batch`, thư mục `ORGANIZATION_LOGOS`, `COMMUNITY_POSTS`…), `GET /warehouses` công khai (`/warehouses/nearest` **chỉ MEMBER**). **Thiếu:** controller API 96–126, 150–154; `Campaign` chỉ có `description, startTime, endTime, locationName, latitude, longitude, preferredItemTypes, status, createdAt` (chưa nơi nhận / kho / `title` / `coverUrl`); chưa có entity lượt quyên góp / note; `Notification` chưa có `targetType/targetId`, `NotificationType` chưa có loại cho quyên góp |

**Kết luận:** việc lớn nhất còn lại là **app Tổ chức** (UI mock) và **nối API thật** khi BE giao. Không thêm tính năng ngoài danh sách dưới.

---

## 1. Lịch 4 tuần

| Tuần | Ngày | Mobile làm | Phụ thuộc |
|---|---|---|---|
| 1 | 02/11 – 08/11 | **N7** khung tổ chức (nối thật `GET /me`, OA-06, 4 tab, nộp lại điền đủ 4 bước) · **N8** tách `WarehousePicker` từ KG-03, rồi chiến dịch OC-01 → OC-04 + **OC-07, OC-08** (mock) | BE đã có `/me`; chờ lead chốt câu L1 (mục 4) trước khi chốt ràng buộc OC-02 |
| 2 | 09/11 – 15/11 | **N9** bài viết OB-01 → OB-05 · **N10** tin nhắn OM-01, thông báo OM-03, hồ sơ OP-01 → OP-05 (mock) · **N10b** nối thật rút hàng + hàng xuống cấp (API 90–95, bỏ `MIXED`) | BE Phase 5 (đã có controller) |
| 3 | 16/11 – 22/11 | **N11** nối thật Phase 6: tổ chức (117–126, 153–154), cộng đồng (100–109), chat (110–113), thông báo (114–116), thử đồ (96–99) — theo thứ tự BE giao · **N12** trả hàng không hợp lệ: bật "Gửi GHN, tự trả phí" ở RT-04 (nếu BE kịp) | BE Phase 6 (18/11 – 23/11) |
| 4 | 23/11 – 27/11 | **N13** tắt mọi `MOCK`, test trên máy thật theo kịch bản demo, sửa lỗi, build APK demo. **Đóng băng code 26/11 tối** — 27/11 chỉ sửa lỗi chặn demo | Tất cả |

**Nếu BE trễ** (thứ tự cắt, từ dưới lên):
1. Giữ chắc luồng chính được demo thật: L-01 → L-07 (đăng ký/đăng nhập, ký gửi, mua, thanh toán, giao, trả hàng, ví).
2. Tổ chức: chiến dịch + đơn chờ lấy (OC) **ưu tiên hơn** bài viết (OB) và đổi pháp lý (OP-04/05).
3. Phần nào tới 25/11 BE vẫn chưa có API → giữ mock, ghi rõ trong kịch bản demo và mục *Limitations* của báo cáo. **Không** giả vờ là chạy thật.

---

## 2. Nhánh Git (tiếp số từ Phase 6)

| # | Nhánh | Nội dung | Xong khi |
|---|---|---|---|
| N7 | `feature/org-shell` | Bước 3, 4, 9 + hoàn thiện 7–8 của `feature/org-real-api`: `authApi.getMe` với role ORGANIZATION gọi `organizationApi.getMyOrganization()` (không gọi `/members/me`); giữ `/org` (`OrgHomeScreen`) làm OA-06 cho chưa nộp / PENDING / REJECTED, VERIFIED → `router.replace` sang `(org)/org/(tabs)`; nộp lại **điền sẵn cả 4 bước** (BE `/me` đã trả `representative`, `documents`); thêm `ORGANIZATION_LOGOS` vào `src/constants/upload.js`, logo bỏ `AVATARS` (`OrgReviewScreen.js:43-54`); khung `(org)/org/(tabs)` 4 tab | Đăng nhập tài khoản tổ chức thật vào đúng màn theo trạng thái |
| N8 | `feature/org-campaigns` | Tách `WarehousePicker` từ KG-03 (mục 3.4) → OC-01 → OC-04, **OC-07**, **OC-08** (mock — **thêm cờ mới** `MOCK.orgContent` vào `src/config/env.js`, hiện chưa có) | Mục 3.2 |
| N10b | `api/withdrawals` | Nối thật rút hàng (API 90–92) + hàng xuống cấp (API 93–95), tắt `MOCK.withdrawals`. **Bỏ `MIXED`**: BE enum `WithdrawalFeePaymentMethod` chỉ còn `WALLET`, `MOMO`, `VNPAY` (mỗi lần chọn đúng một) — sửa `withdrawalApi.real.js:14`, `withdrawalApi.mock.js:142-184`, `src/constants/withdrawal.js` | Rút hàng trả phí bằng ví / MoMo / VNPay chạy với server |
| N9 | `feature/org-posts` | OB-01 → OB-05 | PHASE6_GUIDE 0.4 #16 |
| N10 | `feature/org-messages-profile` | OM-01 (dùng lại `ChatRoomScreen`), OM-03 (dùng lại màn thông báo), OP-01 → OP-05 | PHASE6_GUIDE 0.4 #17, #18 |
| N11 | `feature/phase6-real-api` (có thể tách nhỏ theo module) | `*.real.js` cho tryon, community, chat, notifications, orgContent; tắt `MOCK` từng cờ | Mỗi cờ tắt được, test với server |
| N12 | `feature/return-ship-back` | RT-04: bật lựa chọn "Gửi GHN về địa chỉ, tự trả phí" (chọn địa chỉ → phí → trả bằng ví / MoMo / VNPay, dùng lại `PaymentMethodPicker`) | Chỉ làm khi BE có API tính phí + tạo vận đơn chiều kho → Member |
| N13 | `release/demo` | Tắt hết `MOCK`, icon, splash, `preventAutoHideAsync`, build APK | Chạy trọn kịch bản demo trên 1 máy Android không lỗi |

---

## 3. Luồng Tổ chức — chỗ đổi theo wireframe 31/10

### 3.1. Đổi mã màn

PHASE6_GUIDE đang dùng mã tạm **OD-01 / OD-02**. Wireframe đã có mã chính thức → **đổi theo wireframe**:

| Mã tạm (guide) | Mã wireframe | Màn |
|---|---|---|
| OD-01 | **OC-07** | Đơn quyên góp chờ lấy tại điểm ký gửi (F-166, UC-94) |
| OD-02 | **OC-08** | Ghi note quyên góp khi nhận tại địa chỉ riêng (F-167, UC-95) |

Route đề xuất giữ dưới chiến dịch, vì cả hai màn đều gắn **một chiến dịch cụ thể**:
`(org)/org/campaigns/[id]/donations.js?warehouseId=` (OC-07) · `(org)/org/campaigns/[id]/donation-note.js` (OC-08).

Phía Moderator (web, **không làm**): QG-01 hàng đợi chiến dịch tại kho → QG-02 ghi nhận + danh sách đơn **của đúng chiến dịch đó** → QG-03 bàn giao.

### 3.2. Từng màn

**OC-01 · Danh sách chiến dịch** — như PHASE6_GUIDE. Ẩn "lượt thích · bình luận" (B1). Nút "Tạo chiến dịch mới" khoá khi đủ `ORG_LIMITS.MAX_OPEN_CAMPAIGNS` (3, đã có ở `src/constants/community.js:11`) đang chạy, dòng chữ "Khoá vì đang có 3 / 3 chiến dịch".

**OC-02 · Tạo chiến dịch** — wireframe 31/10:

| Ô | Làm | Ghi chú |
|---|---|---|
| Tên chiến dịch *, Ảnh bìa | Hiện ô nếu BE có field; chưa có thì ẩn, tiêu đề = dòng đầu mô tả (A16) | [CHỜ BE] `title`, `coverUrl` |
| Mô tả * | Bắt buộc | |
| Nhận đồ từ ngày — đến ngày * | Ngày kết thúc > ngày bắt đầu, không ở quá khứ; dòng "Hết ngày cuối, chiến dịch tự đóng" | |
| Loại đồ đang cần * | Chip gợi ý + tự nhập (B3), ít nhất 1 | |
| **Cách nhận đồ *** (mới) | 2 lựa chọn: **Nhận tại địa chỉ riêng** (hiện địa chỉ + giờ nhận trong hồ sơ tổ chức, chỉ đọc) · **Nhận tại điểm ký gửi** (bấm "Chọn kho" → `WarehousePicker multiple` tách từ KG-03 (mục 3.4), danh sách `GET /warehouses`) | **Nhiều kho, bất kỳ kho nào: lead đã chốt 01/11.** Chọn một hay cả hai kiểu nơi nhận: **chờ câu L1** |
| Lưu nháp | Ẩn (B2) | |

> **Mô hình dữ liệu mock đề xuất** (bao được mọi đáp án của câu L1, đổi ý không phải sửa màn khác):
> `receiving: { ownAddress: boolean, warehouseIds: string[] }`.
> Kiểm tra: `ownAddress || warehouseIds.length > 0`. Nếu lead chốt "chỉ một trong hai" thì chỉ thêm ràng buộc ở `campaignRules`.
> `campaignRules` là **file mới** `src/features/orgPortal/utils/campaignRules.js` (đi cùng `campaignSchema` zod ở `features/orgPortal/schemas.js` như PHASE6 mục 3) — hiện code chỉ có `features/community/utils/communityRules.js` (`campaignTitleOf`, `isCampaignOpen`…), không viết ràng buộc tạo chiến dịch vào đó.

**OC-03 · Chi tiết chiến dịch** — wireframe 31/10 (từ trên xuống): header ← "Chiến dịch" + nút Sửa · ảnh bìa nhãn "ĐANG NHẬN ĐỒ" · tên + "Đăng dd/mm · nhận tới dd/mm · còn n ngày" · khối số liệu (lượt xem, bài viết liên quan, lượt chia sẻ) · "Loại đồ đang cần" · "Mô tả" · footer [Sửa chiến dịch] [Đóng sớm] + chú thích "Đóng sớm thì chiến dịch biến khỏi feed ngay, không chờ tới dd/mm". Wireframe **không** có khối nơi nhận, **không** có lối vào OC-07 / OC-08 → mobile thêm khối **"NƠI NHẬN ĐỒ"** [GIẢ ĐỊNH, CHỜ LEAD L5]:
- Đặt **đúng chỗ khối số liệu** (khối số liệu ẩn theo B1); tiêu đề nhỏ viết hoa xám như "LOẠI ĐỒ ĐANG CẦN".
- Dòng địa chỉ riêng: địa chỉ + giờ nhận, trình bày như thẻ "Nhận tại địa chỉ riêng" của OC-02; bên phải nút viền **"Ghi note"** → OC-08.
- Mỗi kho một dòng: tên kho · địa chỉ; bên phải **"n chờ lấy ›"** → OC-07 kho đó; 0 đơn → **"Chưa có đơn"**. Số đếm [CHỜ BE] (mục 5 #8); mock / tạm đếm từ API 153.
- Chiến dịch **CLOSED**: vẫn mở được OC-07 (xem lịch sử, cả lượt đã bàn giao); ẩn nút "Ghi note" [GIẢ ĐỊNH].
- Footer: giữ chú thích dưới nút Đóng sớm như wireframe **và** Alert xác nhận khi bấm.

**OC-04 · Sửa chiến dịch** — dùng lại form OC-02, điền sẵn; ngày bắt đầu khoá khi đang chạy (B4); lưu là áp dụng ngay. Đổi **nơi nhận** khi đã có đơn chờ lấy: **khoá phần kho đã có đơn** [GIẢ ĐỊNH] — chờ câu L4.

**OC-07 · Đơn chờ lấy** (chỉ đọc):
- Đầu màn: tên chiến dịch + tên, địa chỉ kho.
- Danh sách mới nhất ở trên: tên người quyên góp **hoặc "Ẩn danh"** (chữ xám), note trong ngoặc kép, chip **CHỜ LẤY** / **ĐÃ BÀN GIAO**, dòng "Ghi nhận dd/mm · hh:mm bởi <mã Moderator>" (đã bàn giao thì thêm "đã bàn giao cho tổ chức dd/mm").
- Kéo để tải lại; rỗng → "Chưa có ai mang đồ tới kho này".
- Mở từ thông báo "Có lượt quyên góp mới tại <kho>" (lead chốt 01/11) → đúng chiến dịch + kho.
- Trạng thái lấy từ `src/constants/donation.js`: `PENDING_PICKUP`, `HANDED_OVER` (theo API 150–153).

**OC-08 · Ghi note quyên góp** — wireframe 31/10: header ← "Ghi note quyên góp" · hộp xám giải thích · "Người quyên góp" (ô tên + ô tích Ẩn danh + chữ hướng dẫn) · "Note (tuỳ chọn)" + "Chỉ là chữ tự do…" · footer [Lưu note] [Bỏ qua]. Wireframe **không** nói "Bỏ qua" làm gì, **không** hiện tên chiến dịch.
- Dải nhỏ dưới header: **tên chiến dịch** (như đầu màn OC-07) [GIẢ ĐỊNH, CHỜ LEAD L8] — API 154 cần `campaignId` và tổ chức có thể có nhiều chiến dịch nhận tại địa chỉ riêng.
- Hộp xám giải thích: chỉ dành cho nhận tại địa chỉ riêng, không bắt buộc, hệ thống không theo dõi.
- **Người quyên góp**: ô tên + ô tích **Ẩn danh** (tích thì ô tên xoá và khoá). Lỗi: chưa tên mà không tích ẩn danh → "Nhập tên người quyên góp hoặc chọn Ẩn danh" (khớp API 154 lỗi 400).
- **Note (tuỳ chọn)**: chữ tự do, giới hạn 500 ký tự [GIẢ ĐỊNH]; dòng "Chỉ là chữ tự do — không có ô số lượng hay cân nặng".
- **Lưu note** → toast + quay lại OC-03.
- **Bỏ qua** và nút ← cùng hành vi: form trống → quay lại OC-03 ngay; đã nhập tên hoặc note → Alert "Bỏ note đang ghi?" [Ghi tiếp] [Bỏ] (như OB-02 "Bỏ bài đang soạn?"). Giữ chữ "Bỏ qua" theo wireframe tới khi lead trả lời L8.
- Xem lại các note đã ghi: **chưa có API** → chờ câu L3 / B3.

**Phía Member (CD-04)** — khối "Mang đồ tới đâu" hiện **mọi nơi nhận** của chiến dịch: địa chỉ tổ chức (câu cũ "Bạn tự mang đồ tới…") và từng kho ReHome ("Mang đồ tới quầy ReHome <kho>, nhân viên ghi nhận giúp bạn — không cần mở app" + giờ mở cửa + Chỉ đường). Member vẫn **không** có nút "Quyên góp".

### 3.3. Phần tổ chức còn lại (OB, OM, OP, OA-06)

Wireframe các màn này **không đổi** so với lúc viết PHASE6_GUIDE → làm đúng mục 8 và bảng lệch B1–B11 của guide. Đã kiểm code 01/11:
- **OA-06**: không cần file `status.js` mới — `/org` (`OrgHomeScreen`) đã là màn trạng thái, chỉ chỉnh lại + chuyển VERIFIED sang tab.
- **OM-01 / OM-03**: dùng lại `ConversationListScreen`, `ChatRoomScreen` (`viewer="org"`, `ChatRoomScreen.js:42, 114-167`) và `NotificationListScreen({ viewer, backHref })` (`NotificationListScreen.js:25-53`); `notificationRoute(n, viewer)` đã có nhánh `org`.
- **OB-02 / OB-03**: upload ảnh bằng `uploadFile(file, UPLOAD_FOLDER.COMMUNITY_POSTS)` (`src/lib/api/upload.js`, BE có thư mục này).
- **OP-04**: `LegalDocCard`, `CccdSlot` dùng lại ngay; **phải tách** khối người đại diện (`OrgRepresentativeScreen.js:71-121`) và chọn loại hình (`OrgInfoScreen.js:147-163`) thành `RepresentativeFields`, `OrgTypePicker`.

### 3.4. Tách màn chọn kho của KG-03 (làm đầu N8)

`WarehouseStep` (`src/features/consignment/components/WarehouseStep.js:82`, dùng ở `CreateFormScreen.js:221`) đang gắn chặt với ký gửi:

| Vấn đề | Dòng | OC-02 cần |
|---|---|---|
| Chọn **một** kho (radio, `value` = 1 id) | :46-60, :144 | chọn **nhiều** (checkbox, `values[]`) |
| **Tự chọn sẵn kho đầu tiên** khi danh sách về | :100-104 | **không** tự chọn |
| Gọi `consignmentApi.getNearestWarehouses` + `consignKeys` | :15-16, :94-98 | tổ chức **không gọi được** `/warehouses/nearest` (chỉ MEMBER) → dùng `GET /warehouses` (công khai), km tự tính ở app nếu có vị trí |
| `getCoords()` viết riêng | :28-41 | dùng `src/utils/location.js` `getCoords()` (đã có, trùng chức năng) |
| Câu "7 ngày mang đồ đến" cứng trong component | :148-154 | truyền ghi chú từ ngoài vào |

Tách thành: `WarehouseOption` (radio | checkbox) + hook `useWarehouses({ nearest })` + `WarehousePicker({ multiple, value | values, onChange, autoSelectFirst, note })` đặt ở chỗ dùng chung (vd `src/components/warehouse/`). KG-03 truyền `autoSelectFirst` + note 7 ngày → hành vi giữ nguyên; test lại tạo yêu cầu ký gửi sau khi tách.

---

## 4. Câu hỏi cho lead (gửi ngay, cần trước 04/11)

| # | Câu hỏi | Vì sao | Mobile làm tạm |
|---|---|---|---|
| L1 | **Nơi nhận của một chiến dịch**: chỉ được chọn **một trong hai** (ghi chú L-09 "chọn 1 trong 2"), hay **được chọn cả hai** (chữ trên OC-02 "có thể chọn cả hai")? (Số kho đã chốt 01/11: **nhiều kho, bất kỳ kho nào** — nhờ lead sửa ghi chú L-09 "một kho ReHome khác" trên wireframe cho khớp) | Tài liệu và wireframe nói khác nhau | Mô hình `{ ownAddress, warehouseIds[] }`, cho chọn cả hai + nhiều kho, chờ chốt để thêm ràng buộc |
| L2 | Giữ **Tên chiến dịch** và **Ảnh bìa** không? | DB Campaign chưa có cột — nếu giữ thì BE phải thêm | Hiện nếu BE trả, không thì ẩn |
| L3 | Tổ chức có cần **xem lại các note đã ghi** (OC-08) không? Ở đâu? | API 154 chỉ có POST, không có GET | Không có danh sách note |
| L4 | Sửa chiến dịch đang chạy: có được **bỏ một kho** đang có đơn chờ lấy không? | Đơn chờ lấy sẽ "mồ côi" | Khoá bỏ kho đã có đơn |
| L5 | Lối vào OC-07 / OC-08 đặt ở **OC-03** như mục 3.2 — đồng ý không? Bố cục khối **"NƠI NHẬN ĐỒ"**: đặt vào chỗ khối số liệu (ẩn theo B1), dòng địa chỉ riêng + nút "Ghi note", mỗi kho một dòng "n chờ lấy ›" / "Chưa có đơn", chiến dịch CLOSED vẫn xem được OC-07 nhưng ẩn "Ghi note" — đồng ý không? | Wireframe OC-03 không có khối nơi nhận, không có lối vào | Làm như mục 3.2 |
| L6 | Thử đồ: giữ **Đầm** hay chỉ **Áo + Quần** (tài liệu sau Review 2)? | Đã treo từ PHASE6_GUIDE 0.6; API 97 và enum BE `TryOnSlot` vẫn có `DRESS` | Giữ Đầm |
| L7 | Tài liệu tổng quan mục 7 còn ghi phí rút hàng "trừ ví trước, thiếu thì MoMo"; BE đã bỏ `MIXED` (chọn đúng 1: ví / MoMo / VNPay). Sửa tài liệu theo BE? | Lệch giữa tài liệu và code | Làm theo BE (N10b) |
| L8 | OC-08: giữ chữ **"Bỏ qua"** hay đổi **"Huỷ"** (như OB-02, OC-04)? Thêm **dải tên chiến dịch** dưới header được không? | Wireframe không nói "Bỏ qua" làm gì, không hiện tên chiến dịch | Giữ "Bỏ qua" (hành vi như Huỷ, hỏi khi đã nhập); có dải tên chiến dịch |

## 5. Danh sách gửi BE (Tài: 117–126, 153–154 · Nguyên: 150–152)

1. **API 119 / 120 (tạo / sửa chiến dịch):** body chưa có nơi nhận kiểu mới. Đề xuất thêm `receiveAtOwnAddress: boolean`, `warehouseIds: string[]` (bỏ `locationName/latitude/longitude` tự nhập, vì địa chỉ riêng lấy từ hồ sơ tổ chức); thêm `title`, `coverUrl` nếu L2 giữ. Response API 102, 122 trả lại các field này + tên, địa chỉ, giờ mở cửa của từng kho.
2. **API 150 (Moderator ghi nhận) thiếu `campaignId`.** Wireframe QG-02 ghi nhận **theo từng chiến dịch**, và một kho có thể nhận cho nhiều chiến dịch của nhiều tổ chức → không có `campaignId` thì không biết lượt quyên góp thuộc tổ chức nào. API 151, 152 cũng cần lọc / bàn giao theo `campaignId`.
3. **API 153 (tổ chức xem đơn chờ lấy):** thêm query `campaignId`, `warehouseId`, `status`; mỗi dòng trả thêm `campaignId`, `warehouseName`, `recordedBy` (mã Moderator), `handedOverAt`. Có phân trang theo quy ước chung.
4. **API đọc note quyên góp** (nếu L3 = có): `GET /organizations/me/donation-notes?campaignId=`.
5. **Thông báo cho tổ chức khi Moderator ghi một lượt quyên góp:** loại `NotificationType` mới (ví dụ `DONATION_RECORDED`) + `targetType = CAMPAIGN`, `targetId`, kèm `warehouseId` để app mở đúng OC-07.
6. **Hạn giao API Phase 6** cho mobile nối thật trước 22/11, và `POST /uploads` (ảnh bài viết, ảnh bìa, giấy tờ đổi pháp lý).
7. **Trả hàng không hợp lệ — gửi GHN tự trả phí** (đã chốt 28/10): API tính phí kho → địa chỉ Member, thanh toán phí, tạo vận đơn chiều kho → Member; trạng thái `LOST` khi GHN làm mất hàng chiều Member → kho; hạn 7 ngày tới lấy. Nếu không kịp → ghi vào *Limitations*.
8. **Số đơn chờ lấy theo từng kho của một chiến dịch** (cho OC-03 "n chờ lấy"): trả kèm ở API 102 / 122 (vd `warehouses: [{id, name, address, openingHours, pendingCount}]`) hoặc query đếm ở API 153.

---

## 6. Kiểm thử (sửa lại lịch Report 5)

Lịch Test Milestones gửi hôm 27/10 kéo tới **13/12 — sai**, vì bảo vệ bắt đầu **28/11**. Thay bằng:

| Milestone Task | Start Date | End Date |
|---|---|---|
| Write test plan (Report 5) | 26/10/2026 | 01/11/2026 |
| Write unit test cases | 02/11/2026 | 08/11/2026 |
| Unit testing | 02/11/2026 | 15/11/2026 |
| Write integration and system test cases | 09/11/2026 | 15/11/2026 |
| Integration / API testing | 16/11/2026 | 21/11/2026 |
| System testing (Round 1) | 20/11/2026 | 23/11/2026 |
| Bug fixing and regression testing (Round 2, 3) | 24/11/2026 | 26/11/2026 |
| Acceptance testing with supervisor | 26/11/2026 | 27/11/2026 |
| Test report | 25/11/2026 | 27/11/2026 |

Kịch bản test hệ thống phía mobile (tổ chức) tối thiểu: đăng nhập 3 trạng thái (PENDING, REJECTED → nộp lại, VERIFIED) · tạo chiến dịch mỗi kiểu nơi nhận · chặn tạo khi 3/3 · sửa, đóng sớm · Moderator ghi nhận trên web → tổ chức nhận thông báo → OC-07 thấy đơn → Moderator bàn giao → đơn đổi ĐÃ BÀN GIAO · ghi note OC-08 (có tên, ẩn danh, thiếu tên → lỗi) · đăng / sửa / xoá bài · trả lời tin nhắn Member.

---

## 7. Tự kiểm tra trước khi push (bổ sung cho PHASE6_GUIDE mục 9)

- Chuỗi trạng thái quyên góp chỉ nằm ở `src/constants/donation.js`; hiển thị qua một hàm (`donationStatusLabel`).
- "Ẩn danh" không bao giờ gửi kèm `donorName` (khi `isAnonymous = true` thì bỏ `donorName`).
- Form chiến dịch: mọi ràng buộc (ngày, loại đồ, nơi nhận, giới hạn 3) nằm trong `campaignRules` / schema zod, không viết rải trong màn.
- Màn chọn kho của KG-03 được **dùng lại** qua `WarehousePicker` (mục 3.4), không copy; KG-03 tạo yêu cầu ký gửi vẫn chạy như cũ.
- Tài khoản tổ chức **không** gọi `/members/me` hay `/warehouses/nearest` (chỉ MEMBER).
- Sau N7, sửa dòng "Đăng ký tổ chức" trong `CLAUDE.md` (đang ghi cũ `MOCK.organization = true`, "bước 4 chờ `GET /me`").
- Không mã màu, không so chữ trong message lỗi; lỗi theo `code` / `statusCode`.
