# ReHome Mobile — Hướng dẫn Phase 2 (Ký gửi — phía Member)

> Phase 2: 20/10 – 30/10/2026, luồng **L-02** (theo _Kế hoạch triển khai code_ 13/10). Tích hợp thật dồn vào **28–30/10**; trước đó code UI với mock đúng contract.
> Nguồn: _Tài liệu tổng quan_ (F-014…F-031, mục 7, 8, 11, 12), _Thiết kế Database_ (ConsignmentForm, ConsignmentReceipt, Product, PriceChangeLog, EndOfTermDecision), _API_CONTRACT_ (API 14–24, 44, upload), wireframe của lead (bảng **KG-01 → KG-12**).
> Quy ước giữ nguyên như Phase 1 (`CLAUDE.md`). File này chỉ ghi phần **mới** của Phase 2.
> Ký hiệu: **[GIẢ ĐỊNH]** = tạm làm vậy, chưa ai chốt · **[CHỜ BE]** = chờ backend · **[CHỜ LEAD]** = chờ lead chốt · **[KIỂM TRA]** = đối chiếu lại code BE trước khi dùng.
> **Trạng thái BE (đọc lại 18/10, `develop` `1852963`):** vẫn **chưa có controller nào của Phase 2** (API 14–24, 44, `/uploads`). Mới có phần mua hàng Phase 3: `GET /products`, `/cart`, `/addresses` (đủ CRUD), `POST /orders`. **Entity/DB đã có và khớp guide** (mục 4.1) → mock theo đúng tên field của entity.
> **Tiến độ (18/10): xong toàn bộ UI KG-01 → KG-12 chạy mock** — PR #4 (form KG-01→05 + Google + dev build), #5 (biên nhận KG-06/07), #6 (sản phẩm KG-08→10), #7 (cuối kỳ KG-11/12). **Code trong repo là bản chuẩn**; spec mục 7 là mô tả rút gọn, lệch thì theo code. Còn lại: nối API thật (`feature/consign-real-api`) khi BE có controller, thay điều khoản biên nhận [GIẢ ĐỊNH] bằng nguyên văn mục 12, checklist mục 9 phần BE thật.

---

## 0. Phase 2 gồm những gì và thế nào là "xong"

### 0.1. Ngoài phạm vi (đừng làm)

- **Rút hàng giữa kỳ** (F-032–035, KG-13/14) và **hàng xuống cấp** (F-036, KG-15/16) → **Phase 5**. Nút "Rút hàng về" ở KG-09: **ẩn** trong Phase 2.
- Theo dõi đơn hàng (nút "Theo dõi đơn" ở KG-09 Đã có đơn) → Phase 3. Phase 2 chỉ hiện chữ, không bấm.
- Bản đồ ở KG-03 → không làm, chỉ hiện danh sách kho (bản đồ là trang trí trong wireframe).
- "Nhắn cho kho" (KG-10, KG-12) → chat là phase sau. **Ẩn**.

### 0.2. Danh sách màn hình

| Mã    | Màn hình                                                       | Route đề xuất (dưới `src/app/(member)/`)                      | API        | F                   |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------- | ---------- | ------------------- |
| —     | Tab Ký gửi (2 mục: Form · Sản phẩm)                            | `(tabs)/consign.js` → `ConsignTabScreen`                      | 16, 21     | F-018, F-024        |
| KG-01 | Danh sách form (rỗng / có dữ liệu)                             | nằm trong tab, mục "Form ký gửi"                              | 16         | F-016, F-018        |
| KG-02 | Tạo form — bước 1 (thông tin + ảnh)                            | `consign-forms/new.js`                                        | 44, upload | F-014               |
| KG-03 | Tạo form — bước 2 (chọn kho)                                   | cùng màn `new.js` (bước 2 của Stepper)                        | 14, 15     | F-015, F-016        |
| KG-04 | Chi tiết form: Chờ duyệt / Đã duyệt / Bị từ chối / Hết hạn     | `consign-forms/[id]/index.js`                                 | 17         | F-018, F-019        |
| KG-05 | Sửa form đang chờ duyệt                                        | `consign-forms/[id]/edit.js`                                  | 17, 18     | F-017               |
| KG-06 | Biên nhận: Chờ xác nhận / Đã xác nhận                          | `receipts/[id].js`                                            | 19         | F-020, F-023        |
| KG-07 | Dialog xác nhận biên nhận                                      | modal trong `receipts/[id].js`                                | 20         | F-021, F-022        |
| KG-08 | Danh sách sản phẩm ký gửi                                      | nằm trong tab, mục "Sản phẩm ký gửi"                          | 21         | F-024               |
| KG-09 | Chi tiết sản phẩm: Kỳ 1 / Kỳ 3 / Đã có đơn / Chờ xử lý cuối kỳ | `my-products/[id]/index.js`                                   | 22         | F-024, F-027, F-028 |
| KG-10 | Giảm giá: bình thường / Đã đổi hôm nay / Dưới giá sàn          | `my-products/[id]/reduce-price.js`                            | 22, 23     | F-025, F-026        |
| KG-11 | Xử lý cuối kỳ (chọn 1 trong 2)                                 | `my-products/[id]/end-of-term.js`                             | 24         | F-029               |
| KG-12 | Ký gửi lại: Chờ Moderator chốt giá / Xác nhận giá mới          | `my-products/[id]/reconsign.js` + dùng lại `receipts/[id].js` | 22, 19, 20 | F-030               |

> **Tránh trùng route** (bài học `(org-status)/index` ở Phase 1): **không** tạo thư mục `(member)/consign/` vì tab đã chiếm URL `/consign`. Dùng `consign-forms/`, `receipts/`, `my-products/` như bảng trên.
> Các màn chi tiết đặt **ngoài** `(tabs)` để thanh tab tự ẩn khi đi sâu.

### 0.3. Định nghĩa "xong"

Chạy trên Android thật, với mock (`MOCK.consignment = true`) trước, rồi với BE thật khi có:

1. Tab Ký gửi: Guest thấy thẻ mời đăng nhập; Member thấy 2 mục Form · Sản phẩm, kéo xuống để tải lại.
2. Tạo form 2 bước: chọn 1–6 ảnh, danh mục/thương hiệu lấy từ API, giá dạng `1.000.000 đ`, lỗi hiện dưới từng ô + hộp tổng lỗi; bước 2 xin quyền vị trí, liệt kê kho gần nhất (từ chối quyền vẫn chọn được kho); gửi xong về chi tiết form.
3. Đủ 5 form chờ: nút "+ Tạo form" bị chặn, hiện lý do (cả khi BE trả `409 TOO_MANY_PENDING_FORMS`).
4. Chi tiết form hiển thị đúng 4 trạng thái + đếm ngược hạn mang đồ; Đã duyệt có nút "Mã Member của tôi" → PR-04; có biên nhận thì có nút "Xem biên nhận".
5. Sửa form chỉ khi PENDING; BE trả `409 FORM_NOT_EDITABLE` → toast + tải lại chi tiết.
6. Biên nhận: đọc, tick "Tôi đã đọc và đồng ý", dialog xác nhận, xác nhận xong chuyển sang "Đã xác nhận", mở được PDF.
7. Sản phẩm: danh sách lọc theo trạng thái; chi tiết hiện kỳ x/3, ngày hết kỳ, hoa hồng kỳ hiện tại, tiền dự kiến nhận.
8. Giảm giá: tính trước tiền nhận; chặn ngay trên app khi ≥ giá hiện tại hoặc < giá sàn; xử lý đủ 3 lỗi BE.
9. Cuối kỳ: chọn Nhận lại / Ký gửi lại, hỏi xác nhận; `409 DECISION_EXPIRED` → báo hết hạn; Ký gửi lại đi tiếp được tới xác nhận biên nhận mới.
10. Không có chuỗi trạng thái rải rác (tất cả ở `src/constants/consignment.js`), không mã màu trong màn hình.

### 0.4. Quyết định đang áp dụng và chỗ lệch (báo lead)

