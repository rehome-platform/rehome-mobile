# ReHome Mobile — Hướng dẫn Phase 3 (Mua hàng & thanh toán — phía Member)

> Phase 3 theo kế hoạch: 31/10 – 05/11/2026, luồng **L-03**. Mobile đang **đi trước lịch** (Phase 2 xong UI 18/10), nên làm Phase 3 từ **19/10**, xen kẽ việc nối API thật Phase 2 (28–30/10) khi BE xong.
> Nguồn: _Tài liệu tổng quan_ (F-012, F-013, F-045 … F-058; L-03; mục 8 dòng tiền; mục 11 "Thời hạn thanh toán 15 phút"), _Thiết kế Database_ (Cart, CartItem, ShippingAddress, Order, OrderItem, Payment), _API_CONTRACT_ (API 49 – 61, cộng 62/63 của Phase 4 để xem đơn), wireframe của lead (**BR-01 → BR-09**).
> Quy ước giữ nguyên như `CLAUDE.md` và PHASE2_GUIDE. File này chỉ ghi phần **mới**.
> Ký hiệu: **[GIẢ ĐỊNH]** · **[CHỜ BE]** · **[CHỜ LEAD]** · **[KIỂM TRA]** (đối chiếu code BE trước khi dùng).
> **Trạng thái BE (đã đọc code 19/10 tại `develop` `1852963` — kết quả ở mục 5.2 + 5.2b):** có thật `GET /products` (public), `GET /cart`, `POST /cart/items`, `DELETE /cart/items/{id}`, `GET/POST/PUT/DELETE /addresses`, `POST /orders`. **Chưa có:** `GET /products/{id}` (API 50 — chi tiết sản phẩm!), checkout-preview (58), thanh toán (60), webhook MoMo (61), xem đơn (63). Có mấy điểm BE làm **khác contract** ảnh hưởng luồng giỏ → đặt hàng (mục 5.2b) — đọc trước khi code.

---

## 0. Phase 3 gồm những gì và thế nào là "xong"

### 0.1. Ngoài phạm vi (đừng làm)