| #   | Wireframe                                         | Mobile làm                                                | Lý do                                                                    |
| --- | ------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | KG-01 và KG-08 là 2 màn riêng có nút ←            | Gộp vào **tab Ký gửi** có 2 mục (segmented)               | Tab là điểm vào, không có màn cha để "quay lại" [CHỜ LEAD]               |
| 2   | KG-02 có ô **Kích cỡ** và **Tình trạng**          | **Bỏ 2 ô**, thêm gợi ý ghi size/tình trạng vào **Mô tả**  | Bảng ConsignmentForm và API 15 không có `size`/`condition` [CHỜ LEAD/BE] |
| 3   | KG-02 lỗi "Thiếu ảnh nhãn mác" (ảnh theo loại)    | Chỉ kiểm số lượng ảnh 1–6 [GIẢ ĐỊNH], ghi hướng dẫn chụp  | API chỉ nhận `photoUrls[]`, không phân loại ảnh                          |
| 4   | KG-03 có bản đồ                                   | Chỉ danh sách kho                                         | Không có trong phạm vi F-015                                             |
| 5   | KG-04 nút **Hủy form**; KG-04 Từ chối nút **Xóa** | **Ẩn**                                                    | API_CONTRACT không có endpoint huỷ/xóa form (DB có `CANCELLED`) [CHỜ BE] |
| 6   | KG-04 Từ chối: "Tạo form mới từ thông tin này"    | ✅ Làm (cả form Hết hạn): `new?fromFormId=` điền sẵn từ cache, **chọn kho lại** | Cần API 17 trả đủ trường (câu hỏi BE mục 11)               |
| 7   | KG-10 có lịch sử đổi giá                          | Hiện **nếu API trả** `priceChanges` (mock có sẵn)         | DB đã có `PriceChangeLog`, chưa có API đọc [CHỜ BE]                      |
| 8   | KG-12 "Từ chối giá" / "Hủy, nhận lại hàng"; KG-10/12 "Nhắn cho kho" | **Ẩn**                                  | Chưa có API từ chối đề xuất / đổi ý [CHỜ BE]; chưa có chat               |
| 9   | KG-09 dòng "Thuế khấu trừ"                        | Không hiện                                                | Tài liệu không có thuế trong công thức                                   |
| 10  | KG-02/03: `select` danh mục/thương hiệu; "Bước 1/2" | `SelectField` (danh sách trượt từ dưới, thương hiệu **tìm không dấu**); chữ "Bước x / 2" + thanh 2 nấc | RN không có `select`; Shopee/Grab dùng bottom sheet          |
| 11  | KG-02 lỗi validate: nút Tiếp tục mờ               | **Hộp tổng lỗi** ("Còn n mục chưa hợp lệ") + cuộn lên đầu; **nút luôn bấm được** | Thống nhất Phase 1 #12. Áp dụng cả KG-06 (chưa tick → lỗi dưới ô tick) |
| 12  | KG-07 dialog có bảng số                           | **Modal** riêng, có "bạn nhận …" tính từ giá × (1 − hoa hồng kỳ 1) | `Alert` không hiện bảng được                                     |
| 13  | KG-06 "Tải bản PDF"                               | Mở bằng `Linking` (trình xem của máy)                     | Không thêm thư viện native → không phải build lại APK                    |
| 14  | KG-08 là màn riêng có nút "Lọc"                   | Bỏ nút Lọc; **dải đếm** bấm được để lọc nhanh; việc cần làm lên đầu | 4 chip đã là bộ lọc                                          |
| 15  | KG-09 Đã có đơn: "Theo dõi đơn", 2 nút mờ         | Tiến trình đơn 4 nấc (`OrderStatus`), **không** nút        | Theo dõi đơn là Phase 3; nút mờ gây rối                                  |
| 16  | KG-11: chưa vẽ bước sau khi chọn "Nhận lại hàng"  | Trạng thái mới **"Chờ nhận lại"** (`PRODUCT_VIEW.PICKUP`): đến kho trong 7 ngày [GIẢ ĐỊNH] + nút Mã Member | Không có thì sản phẩm vẫn hiện "Chờ cuối kỳ" dù đã chọn |
| 17  | KG-12 ghi chú "Đổi ý lúc nào cũng được: bấm Huỷ…" | Đổi thành "Hàng vẫn giữ tại kho… kho đề xuất giá thì bạn xác nhận biên nhận mới" | Nút Huỷ đã ẩn (#8)                                    |
| 18  | KG-06 Điều 4–7, 9, 10                             | ⚠️ Bản tóm tắt **[GIẢ ĐỊNH]** (`features/consignment/receiptTerms.js`) | Chưa có nguyên văn mục 12 Tài liệu tổng quan — **phải thay trước demo** [CHỜ LEAD] |

---

## 1. Nhánh Git

Mỗi việc một nhánh từ `develop` (như Phase 1). Thứ tự đề xuất:

| Thứ tự | Nhánh                         | Nội dung                                                              | Trạng thái |
| ------ | ----------------------------- | --------------------------------------------------------------------- | ---------- |
| 1      | `feature/consign-form`        | constants, api mock, tab Ký gửi, KG-01 → KG-05 (+ gộp `feature/google-login`) | ✅ PR #4 (17/10) |
| 2      | `feature/consign-receipt`     | KG-06, KG-07, mở PDF, chia sẻ                                         | ✅ PR #5 (18/10) |
| 3      | `feature/consign-products`    | KG-08, KG-09, KG-10                                                   | ✅ PR #6 (18/10) |
| 4      | `feature/consign-end-of-term` | KG-11, KG-12, trạng thái "Chờ nhận lại"                               | ✅ PR #7 (18/10) |
| 5      | `feature/consign-real-api`    | `*.real.js`, tắt `MOCK.consignment`, test với Moderator thật trên web | ⏳ chờ BE (dự kiến 28–30/10) |

```bash
git checkout develop && git pull
git checkout -b feature/consign-form
```

Việc Phase 1 còn dở (tổ chức, Google) vẫn ở nhánh riêng của nó — không trộn vào nhánh Phase 2.

**Chừa thời gian cho Phase 1 còn dở** (làm xen kẽ khi BE báo xong, lịch trên có thể lùi tương ứng):

| Nhánh | Việc | Ước lượng | Khi nào |
| --- | --- | --- | --- |
| ~~`feature/google-login`~~ (code đã vào `develop` qua PR #4) | Test 8 bài (PHASE1_GUIDE AU-02 Google) — **không cần sửa code** | ~0,5 ngày | BE đặt `GOOGLE_CLIENT_ID` trên Render = **Web client ID** rồi redeploy (đang đặt nhầm ID Android → 401 "Token không hợp lệ") |
| `feature/org-real-api` | Tổ chức "tạo account trước" — 9 việc trong `CLAUDE.md` → "Tiến độ" | ~2 ngày | BE push API account tổ chức + `/me` + registration + `/uploads` |

Đang làm dở nhánh Phase 2 mà phải chuyển: commit (hoặc `git stash`) trước → `git checkout develop && git pull` → tạo nhánh kia → xong quay lại `git checkout feature/consign-…`.

---

## 2. Thư viện mới

| Thư viện            | Dùng cho                              | Trạng thái                                                                                      |
| ------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `expo-location`     | Lấy vị trí cho "kho gần nhất" (KG-03) | ✅ đã cài + plugin + **build lại dev APK** (17/10)                                               |
| ~~`expo-web-browser`~~ | Mở PDF biên nhận (KG-06)           | **Không dùng** — mở bằng `Linking.openURL` (không phải build lại)                               |
| `expo-image-picker` | Chọn / chụp ảnh form (đã có từ Phase 1) | Câu xin quyền camera/thư viện đã sửa nhắc cả ảnh sản phẩm ký gửi                              |
| `dayjs`             | Đếm ngày còn lại (đã có)              | —                                                                                               |

Chia sẻ PDF dùng `Share` có sẵn của React Native, không cần thêm thư viện.

Đã làm: cài `expo-location`, thêm lời xin quyền vào `app.json` (plugin), **build lại dev build**. Thư viện native mới → app ReHome bản cũ sẽ crash khi mở nếu code import nó; trong lúc chờ build thì test bằng Expo Go:

```json
"plugins": [
  ["expo-location", {
    "locationWhenInUsePermission": "ReHome dùng vị trí để gợi ý kho ký gửi gần bạn."
  }]
]
```

Dùng vị trí chỉ khi đang mở app (foreground), **không** xin quyền nền.

---

## 3. Cấu trúc thư mục thêm mới

**Như đã làm (18/10):**

```
src/
├─ lib/api/upload.js · upload.mock.js  # uploadFile dùng chung (chuyển từ organization); mock trả lại uri → ảnh vẫn hiện
├─ components/ui/                      # dùng chung mới: SelectField · MoneyField · StatusTimeline (chuyển từ organization)
│                                      #   TextField thêm `suffix`; Screen thêm `scrollRef`
├─ constants/consignment.js           # FORM_STATUS(+_LABEL) · PRODUCT_STATUS · END_OF_TERM_DECISION · PRODUCT_VIEW(+_LABEL)
│                                      # PRODUCT_ENDED_LABEL · ORDER_STEPS · CONSIGN_LIMITS
├─ constants/errorCodes.js            # + TOO_MANY_PENDING_FORMS · FORM_NOT_EDITABLE · BELOW_FLOOR_PRICE
│                                      #   PRICE_CHANGE_LIMIT_REACHED · DECISION_EXPIRED · GOOGLE_ACCOUNT_CONFLICT
├─ utils/money.js                      # formatNumber · formatVnd · parseVnd
├─ utils/consignment.js                # calcPayout · formatRate · daysLeft · totalTermDays · commissionRates
│                                      # getProductView · PRODUCT_VIEW_ORDER · productTiming · currentRate
├─ features/catalog/                   # api/catalogApi(.mock).js (API 44) · hooks/useCatalogOptions.js
└─ features/consignment/
   ├─ api/ consignmentApi.js (= mock) · consignmentApi.mock.js · mockData.js · queryKeys.js
   ├─ hooks/usePendingFormCount.js     # API 16 lọc PENDING size 1 → totalElements
   ├─ utils/photos.js                  # uploadPhotos: URL cũ giữ nguyên, ảnh mới mới upload
   ├─ schemas.js                       # consignFormSchema · STEP1_FIELDS · formToValues · makeReducePriceSchema
   ├─ receiptTerms.js                  # ⚠️ Điều 4–7, 9, 10 [GIẢ ĐỊNH]
   ├─ components/
   │  ├─ FormListSection · FormCard · StatusBadge                   # KG-01
   │  ├─ ConsignFormFields · PhotoPicker · WarehouseStep            # KG-02/03/05
   │  ├─ KeyValueTable · ReceiptConfirmModal                        # KG-06/07
   │  ├─ ProductListSection · ProductCard · ProductBadge            # KG-08
   │  ├─ PayoutBreakdown · TermProgress · PickupInfo                # KG-09/10/11
   └─ screens/
      ├─ ConsignTabScreen · CreateFormScreen · FormDetailScreen · EditFormScreen
      ├─ ReceiptScreen · ProductDetailScreen · ReducePriceScreen
      └─ EndOfTermScreen · ReconsignScreen
src/app/(member)/
├─ consign-forms/new.js · [id]/index.js · [id]/edit.js
├─ receipts/[id].js
└─ my-products/[id]/index.js · reduce-price.js · end-of-term.js · reconsign.js
```

- Danh mục/thương hiệu (`GET /categories`, `/brands`) để ở `features/catalog/` vì sàn mua (Phase 3) dùng chung.
- `FormListSection`, `ProductListSection` đặt trong `components` (là một phần của màn tab, không phải màn riêng).
- `consignmentApi.real.js` **chưa tạo** — làm ở nhánh `feature/consign-real-api` khi BE có controller.

---

## 4. Hằng số và hàm tiện ích

### 4.1. `src/constants/consignment.js`

Trạng thái lấy theo **DB** (bảng ConsignmentForm, Product, EndOfTermDecision). **Đã đối chiếu entity BE (`c62dca4`) — khớp:**

| Entity BE | Field / enum (dùng đúng tên này trong mock) |
| --- | --- |
| `ConsignmentForm` | `id` (UUID), `warehouse`, `category`, `brand`, `productName`, `description`, `desiredPrice`, `status` (`ConsignmentFormStatus`: PENDING · APPROVED · REJECTED · EXPIRED · CANCELLED), `rejectReason`, `bringInDeadline` (**chỉ ngày** `yyyy-MM-dd`), `createdAt`, `updatedAt`; ảnh ở bảng `ConsignmentFormPhoto` |
| `ConsignmentReceipt` | `receiptNo`, `agreedPrice`, `floorPrice`, `termLengthDays` (30), `maxRenewals` (2), `freeWithdrawalWindowDays` (7), `commissionRateTerm1/2/3` (0.10/0.15/0.20), `withdrawalFee`, `degradedCompensationRate` (0.50), `confirmedAt`, `pdfUrl`, `createdAt` |
| `Product` | `id` là **chuỗi** (SKU, không phải UUID), `name`, `size`, `conditionNote`, `currentPrice`, `status` (`ProductStatus`: ON_SALE · RESERVED · SOLD · WITHDRAWN · UNCLAIMED · DONATED · DESTROYED), `currentTerm`, `termStartedAt`, `endOfTermDeadline`, **`unclaimedDecisionDeadline`**, `shelfLocation`, `warehouse`, `category`, `brand` |
| `EndOfTermDecision` | `id`, `product`, `decision` (`EndOfTermChoice`: TAKE_BACK · RE_CONSIGN · UNCLAIMED, `null` = chưa chọn), `newReceipt`, `decidedAt`, `deadline` |
| `Warehouse` | `id`, `name`, `address`, `latitude`, `longitude`, **`openingHours`**, `status` |

Tiền (`BigDecimal`) và tỷ lệ về app là **number** (`1000000`, `0.1`). Tên field trả qua API (DTO) có thể khác entity → [KIỂM TRA] khi BE có controller.

```js
export const FORM_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
};

export const FORM_STATUS_LABEL = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã huỷ",
};

export const PRODUCT_STATUS = {
  ON_SALE: "ON_SALE",
  RESERVED: "RESERVED", // đã có đơn
  SOLD: "SOLD",
  WITHDRAWN: "WITHDRAWN",
  UNCLAIMED: "UNCLAIMED",
  DONATED: "DONATED",
  DESTROYED: "DESTROYED",
};

export const END_OF_TERM_DECISION = {
  TAKE_BACK: "TAKE_BACK",
  RE_CONSIGN: "RE_CONSIGN",
  UNCLAIMED: "UNCLAIMED",
};

export const CONSIGN_LIMITS = {
  MAX_PENDING_FORMS: 5,
  MIN_PHOTOS: 1, // [GIẢ ĐỊNH]
  MAX_PHOTOS: 6, // theo KG-02 "2 / 6"
  TOTAL_TERMS: 3,
};
```

**Trạng thái "Chờ xử lý cuối kỳ"** (KG-08/09) không có trong enum Product của DB. Theo DB thì đó là: `status` vẫn `ON_SALE` (hoặc trạng thái khác) + có `EndOfTermDecision` với `decision = null`. Cách app nhận biết **phụ thuộc BE** → mục 11. Tạm thời trong mock thêm cờ ở mức hiển thị:

```js
// Trạng thái hiển thị (chỉ dùng ở app), suy ra từ dữ liệu API
export const PRODUCT_VIEW = {
  SELLING: "SELLING", // ON_SALE, chưa tới cuối kỳ
  HAS_ORDER: "HAS_ORDER", // RESERVED
  AWAITING_DECISION: "AWAITING_DECISION", // hết 90 ngày, chưa chọn
  REPRICING: "REPRICING", // đã chọn RE_CONSIGN, chờ Moderator chốt giá
  ENDED: "ENDED", // SOLD / WITHDRAWN / UNCLAIMED / DONATED / DESTROYED
};
```

Viết một hàm duy nhất `getProductView(product)` trong `utils/consignment.js` để quy đổi. Khi BE chốt cách trả dữ liệu, chỉ sửa hàm này.

### 4.2. `src/utils/money.js`

- `formatVnd(1000000)` → `"1.000.000 đ"` (dùng `toLocaleString("vi-VN")` hoặc tự chèn dấu chấm; kiểm tra Hermes trên Android ra đúng dấu chấm — nếu không thì tự viết bằng regex).
- `parseVnd("1.000.000 đ")` → `1000000` (bỏ mọi ký tự không phải số).
- Tiền luôn là **số nguyên đồng** trong state và khi gửi API.

### 4.3. `src/utils/consignment.js`

```js
// Tiền Member nhận = giá × (1 − hoa hồng). Làm tròn xuống đồng.
export const calcPayout = (price, rate) => Math.floor(price * (1 - rate));

// "Còn X ngày" tính theo ngày lịch, không theo giờ
export const daysLeft = (deadline) =>
  dayjs(deadline).startOf("day").diff(dayjs().startOf("day"), "day");
```

- `rate` từ BE là số thập phân (`0.10`) theo DB/API 19. Hiển thị `Math.round(rate * 100) + "%"`.
- `expectedPayout` BE đã trả trong API 21 → **ưu tiên số của BE**; chỉ tự tính ở màn giảm giá (KG-10) để xem trước.
- Hoa hồng **chốt lúc đặt đơn** (KG-09 Đã có đơn): khi `RESERVED`, hiển thị số tiền đã chốt BE trả, không tính lại theo kỳ hiện tại [CHỜ BE: field nào chứa tỷ lệ đã chốt].

---

## 5. Lớp API

### 5.1. `src/config/env.js`

Thêm một nhóm mock:

```js
export const MOCK = {
  password: false,
  upload: true,
  organization: true,
  consignment: true, // Phase 2 — BE chưa có thì để true cứng
};
```

### 5.2. Bảng API Phase 2 (theo API_CONTRACT — [KIỂM TRA] với code BE)

**BE `c62dca4` (16/10) chưa có controller nào trong bảng dưới** → cột "BE thật" để `chưa có`; BE push thì đối chiếu lại (tiền tố `/api`, envelope, tên field, `code` lỗi). Phase 1: `/api/auth/*` không bọc; `/members`, `/products` có bọc và không có `/api` — `unwrap` hiện có xử lý cả hai kiểu.

| API | Method + path                                  | Body / query                                                                              | Trả về                                                                                                                                                                                   | Lỗi                                                                                          | BE thật     |
| --- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------- |
| 14  | `GET /warehouses/nearest?lat&lng`              | —                                                                                         | `[{id, name, address, distanceKm}]`                                                                                                                                                      | —                                                                                            | chưa có     |
| 15  | `POST /consignment-forms`                      | `{categoryId, brandId, productName, description, desiredPrice, warehouseId, photoUrls[]}` | `{id, status:"PENDING", bringInDeadline, createdAt}`                                                                                                                                     | 400 giá ≤ 0 · 409 `TOO_MANY_PENDING_FORMS`                                                   | chưa có     |
| 16  | `GET /consignment-forms?status&page&size`      | page 0-based                                                                              | `{content:[{id, status, productName, desiredPrice}], page, size, totalElements, totalPages}`                                                                                             | —                                                                                            | chưa có     |
| 17  | `GET /consignment-forms/{id}`                  | —                                                                                         | `{id, status, productName, rejectReason, bringInDeadline, receiptId}`                                                                                                                    | 403 · 404                                                                                    | chưa có     |
| 18  | `PUT /consignment-forms/{id}`                  | như API 15                                                                                | form                                                                                                                                                                                     | 409 `FORM_NOT_EDITABLE`                                                                      | chưa có     |
| 19  | `GET /consignment-receipts/{id}`               | —                                                                                         | `{id, receiptNo, agreedPrice, floorPrice, termLengthDays, maxRenewals, freeWithdrawalWindowDays, commissionRateTerm1/2/3, withdrawalFee, degradedCompensationRate, confirmedAt, pdfUrl}` | 403 · 404                                                                                    | chưa có     |
| 20  | `POST /consignment-receipts/{id}/confirm`      | —                                                                                         | `{id, confirmedAt, pdfUrl}`                                                                                                                                                              | 409 đã xác nhận                                                                              | chưa có     |
| 21  | `GET /products/mine?status&page&size`          | —                                                                                         | page `{id (SKU), productName, status, currentTerm, termStartedAt, endOfTermDeadline, commissionRateCurrentTerm, expectedPayout}`                                                         | —                                                                                            | chưa có     |
| 22  | `GET /products/{id}`                           | —                                                                                         | `{id, productName, currentPrice, status, endOfTermDecision}`                                                                                                                             | 403 · 404                                                                                    | chưa có     |
| 23  | `POST /products/{id}/price-reduction`          | `{newPrice}`                                                                              | `{currentPrice}`                                                                                                                                                                         | 400 không thấp hơn giá hiện tại · 409 `BELOW_FLOOR_PRICE` · 409 `PRICE_CHANGE_LIMIT_REACHED` | chưa có     |
| 24  | `POST /end-of-term-decisions/{id}/decide`      | `{decision: TAKE_BACK \| RE_CONSIGN}`                                                     | `{decision, newReceiptId}`                                                                                                                                                               | 409 `DECISION_EXPIRED`                                                                       | chưa có     |
| 44  | `GET /categories?status`, `GET /brands?status` | public                                                                                    | `[{id, name, tryonSlot, status}]`                                                                                                                                                        | —                                                                                            | chưa có     |
| —   | `POST /uploads` (multipart `file`)             | —                                                                                         | `{url}`                                                                                                                                                                                  | —                                                                                            | **chưa có** |

**Thiếu so với wireframe** (đã gom vào mục 11): API 16 thiếu ảnh/kho/hạn/lý do; API 17 thiếu các trường để sửa form; API 22 thiếu giá sàn, kỳ, hoa hồng, ngày hết kỳ, thời điểm đổi giá gần nhất.

### 5.3. Tên hàm trong `consignmentApi.*.js` (real và mock phải giống hệt)

```
getNearestWarehouses({ lat, lng })
createForm(payload)
getMyForms({ status, page, size })
getForm(id)
updateForm(id, payload)
getReceipt(id)
confirmReceipt(id)
getMyProducts({ status, page, size })
getProduct(id)
reducePrice(id, newPrice)
decideEndOfTerm(decisionId, decision)
```

`features/catalog/api/catalogApi.*.js`: `getCategories()`, `getBrands()`.
Upload ảnh: **một** hàm `uploadFile(file)` dùng chung ở `src/lib/api/upload.js` (real/mock theo `MOCK.upload`). Phase 1 đang để hàm này trong `features/organization/api/organizationApi.mock.js` → **việc đầu tiên của nhánh `feature/consign-form`**: chuyển ra `lib/api`, sửa `OrgReviewScreen` gọi từ chỗ mới (organization và consignment không import lẫn nhau). Không viết hàm upload thứ hai. `file` = `{ uri, name, mimeType }` (giống `utils/files.js` của organization).

### 5.4. Mock phải "sống" (đủ để demo luồng)

`consignmentApi.mock.js` giữ dữ liệu trong một biến module (mất khi reload app — chấp nhận):

- Có sẵn dữ liệu mẫu đủ trạng thái giống wireframe: 1 form Đã duyệt (hạn mang đồ còn 6 ngày, có `receiptId` chưa xác nhận), 1 Chờ duyệt, 1 Bị từ chối, 1 Hết hạn; sản phẩm: Kỳ 1, Kỳ 3 (còn 4 ngày), Đã có đơn, Chờ xử lý cuối kỳ, Chờ chốt giá.
- `createForm`: đếm form PENDING, đủ 5 thì **ném `ApiError` 409 `TOO_MANY_PENDING_FORMS`** (đúng hình dạng lỗi thật) — để test nhánh lỗi.
- `updateForm`: form không PENDING → 409 `FORM_NOT_EDITABLE`.
- `confirmReceipt`: đã xác nhận → 409; xác nhận xong gán `confirmedAt`, `pdfUrl` (dùng một link PDF công khai bất kỳ để test mở).
- `reducePrice`: kiểm đủ 3 lỗi; nhớ ngày đổi giá gần nhất cho từng sản phẩm.
- `decideEndOfTerm`: quá `deadline` → 409 `DECISION_EXPIRED`; `RE_CONSIGN` → sản phẩm sang "Chờ chốt giá", sau đó (giả lập Moderator) có `newReceiptId`.
- Mỗi hàm `await sleep(400–800ms)` để thấy trạng thái loading.

**Như đã làm:**

- Dữ liệu mẫu (`mockData.js`): 5 form (`form-001` Đã duyệt có biên nhận `rc-001` chờ xác nhận, 2 Chờ duyệt, 1 Bị từ chối, 1 Hết hạn), 3 kho TP.HCM, 6 sản phẩm (Kỳ 1, Kỳ 3 còn 4 ngày, Đã có đơn, Chờ cuối kỳ, Chờ chốt giá, Đã bán). Ngày tính theo **hôm nay** nên "còn X ngày" luôn đúng.
- `confirmReceipt`: biên nhận ký gửi lại (có `productId`) → sản phẩm lên sàn lại (kỳ 1, giá mới); có `formId` → form `receiptConfirmed: true`.
- `decideEndOfTerm`: `TAKE_BACK` → gắn `pickupDeadline` = +7 ngày [GIẢ ĐỊNH].
- **`mockProposeNewPrice(productId)`** [chỉ mock]: giả lập Moderator đề xuất giá (−20%) + tạo biên nhận mới. Gọi từ nút **"[Dev] Giả lập kho đề xuất giá"** ở KG-12, chỉ hiện khi `__DEV__ && MOCK.consignment` (bản build thật / nối BE thật thì tự ẩn).
- Chưa giả lập được: Moderator duyệt / từ chối form, `FORM_NOT_EDITABLE`, `DECISION_EXPIRED` (test khi có BE + web).

### 5.5. React Query

`queryKeys.js`:

```js
export const consignKeys = {
  forms: (status) => ["consign", "forms", status ?? "ALL"],
  form: (id) => ["consign", "form", id],
  receipt: (id) => ["consign", "receipt", id],
  products: (status) => ["consign", "products", status ?? "ALL"],
  product: (id) => ["consign", "product", id],
  warehouses: (lat, lng) => ["consign", "warehouses", lat, lng],
};
```

Sau mutation thì làm mới đúng chỗ:

| Mutation                | invalidate                                                       |
| ----------------------- | ---------------------------------------------------------------- |
| createForm / updateForm | `["consign","forms"]` + `form(id)`                               |
| confirmReceipt          | `receipt(id)` + `["consign","forms"]` + `["consign","products"]` |
| reducePrice             | `product(id)` + `["consign","products"]`                         |
| decideEndOfTerm         | `product(id)` + `["consign","products"]`                         |

Danh sách có phân trang → dùng `useInfiniteQuery` (`getNextPageParam: (last) => last.page + 1 < last.totalPages ? last.page + 1 : undefined`). Nếu thấy phức tạp, Phase 2 dùng `useQuery` với `size: 50` cũng chấp nhận được — ghi chú lại.

---

## 6. Business rules áp dụng trên app

App **hiển thị và chặn sớm** cho dễ dùng; **BE là bên quyết định cuối** — luôn xử lý lỗi BE dù app đã chặn.

| Quy tắc                                                                             | Nguồn         | App làm gì                                                                                                                           |
| ----------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Tối đa **5 form chờ duyệt**                                                         | F-016, mục 11 | Đếm PENDING từ API 16, hiện "Đang có 3/5 form chờ duyệt"; đủ 5 → nút Tạo form disabled + giải thích. Vẫn bắt 409.                    |
| Mang đồ tới kho trong **7 ngày** sau khi duyệt                                      | F-019         | Hiện `bringInDeadline` + "còn X ngày"; ≤ 2 ngày nhấn mạnh. Quá hạn BE tự chuyển EXPIRED.                                             |
| Giá mong muốn > 0, chỉ là đề xuất                                                   | F-014         | zod `> 0`; NoteBox "Moderator sẽ chốt giá tại kho".                                                                                  |
| Sửa form chỉ khi **PENDING**; không đổi kho khi sửa                                 | F-017, KG-05  | Nút Sửa chỉ hiện khi PENDING; màn sửa không có bước chọn kho.                                                                        |
| Kỳ **30 ngày × 3**, tự gia hạn                                                      | F-027         | Hiện "Kỳ x / 3", "Ngày n / 90".                                                                                                      |
| Hoa hồng **10 / 15 / 20 %** theo kỳ, **chốt lúc đặt đơn**, snapshot trong biên nhận | mục 7, F-022  | Lấy tỷ lệ từ API (không viết cứng 10/15/20 trong logic, chỉ dùng trong mock).                                                        |
| Giá sàn = **50% giá chốt**, chỉ được **giảm**, **1 lần/ngày**                       | F-025, F-026  | Chặn `newPrice >= currentPrice` và `< floorPrice` ngay khi gõ; nút "Về giá sàn". 1 lần/ngày: dựa vào lỗi 409 (hoặc field BE nếu có). |
| Cuối kỳ có **30 ngày** để chọn, quá hạn → vô thừa nhận                              | F-029, F-031  | DeadlineBanner đỏ ở KG-08/09/11, nhắc rõ hậu quả.                                                                                    |
| Nhận lại hàng cuối kỳ **miễn phí**, đến kho trong 7 ngày, đọc mã Member             | KG-11         | Sau khi chọn TAKE_BACK: hiện hướng dẫn + nút "Mã Member của tôi".                                                                    |
| Ký gửi lại: biên nhận mới, chu kỳ 90 ngày tính lại, hoa hồng về 10%                 | F-030         | Chờ `newReceiptId` → mở `receipts/[newReceiptId]`, xác nhận như KG-06/07.                                                            |

---

## 7. Spec từng màn hình

Chung cho mọi màn:

- Loading lần đầu: skeleton hoặc `ActivityIndicator` giữa màn. Lỗi: `ErrorBox` + nút "Thử lại" (`refetch`). Lỗi mạng `status 0` → "Không có kết nối…".
- Kéo xuống để tải lại (`RefreshControl`) ở danh sách và chi tiết.
- 403/404 ở chi tiết → `EmptyState` "Không tìm thấy hoặc bạn không có quyền xem" + nút quay lại.
- Server Render ngủ: lần gọi đầu có thể 30–50 giây, mà `client.js` đang `timeout: 30000` → tăng lên **60000** khi nối API thật (nhánh `feature/consign-real-api`); upload ảnh cũng cần thời gian dài.
- **Guest mở thẳng màn chi tiết** (`/consign-forms/…`, `/receipts/…`, `/my-products/…` — nhóm `(member)` cho Guest vào): chưa đăng nhập → `<Redirect href="/login" />` (đặt sau mọi hook). Chỉ tab Ký gửi có bản Guest.
- **Không viết cứng số nghiệp vụ trong chữ:** hoa hồng từng kỳ, số ngày một kỳ, tổng ngày lấy từ dữ liệu (`commissionRateTerm1/2/3`, `termLengthDays`, tổng = `termLengthDays × (maxRenewals + 1)`). Các số trong spec bên dưới (10/15/20%, 30/90 ngày) là ví dụ theo cấu hình mặc định.

### Tab Ký gửi · `ConsignTabScreen`

- **Guest:** `EmptyState` "Đăng nhập để ký gửi" + nút Đăng nhập / Tạo tài khoản (giống thẻ khách ở PR-01).
- **Member:** `AppHeader` "Ký gửi" (không có nút ←). Dưới header là segmented 2 mục: **Form ký gửi** · **Sản phẩm ký gửi** (`ChipGroup` một lựa chọn là đủ). Nhớ mục đang chọn trong state của màn (không cần lưu).
- Badge số trên mục Sản phẩm khi có sản phẩm "Chờ xử lý cuối kỳ" (nếu dữ liệu cho phép).

### KG-01 · Danh sách form (mục "Form ký gửi")

- Header phải: nút **+ Tạo form** → `consign-forms/new`.
- Dải thông tin: "Đang có **n/5** form chờ duyệt. Đủ 5 form thì không tạo thêm được." (ẩn khi n = 0).
- Chip lọc: Tất cả · Chờ duyệt · Đã duyệt · Từ chối → truyền `status` vào API 16 (Tất cả = không truyền). "Hết hạn" chỉ hiện trong Tất cả.
- `FormCard`: ảnh nhỏ (nếu API có), tên, `StatusBadge`, "Giá mong muốn 1.000.000 đ · Kho …", dòng phụ theo trạng thái:
  - PENDING: "Gửi lúc dd/MM/YYYY HH:mm".
  - APPROVED: ô nổi bật "Mang đồ đến kho trước dd/MM · còn X ngày".
  - REJECTED: lý do (1–2 dòng, cắt bớt).
  - EXPIRED: mờ, "Quá hạn mang đồ đến kho dd/MM/YYYY".
- Thứ tự gợi ý: APPROVED (việc cần làm) lên đầu — nếu BE không sắp xếp thì để nguyên thứ tự BE, ghi chú [CHỜ LEAD].
- **Rỗng:** `EmptyState` "Chưa có form ký gửi nào" + "Gửi thông tin món đồ, kho duyệt xong bạn mới mang đến. Không mất phí đăng, không bán được cũng không mất gì." + nút Tạo form. Link "Ký gửi hoạt động thế nào?" → tạm mở một sheet/Alert tóm tắt 4 bước (form → duyệt → mang đến kho → xác nhận biên nhận).

### KG-02 + KG-03 · Tạo form (2 bước, một màn)

Một màn `CreateFormScreen`, một `useForm` cho cả 2 bước, `Stepper` "Bước 1 / 2". Nút ← ở bước 2 quay về bước 1 (không thoát). Thoát giữa chừng khi đã nhập → `Alert` "Bỏ form đang tạo?".

**Bước 1 — thông tin**

- **Ảnh sản phẩm (n / 6):** `PhotoPicker` lưới 4 cột; ô "+" mở `ImagePicker.launchImageLibraryAsync` (`mediaTypes: ["images"]`, `allowsMultipleSelection: true`, `selectionLimit: 6 - n`, `quality: 0.7`); có thể thêm lựa chọn chụp bằng camera (`launchCameraAsync`, cần xin quyền camera). Nhấn giữ/nút × để xoá ảnh. Hướng dẫn: "Cần ảnh mặt trước, mặt sau, nhãn mác và tem thương hiệu. Ảnh càng rõ, kho duyệt càng nhanh."
- **Tên sản phẩm:** bắt buộc, 2–100 ký tự [GIẢ ĐỊNH].
- **Danh mục / Thương hiệu:** 2 ô chọn cạnh nhau, dữ liệu từ API 44 (chỉ lấy đang hoạt động). Chọn bằng bottom sheet / màn chọn có ô tìm (thương hiệu có thể nhiều). Gửi `categoryId`, `brandId`.
- **Giá mong muốn:** `MoneyField` bàn phím số, hiển thị `1.000.000 đ`, > 0. NoteBox: "Đây chỉ là giá bạn đề xuất. Moderator sẽ kiểm định và chốt giá bán cuối cùng với bạn tại kho. Bạn có quyền từ chối nếu không đồng ý."
- **Mô tả:** `TextField multiline`, bắt buộc (DB `description NOT NULL`), placeholder "Size, tình trạng, lỗi nếu có (vd: size M, mặc 2 lần, không lỗi)" — thay cho 2 ô Kích cỡ/Tình trạng đã bỏ.
- **Nút "Tiếp tục — chọn kho":** `trigger([...các trường bước 1])`; lỗi → hộp tổng "Còn n mục chưa hợp lệ" ở đầu + lỗi dưới từng ô + cuộn lên đầu (KG-02 Lỗi validate).

**Bước 2 — chọn kho (KG-03)**

- Khi vào bước 2: `Location.requestForegroundPermissionsAsync()` → được thì `getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })` → API 14.
- **Từ chối quyền / lỗi GPS:** vẫn cho chọn — gọi API 14 không kèm toạ độ nếu BE hỗ trợ, hoặc cần một API danh sách kho [CHỜ BE]. Hiện NoteBox "Bật vị trí để xếp kho gần bạn lên đầu".
- Tiêu đề "GẦN BẠN NHẤT", danh sách `WarehouseOption` (RadioCard trong cột, `style={{ flex: 0 }}`): tên, khoảng cách `2,3 km` (dấu phẩy thập phân), địa chỉ. Giờ mở cửa chỉ hiện nếu API có. Chọn sẵn kho đầu tiên.
- NoteBox: "Sau khi kho duyệt form, bạn có **7 ngày** để mang đồ đến đúng kho này. Quá hạn thì form tự hủy."
- **Nút "Gửi form ký gửi"** (loading cả quá trình):
  1. Upload từng ảnh qua `uploadFile` → lấy `url` (tuần tự hoặc `Promise.all`; một ảnh lỗi → dừng, báo lỗi, giữ nguyên dữ liệu đã nhập).
  2. `createForm({...values, photoUrls})`.
  3. Thành công → `showToast("Đã gửi form")` → `router.replace("/consign-forms/" + id)`.
  4. 409 `TOO_MANY_PENDING_FORMS` → `Alert` "Bạn đang có 5 form chờ duyệt…" → về tab. 400 → hiện `fieldErrors` vào đúng ô (quay về bước 1 nếu lỗi ở bước 1).

**Chặn từ đầu:** vào màn khi đã đủ 5 form chờ (từ dữ liệu API 16 đã cache) → hiện thông báo thay vì form.

### KG-04 · Chi tiết form

Phần chung: header "Chi tiết form"; dòng "Mã form …" (dùng mã BE trả; nếu chỉ có UUID thì ẩn hoặc rút gọn [CHỜ BE]) + `StatusBadge`; khối **Sản phẩm** (ảnh, tên, danh mục · thương hiệu, giá mong muốn); khối **Kho tiếp nhận**.

- **PENDING (Chờ duyệt):** `Timeline` 4 bước — Đã gửi form ✓ (thời gian) → Kho đang duyệt (đang chạy, "Thường trong 1–2 ngày làm việc") → Mang đồ đến kho → Kiểm định & nhập kho. Footer: **Sửa form** (→ edit). "Hủy form" ẩn (mục 0.4 #5).
- **APPROVED (Đã duyệt):** khối **Việc cần làm** đầu màn: "Mang đồ đến **Kho …** trước **dd/MM/YYYY** · Còn X ngày · Quá hạn thì form tự hủy." NoteBox: "Đến quầy, đọc mã Member hoặc số điện thoại cho nhân viên. Moderator sẽ kiểm định và thống nhất giá bán với bạn trước khi nhập kho." Footer: **Mã Member của tôi** → PR-04 (`/profile/member-code`). Nút "Chỉ đường" tuỳ chọn: `Linking.openURL("geo:0,0?q=" + encodeURIComponent(address))`.
  - Có `receiptId` (đã kiểm định tại quầy, chờ Member xác nhận) → khối nổi bật "Kho đã lập biên nhận — xác nhận để đăng bán" + nút **Xem biên nhận** → `receipts/[receiptId]`.
- **REJECTED (Bị từ chối):** khối **Lý do từ chối** (`rejectReason`; thông tin Moderator/thời gian chỉ hiện nếu API có). Mục "Có thể bạn muốn": **Tạo form mới từ thông tin này** → `consign-forms/new?fromFormId=…` (điền sẵn, cần API 17 đủ trường; không có thì ẩn).
- **EXPIRED:** NoteBox "Form đã hết hạn vì quá hạn mang đồ đến kho (dd/MM/YYYY). Bạn có thể tạo form mới."

### KG-05 · Sửa form

- Vào màn: lấy dữ liệu API 17 điền sẵn (cần đủ trường — mục 11). Không PENDING → hiện thông báo và quay lại.
- Giống bước 1 của KG-02, **không có bước chọn kho**. NoteBox đầu màn: "Sửa được khi form còn ở trạng thái Chờ duyệt. Kho đã chọn không đổi được ở đây — muốn đổi kho thì huỷ form và tạo lại." (khi BE chưa có huỷ form, bỏ vế "huỷ form…").
- Ảnh: ảnh cũ là URL, ảnh mới là `file://` → khi lưu chỉ upload ảnh mới, ghép với URL cũ còn giữ lại.
- Footer: **Huỷ** (quay lại, hỏi nếu đã sửa) · **Lưu thay đổi** (disabled khi chưa sửa gì — `formState.isDirty`). API 18 gửi kèm `warehouseId` cũ (body giống API 15).
- 409 `FORM_NOT_EDITABLE` → toast "Form đã được kho xử lý, không sửa được nữa" → invalidate + quay lại chi tiết.

### KG-06 · Biên nhận ký gửi

Nguồn: API 19 (+ tên sản phẩm/SKU/kho nếu BE trả). Bố cục theo mẫu biên nhận mục 12 tài liệu, chia khối "Điều":

- **Chờ xác nhận** (`confirmedAt == null`):
  - Dải nhắc đầu màn: "Đọc kỹ trước khi xác nhận. Bấm xác nhận là hàng được nhập kho và đăng bán ngay."
  - Tiêu đề "BIÊN NHẬN KÝ GỬI HÀNG HÓA", "Số `receiptNo`".
  - Điều 1 — Hàng hoá: sản phẩm, SKU, kết quả kiểm định (nếu có).
  - Điều 2 — Giá bán và hoa hồng: Giá bán niêm yết `agreedPrice`, Giá sàn `floorPrice`; bảng 3 kỳ (Kỳ 1 ngày 0–30 · `commissionRateTerm1`…). Ngày tính từ `termLengthDays`, **không viết cứng 30**.
  - Điều 3 — Thời hạn: "Một kỳ `termLengthDays` ngày, tự gia hạn tối đa `maxRenewals` lần… Mỗi lần sang kỳ mới bạn có `freeWithdrawalWindowDays` ngày rút hàng không mất phí." Phí rút hàng `withdrawalFee`.
  - Điều 8 — Hàng vô thừa nhận (văn bản cố định theo mục 12).
  - "Điều 4–7, 9, 10": thu gọn, bấm để mở (văn bản cố định từ mục 12, để trong `constants` hoặc một file text riêng).
  - Footer cố định: `Checkbox` "Tôi đã đọc và đồng ý toàn bộ nội dung biên nhận" + nút **Xác nhận biên nhận** (disabled khi chưa tick) → mở KG-07.
- **Đã xác nhận:** badge "ĐÃ XÁC NHẬN", "Xác nhận lúc dd/MM/YYYY HH:mm"; tóm tắt (giá bán, giá sàn, hoa hồng "10% → 15% → 20%", hết hạn); NoteBox: "Các mức phí và thời hạn trong biên nhận này được giữ nguyên đến khi kết thúc. ReHome đổi cấu hình sau này không ảnh hưởng hợp đồng của bạn." Footer: **Tải bản PDF** · **Chia sẻ**.
  - Mở PDF: `WebBrowser.openBrowserAsync(pdfUrl)`. Trên Android, Chrome Custom Tab có thể tải file về thay vì xem — chấp nhận. Nếu không mở được → `Linking.openURL(pdfUrl)`.
  - Chia sẻ: `Share.share({ message: "Biên nhận ký gửi " + receiptNo + ": " + pdfUrl })`. [CHỜ BE] `pdfUrl` có cần token không — nếu cần, không mở trực tiếp được (mục 11).

### KG-07 · Dialog xác nhận biên nhận

- Modal (hoặc `Alert` nếu muốn nhanh — nhưng wireframe có bảng số liệu nên nên làm Modal).
- Tiêu đề "Xác nhận biên nhận?"; "Sau khi xác nhận, hàng được nhập kho và đăng bán ngay. **Không thể hủy biên nhận này.**"
- Bảng: Sản phẩm · Giá bán · Giá sàn · "Hoa hồng kỳ 1: 10% — bạn nhận 900.000 đ" (`calcPayout(agreedPrice, commissionRateTerm1)`) · Thời hạn "90 ngày" (= `termLengthDays × (maxRenewals + 1)`), đến ngày nếu tính được.
- NoteBox: "Sau khi xác nhận bạn chỉ được giảm giá, không được tăng, và không thấp hơn giá sàn. Hoa hồng tăng lên `{commissionRateTerm2}`% ở kỳ 2 và `{commissionRateTerm3}`% ở kỳ 3." (lấy từ biên nhận, không viết cứng).
- Nút **Để sau** (đóng) · **Xác nhận** (loading) → API 20 → đóng modal, `showToast("Đã xác nhận biên nhận")`, màn chuyển sang trạng thái Đã xác nhận. 409 (đã xác nhận ở nơi khác) → refetch API 19.

### KG-08 · Danh sách sản phẩm ký gửi (mục "Sản phẩm ký gửi")

- Dải tóm tắt: "4 Đang bán · 1 Đã có đơn · 1 Chờ cuối kỳ" (đếm từ dữ liệu đã tải; nếu phân trang thì bỏ dải này hoặc xin BE số đếm [CHỜ BE]).
- Chip lọc: Tất cả · Đang bán · Chờ cuối kỳ · Kết thúc → map sang `status` API 21 [KIỂM TRA giá trị BE nhận].
- `ProductCard` theo `getProductView`:
  - **Chờ cuối kỳ** (đưa lên đầu, viền đậm): "Còn X ngày để chọn cách xử lý" + dòng nhắc "Quá hạn, bạn mất quyền sở hữu món hàng".
  - **Đang bán:** giá, "Kỳ x/3 · còn X ngày · hoa hồng 10%", "Dự kiến nhận 900.000 đ" (`expectedPayout`).
  - **Đã có đơn:** giá, "Đơn … · đang giao" (nếu có), "Tạm khóa giảm giá và rút hàng".
  - **Kết thúc:** mờ, nhãn Đã bán / Đã nhận lại / Vô thừa nhận.
- **Rỗng:** "Chưa có sản phẩm ký gửi. Món đồ lên đây sau khi bạn xác nhận biên nhận tại kho."

### KG-09 · Chi tiết sản phẩm

Đầu màn chung: tên, `StatusBadge`, "Thương hiệu · Size", "SKU … · Kho …".

- **Đang bán (Kỳ 1/2):**
  - Khối **Kỳ ký gửi**: "Kỳ x / 3", "Ngày n / 90" (thanh tiến độ; 3 và 90 tính từ biên nhận — `maxRenewals + 1`, `termLengthDays × (maxRenewals + 1)` — nếu API 22 không trả thì xin BE [CHỜ BE]), "Hết kỳ x: dd/MM/YYYY · còn X ngày". NoteBox: "Hết kỳ x mà chưa bán, hệ thống tự gia hạn sang kỳ x+1 và hoa hồng tăng lên y%."
  - Khối **Nếu bán được hôm nay** (`PayoutBreakdown`): Giá bán hiện tại − Hoa hồng kỳ x (r%) = **Bạn nhận vào ví**. Dòng "Giá sàn … — bạn không hạ thấp hơn mức này được."
  - Footer: **Giảm giá bán** → `reduce-price`. (Rút hàng về: ẩn — Phase 5. Khối "cửa sổ rút miễn phí" của wireframe cũng ẩn vì thuộc chức năng rút hàng.)
- **Kỳ 3 (kỳ cuối):** như trên + banner cảnh báo đầu màn: "Còn X ngày là hết kỳ cuối. Sau dd/MM, sản phẩm được gỡ khỏi sàn và bạn phải chọn cách xử lý trong 30 ngày." + khối "Sắp tới sẽ thế nào". Dòng phụ "Hoa hồng kỳ 3 là 20% — mức cao nhất, không tăng thêm."
- **Đã có đơn (RESERVED):** khối "Đã bán — đang chờ giao hàng" + tiến trình (Đã thanh toán → Đã đóng gói → Đang giao → Hoàn thành) nếu BE có trạng thái đơn; khối **Số tiền đã chốt** (giá, hoa hồng đã chốt, "Sẽ cộng vào ví"); NoteBox: "Hoa hồng chốt theo kỳ đang chạy lúc đơn được đặt… Tiền được cộng vào ví khi đơn hoàn thành và hết thời hạn trả hàng của người mua." **Không có** nút Giảm giá (hoặc disabled).
- **Chờ xử lý cuối kỳ:** khối đỏ "Cần bạn quyết định — Còn X ngày", "Đã hết 90 ngày trên sàn (dd/MM). Hạn phản hồi: dd/MM/YYYY.", câu hậu quả vô thừa nhận; "Lịch sử ký gửi" theo kỳ (chỉ nếu API có); mô tả 2 lựa chọn; footer **Nhận lại hàng** · **Ký gửi lại** → cả hai mở `end-of-term` (chọn sẵn lựa chọn tương ứng).
- **Chờ chốt giá (đã chọn ký gửi lại):** chuyển thẳng sang `reconsign` hoặc hiện khối dẫn tới đó.

### KG-10 · Giảm giá bán

- Đầu màn: tên, "SKU · Kỳ x · hoa hồng r%".
- **Giá bán mới:** `MoneyField`, helper "Hiện tại 1.000.000 đ". Chip nhanh: −10% · −20% · Về giá sàn (làm tròn xuống nghìn đồng [GIẢ ĐỊNH]).
- Thanh mô tả vị trí: Giá sàn — Giá mới — Giá gốc (đơn giản là 3 nhãn trên một thanh; không bắt buộc vẽ đẹp).
- Khối **Với giá mới, bạn nhận**: Giá bán mới − hoa hồng = Bạn nhận; "So với giá hiện tại: nhận ít hơn …".
- NoteBox: "Giá mới áp dụng ngay khi xác nhận. Bạn chỉ được giảm, không được tăng lại, và mỗi ngày đổi giá tối đa 1 lần. Muốn tăng giá phải thương lượng lại biên nhận với kho."
- Kiểm tra trên app (zod với `currentPrice`, `floorPrice` truyền vào schema):
  - `newPrice >= currentPrice` → "Giá mới phải thấp hơn giá hiện tại".
  - `newPrice < floorPrice` → trạng thái **Dưới giá sàn**: lỗi đỏ "Thấp hơn giá sàn. Mức thấp nhất bạn được đặt là 500.000 đ." + khối giải thích (giá sàn = 50% giá thống nhất, ghi trong biên nhận) + nút **Đặt về giá sàn**. Nút xác nhận disabled.
- Nút **Xác nhận giá 850.000 đ** → `Alert` hỏi lại (đổi giá không hoàn tác) → API 23 → toast → quay lại KG-09.
- Lỗi BE: 400 → lỗi dưới ô; 409 `BELOW_FLOOR_PRICE` → trạng thái Dưới giá sàn; 409 `PRICE_CHANGE_LIMIT_REACHED` → trạng thái **Đã đổi giá hôm nay**: khối "Hôm nay bạn đã đổi giá rồi… Có thể đổi giá tiếp từ 00:00 ngày mai", ô nhập + nút disabled, footer "Quay lại sản phẩm". Nếu BE trả thời điểm đổi giá gần nhất thì vào màn là biết luôn, khỏi chờ lỗi.
- Sản phẩm không phải Đang bán → không cho vào màn này.

### KG-11 · Xử lý cuối kỳ

- Banner: "Còn X ngày để quyết định. Hạn phản hồi dd/MM/YYYY. Quá hạn, bạn mất quyền sở hữu món hàng và ReHome chuyển cho tổ chức từ thiện đối tác."
- Thẻ sản phẩm: tên, thương hiệu · size · giá cuối, "Đang giữ tại Kho …".
- "Chọn một trong hai" — 2 `RadioCard` trong cột:
  - **Nhận lại hàng — miễn phí:** "Sản phẩm được giữ lại cho bạn. Đến Kho … trong 7 ngày kể từ khi xác nhận, đọc mã Member tại quầy để nhận. Không tính phí rút hàng ở bước này."
  - **Ký gửi lại với giá mới:** "Hàng ở nguyên kho, bạn không phải đi lại. Moderator xem lại tình trạng và đề xuất giá mới, bạn đồng ý thì ký biên nhận mới. Chu kỳ 90 ngày tính lại từ đầu, hoa hồng về mức kỳ 1."
- Gợi ý (nếu có lịch sử giá): "Sản phẩm đã qua 3 kỳ, giá hạ từ … xuống … mà chưa bán được."
- Nút **Xác nhận lựa chọn** (disabled khi chưa chọn) → `Alert` xác nhận → API 24 với `decisionId` lấy từ `endOfTermDecision` của API 22 [CHỜ BE hình dạng].
  - TAKE_BACK → màn kết quả/NoteBox "Đến Kho … trước dd/MM, đọc mã Member tại quầy" + nút **Mã Member của tôi**.
  - RE_CONSIGN → `router.replace("my-products/[id]/reconsign")`.
  - 409 `DECISION_EXPIRED` → `Alert` "Đã quá hạn chọn cách xử lý" → quay lại, refetch.

### KG-12 · Ký gửi lại

- **Chờ Moderator chốt giá** (`decision = RE_CONSIGN`, chưa có `newReceiptId`): badge "CHỜ CHỐT GIÁ"; `Timeline`: Bạn chọn ký gửi lại ✓ → Moderator đề xuất giá mới (đang chạy) → Bạn đồng ý hoặc từ chối → Biên nhận mới, hàng lên sàn lại. Khối "Đang chờ kho phản hồi… Thường trong 1–2 ngày làm việc." Khối "Kỳ ký gửi vừa kết thúc" (giá ban đầu, giá cuối, 90 ngày không bán được) nếu có dữ liệu. Nút "Nhắn cho kho" và "Hủy, nhận lại hàng": **ẩn** (mục 0.4 #8).
- **Có giá mới** (`newReceiptId` có, biên nhận mới chưa xác nhận): theo F-030 Member xác nhận qua **API 19/20** → mở thẳng `receipts/[newReceiptId]` (KG-06/07 dùng lại). Phần "Moderator đề xuất 420.000 đ (gạch 550.000 đ) + ghi chú Moderator" chỉ hiện nếu API 19 trả thêm ghi chú/giá cũ [CHỜ BE]. Nút "Từ chối giá" ẩn cho tới khi BE có API.

---

## 8. Schema zod (`features/consignment/schemas.js`)

```js
import { z } from "zod";
import { CONSIGN_LIMITS } from "@/constants/consignment";
import { formatVnd } from "@/utils/money";

export const consignFormSchema = z.object({
  photos: z
    .array(z.string()) // uri local hoặc URL đã upload
    .min(CONSIGN_LIMITS.MIN_PHOTOS, "Cần ít nhất 1 ảnh sản phẩm")
    .max(CONSIGN_LIMITS.MAX_PHOTOS, `Tối đa ${CONSIGN_LIMITS.MAX_PHOTOS} ảnh`),
  productName: z
    .string()
    .trim()
    .min(2, "Chưa nhập tên sản phẩm")
    .max(100, "Tối đa 100 ký tự"),
  categoryId: z.string({ error: "Chọn danh mục" }).min(1, "Chọn danh mục"),
  brandId: z.string({ error: "Chọn thương hiệu" }).min(1, "Chọn thương hiệu"),
  desiredPrice: z
    .number({ error: "Nhập giá mong muốn" }) // ô trống = undefined → báo câu này
    .int()
    .positive("Giá phải lớn hơn 0"),
  description: z
    .string()
    .trim()
    .min(10, "Mô tả ngắn size và tình trạng (ít nhất 10 ký tự)"),
  warehouseId: z.string().optional(), // bắt buộc ở bước 2 — kiểm riêng khi bấm Gửi
});

export const makeReducePriceSchema = ({ currentPrice, floorPrice }) =>
  z.object({
    newPrice: z
      .number({ error: "Nhập giá mới" })
      .int()
      .lt(currentPrice, "Giá mới phải thấp hơn giá hiện tại")
      .gte(
        floorPrice,
        `Thấp hơn giá sàn. Mức thấp nhất là ${formatVnd(floorPrice)}`,
      ),
  });
```

- Cú pháp **zod 4** (project dùng `zod ^4.6.7`, giống Phase 1): message kiểu `{ error: "…" }`. **Không** dùng `required_error` / `invalid_type_error` (của zod 3, zod 4 bỏ qua).
- **Quy ước `MoneyField`:** giá trị trong form là **number** hoặc **`undefined` khi ô trống** (không phải `0`, không phải `NaN`) → trống hiện "Nhập giá mong muốn", gõ `0` hiện "Giá phải lớn hơn 0". Hiển thị `formatVnd(value)`, khi gõ thì `parseVnd(text)` (chuỗi rỗng → `undefined`).
- Các mức `min(2)`, `min(10)`, `max(100)` là **[GIẢ ĐỊNH]** — đối chiếu với validation trong code BE khi có controller.

---

## 9. Tự kiểm tra trước khi push

Chạy trên Android thật. Ghi ✅ khi qua.

**Mock (`MOCK.consignment = true`)**

- [x] ✅ Guest mở tab Ký gửi → thẻ mời đăng nhập.
- [x] ✅ Danh sách form: đủ 4 trạng thái, lọc chip đúng, kéo tải lại. (Trạng thái rỗng: thử bằng `let forms = []`.)
- [x] ✅ Tạo form: bỏ trống bấm Tiếp tục → hộp tổng lỗi + lỗi từng ô; giá `0` bị chặn; đủ 6 ảnh thì ô "+" biến mất.
- [x] ✅ Bước 2: cho phép vị trí → danh sách kho có km, kho gần nhất chọn sẵn. (Từ chối vị trí: chưa thử.)
- [x] ✅ Đủ 5 form chờ → "+ Tạo form" báo "Chưa tạo thêm được"; vào thẳng màn tạo → màn chặn.
- [x] ✅ Chi tiết form 4 trạng thái; Đã duyệt → Mã Member; có biên nhận → KG-06; đã xác nhận → tiến trình hoàn tất.
- [x] ✅ Sửa form: dữ liệu điền sẵn; Lưu mờ khi chưa sửa; lưu xong cập nhật chi tiết + danh sách. Tạo lại từ form Bị từ chối / Hết hạn.
- [x] ✅ Biên nhận: chưa tick → lỗi dưới ô tick; dialog đúng số tiền; xác nhận xong đổi trạng thái; mở PDF; Chia sẻ.
- [x] ✅ Sản phẩm: dải đếm + 4 chip; chi tiết Kỳ 1, Kỳ 3 (banner), Đã có đơn (tiến trình, số tiền đã chốt), Chờ cuối kỳ, Chờ chốt giá, Đã bán.
- [x] ✅ Giảm giá: "bạn nhận" đổi theo khi gõ; ≥ giá hiện tại bị chặn; < giá sàn → trạng thái Dưới giá sàn; "Về giá sàn"; đổi xong vào lại → Đã đổi hôm nay + lịch sử.
- [x] ✅ Cuối kỳ: chọn sẵn theo nút bấm; Nhận lại → "Chờ nhận lại" + Mã Member; Ký gửi lại → Chờ chốt giá → [Dev] giả lập → biên nhận mới → xác nhận → lên sàn lại kỳ 1.
- [ ] Mất mạng (bật chế độ máy bay) ở 1 màn danh sách và 1 màn mutation → thông báo lỗi mạng, bấm thử lại được. (Mock không gọi mạng → thử khi nối BE thật.)
- [ ] Từ chối quyền vị trí ở bước 2 → NoteBox "Bật quyền vị trí…", vẫn chọn được kho.

**BE thật (28–30/10)** — cùng danh sách, cộng:

- [ ] Moderator duyệt / từ chối trên web → app kéo tải lại thấy đổi trạng thái.
- [ ] Kiểm định tại quầy trên web → app thấy biên nhận, xác nhận → sản phẩm xuất hiện ở mục Sản phẩm.
- [ ] Mỗi mã lỗi ở bảng 5.2 được thử ít nhất 1 lần.

---

## 10. Commit, push, Pull Request

Như Phase 1 (mục 11 PHASE1_GUIDE). Gợi ý commit cho nhánh đầu:

```
feat(consign): add consignment constants and mock api
feat(consign): consign tab with form list (KG-01)
feat(consign): create form 2 steps with nearest warehouse (KG-02, KG-03)
feat(consign): form detail and edit (KG-04, KG-05)
```

Mô tả PR có các mục: Đã làm · Đang dùng mock (chờ BE) · Lệch so với wireframe (bảng 0.4) · Cách test · Ảnh chụp.

---

## 11. Cần hỏi (gom gửi backend / lead)

**Backend (Nguyên — phụ trách API 14–48)**

1. **Upload ảnh:** `POST /uploads` khi nào có? Hay `POST /consignment-forms` nhận multipart luôn? Không có upload thì không tạo form thật được.
2. **Tiền tố và envelope** của nhóm API 14–24, 44: có `/api` không? có bọc `{result, statusCode, message, isSuccess}` không? Định dạng lỗi có `code` như nhóm auth không?
3. **API 16 (danh sách form)** xin thêm: `thumbnailUrl` (ảnh đầu), `warehouseName`, `bringInDeadline`, `createdAt`, `rejectReason`, và **số form PENDING** (để hiện 3/5 mà không phải tải hết).
4. **API 17 (chi tiết form)** xin thêm đủ trường để sửa/tạo lại: `categoryId/Name`, `brandId/Name`, `description`, `desiredPrice`, `photoUrls`, `warehouse {id, name, address}`, `createdAt`, `formNo` (mã hiển thị), và cho biết `receiptId` đã xác nhận hay chưa.
5. **Huỷ form** (DB có `CANCELLED`): có endpoint không? (KG-04 có nút Hủy form.)
6. **API 14 khi không có vị trí:** gọi không kèm `lat/lng` được không, hay có `GET /warehouses` công khai? Có trả `openingHours` không (entity `Warehouse` đã có cột này)?
7. **API 22 (chi tiết sản phẩm)** trả thêm các cột **entity `Product` đã có**: `size`, `conditionNote`, `currentTerm`, `termStartedAt`, `endOfTermDeadline`, `unclaimedDecisionDeadline`; và từ biên nhận: `floorPrice`, `commissionRateCurrentTerm`, `termLengthDays`, `maxRenewals`; cộng `expectedPayout`, `warehouseName`, `brandName`, ảnh, **`lastPriceChangedAt`** (biết trước đã đổi giá hôm nay); với RESERVED: tỷ lệ hoa hồng **đã chốt** + mã đơn.
8. **`endOfTermDecision`** trong API 22: entity đã có `{id, decision, newReceipt, decidedAt, deadline}` → đề xuất trả `{id, decision, deadline, newReceiptId}`. App lấy `id` để gọi API 24.
9. **"Chờ xử lý cuối kỳ"** không có trong `ProductStatus`. Đề xuất: Product có `EndOfTermDecision` với `decision = null` (hoặc `unclaimedDecisionDeadline != null`). API 21 lọc bằng giá trị nào cho nhóm này?
10. **API 19** có trả thêm `productName`, `sku`, `warehouseName`, `conditionNote` để hiện Điều 1 không? Với biên nhận ký gửi lại: có giá cũ và ghi chú của Moderator không?
11. **`pdfUrl`** là link công khai hay cần token? (Cần token thì app phải tải về bằng axios rồi mới mở.)
12. Ký gửi lại: Member **từ chối giá** đề xuất / **đổi ý sang nhận lại** gọi API nào? (KG-12)
13. Bảng `PriceChangeLog` đã có trong DB — có **API đọc** lịch sử đổi giá / giá theo kỳ không? (KG-10, KG-09 cuối kỳ) — không có thì app ẩn.
14. Giới hạn validation: số ảnh tối thiểu/tối đa, độ dài tên/mô tả.
15. **API 19** có `formId` (biên nhận lần đầu) hoặc `productId` (biên nhận ký gửi lại) không? Với ký gửi lại: `previousPrice`, `moderatorNote`.
16. **API 17** có cờ biên nhận đã xác nhận chưa (mobile đang dùng `receiptConfirmed`)?
17. Chọn **Nhận lại hàng** (`TAKE_BACK`): hạn đến kho lấy hàng bao lâu (mobile giả định 7 ngày, theo KG-11)? Trả về field gì (mobile đang dùng `pickupDeadline`)? `ProductStatus` khi đang chờ lấy?
18. Đơn hàng trong API 22 (RESERVED): `order {code, status, lockedCommissionRate, orderedTerm, orderedDay}` — tên field thật?
19. Danh sách sản phẩm: số đếm theo nhóm (Đang bán / Đã có đơn / Chờ cuối kỳ) để không phải tải hết.

**Lead**

20. Gộp KG-01 và KG-08 vào tab Ký gửi (2 mục) — đồng ý?
21. Bỏ ô Kích cỡ/Tình trạng ở KG-02 (DB không có), hướng dẫn ghi vào Mô tả — đồng ý? Hay xin BE thêm cột?
22. Ảnh theo loại (mặt trước/sau/nhãn mác/tem) có bắt buộc không? Nếu có thì cần BE phân loại ảnh.
23. **Nguyên văn mục 12** (mẫu biên nhận) Tài liệu tổng quan để thay Điều 4–7, 9, 10 đang tạm (`receiptTerms.js`).
24. Duyệt các chỗ lệch #10–#18 ở bảng 0.4 (đặc biệt #16 trạng thái "Chờ nhận lại").