- **Danh sách / chi tiết / theo dõi đơn, huỷ đơn đã thanh toán, xác nhận nhận hàng, đánh giá** (BR-10 → BR-14) → **Phase 4**. Phase 3 chỉ có màn **kết quả thanh toán**.
- **Thanh toán bằng ví**: API 60 có `WALLET` nhưng ví (số dư, API 73) là Phase 4 và ví chưa có tiền trước khi có đơn hoàn thành → Phase 3 **chỉ MoMo**, ẩn lựa chọn ví (mục 0.4 #7).
- **Thử đồ AI** (nút ở BR-04) → Phase 6. **Ẩn**.
- "Báo khi có lại" (BR-04), "Báo cho tôi khi có hàng phù hợp" (BR-02) → không có API thông báo đăng ký. **Ẩn**.
- Chọn Tỉnh/Quận/Phường theo GHN (BR-07) → cần dữ liệu vùng GHN, làm cùng GHN ở Phase 4 (mục 0.4 #5).

### 0.2. Danh sách màn hình

| Mã    | Màn hình                                                                  | Route đề xuất (dưới `src/app/(member)/`)     | Cần đăng nhập           | API                   | F                   |
| ----- | ------------------------------------------------------------------------- | -------------------------------------------- | ----------------------- | --------------------- | ------------------- |
| BR-01 | Trang chủ Mua sắm (tìm kiếm, chip danh mục, lưới "Mới lên sàn", icon giỏ) | `(tabs)/index.js` (đã có, đang EmptyState)   | Không                   | 49, 44, 52 (badge)    | F-012               |
| BR-02 | Kết quả tìm kiếm / Không có kết quả                                       | `search.js`                                  | Không                   | 49                    | F-013               |
| BR-03 | Bộ lọc (bottom sheet)                                                     | sheet trong `search.js`                      | Không                   | 44, 49                | F-013               |
| BR-04 | Chi tiết sản phẩm: Đang bán / Không khả dụng / Đã bán                     | `products/[id].js`                           | Không (bấm mua mới cần) | 50, 49 (tương tự), 51 | F-012, F-045        |
| BR-05 | Giỏ hàng (nhóm theo kho; có món không khả dụng)                           | `cart.js`                                    | Có                      | 52, 53                | F-046, F-047        |
| BR-06 | Địa chỉ giao hàng (danh sách; chế độ chọn khi checkout)                   | `addresses/index.js`                         | Có                      | 54, 56, 57            | F-048, F-050, F-051 |
| BR-07 | Thêm / sửa địa chỉ                                                        | `addresses/new.js`, `addresses/[id]/edit.js` | Có                      | 55, 56                | F-049, F-050        |
| BR-08 | Đặt hàng (checkout, tách đơn theo kho) + trạng thái "Giữ hàng thất bại"   | `checkout.js`                                | Có                      | 58, 59                | F-052 … F-055       |
| BR-09 | Chờ thanh toán (đếm ngược 15 phút) → Thành công / Hết hạn                 | `payment.js`                                 | Có                      | 60, 63                | F-056 … F-058       |

> **Route:** `products/[id]` (người mua) khác `my-products/[id]` (người ký gửi, Phase 2) — không trùng. Tab Mua sắm là `(tabs)/index.js` = URL `/`, nên **không** tạo `(member)/index.js`.
> Các màn cần đăng nhập: Guest mở thẳng → `<Redirect href="/login" />` (đặt sau mọi hook), giống Phase 2.

### 0.3. Định nghĩa "xong"

Chạy trên Android thật; phần BE đã có thì gọi thật, phần chưa có thì mock (mục 5.1):

1. Guest xem được trang chủ, tìm kiếm, lọc, chi tiết sản phẩm. Bấm "Thêm vào giỏ" / "Mua ngay" khi chưa đăng nhập → hỏi đăng nhập, đăng nhập xong **quay lại đúng sản phẩm**.
2. Danh sách sản phẩm cuộn vô hạn (phân trang 0-based), kéo xuống tải lại, ảnh có ô giữ chỗ khi đang tải.
3. Tìm kiếm + lọc (danh mục, thương hiệu, khoảng giá, kho) đúng với API; chip bộ lọc đang áp dụng bấm ✕ để bỏ; không có kết quả → màn BR-02 rỗng có "Xoá hết bộ lọc".
4. Chi tiết: ảnh lướt ngang, giá (gạch giá gốc nếu đã giảm), "Đã kiểm định", 3 trạng thái (Đang bán / Không khả dụng / Đã bán); thêm vào giỏ xong badge giỏ tăng.
5. Giỏ hàng nhóm theo kho, báo "tách thành n đơn"; món không khả dụng mờ, không tính vào tạm tính; xoá món có hỏi lại.
6. Địa chỉ: thêm / sửa / xoá / đặt mặc định; tối đa 5; không xoá được địa chỉ mặc định; địa chỉ đầu tiên tự là mặc định.
7. Checkout: chọn sẵn địa chỉ mặc định, đổi được; hiện từng đơn theo kho + phí ship + tổng; bấm đặt **không tạo đơn hai lần**; có món vừa bị người khác mua → trạng thái "Đặt được n/m món".
8. Thanh toán MoMo: mở trang MoMo, quay về app tự kiểm tra kết quả; đếm ngược theo `paymentDeadline` của BE; hết giờ → báo đơn đã huỷ; thành công → màn kết quả, giỏ được làm mới.
9. Thoát giữa chừng ở BR-09 → giỏ hàng có dải "Bạn có đơn chờ thanh toán — còn mm:ss" để mở lại.
10. Không có chuỗi trạng thái rải rác (`src/constants/order.js`, `product.js`), không mã màu trong màn hình, không so chữ trong message lỗi.

### 0.4. Quyết định đang áp dụng và chỗ lệch (báo lead)

| #   | Wireframe                                                                              | Mobile làm                                                                                                                       | Lý do                                                                                                                                                |
| --- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BR-03 lọc **Size**, **Tình trạng**; chọn **nhiều** danh mục/thương hiệu; nút "Sắp xếp" | Lọc 1 danh mục, 1 thương hiệu, khoảng giá, 1 kho; **ẩn** Size, Tình trạng, Sắp xếp                                               | API 49 chỉ có `categoryId`, `brandId` (một giá trị), `priceMin/Max`, `warehouseId` [CHỜ BE nếu muốn thêm]                                            |
| 2   | BR-03 nút "Xem **24** sản phẩm" (đếm trước)                                            | Nút "Áp dụng"                                                                                                                    | Đếm trước phải gọi API mỗi lần chạm chip; không đáng cho Phase 3                                                                                     |
| 3   | BR-02 "Thử tìm rộng hơn" (gợi ý từ khoá)                                               | Ẩn                                                                                                                               | Không có API gợi ý                                                                                                                                   |
| 4   | BR-04 "Sản phẩm tương tự"                                                              | Lấy bằng API 49 `categoryId` của món đang xem, bỏ chính nó, tối đa 6 [GIẢ ĐỊNH]                                                  | Không có API riêng; cách này không cần BE                                                                                                            |
| 5   | BR-07 chọn Tỉnh / Quận / Phường từ danh sách GHN, "Ghi chú cho shipper"                | Một ô **Địa chỉ cụ thể** (nhiều dòng); bỏ ghi chú                                                                                | Bảng ShippingAddress và API 55 chỉ có `addressDetail`, không có mã vùng / ghi chú. **Phase 4 tạo vận đơn GHN sẽ cần mã vùng** → báo BE ngay (mục 11) |
| 6   | BR-09 **một** lần thanh toán MoMo cho cả 2 đơn (tổng 2.022.000 đ)                      | Thiết kế màn theo **nhóm đơn**, lớp API giấu cách trả: BE có thanh toán gộp thì gọi 1 lần, chưa có thì trả **lần lượt từng đơn** | API 60 là `POST /orders/{id}/payment` — **mỗi đơn một lần** [CHỜ BE]                                                                                 |
| 7   | F-056 chọn **Ví hoặc MoMo**; BR-08 chỉ vẽ MoMo                                         | Phase 3 chỉ MoMo, giữ chỗ trong code (`PAYMENT_METHOD`) để Phase 4 bật Ví                                                        | Ví là Phase 4, chưa có số dư [CHỜ LEAD]                                                                                                              |
| 8   | BR-09 nút "Hủy đơn" (đơn chưa trả)                                                     | Ẩn — đơn tự huỷ khi hết 15 phút                                                                                                  | API 65 chỉ huỷ đơn **đã thanh toán**; chưa có API huỷ đơn chờ thanh toán [CHỜ BE]                                                                    |
| 9   | BR-04 "Share"                                                                          | Chia sẻ chữ (tên + giá + mã SKU) bằng `Share`                                                                                    | Chưa có link web sản phẩm                                                                                                                            |
| 10  | Sau thanh toán                                                                         | Thêm màn **kết quả** (thành công / hết hạn) ngay trong `payment.js`; nút "Xem đơn hàng" ẩn tới Phase 4                           | Wireframe không vẽ; BR-10/11 là Phase 4                                                                                                              |
| 11  | Giỏ hàng chỉ mở từ BR-01/BR-04                                                         | Thêm dải "Đơn chờ thanh toán" ở giỏ để quay lại BR-09                                                                            | Chưa có danh sách đơn (Phase 4); tránh Member mất đường quay lại đơn đang giữ                                                                        |

---

## 1. Nhánh Git

Mỗi việc một nhánh từ `develop`:

| Thứ tự | Nhánh                                | Nội dung                                            | Ngày (gợi ý) |
| ------ | ------------------------------------ | --------------------------------------------------- | ------------ |
| 0      | —                                    | ✅ Đã đọc code BE, điền mục 5.2 + 5.2b (19/10)      | 19/10        |
| 1      | `feature/shop-browse`                | constants, api products, BR-01 → BR-04              | 19–21/10     |
| 2      | `feature/cart-address`               | BR-05 → BR-07, badge giỏ, quay lại sau đăng nhập    | 22–23/10     |
| 3      | `feature/checkout-payment`           | BR-08, BR-09, `checkoutStore`, mock thanh toán      | 24–26/10     |
| 4      | `feature/payment-momo`               | MoMo sandbox thật (khi BE có API 60/61)             | khi BE xong  |
| —      | `feature/consign-real-api` (Phase 2) | nối API ký gửi thật                                 | 28–30/10     |

Việc Phase 1 (tổ chức, Google) vẫn theo nhánh riêng khi BE báo xong (CLAUDE.md → "Tiến độ").

---

## 2. Thư viện

| Thư viện                                           | Dùng cho                                              | Trạng thái |
| -------------------------------------------------- | ----------------------------------------------------- | ---------- |
| `expo-web-browser`                                 | Mở trang thanh toán MoMo (`openAuthSessionAsync`)     | ⚠️ **Chưa cài** (Phase 2 đã chọn `Linking`, không dùng thư viện này). Cài ở nhánh `feature/payment-momo` khi BE có API 60: `npx expo install expo-web-browser` → **build lại dev build** (thư viện native). Nhánh 1–3 không cần |
| `expo-linking`                                     | Tạo đường dẫn quay về app sau MoMo                    | ✅ có sẵn (`~58.0.13`) |
| `react-native` `Share`, `AppState`, `FlatList`     | Chia sẻ; biết khi app quay lại từ MoMo; lưới sản phẩm | ✅ có sẵn |

**Tuỳ chọn:** `expo-image` (cache ảnh tốt hơn `Image`, có `placeholder`, chuyển ảnh mượt). Là thư viện native → `npx expo install expo-image` rồi **build lại dev build**. Nếu chưa muốn build lại thì dùng `Image` của React Native, Phase 3 vẫn chạy được.

**`scheme` trong `app.json`:** ✅ đã là `"rehome"` (có từ Phase 1, nằm trong dev build hiện tại). Đường dẫn quay về app sau thanh toán: `rehome://payment-return`. Đổi scheme → **build lại dev build**. Trong Expo Go đường dẫn sẽ là `exp://…`, nên test MoMo nên dùng dev build.

---

## 3. Cấu trúc thư mục thêm mới

```
src/
├─ constants/product.js              # PRODUCT_CONDITION + nhãn (dùng chung với Phase 2 nếu trùng)
├─ constants/order.js                # ORDER_STATUS, PAYMENT_METHOD, CART_UNAVAILABLE_REASON
├─ stores/checkoutStore.js           # đơn vừa tạo đang chờ trả (chỉ RAM), địa chỉ đang chọn
├─ stores/pendingActionStore.js      # (tuỳ chọn) việc cần làm tiếp sau khi đăng nhập
├─ features/products/
│  ├─ api/ productsApi.js · productsApi.real.js · productsApi.mock.js · queryKeys.js
│  ├─ components/ ProductCard.js · ProductGrid.js · PhotoCarousel.js · PriceTag.js
│  │              FilterSheet.js · ActiveFilterChips.js · InspectedBadge.js
│  └─ screens/ ShopHomeScreen.js · SearchScreen.js · ProductDetailScreen.js
├─ features/cart/
│  ├─ api/ cartApi.js · cartApi.real.js · cartApi.mock.js
│  ├─ hooks/ useCart.js · useAddToCart.js
│  ├─ components/ CartButton.js (icon + badge) · CartItemRow.js · WarehouseGroup.js · PendingPaymentBanner.js
│  └─ screens/ CartScreen.js
├─ features/addresses/
│  ├─ api/ addressApi.js · addressApi.real.js
│  ├─ schemas.js
│  ├─ components/ AddressCard.js · AddressFormFields.js
│  └─ screens/ AddressListScreen.js · AddressFormScreen.js (dùng cho cả thêm và sửa)
└─ features/orders/                  # Phase 4 mở rộng thêm danh sách / chi tiết đơn
   ├─ api/ ordersApi.js · ordersApi.real.js · ordersApi.mock.js · paymentApi.js · paymentApi.real.js · paymentApi.mock.js
   ├─ hooks/ useOrderStatusPolling.js
   ├─ components/ OrderGroupCard.js · CheckoutSummary.js · PaymentCountdown.js
   └─ screens/ CheckoutScreen.js · PaymentScreen.js
```

`features/catalog` (danh mục/thương hiệu) đã có từ Phase 2 → dùng lại cho chip danh mục và bộ lọc. Kho cho bộ lọc: dùng danh sách kho của Phase 2 nếu có API công khai [CHỜ BE], chưa có thì ẩn mục Kho.

---

## 4. Hằng số và hàm tiện ích

### 4.1. `src/constants/order.js`

Theo **DB** (bảng Order, Payment). [KIỂM TRA] tên enum trong code BE.

```js
export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PAID: "PAID",
  PACKING: "PACKING",
  SHIPPING: "SHIPPING",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const ORDER_STATUS_LABEL = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã huỷ",
};

export const PAYMENT_METHOD = { MOMO: "MOMO", WALLET: "WALLET" };

// API 52: BE trả unavailableReason = tên ProductStatus của món (đã đọc code 19/10) khi món không còn ON_SALE
export const CART_UNAVAILABLE_LABEL = {
  RESERVED: "Đang có người thanh toán",
  SOLD: "Đã bán",
  WITHDRAWN: "Người ký gửi đã rút hàng",
  UNCLAIMED: "Không còn bán",
  DONATED: "Không còn bán",
  DESTROYED: "Không còn bán",
};
export const unavailableLabel = (reason) =>
  CART_UNAVAILABLE_LABEL[reason] ?? "Không còn khả dụng";

export const ADDRESS_LIMIT = 5; // theo BR-06 — BE KHÔNG giới hạn (đọc code 19/10) → app tự chặn
```

### 4.2. Tình trạng sản phẩm (`condition`)

**Đã đọc code BE:** API 49 trả `condition` = **`product.conditionNote`** — chữ tự do Moderator ghi lúc kiểm định (vd "Chính hãng, như mới"), **không phải enum** `LIKE_NEW`. → **Không** tạo `PRODUCT_CONDITION_LABEL`; hiển thị nguyên chữ (cắt 1 dòng ở thẻ), không có thì ẩn. Lọc theo tình trạng (BR-03) vì thế cũng không làm được (0.4 #1). Không cần file `constants/product.js` ở Phase 3.

### 4.3. Tiện ích

- Tiền: dùng lại `formatVnd` (Phase 2).
- Giá đã giảm: `currentPrice < originalPrice` → hiện giá gốc gạch ngang. `originalPrice` = giá chốt ký gửi.
- Đếm ngược: dùng lại hook `useCountdown` (có từ Phase 1 cho OTP) với mốc **`paymentDeadline` của BE**, không tự cộng 15 phút trên máy. Contract ghi thời điểm là ISO UTC có `Z` → `dayjs(paymentDeadline)` đúng múi giờ. Nếu BE trả không có `Z`/offset thì lệch 7 tiếng → [KIỂM TRA] (câu hỏi BE #15 của PHASE2_GUIDE).

---

## 5. Lớp API

### 5.1. `src/config/env.js`

Tách nhỏ vì BE xong từng phần khác nhau:

```js
export const MOCK = {
  password: false,
  upload: true,
  organization: true,
  consignment: true,
  // Phase 3 — theo kết quả đọc code BE 19/10 (mục 5.2)
  products: false, // GET /products thật; riêng getProduct(id) (API 50) chưa có → xem 5.2b #1
  cart: false, // /cart thật
  orders: false, // POST /orders thật; getCheckoutPreview / getOrder chưa có → tự tính / mock trong ordersApi (5.2b)
  payment: true, // API 60/61 chưa có
};
```

Một nhóm API có hàm thật và hàm chưa có (vd `productsApi`): file `*.js` ghép như `authApi.js` ở Phase 1 — `{ ...real, getProduct: MOCK.productDetail ? mock.getProduct : real.getProduct }` — để từng hàm bật/tắt mock riêng.

`addressApi` chỉ có `*.real.js` (API đã đủ CRUD từ 18/10) — giống `profileApi` ở Phase 1.

### 5.2. Bảng API Phase 3 (theo API_CONTRACT, cột "BE thật" = đọc code `develop` `1852963` ngày 19/10)

Base path: **không có `/api`**, **có envelope** `{result, isSuccess, statusCode, code, message}` (đã xác nhận ở `ProductController`, `CartController`, `ShippingAddressController`, `OrderController`). `unwrap` hiện có xử lý được. Lỗi 409 (`ConflictException`) và 400 (`BadRequestException`) đều dạng envelope **không có `code`** → phân biệt theo `status` + ngữ cảnh, không so chữ.

| API | Method + path                                         | Body / query                                                               | Trả về (contract)                                                                                                                                                                          | Lỗi                                           | BE thật                   |
| --- | ----------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------- |
| 49  | `GET /products`                                       | `search, categoryId, brandId, priceMin, priceMax, warehouseId, page, size` (size mặc định 20) | PageResponse `{content:[{id, name, thumbnailUrl, brandName, categoryName, size, condition, originalPrice, currentPrice}], page, size, totalElements, totalPages}` | 400 priceMin > priceMax | ✅ **public**; chỉ ON_SALE; sắp **mới nhất trước** (`createdAt` DESC); `thumbnailUrl` = ảnh đầu; `originalPrice` = giá chốt trong biên nhận; `condition` = `conditionNote` (chữ tự do) |
| 50  | `GET /products/{id}`                                  | —                                                                          | `{id, name, currentPrice, status, photos:[{url, isBackgroundRemoved}]}`                                         | 404                                           | ❌ **chưa có** (5.2b #1) |
| 51  | `POST /cart/items`                                    | `{productId}`                                                              | `{id, productId, addedAt}`                                                                                      | 400 thiếu productId · 404 · **409** "Sản phẩm không còn để bán." · **409** "Sản phẩm đã có trong giỏ hàng." | ✅ (role MEMBER) |
| 52  | `GET /cart`                                           | —                                                                          | `{groupedByWarehouse:[{warehouseId, warehouseName, items:[{id, product{id, name, thumbnailUrl, size, originalPrice, currentPrice}, addedAt, unavailableReason}], subtotal}], totalAmount}` | 401/403 | ✅ giỏ rỗng → `{groupedByWarehouse: [], totalAmount: 0}`; `unavailableReason` = tên `ProductStatus` (RESERVED, SOLD…) hoặc `null`; `subtotal`/`totalAmount` đã bỏ món không khả dụng; **item không có** `brandName`/`condition` |
| 53  | `DELETE /cart/items/{id}`                             | —                                                                          | `null`                                                                                                          | 404                                           | ✅ |
| 54  | `GET /addresses`                                      | —                                                                          | `[{id, recipientName, phone, addressDetail, isDefault}]`                                                        | —                                             | ✅ |
| 55  | `POST /addresses`                                     | `{recipientName, phone, addressDetail, isDefault}`                         | **chỉ** `{id, recipientName, isDefault}`                                                                        | 400 thiếu trường                              | ✅ `isDefault: true` → BE tự bỏ mặc định ở địa chỉ khác. **Không** giới hạn 5, **không** tự đặt mặc định cho địa chỉ đầu tiên |
| 56  | `PUT /addresses/{id}`                                 | như 55                                                                     | **chỉ** `{id, phone}`                                                                                           | 400 · địa chỉ của người khác / không có → `IllegalArgumentException` | ✅ tự bỏ mặc định cũ khi đặt mặc định mới → sau khi lưu **gọi lại `GET /addresses`** |
| 57  | `DELETE /addresses/{id}`                              | —                                                                          | `null`                                                                                                          | như 56                                        | ✅ **Không chặn** xoá địa chỉ mặc định → app tự chặn |
| 58  | `GET /cart/checkout-preview?shippingAddressId=`       | —                                                                          | `{orders:[…], unavailableItems:[]}`                                                                             | —                                             | ❌ chưa có (5.2b #3) |
| 59  | `POST /orders`                                        | `{shippingAddressId, productIds?}`                                         | `[{id, orderNo, warehouseId, subtotal, shippingFee, totalAmount, status:"PENDING_PAYMENT", paymentDeadline}]` | 400 thiếu / sai địa chỉ, "Giỏ hàng trống." · **409** "Sản phẩm không còn để bán." | ✅ role MEMBER; HTTP **200** (body `statusCode: 201`); món chuyển `RESERVED` ngay; `paymentDeadline` kiểu `Instant` (ISO UTC). Cách xử lý giỏ **khác contract** → 5.2b #2 |
| 60  | `POST /orders/{id}/payment`                           | `{paymentMethod: MOMO\|WALLET}`                                            | WALLET `{id, status}` · MOMO `{payUrl}`                                                                         | —                                             | ❌ chưa có |
| 61  | `POST /webhooks/momo`                                 | MoMo gọi, **app không gọi**                                                | —                                                                                                               | —                                             | ❌ chưa có |
| 63  | `GET /orders/{id}`                                    | —                                                                          | `{id, orderNo, status, items, ghnTrackingCode}`                                                                 | —                                             | ❌ chưa có |

### 5.2b. Điểm BE làm khác contract / còn thiếu — ảnh hưởng cách làm (đọc code 19/10)

1. **Chưa có `GET /products/{id}`** → BR-04 chưa gọi thật được. Cách làm: khi bấm thẻ ở danh sách, **lấy sẵn dữ liệu thẻ** (đã có tên, ảnh đầu, giá, thương hiệu, danh mục, size, tình trạng) từ cache `useInfiniteQuery` làm `initialData`; phần thiếu (nhiều ảnh, mô tả, kho, trạng thái) để trống / mock qua `productsApi.mock.getProduct`. Mở từ giỏ (chỉ có `product{id, name, thumbnailUrl, size, giá}`) → hiện phần có. Mở bằng link không có cache → mock. BE có API 50 thì chỉ đổi `getProduct` sang thật.
2. **`POST /orders` có 2 nhánh, khác contract:**
   - **Không gửi `productIds`** → lấy **cả giỏ**; **một món không còn ON_SALE là 409 cho cả lần đặt** (không đặt phần còn lại); đặt xong **BE xoá các món đó khỏi giỏ**.
   - **Có `productIds`** (BE gọi là "mua ngay", nhận **nhiều** id) → khoá đúng các món đó, **không đụng tới giỏ** → đặt xong các món vẫn nằm trong giỏ (thành "Đang có người thanh toán").
   - **Mobile làm:** giỏ không có món không khả dụng → gửi **không** `productIds`. Giỏ có món không khả dụng → gửi `productIds` = các món còn mua được, đặt thành công thì **tự gọi `DELETE /cart/items/{cartItemId}`** cho các món vừa đặt (bỏ qua lỗi) rồi làm mới giỏ. Mua ngay → `productIds: [id]` (đúng ý BE). [CHỜ BE] đề xuất BE tự xoá khỏi giỏ các `productIds` có trong giỏ (mục 11 câu 19b).
3. **Chưa có checkout-preview (API 58):** BR-08 tự dựng phần xem trước từ **`GET /cart`** (đã nhóm theo kho + `subtotal`) — hoặc từ món Mua ngay. **Phí ship chưa biết trước** → dòng "Phí vận chuyển: tính khi đặt hàng" (không viết cứng 25.000 đ); số thật lấy từ kết quả `POST /orders` hiện ở BR-09. Trạng thái "Giữ hàng thất bại" dựng từ lỗi 409 + `GET /cart` gọi lại (món mất sẽ có `unavailableReason`).
4. **Chưa có `GET /orders/{id}`** → BR-09 kiểm tra kết quả thanh toán bằng mock (`ordersApi.mock.getOrder`) cho tới khi có API 63 / thanh toán thật.
5. **Lỗi 409 không có `code`:** `POST /cart/items` có 2 loại 409 (không còn bán / đã có trong giỏ) → app **kiểm trước bằng cache giỏ** (đã có `productId` trong giỏ thì không gọi, hiện "Xem giỏ hàng"); gọi mà vẫn 409 → tải lại chi tiết + giỏ.
6. **Địa chỉ:** BE không giới hạn 5, không chặn xoá mặc định, không tự đặt mặc định cho địa chỉ đầu tiên → **app làm cả 3**: chặn thêm khi đủ 5; ẩn nút Xoá ở địa chỉ mặc định; địa chỉ đầu tiên luôn gửi `isDefault: true`. Response POST/PUT thiếu trường → luôn `invalidate` `addresses` sau khi lưu, không dùng response để vẽ.
7. **`POST /orders` chỉ cho role MEMBER** (`@PreAuthorize`) — tài khoản tổ chức không mua được (đúng nghiệp vụ).

### 5.3. Tên hàm (real và mock giống hệt)

```
// productsApi
getProducts({ search, categoryId, brandId, priceMin, priceMax, warehouseId, page, size })
getProduct(id)

// cartApi
getCart()
addToCart(productId)
removeCartItem(cartItemId)

// addressApi
getAddresses()
createAddress(payload)
updateAddress(id, payload)
deleteAddress(id)

// ordersApi
getCheckoutPreview({ shippingAddressId, productIds })   // productIds dùng cho Mua ngay khi BE hỗ trợ
createOrders({ shippingAddressId, productIds })          // → mảng đơn
getOrder(id)

// paymentApi
startPayment({ orderIds, method })   // → { payUrl } (MOMO) hoặc { paid: true } (WALLET, Phase 4)
```

`startPayment` nhận **mảng** `orderIds` để màn hình không cần biết BE trả gộp hay từng đơn (mục 0.4 #6):

- BE có API thanh toán gộp → gọi một lần.
- Chưa có → `paymentApi.real.js` trả `payUrl` của **đơn đầu tiên chưa trả**; màn BR-09 trả xong đơn này thì gọi lại cho đơn kế tiếp. Ghi rõ trong PR là tạm thời.

### 5.4. Mock

- `productsApi.mock.js` (chỉ dùng khi `MOCK.products`): 20–30 sản phẩm mẫu (tên, thương hiệu, size, giá, kho Quận 7 / Gò Vấp / Thủ Đức), có lọc + phân trang thật trong RAM để test cuộn vô hạn.
- `cartApi.mock.js`: thêm món đã ON_SALE; thêm trùng → 409; có một món mẫu `unavailableReason: "SOLD"`.
- `ordersApi.mock.js`:
  - `getCheckoutPreview`: nhóm theo kho, phí ship mỗi đơn 25.000 đ (giống cấu hình BE), có lựa chọn giả lập 1 món bị mua trước.
  - `createOrders`: tạo đơn `PENDING_PAYMENT`, `paymentDeadline = now + 15 phút` (dạng ISO có `Z`). Nếu có món "bị mua trước" → ném `ApiError` 409.
  - `getOrder`: trả trạng thái hiện tại; quá hạn → `CANCELLED`.
- `paymentApi.mock.js`: `startPayment` trả `{ payUrl: null }`; thêm hàm `mockPayOrders(orderIds, ok)` để **chỉ trong `__DEV__ && MOCK.payment`** BR-09 hiện 2 nút "Mock: MoMo thành công / thất bại".
- Mỗi hàm `await sleep(400–800ms)`.

### 5.5. React Query

```js
export const shopKeys = {
  products: (filters) => ["products", "list", filters],
  product: (id) => ["products", "detail", id],
  similar: (categoryId, excludeId) => [
    "products",
    "similar",
    categoryId,
    excludeId,
  ],
  cart: ["cart"],
  addresses: ["addresses"],
  checkoutPreview: (addressId, productIds) => [
    "checkout",
    "preview",
    addressId,
    productIds ?? "CART",
  ],
  order: (id) => ["orders", "detail", id],
};
```

- `filters` là object đã **bỏ các giá trị rỗng** (để `{}` và `{categoryId: undefined}` ra cùng một key).
- Danh sách: `useInfiniteQuery` + `FlatList numColumns={2}` + `onEndReached`; `getNextPageParam: (last) => last.page + 1 < last.totalPages ? last.page + 1 : undefined`.
- Giỏ: `useQuery(shopKeys.cart, { enabled: isMember })` — Guest không gọi.

| Mutation                     | Làm mới                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| addToCart / removeCartItem   | `cart`                                                      |
| create/update/delete address | `addresses` (+ `checkoutPreview` nếu đổi địa chỉ đang dùng) |
| createOrders                 | `cart`, `["products"]` (món chuyển RESERVED, biến khỏi sàn) |
| thanh toán xong (PAID)       | `cart`, `["products"]`, `order(id)`                         |

---

## 6. Business rules áp dụng trên app

| Quy tắc                                                         | Nguồn         | App làm gì                                                                                |
| --------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------- |
| Mỗi món là **độc bản**, không có số lượng                       | L-03, BR-05   | Không có ô số lượng; thêm trùng → "Đã có trong giỏ" + nút "Xem giỏ"                       |
| Thêm vào giỏ **chưa giữ hàng**; giữ từ lúc **đặt hàng** (F-055) | API 59, BR-05 | Câu nhắc ở giỏ: "Thêm vào giỏ chưa giữ chỗ — ai thanh toán trước thì được."               |
| Sàn chỉ hiện **ON_SALE**; món RESERVED biến khỏi danh sách      | API 49        | Mở chi tiết món không còn ON_SALE (từ giỏ / link cũ) → trạng thái Không khả dụng / Đã bán |
| Giỏ nhiều kho → **tách đơn**, mỗi đơn một phí ship              | F-053, F-054  | Giỏ: dải "Hàng ở n kho, sẽ tách thành n đơn"; checkout: "Đơn i / n — Kho …"               |
| Thanh toán trong **15 phút**, quá hạn tự huỷ, nhả hàng          | F-058, mục 11 | Đếm ngược theo `paymentDeadline`; về 0 → gọi lại `getOrder` và hiện "Đơn đã huỷ"          |
| Trả **trọn** một phương thức (ví **hoặc** MoMo)                 | F-056, mục 8  | Chọn một phương thức cho cả nhóm đơn; Phase 3 chỉ MoMo                                    |
| Đơn chỉ xác nhận khi BE nhận **webhook** MoMo                   | F-057         | **Không** tin kết quả trên đường dẫn quay về; luôn gọi `getOrder` để biết `PAID`          |
| Người khác mua trước                                            | L-03 unhappy  | 409 khi đặt → tải lại xem trước, chỉ ra món mất, cho đặt phần còn lại                     |
| Tối đa 5 địa chỉ, không xoá địa chỉ mặc định                    | BR-06         | Chặn trên app + vẫn xử lý lỗi BE                                                          |
| Người mua không thấy người ký gửi                               | API 50        | Không hiện tên/mã người bán ở chi tiết                                                    |

---

## 7. Spec từng màn hình

Chung cho mọi màn (như Phase 2): loading lần đầu, `ErrorBox` + "Thử lại", kéo xuống tải lại, lỗi mạng `status 0`, 403/404 ở chi tiết → `EmptyState`. Ảnh lỗi/thiếu → ô xám có icon.

### BR-01 · Trang chủ Mua sắm (`(tabs)/index.js`)

- Header: chữ "ReHome" · ô tìm kiếm **giả** (bấm là sang `search` và mở bàn phím ngay — `autoFocus`) · `CartButton` (icon giỏ + badge số món; Guest bấm → hỏi đăng nhập).
- Chip danh mục ngang (`ChipGroup` một lựa chọn, dữ liệu `getCategories`): "Tất cả" + danh mục. Chọn chip → lọc ngay trên trang chủ (không sang màn khác).
- NoteBox: "Mọi món trên ReHome đều đã qua kiểm định tại kho. Mỗi món là duy nhất — bán rồi là hết." (ẩn sau khi bấm ✕ — nhớ trong state của màn là đủ).
- Tiêu đề "Mới lên sàn" + `ProductGrid` 2 cột, cuộn vô hạn. [CHỜ BE] API 49 có sắp xếp mới nhất trước không; không có thì để thứ tự BE.
- `ProductCard`: ảnh tỉ lệ 3:4 + nhãn "ĐÃ KIỂM ĐỊNH" góc dưới · tên (2 dòng) · `PriceTag` (giá hiện tại đậm; giá gốc gạch nếu đã giảm) · "Thương hiệu · Size · Tình trạng". Bấm → `products/[id]`.
- Rỗng (sàn chưa có hàng): `EmptyState` "Chưa có món nào lên sàn. Quay lại sau nhé."
- Màn này nằm trong tab → `Screen edges={["top"]}`, `padded={false}` khi dùng `FlatList` có kéo tải lại.

### BR-02 + BR-03 · Tìm kiếm và bộ lọc (`search.js`)

- Header: ← · ô tìm (`autoFocus`, có ✕ xoá chữ). Tìm khi **bấm Enter** (`returnKeyType="search"`) — không gọi API theo từng ký tự. Có thể nhận sẵn `categoryId` từ trang chủ qua params.
- Thanh dưới header: "n sản phẩm" (`totalElements`) · nút **Lọc · k** (k = số bộ lọc đang bật).
- `ActiveFilterChips`: mỗi bộ lọc đang bật là một chip "Áo khoác ✕", "100.000 – 500.000 đ ✕"; bấm ✕ bỏ bộ lọc đó và tải lại.
- **FilterSheet** (bottom sheet — dùng lại kiểu sheet của `SelectField` nếu tách được, hoặc `Modal` trượt từ dưới):
  - Danh mục (chip, một lựa chọn), Thương hiệu (chip, một lựa chọn, có "Xem thêm" mở `SelectField searchable` nếu nhiều), Khoảng giá (2 `MoneyField`: Từ — Đến), Kho (chip, một lựa chọn; ẩn nếu chưa có danh sách kho).
  - Kiểm tra: `priceMin > priceMax` → lỗi dưới ô, không cho áp dụng (BE cũng trả 400).
  - Footer: **Đặt lại** · **Áp dụng**. Sửa trong sheet là bản nháp; chỉ khi Áp dụng mới đổi bộ lọc thật.
- Kết quả: `ProductGrid` như BR-01.
- **Không có kết quả:** `EmptyState` "Không tìm thấy món nào" + "Hàng ký gửi là đồ cũ nên mỗi món chỉ có một cái. Thử bỏ bớt bộ lọc, hoặc quay lại sau — kho nhập hàng mới mỗi ngày." + nút **Xoá hết bộ lọc** (giữ từ khoá).

### BR-04 · Chi tiết sản phẩm (`products/[id].js`)

Nguồn: API 50. Header: ← · Chia sẻ · `CartButton`.

- **Đang bán (`ON_SALE`):**
  - `PhotoCarousel`: `FlatList` ngang `pagingEnabled` + chấm trang "1/4". Không có ảnh → ô xám.
  - Tên · `PriceTag` cỡ lớn · "Thương hiệu · Size · Danh mục" · "SKU … · Kho …" (chỉ hiện trường nào API có).
  - Khối **Đã kiểm định tại kho ReHome**: "Hàng chính hãng · Tình trạng: …", "Kiểm định ngày dd/MM/YYYY" (nếu có).
  - "Mô tả" (thu gọn 4 dòng, bấm "Xem thêm").
  - "Sản phẩm tương tự" (mục 0.4 #4): hàng ngang `ProductCard` nhỏ; không có món nào → ẩn cả khối.
  - Footer cố định: **Thêm vào giỏ** (secondary) · **Mua ngay** (primary).
    - Guest → `Alert` "Đăng nhập để mua hàng" [Để sau] [Đăng nhập] → sang `/login` (xem "Quay lại sau đăng nhập" ngay dưới).
    - Thêm vào giỏ: món đã có trong giỏ (so `productId` trong cache giỏ) → nút đổi thành **Xem giỏ hàng**. Thành công → `showToast("Đã thêm vào giỏ")`, badge tăng. 409 → tải lại chi tiết (sẽ ra trạng thái Không khả dụng).
    - Mua ngay → `checkout?productId=…` (không đi qua giỏ).
- **Không khả dụng (`RESERVED`):** ảnh mờ + khối "Sản phẩm không còn khả dụng — Món này đã được mua, hoặc đang có người khác thanh toán…" + NoteBox "Nếu người mua kia không hoàn tất thanh toán trong 15 phút, món này có thể quay lại sàn." Footer: **Xem món tương tự** (cuộn xuống khối tương tự). Không có nút mua.
- **Đã bán (`SOLD` và trạng thái kết thúc khác):** nhãn "ĐÃ BÁN", giá gạch, khối "Món này đã có chủ. Mỗi sản phẩm ký gửi là một món duy nhất, bán xong là hết." + món tương tự.
- **Món của chính mình** (người ký gửi mở món mình trên sàn): [CHỜ BE] cách nhận biết. Nếu biết được → thay footer bằng NoteBox "Đây là món bạn ký gửi" + nút "Xem trong Ký gửi" → `my-products/[id]`.
- Chia sẻ: `Share.share({ message: \`${name} — ${formatVnd(currentPrice)} trên ReHome (mã ${id})\` })`.

### Quay lại sau đăng nhập (dùng cho BR-04, BR-01 giỏ)

Khi Guest bấm việc cần đăng nhập:

1. Lưu "việc đang làm" vào `pendingActionStore` (RAM): `{ type: "VIEW_PRODUCT", productId }` hoặc `{ type: "OPEN_CART" }`.
2. `router.push("/login")`.
3. Sau khi `signIn` thành công, `_layout.js` chuyển sang nhóm `(member)` như hiện tại; màn đầu tiên của nhóm (hoặc một `useEffect` ở `_layout`) đọc `pendingActionStore`, **xoá** nó, rồi `router.push` tới đúng chỗ.

- Không tự thêm vào giỏ hộ — chỉ đưa về đúng màn để Member bấm lại (tránh thêm nhầm).
- Đọc lại cách `_layout.js` đang đổi nhóm sau đăng nhập trước khi làm; nếu phức tạp thì Phase 3 chấp nhận về trang chủ, ghi vào PR.

### BR-05 · Giỏ hàng (`cart.js`)

- Header: ← · "Giỏ hàng (n)".
- `PendingPaymentBanner` (mục 0.4 #11): `checkoutStore` có đơn chờ trả còn hạn → dải "Bạn có n đơn chờ thanh toán — còn mm:ss" + "Thanh toán" → `payment`. Hết hạn → tự ẩn.
- Có từ 2 kho → NoteBox: "Hàng của bạn ở n kho khác nhau, sẽ tách thành n đơn và tính phí vận chuyển riêng."
- Có món không khả dụng → ErrorBox nhẹ: "k món không còn mua được. Các món còn lại vẫn đặt bình thường."
- `WarehouseGroup` theo `groupedByWarehouse`: tiêu đề "Kho Quận 7 · 2 món" → `CartItemRow` (ảnh, tên, "Thương hiệu · Size · Tình trạng", giá, nút ✕).
  - Món có `unavailableReason` → mờ, nhãn `unavailableLabel(reason)`, không tính tiền, vẫn có ✕.
  - Bấm hàng → `products/[id]`.
  - ✕ → `Alert` "Xoá khỏi giỏ?" → API 53 → làm mới giỏ.
- NoteBox cuối danh sách: "Mỗi món là hàng ký gửi duy nhất, không có số lượng. Thêm vào giỏ chưa giữ chỗ — ai thanh toán trước thì được."
- Footer cố định: "Tạm tính k món · 1.970.000 đ" + "Chưa gồm phí vận chuyển của n đơn" + nút **Đặt hàng** (có món không khả dụng → **Đặt k món còn lại**). Không còn món mua được → nút mờ.
- Tạm tính: dùng `totalAmount` của BE (contract đã loại món không khả dụng); số món tự đếm các món `unavailableReason == null`.
- **Rỗng:** `EmptyState` "Giỏ hàng đang trống" + nút "Khám phá sản phẩm" → tab Mua sắm.

### BR-06 · Địa chỉ giao hàng (`addresses/index.js`)

Hai chế độ:

- **Quản lý** (mở từ Cá nhân → "Địa chỉ" — bật dòng này ở PR-01, đang "Sắp có"): xem, sửa, xoá, đặt mặc định.
- **Chọn** (`addresses?select=1` từ checkout): bấm thẻ → ghi `checkoutStore.setAddressId(id)` → `router.back()`. Thẻ đang chọn có viền đậm.

`AddressCard`: tên người nhận + nhãn "MẶC ĐỊNH" · SĐT `formatPhone` · địa chỉ. Hành động: **Sửa** · **Đặt làm mặc định** (ẩn nếu đang là mặc định) · **Xoá** (ẩn ở địa chỉ mặc định; thay bằng chữ mờ "Không xoá được địa chỉ mặc định").

- Đặt mặc định → `updateAddress(id, {...address, isDefault: true})` [KIỂM TRA BE tự bỏ mặc định ở địa chỉ cũ].
- Xoá → `Alert` xác nhận → API 57.
- NoteBox: "Tối đa 5 địa chỉ. Đơn đã đặt giữ nguyên địa chỉ lúc đặt, sửa ở đây không ảnh hưởng."
- Footer: **+ Thêm địa chỉ mới** → `addresses/new`; đủ 5 → nút mờ + chữ "Đã đủ 5 địa chỉ".
- Rỗng: `EmptyState` "Chưa có địa chỉ giao hàng" + nút Thêm.

### BR-07 · Thêm / sửa địa chỉ (`addresses/new.js`, `addresses/[id]/edit.js`)

Một màn `AddressFormScreen` dùng cho cả hai (giống `ConsignFormFields` ở Phase 2).

- **Họ tên người nhận \*** · **Số điện thoại \*** (bàn phím số, `/^0\d{9}$/`) · **Địa chỉ cụ thể \*** (nhiều dòng, helper "Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố") · `Checkbox` **Đặt làm địa chỉ mặc định**.
- Địa chỉ đầu tiên: checkbox tích sẵn và khoá (phải có một mặc định).
- Sửa: điền sẵn từ cache `addresses` (không cần API chi tiết); nút **Lưu** mờ khi chưa sửa (`isDirty`); ← khi đã sửa → "Bỏ thay đổi?".
- Mở từ checkout (`?from=checkout`): lưu xong chọn luôn địa chỉ mới cho checkout rồi quay lại.
- Lỗi 400 → hiện dưới ô theo `fieldErrors` nếu có; không có thì `ErrorBox` với message BE.

Schema (`features/addresses/schemas.js`, zod 4):

```js
export const addressSchema = z.object({
  recipientName: z.string().trim().min(2, "Nhập họ tên người nhận").max(100),
  phone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, "Số điện thoại gồm 10 số, bắt đầu bằng 0"),
  addressDetail: z
    .string()
    .trim()
    .min(10, "Nhập địa chỉ đầy đủ (số nhà, đường, phường, quận, tỉnh)")
    .max(255),
  isDefault: z.boolean(),
});
```

`PHONE_REGEX` lấy từ `utils/validators.js`. Các mức `min/max` là [GIẢ ĐỊNH].

### BR-08 · Đặt hàng (`checkout.js`)

Vào từ giỏ (cả giỏ, chỉ món còn mua được) hoặc từ "Mua ngay" (`?productId=`).

- **Giao đến:** thẻ địa chỉ (mặc định chọn sẵn, hoặc địa chỉ trong `checkoutStore`) + nút **Đổi** → `addresses?select=1`. Chưa có địa chỉ nào → thẻ trống "Thêm địa chỉ giao hàng" → `addresses/new?from=checkout`.
- **Xem trước** (API 58 theo địa chỉ đang chọn):
  - Nhiều đơn → NoteBox: "Hàng ở n kho nên tách thành n đơn riêng, giao n lần, mỗi đơn một phí vận chuyển."
  - `OrderGroupCard` mỗi đơn: "Đơn i / n — Kho …", danh sách món (tên + giá), "Phí vận chuyển" (`shippingFee`).
  - Có `unavailableItems` → hiện như BR-09 "Giữ hàng thất bại" (dưới).
  - **Mua ngay:** API 58 chưa nhận `productIds` [CHỜ BE] → tạm hiện 1 đơn với giá món + dòng "Phí vận chuyển: tính khi đặt" và lấy số thật từ kết quả `createOrders`. Không viết cứng 25.000 đ trong app.
- **Thanh toán:** một lựa chọn "Ví MoMo" (RadioCard đã chọn). Phase 4 thêm "Ví ReHome".
- `CheckoutSummary`: Tiền hàng · Vận chuyển n đơn · **Tổng cộng**.
- Footer: **Thanh toán qua MoMo · 2.022.000 đ**. Bấm:
  1. Khoá nút ngay (loading) — **chống bấm hai lần**, vì mỗi lần bấm là tạo đơn và giữ hàng.
  2. `createOrders({ shippingAddressId, productIds })` — luôn gửi **danh sách id cụ thể** (các món còn mua được), không để trống, tránh BE lấy cả món không khả dụng.
  3. Lưu kết quả vào `checkoutStore.setPendingOrders(orders)`.
  4. `router.replace("/payment")` (replace để Back không quay về checkout tạo đơn lần nữa).
  5. 409 (vừa có người mua trước) → gọi lại API 58 → chuyển sang trạng thái **Giữ hàng thất bại**.
  6. 400/404 địa chỉ → báo dưới thẻ địa chỉ.

**Trạng thái "Giữ hàng thất bại" (BR-09-GiuHangThatBai, hiển thị ngay trong `checkout.js`):**

- ErrorBox: "Đặt được k trong m món. Một món vừa có người khác thanh toán trước. **Chưa có khoản tiền nào bị trừ.**"
- Khối **Không đặt được**: món bị mất (mờ) + câu "Hàng ký gửi là món duy nhất… Món này sẽ không quay lại sàn trừ khi người mua kia huỷ đơn."
- Khối **Vẫn đặt được**: các món còn lại + "Tổng mới, gồm n phí ship".
- Footer: **Đặt k món còn lại — 1.022.000 đ** (gọi lại `createOrders` với danh sách mới) · **Quay lại giỏ hàng**.
- Mất hết món → chỉ còn nút quay lại giỏ.

### BR-09 · Chờ thanh toán (`payment.js`)

Dữ liệu: `checkoutStore.pendingOrders` (đơn vừa tạo). Không có đơn nào (mở thẳng / reload app) → `Redirect` về giỏ.

**Trạng thái Chờ thanh toán**

- Khối đếm ngược lớn **"14:32"** (`PaymentCountdown`, theo `paymentDeadline` sớm nhất trong nhóm) + "Còn lại để thanh toán".
- NoteBox: "Sản phẩm đang được giữ cho bạn. Trong 15 phút này không ai mua được k món của bạn. Hết giờ mà chưa thanh toán, đơn tự huỷ và hàng mở bán lại."
- Danh sách đơn: "Đơn 1 — Kho Quận 7 · 1.442.000 đ" (+ nhãn "Đã thanh toán" cho đơn đã xong nếu trả lần lượt). "Tổng thanh toán".
- Nút chính **Thanh toán qua MoMo** (lần đầu tự mở luôn khi vào màn) / **Mở lại MoMo để thanh toán**:
  1. `startPayment({ orderIds, method: MOMO })` → `payUrl`.
  2. `const returnUrl = Linking.createURL("payment-return");`
     `const res = await WebBrowser.openAuthSessionAsync(payUrl, returnUrl);`
  3. Dù `res.type` là `success`, `cancel` hay `dismiss` → **kiểm tra lại bằng `getOrder`** cho từng đơn. Không dựa vào tham số trên đường dẫn quay về để kết luận đã trả.
  - [CHỜ BE] MoMo chỉ tự quay về app nếu BE đặt `redirectUrl` của giao dịch MoMo = `returnUrl` của app (đề xuất: body API 60 nhận thêm `returnUrl`). Chưa có thì Member tự đóng trang MoMo; bước 3 vẫn chạy.
  - Nếu trang MoMo mở app MoMo (deeplink) rồi Member quay lại ReHome: `AppState` chuyển `active` → cũng gọi `getOrder`.
- Nút phụ **Tôi đã thanh toán — kiểm tra lại** → gọi `getOrder`. Chữ nhỏ: "Đã trả tiền mà màn hình chưa đổi? Hệ thống chỉ xác nhận đơn khi nhận được thông báo từ MoMo, có thể chậm vài giây."
- `useOrderStatusPolling`: khi đang ở màn và còn đơn `PENDING_PAYMENT` → `refetchInterval: 3000` **chỉ trong 60 giây sau mỗi lần quay về từ MoMo**, rồi dừng (không gọi suốt 15 phút).
- ← / Back Android → `Alert` "Rời màn thanh toán? Đơn vẫn được giữ đến hh:mm. Bạn có thể thanh toán tiếp từ Giỏ hàng." [Ở lại] [Rời đi → về giỏ].
- Mock (`__DEV__ && MOCK.payment`): 2 nút "Mock: MoMo thành công / thất bại".

**Trạng thái Thành công** (mọi đơn `PAID`)

- Icon ✓ + "Thanh toán thành công" + danh sách "Đơn OD-2026-000123 — Kho Quận 7".
- "Kho sẽ đóng gói và giao hàng cho bạn. Bạn sẽ nhận thông báo khi đơn được gửi đi."
- Nút **Tiếp tục mua sắm** → `router.dismissTo("/")`. "Xem đơn hàng" → Phase 4 (ẩn).
- Xoá `checkoutStore.pendingOrders`; làm mới `cart`, `["products"]`.

**Trạng thái Hết hạn / Đã huỷ** (đếm về 0 hoặc `getOrder` trả `CANCELLED`)

- "Đơn đã hết hạn thanh toán. Các món đã được mở bán lại." + nút **Về giỏ hàng** (món vẫn còn trong giỏ nếu BE không xoá — [KIỂM TRA]).
- Đếm về 0 nhưng `getOrder` vẫn `PENDING_PAYMENT` (BE chưa chạy job huỷ) → vẫn hiện hết hạn, không cho mở lại MoMo.
- Có trường hợp webhook tới **sau** khi huỷ: BE tự hoàn tiền vào ví (API 61). Hiện thêm câu: "Nếu bạn đã trả tiền sau khi hết giờ, tiền sẽ được hoàn vào ví ReHome."

**Thanh toán lỗi** (MoMo báo thất bại, đơn vẫn `PENDING_PAYMENT`): giữ ở trạng thái chờ, `showToast("Thanh toán chưa thành công, bạn có thể thử lại")`.

---

## 8. `stores/checkoutStore.js` (zustand, chỉ RAM)

```js
// Hình dạng gợi ý
{
  addressId: null,          // địa chỉ đang chọn ở checkout
  pendingOrders: [],        // [{ id, orderNo, warehouseName, totalAmount, paymentDeadline, status }]
  setAddressId, setPendingOrders, markPaid(orderId), clear()
}
```

- Mất khi tắt app — chấp nhận ở Phase 3 (đơn vẫn tự huỷ sau 15 phút, hàng tự mở bán lại). Phase 4 có `GET /orders?status=PENDING_PAYMENT` thì lấy từ BE thay cho store.
- Đăng xuất → `clear()` (thêm vào `authStore.signOut`).

---

## 9. Tự kiểm tra trước khi push

Chạy trên Android thật (dev build cho phần MoMo).

**Duyệt sản phẩm (Guest và Member)**

- [ ] Trang chủ: chip danh mục lọc đúng; cuộn tới cuối tự tải trang sau; kéo xuống tải lại.
- [ ] Tìm "áo" → có kết quả; tìm chuỗi vô nghĩa → màn không có kết quả; "Xoá hết bộ lọc" chạy.
- [ ] Bộ lọc: giá Từ > Đến bị chặn; Đặt lại / Áp dụng đúng; chip ✕ bỏ từng bộ lọc.
- [ ] Chi tiết: lướt ảnh; giá gạch khi đã giảm; món tương tự không chứa chính nó.
- [ ] Guest bấm Thêm vào giỏ → đăng nhập → quay lại đúng sản phẩm (hoặc ghi rõ trong PR nếu chưa làm).

**Giỏ và địa chỉ (Member)**

- [ ] Thêm vào giỏ → badge tăng; thêm lại cùng món → "Đã có trong giỏ".
- [ ] Giỏ 2 kho → báo tách 2 đơn; món không khả dụng mờ, không tính tiền; xoá có hỏi lại; giỏ rỗng.
- [ ] Địa chỉ: thêm đầu tiên tự mặc định; thêm tới 5 thì nút mờ; không xoá được mặc định; đặt mặc định cho địa chỉ khác.
- [ ] SĐT sai định dạng, địa chỉ quá ngắn → lỗi dưới ô.

**Đặt hàng và thanh toán**

- [ ] Checkout chọn sẵn địa chỉ mặc định; Đổi địa chỉ → quay lại đúng địa chỉ mới, phí ship tải lại.
- [ ] Bấm đặt liên tục 3 lần → chỉ tạo 1 nhóm đơn.
- [ ] Mock 1 món bị mua trước → trạng thái "Đặt được k/m món" → đặt phần còn lại được.
- [ ] Mua ngay từ chi tiết → checkout chỉ có 1 món.
- [ ] Màn chờ: đếm ngược đúng theo `paymentDeadline`; Back → hỏi → về giỏ có dải "đơn chờ thanh toán" → bấm quay lại đúng màn.
- [ ] Mock thành công → màn thành công, giỏ đã làm mới, món biến khỏi sàn.
- [ ] Mock để hết giờ (sửa mock deadline còn 30 giây) → màn hết hạn.
- [ ] MoMo sandbox thật (khi BE có): mở trang, trả bằng tài khoản thử, quay về app → tự chuyển thành công trong vài giây.
- [ ] Mất mạng ở trang chủ và ở nút đặt hàng → báo lỗi mạng, thử lại được.

---

## 10. Commit, push, Pull Request

Như Phase 1/2. Gợi ý commit nhánh đầu:

```
feat(shop): add product constants and products api
feat(shop): shop home with category chips and product grid (BR-01)
feat(shop): search and filter sheet (BR-02, BR-03)
feat(shop): product detail with 3 states (BR-04)
```

Mô tả PR: Đã làm · Gọi thật / mock (theo `MOCK`) · Lệch wireframe (bảng 0.4) · Cách test · Ảnh chụp.

---

## 11. Cần hỏi (gom gửi backend / lead)

**Backend (Tài — phụ trách API 49–95)**

1. **Thanh toán nhiều đơn:** giỏ 2 kho tạo 2 đơn, nhưng API 60 là `POST /orders/{id}/payment` (mỗi đơn một lần MoMo). Đề xuất một API trả **gộp** (vd `POST /orders/payment {orderIds, paymentMethod}` → một `payUrl`) cho đúng BR-09. Nếu không, xác nhận mobile trả lần lượt từng đơn.
2. **`redirectUrl` của MoMo:** API 60 nhận thêm `returnUrl` từ app (vd `rehome://payment-return`) để MoMo tự quay về app sau khi trả? MoMo sandbox dùng cổng nào (`payUrl` web hay `deeplink` app MoMo test)? Có trả cả `deeplink` không?
3. Bao giờ có **API 58 (checkout-preview), 60, 61, 63**? Webhook trên Render đã nhận được từ MoMo sandbox chưa?
4. **API 58 nhận `productIds`** (cho "Mua ngay" và cho "đặt phần còn lại") được không?
5. **API 50 (chi tiết)** trả thêm: `brandName`, `categoryName`, `categoryId` (để tìm món tương tự), `size`, `condition`/`conditionNote`, `description`, `originalPrice`, `warehouseName`, ngày kiểm định, toàn bộ `photos`. API này dùng chung với API 22 (người ký gửi) — người mua có bị lộ các field riêng của người ký gửi (giá sàn, hoa hồng…) không?
6. **`condition`:** API 49 trả `LIKE_NEW` nhưng bảng Product chỉ có `condition_note`. Danh sách enum là gì (Như mới / Tốt / Khá)?
7. **Lọc thêm** Size, Tình trạng, nhiều danh mục/thương hiệu, **sắp xếp** (mới nhất, giá tăng/giảm) có làm không? Mặc định API 49 sắp xếp theo gì?
8. **Danh sách kho công khai** cho bộ lọc (dùng chung với KG-03 Phase 2)?
9. **Mã lỗi `code`** cho các 409 (hiện chỉ có message): `PRODUCT_NOT_AVAILABLE`, `ALREADY_IN_CART`, `CART_EMPTY`, `ORDER_NOT_PENDING`, `INSUFFICIENT_BALANCE`, `ADDRESS_LIMIT_REACHED`, `DEFAULT_ADDRESS_CANNOT_DELETE`. Mobile không so chữ trong message.
10. **Thêm trùng món vào giỏ** trả gì (409 hay 200 giữ nguyên)? `unavailableReason` có những giá trị nào ngoài `SOLD`?
11. **Địa chỉ:** BE có giới hạn 5 không? Có chặn xoá địa chỉ mặc định không? Đặt `isDefault: true` có tự bỏ mặc định ở địa chỉ khác không? Địa chỉ đầu tiên có tự thành mặc định không?
12. **Địa chỉ cho GHN (quan trọng cho Phase 4):** GHN tạo vận đơn cần `provinceId / districtId / wardCode`. Bảng ShippingAddress hiện chỉ có `addressDetail`. BE có định thêm cột + API danh sách tỉnh/quận/phường (proxy GHN) không? Nếu có thì mobile làm BR-07 đúng wireframe ngay từ bây giờ.
13. **Huỷ đơn đang chờ thanh toán** (BR-09 nút "Hủy đơn"): có API không, hay chỉ chờ hết 15 phút?
14. **Mua món của chính mình** (người ký gửi mua lại món mình ký gửi): BE có chặn không? API 50 có field kiểu `isMine` để app ẩn nút mua?
15. **Đơn huỷ vì hết hạn:** món có còn trong giỏ người mua không, hay BE xoá?
16. **`paymentDeadline`** trả dạng ISO có `Z` (UTC) như contract chưa? (Render chạy UTC; thiếu `Z` thì app lệch 7 tiếng.)
17. **`GET /orders?status=PENDING_PAYMENT`** (API 62) có sớm được không? Có thì mobile bỏ `checkoutStore` lưu RAM.
18b. *(Mới — sau khi đọc code 19/10)* **`GET /products/{id}` (API 50) chưa có** — cần sớm vì BR-04 là màn chính; trả thêm các trường ở câu 5.
19b. **`POST /orders` với `productIds`:** hiện coi là "mua ngay" và **không xoá** món khỏi giỏ. Đề xuất: món nào trong `productIds` đang có trong giỏ thì xoá khỏi giỏ sau khi đặt (để "đặt k món còn lại" từ giỏ dùng được). Và nhánh cả giỏ hiện 409 toàn bộ nếu 1 món không còn bán — đúng ý chưa?
20b. **Địa chỉ:** BE không giới hạn 5, không chặn xoá mặc định, không tự đặt mặc định cho địa chỉ đầu tiên — mobile đang tự làm cả 3; BE có muốn chặn phía server không? `POST`/`PUT /addresses` trả thiếu trường (`phone`, `addressDetail`) — trả đủ địa chỉ được không?
21b. **`GET /cart` item** thiếu `brandName`, `condition` (BR-05 có "Thương hiệu · Size · Tình trạng").
22b. Mã lỗi `code` cho 409 của `/cart/items` và `/orders` (câu 9).

**Lead**

18. Bỏ lọc Size/Tình trạng/Sắp xếp và nút đếm "Xem 24 sản phẩm" ở Phase 3 — đồng ý? (mục 0.4 #1, #2)
19. Địa chỉ một ô nhập (chưa chọn Tỉnh/Quận/Phường) cho tới khi BE có dữ liệu GHN — đồng ý? (0.4 #5)
20. Phase 3 chỉ MoMo, Ví bật ở Phase 4 — đồng ý? (0.4 #7)
21. Thêm màn kết quả thanh toán và dải "Đơn chờ thanh toán" ở giỏ (wireframe chưa vẽ) — đồng ý? (0.4 #10, #11)
