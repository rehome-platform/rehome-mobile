# ReHome Mobile — Hướng dẫn Phase 4 (Đơn hàng, hoàn tất đơn & Ví — phía Member)

> Phase 4 theo kế hoạch: 06/11 – 11/11/2026, luồng **L-04** (giao hàng, hoàn tất đơn) và **L-07** (ví, rút tiền). Mobile đang đi trước lịch (Phase 3 xong UI 19/10) → làm Phase 4 từ **20/10**, vẫn chừa 28–30/10 cho nối API thật Phase 2/3 khi BE xong.
> Nguồn: _Tài liệu tổng quan_ (F-037 … F-044, F-059 … F-066; L-04, L-07; mục 7 "Luồng tiền"; mục 11 tham số ví và đơn), _Thiết kế Database_ (Order, OrderItem, Payment, Wallet, WalletTransaction, PayoutRequest), _API_CONTRACT_ (API 62 – 67, 73 – 78, cộng API 60 `WALLET`), wireframe của lead (**BR-10 → BR-14**, **VI-01 → VI-05**, thẻ ví ở **PR-01**).
> Quy ước giữ nguyên như `CLAUDE.md` và PHASE2/3_GUIDE. File này chỉ ghi phần **mới**.
> Ký hiệu: **[GIẢ ĐỊNH]** · **[CHỜ BE]** · **[CHỜ LEAD]** · **[KIỂM TRA]**.
> **Trạng thái BE (đã đọc code 20/10 tại `develop` `2bfc66c`):** **chưa có** API nào của Phase 4 — controller đơn chỉ có `POST /orders`, chưa có controller ví; cũng chưa có API 60/61/63 của Phase 3. Phase 4 làm **toàn bộ bằng mock**, mock phải "sống" và nối với mock Phase 3 (đơn tạo ở BR-08 hiện ở danh sách đơn; huỷ đơn thì ví có giao dịch hoàn tiền). **Entity / enum đã có** (dùng để đặt tên field mock cho khớp) → mục 5.2b. Render vẫn chạy bản BE cũ (chưa deploy `2af9d85`, `2bfc66c`).

---

## 0. Phase 4 gồm những gì và thế nào là "xong"

### 0.1. Ngoài phạm vi (đừng làm)

- **Trả hàng** (nút "Trả hàng", "Hàng có vấn đề — yêu cầu trả" ở BR-11; RT-01 → RT-04) → **Phase 5**. Phase 4 **ẩn** nút, nhưng **tính sẵn** hạn trả hàng trong một hàm (mục 4.3) để Phase 5 chỉ việc bật.
- **Rút lại hàng ký gửi / phí rút hàng** (KG-13/14) → Phase 5. Giao dịch loại `WITHDRAWAL_FEE` vẫn phải **hiển thị đúng** trong lịch sử ví nếu BE trả về.
- **Chat** ("Nhắn cho kho", "Báo cho kho" ở BR-11/12) → Phase 6. **Ẩn**.
- **Thông báo đẩy** ("Bạn sẽ nhận thông báo khi có kết quả") → phase sau. Phase 4 dùng kéo-để-tải-lại + tự hỏi lại trạng thái khi đang mở màn.
- **Phía Moderator** (đóng gói, tạo vận đơn GHN, bàn giao — DG-01 → DG-04, BG-01) là web, không làm ở mobile.

### 0.2. Danh sách màn hình

| Mã       | Màn hình                                                                                                            | Route đề xuất (dưới `src/app/(member)/`) | API        | F            |
| -------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ---------- | ------------ |
| BR-10    | Đơn hàng của tôi (chip trạng thái)                                                                                  | `orders/index.js`                        | 62         | F-059        |
| BR-11    | Chi tiết đơn: Chờ thanh toán / Đã thanh toán (huỷ được) / Đang đóng gói / Đang giao / Đã giao / Hoàn thành / Đã huỷ | `orders/[id]/index.js`                   | 63, 65     | F-059, F-061 |
| BR-12    | Theo dõi vận chuyển (bình thường / có sự cố)                                                                        | `orders/[id]/tracking.js`                | 64         | F-060        |
| BR-13    | Dialog xác nhận đã nhận hàng                                                                                        | modal trong `orders/[id]/index.js`       | 66         | F-063        |
| BR-14    | Đánh giá dịch vụ                                                                                                    | `orders/[id]/rating.js`                  | 67         | F-066        |
| VI-01    | Ví của tôi (rỗng / có giao dịch)                                                                                    | `wallet/index.js`                        | 73, 74     | F-037, F-038 |
| VI-02    | Chi tiết giao dịch                                                                                                  | `wallet/transactions/[id].js`            | (74, 75)   | F-038        |
| VI-03    | Doanh thu của tôi                                                                                                   | `wallet/revenue.js`                      | 75         | F-040        |
| VI-04    | Rút tiền (bình thường / lỗi vượt số dư)                                                                             | `wallet/withdraw.js`                     | 73, 76, 78 | F-042, F-043 |
| VI-05    | Yêu cầu rút: Đang xử lý / Thành công / Thất bại                                                                     | `wallet/payouts/[id].js`                 | 77         | F-044        |
| —        | Danh sách yêu cầu rút                                                                                               | `wallet/payouts/index.js`                | 78         | F-044        |
| PR-01    | Thẻ ví + dòng "Đơn hàng của tôi" ở tab Cá nhân (đang ẩn / "Sắp có")                                                 | `(tabs)/account.js` (đã có)              | 73, 62     | F-037        |
| BR-08/09 | **Bổ sung** lựa chọn **Ví ReHome** khi thanh toán (Phase 3 để chỗ sẵn)                                              | `checkout.js`, `payment.js` (đã có)      | 60, 73     | F-056        |

> Tất cả cần đăng nhập → Guest mở thẳng: `<Redirect href="/login" />` (đặt sau mọi hook), như Phase 2/3.
> **Không trùng route:** `orders/` mới; `payment.js` (Phase 3) giữ nguyên, thêm nhận `?orderIds=` (mục 7, BR-10).

### 0.3. Định nghĩa "xong"

Chạy trên Android thật, với mock (`MOCK.orders`, `MOCK.wallet` = true):

1. Tab Cá nhân: thẻ ví hiện số dư khả dụng + nút "Rút tiền"; dòng "Đơn hàng của tôi" bật, có badge số đơn đang giao.
2. Danh sách đơn lọc theo chip, kéo tải lại, cuộn vô hạn; mỗi thẻ có nút hành động đúng trạng thái (Thanh toán / Theo dõi / Đã nhận hàng).
3. Đơn **chờ thanh toán** mở lại được màn BR-09 từ danh sách (không cần `checkoutStore`), đồng hồ chạy đúng.
4. Chi tiết đơn đúng 7 trạng thái; **huỷ đơn đã thanh toán** có hỏi lại → đơn Đã huỷ, ví có thêm giao dịch hoàn tiền 100% (cả phí ship).
5. Theo dõi vận chuyển: mã vận đơn sao chép được, hành trình theo thời gian, trạng thái "có sự cố".
6. Xác nhận đã nhận hàng qua dialog → đơn Hoàn thành; đánh giá sao gửi được, gửi rồi thì hiện "Xem đánh giá của bạn".
7. Ví: số dư / khả dụng / đang khoá; lịch sử lọc Tất cả / Tiền vào / Tiền ra; chi tiết giao dịch bán hàng có cách tính tiền (giá − hoa hồng − thuế).
8. Doanh thu: tổng theo tháng + từng đơn với **mức hoa hồng đã chốt** của đơn đó.
9. Rút tiền: chặn dưới mức tối thiểu, vượt khả dụng, hết lượt trong ngày; tạo xong sang màn trạng thái, tự đổi Đang xử lý → Thành công / Thất bại; thất bại thì tiền khoá được trả lại.
10. Thanh toán bằng **Ví ReHome** ở BR-08: đủ số dư thì trả ngay (không qua MoMo), thiếu thì lựa chọn mờ kèm lý do.
11. Không chuỗi trạng thái rải rác (constants), không mã màu trong màn hình, không so chữ trong message lỗi (kể cả khi BE nhét mã lỗi vào message).

### 0.4. Quyết định đang áp dụng và chỗ lệch (báo lead)

| #   | Wireframe                                                                                                  | Mobile làm                                                                                                                                 | Lý do                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | BR-10 4 chip: Tất cả · Chờ thanh toán · Đang giao · Xong                                                   | 6 chip cuộn ngang: Tất cả · Chờ thanh toán · Đang xử lý (PAID + PACKING) · Đang giao (SHIPPING + DELIVERED) · Hoàn thành · Đã huỷ          | Wireframe không có chỗ cho đơn đã trả chưa giao và đơn huỷ; Shopee tách tương tự                                                             |
| 2   | BR-11 Đã giao: 3 ô tích "kiểm hàng xong hãy xác nhận"                                                      | Danh sách **gợi ý** (dấu chấm), **không** bắt tích mới cho bấm                                                                             | Bắt tích chỉ thêm thao tác, không kiểm được thật; BE không lưu                                                                               |
| 3   | BR-11 Hoàn thành: nút "Đánh giá dịch vụ" **mở từ lúc Đã giao**, không có hạn                               | Chỉ mở khi đơn **Hoàn thành** và chưa đánh giá                                                                                             | API 67 trả 409 nếu đơn chưa COMPLETED [CHỜ LEAD/BE nếu muốn mở sớm]                                                                          |
| 4   | BR-14: chip "Đóng gói cẩn thận / Giao chậm…", ảnh gói hàng (1/4), nhận xét                                 | Chỉ **số sao 1–5**; ẩn chip, ảnh, nhận xét                                                                                                 | API 67 và bảng Order chỉ có `serviceRating` [CHỜ BE nếu muốn thêm]                                                                           |
| 5   | BR-11/12 "Nhắn cho kho", "Gọi GHN", "Báo cho kho"                                                          | Ẩn chat; giữ **"Xem trên GHN"** (mở trang tra cứu GHN bằng mã vận đơn) [KIỂM TRA đường dẫn]                                                | Chat là Phase 6; số điện thoại shipper BE không trả                                                                                          |
| 6   | BR-11 nút "Trả hàng" / "Hàng có vấn đề — yêu cầu trả"                                                      | Ẩn (Phase 5) — hàm `returnDeadlineOf(order)` tính sẵn                                                                                      | Phase 5                                                                                                                                      |
| 7   | BR-13 "Hết 3 ngày đó, tiền mới được chuyển cho người ký gửi"; VI-01 "đơn hoàn thành, **hết hạn trả hàng**" | Giữ đúng chữ wireframe nhưng **không tự tính ngày tiền vào ví** — chỉ hiển thị giao dịch BE trả                                            | Contract API 66 ghi tiền vào ví **ngay lúc hoàn tất** → hai tài liệu lệch nhau [CHỜ LEAD] (đang nằm trong "Đang chờ xác nhận" của CLAUDE.md) |
| 8   | VI-01 chip Tất cả / Tiền vào / Tiền ra                                                                     | Giữ 3 chip; "Tiền vào/ra" gửi tham số hướng nếu BE có, chưa có thì **lọc trên các trang đã tải** và ghi chú                                | API 74 chỉ lọc theo **một** `type` [CHỜ BE]                                                                                                  |
| 9   | VI-02 chi tiết giao dịch (mã GD, số dư sau GD, món hàng)                                                   | Mở từ dữ liệu dòng đã tải (không có API chi tiết); giao dịch bán hàng lấy thêm cách tính từ API 75 theo `orderId`; trường nào thiếu thì ẩn | Không có `GET /wallet/transactions/{id}` [CHỜ BE]                                                                                            |
| 10  | VI-04 "Lượt rút hôm nay: đã dùng 2/3"                                                                      | Hiện nếu BE trả số lượt; chưa có thì **ẩn dòng này** (vẫn xử lý lỗi 409 hết lượt)                                                          | Không có API trả số lượt / cấu hình [CHỜ BE]                                                                                                 |
| 11  | VI-04 mức tối thiểu 10.000 đ, 3 lần/ngày                                                                   | Đọc từ API cấu hình nếu có; chưa có thì hằng số `WALLET_LIMITS` [GIẢ ĐỊNH theo mục 11] — **BE mới là bên quyết định**                      | Admin chỉnh được tham số                                                                                                                     |
| 12  | VI-05 "Nhắn hỗ trợ"                                                                                        | Ẩn                                                                                                                                         | Chat Phase 6                                                                                                                                 |
| 13  | PR-01 thẻ "Số dư ví" (wireframe hiện tổng số dư)                                                           | Hiện **số dư khả dụng** (số tiền dùng được), tổng + đang khoá ở VI-01                                                                      | Tránh Member tưởng tiêu được cả phần đang khoá                                                                                               |
| 14  | BR-08 chỉ vẽ MoMo                                                                                          | Thêm **Ví ReHome** (RadioCard, hiện số dư khả dụng); thiếu tiền → mờ + "Thiếu 120.000 đ"                                                   | F-056; Phase 3 đã để chỗ (`PAYMENT_METHOD`)                                                                                                  |
| 15  | BR-10 thẻ "Chờ thanh toán" có nút "Thanh toán"                                                             | Mở `payment?orderIds=<id>` — BR-09 nhận đơn từ tham số, gọi `getOrder`, không phụ thuộc `checkoutStore`                                    | Đơn chờ phải mở lại được kể cả sau khi tắt app (Phase 3 chỉ lưu RAM)                                                                         |

---

## 1. Nhánh Git

| Thứ tự | Nhánh                                                                       | Nội dung                                                                                                                               | Ngày (gợi ý) |
| ------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 0      | —                                                                           | ✅ Đã đọc code BE `2bfc66c` (20/10): chưa có API Phase 4; ghi field entity ở mục 5.2b                                                  | 20/10        |
| 1      | `feature/orders`                                                            | constants, `orderRules`, mock đơn mở rộng, BR-10, BR-11 (7 trạng thái), huỷ đơn, BR-13, mở BR-09 từ danh sách, dòng "Đơn hàng" ở PR-01 | 20–22/10     |
| 2      | `feature/order-tracking-rating`                                             | BR-12, BR-14                                                                                                                           | 23/10        |
| 3      | `feature/wallet`                                                            | mock ví, VI-01 → VI-03, thẻ ví ở PR-01                                                                                                 | 24–25/10     |
| 4      | `feature/payout`                                                            | VI-04, VI-05, danh sách yêu cầu rút                                                                                                    | 26/10        |
| 5      | `feature/checkout-wallet`                                                   | Ví ReHome ở BR-08/09                                                                                                                   | 27/10        |
| —      | `feature/consign-real-api`, `feature/shop-real-api`, `feature/payment-momo` | nối thật Phase 2/3 khi BE xong                                                                                                         | 28–30/10     |
| 6      | `feature/orders-wallet-real-api`                                            | `*.real.js` Phase 4, tắt mock                                                                                                          | khi BE xong  |

---

## 2. Thư viện

Không cần thư viện mới.

| Cần                 | Dùng                                                                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sao chép mã vận đơn | `expo-clipboard` — ✅ **đã có** (`~58.0.3`, PR-04 `MemberCodeScreen` dùng `Clipboard.setStringAsync`), nằm trong dev build hiện tại → không phải build lại |
| Mở trang GHN        | `Linking.openURL` (giống mở PDF ở Phase 2)                                                                                                                                            |
| Chọn sao (BR-14)    | `Pressable` + `Ionicons` `star` / `star-outline` — không cần thư viện rating                                                                                                          |

---

## 3. Cấu trúc thư mục thêm mới

```
src/
├─ constants/order.js                 # (đã có) + ORDER_TAB, TRACKING_EVENT_LABEL
├─ constants/wallet.js                # WALLET_TX_TYPE, WALLET_TX_LABEL, PAYOUT_STATUS, WALLET_LIMITS
├─ features/orders/                   # (đã có từ Phase 3) mở rộng
│  ├─ api/ ordersApi.js · .real.js · .mock.js   # + getOrders, getTracking, cancelOrder, confirmReceipt, rateOrder
│  ├─ utils/ orderRules.js            # canPay, canCancel, canConfirm, canRate, autoCompleteLeft, returnDeadlineOf, orderStepOf
│  ├─ components/ OrderCard.js · OrderStepper.js (thanh 5 bước ngang) · OrderItemRow.js · AmountBreakdown.js
│  │              ConfirmReceiptDialog.js · TrackingTimeline.js · StarRating.js · OrderMockPanel.js (chỉ __DEV__)
│  └─ screens/ OrderListScreen.js · OrderDetailScreen.js · TrackingScreen.js · RatingScreen.js
├─ features/wallet/
│  ├─ api/ walletApi.js · walletApi.real.js · walletApi.mock.js · queryKeys.js
│  ├─ hooks/ useWallet.js · useTransactions.js (useInfiniteQuery) · usePayout.js
│  ├─ utils/ txDirection.js (IN/OUT theo dấu amount) · payoutRules.js (validatePayoutAmount)
│  ├─ components/ BalanceCard.js · TransactionRow.js · RevenueRow.js · PayoutStatusTimeline.js · WalletMockPanel.js (chỉ __DEV__)
│  └─ screens/ WalletScreen.js · TransactionDetailScreen.js · RevenueScreen.js · WithdrawScreen.js
│              PayoutDetailScreen.js · PayoutListScreen.js
└─ app/(member)/
   ├─ orders/index.js  [id]/index.js  [id]/tracking.js  [id]/rating.js
   └─ wallet/index.js  revenue.js  withdraw.js  transactions/[id].js  payouts/index.js  payouts/[id].js
```

`AmountBreakdown` (Giá bán − Hoa hồng − Thuế = Vào ví) dùng chung cho VI-02, VI-03 — giống `PayoutBreakdown` ở Phase 2; nếu giống hẳn thì **dùng lại `PayoutBreakdown`**, đừng viết bản thứ hai.

---

## 4. Hằng số và quy tắc

### 4.1. `src/constants/order.js` (bổ sung)

```js
// Chip ở BR-10 → danh sách status gửi BE (0.4 #1)
export const ORDER_TABS = [
  { key: "ALL", label: "Tất cả", statuses: [] },
  { key: "PENDING", label: "Chờ thanh toán", statuses: ["PENDING_PAYMENT"] },
  { key: "PROCESSING", label: "Đang xử lý", statuses: ["PAID", "PACKING"] },
  { key: "SHIPPING", label: "Đang giao", statuses: ["SHIPPING", "DELIVERED"] },
  { key: "DONE", label: "Hoàn thành", statuses: ["COMPLETED"] },
  { key: "CANCELLED", label: "Đã huỷ", statuses: ["CANCELLED"] },
];

// API 64 events[].status — contract mới có "PICKED_UP" → [CHỜ BE] danh sách đủ (thường theo trạng thái GHN)
export const TRACKING_EVENT_LABEL = {
  PICKED_UP: "GHN đã lấy hàng",
  // thêm khi BE chốt; không có trong bảng → hiện description/raw BE trả
};
```

### 4.2. `src/constants/wallet.js`

Theo **DB** (WalletTransaction.type, PayoutRequest.status). [KIỂM TRA] với code BE.

```js
export const WALLET_TX_LABEL = {
  ORDER_PAYMENT: "Thanh toán đơn hàng", // âm: trả đơn bằng ví
  ORDER_PAYOUT: "Bán hàng", // dương: tiền bán món ký gửi
  REFUND: "Hoàn tiền", // dương: huỷ đơn / trả hàng hợp lệ / GHN lỗi
  WITHDRAWAL: "Rút tiền", // âm
  WITHDRAWAL_FEE: "Phí rút lại hàng", // âm (Phase 5)
  DEGRADED_COMPENSATION: "Đền bù hàng xuống cấp", // dương (Phase 5)
};
export const txLabel = (type) => WALLET_TX_LABEL[type] ?? "Giao dịch khác";

export const TX_STATUS_LABEL = {
  PENDING: "Đang chờ",
  PROCESSING: "Đang xử lý",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

export const PAYOUT_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
};

// [GIẢ ĐỊNH] theo mục 11 tài liệu tổng quan — chỉ để chặn sớm trên app; BE quyết định cuối
export const WALLET_LIMITS = { MIN_PAYOUT: 10000, MAX_PAYOUTS_PER_DAY: 3 };
```

`COMMISSION_REVENUE`, `WITHDRAWAL_FEE_REVENUE` là bút toán của **quỹ nền tảng** — Member không bao giờ thấy, không cần nhãn.

Hướng tiền: theo **dấu của `amount`** (dương = vào, âm = ra), không theo `type` — `utils/txDirection.js`. Hiển thị `+612.000 đ` / `−500.000 đ` (dấu trừ là ký tự `−`, không phải `-`, cho dễ đọc — tuỳ chọn).

### 4.3. `features/orders/utils/orderRules.js` — một chỗ duy nhất

Giống `getProductView` ở Phase 2: mọi điều kiện hiện nút đặt ở đây, màn hình chỉ gọi hàm.

```js
export const canPay = (o) =>
  o.status === "PENDING_PAYMENT" && secondsLeft(o.paymentDeadline) > 0;
export const canCancel = (o) => o.status === "PAID"; // API 65: chỉ PAID (chưa đóng gói)
export const canConfirm = (o) => o.status === "DELIVERED"; // [CHỜ BE] có cho SHIPPING không (câu 6)
export const canRate = (o) =>
  o.status === "COMPLETED" && o.serviceRating == null; // API 67
export const canTrack = (o) => !!o.ghnTrackingCode;

// Phase 5 dùng: trả hàng gác theo MỐC THỜI GIAN (ghi chú BR-11 Hoàn thành), không theo status
export const returnDeadlineOf = (o, days = 3) =>
  o.deliveredAt ? dayjs(o.deliveredAt).add(days, "day") : null; // [CHỜ BE] số ngày lấy từ cấu hình nếu có

// "Tự hoàn thành sau 2 ngày 7 giờ" — lấy autoCompleteDeadline của BE, không tự cộng 3 ngày
export const autoCompleteLeft = (o) => o.autoCompleteDeadline ?? null;

// Bước của thanh 5 bước ngang (BR-11): 0 Đặt hàng · 1 Thanh toán · 2 Đóng gói · 3 Đang giao · 4 Hoàn thành
export const orderStepOf = (o) =>
  ({
    PENDING_PAYMENT: 0,
    PAID: 1,
    PACKING: 2,
    SHIPPING: 3,
    DELIVERED: 3,
    COMPLETED: 4,
  })[o.status] ?? -1; // CANCELLED → không vẽ thanh bước
```

Mọi mốc thời gian (`paymentDeadline`, `deliveredAt`, `autoCompleteDeadline`, `createdAt`) là ISO UTC có `Z` theo contract → `dayjs(x)` đúng múi giờ. Thiếu `Z` → lệch 7 tiếng [KIỂM TRA].

### 4.4. `features/wallet/utils/payoutRules.js`

```js
export function validatePayoutAmount(
  amount,
  { available, minPayout, usedToday, maxPerDay },
) {
  if (amount == null) return "Nhập số tiền muốn rút";
  if (amount < minPayout)
    return `Số tiền rút tối thiểu là ${formatVnd(minPayout)}`;
  if (amount > available)
    return `Vượt quá số dư khả dụng. Mức cao nhất bạn rút được bây giờ là ${formatVnd(available)}.`;
  if (usedToday != null && usedToday >= maxPerDay)
    return `Bạn đã rút ${maxPerDay} lần hôm nay. Thử lại vào ngày mai.`;
  return null;
}
```

Màn VI-04 dùng hàm này cho lỗi dưới ô (zod `superRefine` gọi lại hàm này cũng được — chọn một, đừng viết hai nơi).

---

## 5. Lớp API

### 5.1. `src/config/env.js`

```js
export const MOCK = {
  // … Phase 1–3 giữ nguyên
  orders: true, // (Phase 3) mở rộng thêm getOrders, getTracking, cancelOrder, confirmReceipt, rateOrder
  payment: true, // (Phase 3) + WALLET
  wallet: true, // Phase 4 — ví, lịch sử, doanh thu, rút tiền
};
```

Nhóm có hàm thật và hàm chưa có: chọn **từng hàm** như Phase 3 (`ordersApi = { createOrders: MOCK.orders ? … : …, getOrders: MOCK.orderList ? … : … }`) — tách cờ khi BE xong lệch nhau.

### 5.2. Bảng API Phase 4 (theo API_CONTRACT — [KIỂM TRA] với code BE)

Base path dự kiến như Phase 3: không `/api`, có envelope. Danh sách có phân trang 0-based.

| API | Method + path                       | Body / query                | Trả về (contract)                                                                            | Lỗi (contract)                                                                                         | BE thật |
| --- | ----------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------- |
| 62  | `GET /orders`                       | `status, page, size`        | page `{content:[{id, orderNo, status, totalAmount}], …}`                                     | 401                                                                                                    | ?       |
| 63  | `GET /orders/{id}`                  | —                           | `{id, orderNo, status, items:[{productId, price}], ghnTrackingCode}`                         | 403 · 404                                                                                              | ?       |
| 64  | `GET /orders/{id}/tracking`         | —                           | `{status, ghnTrackingCode, events:[{status, timestamp}]}`                                    | 404                                                                                                    | ?       |
| 65  | `POST /orders/{id}/cancel`          | —                           | `{id, status:"CANCELLED"}`                                                                   | 404 · 409 `CANNOT_CANCEL_AFTER_PACKING` (**nằm trong message**)                                        | ?       |
| 66  | `POST /orders/{id}/confirm-receipt` | —                           | `{id, status:"COMPLETED"}`                                                                   | 404 · 409 chưa đang giao                                                                               | ?       |
| 67  | `POST /orders/{id}/rating`          | `{serviceRating: 1..5}`     | `{id, serviceRating}`                                                                        | 400 ngoài 1–5 · 409 chưa COMPLETED                                                                     | ?       |
| 60  | `POST /orders/{id}/payment`         | `{paymentMethod: "WALLET"}` | `{id, status:"PAID"}`                                                                        | 409 `INSUFFICIENT_BALANCE` (trong message) · 409 đơn không còn chờ                                     | ?       |
| 73  | `GET /wallet`                       | —                           | `{balance, lockedBalance, availableBalance}`                                                 | 401                                                                                                    | ?       |
| 74  | `GET /wallet/transactions`          | `type, page, size`          | page `{content:[{id, type, amount, relatedOrderId, status, note, createdAt}], …}`            | 401                                                                                                    | ?       |
| 75  | `GET /wallet/revenue`               | `page, size`                | page `{content:[{orderId, orderNo, salePrice, commission, tax, netAmount, completedAt}], …}` | 401                                                                                                    | ?       |
| 76  | `POST /wallet/payout-requests`      | `{amount}`                  | `{id, amount, status:"PENDING"}`                                                             | 409 `BELOW_MIN_PAYOUT` · `INSUFFICIENT_BALANCE` · `DAILY_PAYOUT_LIMIT_REACHED` (đều **trong message**) | ?       |
| 77  | `GET /wallet/payout-requests/{id}`  | —                           | `{id, amount, status, failureReason}`                                                        | 404                                                                                                    | ?       |
| 78  | `GET /wallet/payout-requests`       | `page, size`                | page `{content:[{id, amount, status}], …}`                                                   | 401                                                                                                    | ?       |

Cột "BE thật": **❌ tất cả chưa có** (đọc code `2bfc66c`, 20/10).

### 5.2b. Entity / enum BE đã có (đặt tên field mock theo đây)

- **`Order`:** `id, orderNo, buyer, warehouse, shippingAddress, subtotal, shippingFee, totalAmount, paymentMethod (WALLET | MOMO), status, ghnTrackingCode, paymentDeadline, deliveredAt, autoCompleteDeadline, serviceRating (1–5), ratedAt, createdAt, updatedAt`. **Không có** `paidAt`, `completedAt`, `cancelledAt`, `cancelReason`, `refundAmount` → mock vẫn có các field này (màn hình cần) nhưng ghi [CHỜ BE] (mục 11 câu 4b). `paymentMethod` mặc định `WALLET` lúc tạo đơn (BE đặt sẵn) → chưa phản ánh phương thức thật cho tới khi có API 60.
- ⚠️ **`Order.shippingAddress` là khoá ngoại tới `ShippingAddress`, KHÔNG phải bản chụp** → sửa địa chỉ sau khi đặt sẽ đổi luôn địa chỉ của đơn cũ; xoá địa chỉ đã dùng cho đơn có thể lỗi khoá ngoại. Câu NoteBox ở BR-06 Phase 3 ("đơn đã đặt giữ nguyên địa chỉ lúc đặt") **đang sai so với BE** → mục 11 câu 4c.
- **`OrderItem`:** `product, priceAtOrder, commissionRateApplied, taxRateApplied` → doanh thu hiện được **% hoa hồng đã chốt** của từng đơn.
- **`Wallet`:** `balance, lockedBalance` (khả dụng = balance − locked, API 73 contract trả sẵn `availableBalance`).
- **`WalletTransaction`:** `type` (`ORDER_PAYMENT, ORDER_PAYOUT, REFUND, WITHDRAWAL, WITHDRAWAL_FEE, DEGRADED_COMPENSATION` + 2 loại của ví nền tảng), `amount`, `relatedOrder`, `status` (`PENDING | PROCESSING | SUCCESS | FAILED`, mặc định SUCCESS), `note`, `createdAt`. **Không có** `balanceAfter`, mã hiển thị, liên kết tới `PayoutRequest`.
- **`PayoutRequest`:** `amount, status` (cùng enum `TransactionStatus`), `failureReason, createdAt, processedAt`. **Không có** mã hiển thị kiểu RT-00088.
- Hằng số ở mục 4.2 (`WALLET_TX_LABEL`, `PAYOUT_STATUS`) **khớp** enum BE.

**Mã lỗi nằm trong message** (`"BELOW_MIN_PAYOUT: số tiền rút…"`): mobile **không cắt chuỗi** để lấy mã. Xin BE đưa vào field `code` (mục 11 câu 1). Trong lúc chờ: phân biệt bằng `status` + ngữ cảnh, hiện `message` BE nguyên văn (bỏ phần trước dấu `:` là chấp nhận được về hiển thị, nhưng **không dùng để rẽ nhánh logic**).

**Thiếu so với wireframe** (gom vào mục 11): API 62 thiếu ảnh/tên món đầu, `warehouseName`, `paymentDeadline`, `deliveredAt`, `autoCompleteDeadline`, số món; API 63 thiếu `createdAt`, `paidAt`, `deliveredAt`, `autoCompleteDeadline`, `paymentMethod`, `subtotal`, `shippingFee`, `totalAmount`, địa chỉ giao (snapshot), tên/ảnh/size từng món, `serviceRating`, lý do + thời điểm huỷ, số tiền đã hoàn; API 64 thiếu mô tả/địa điểm từng mốc, dự kiến giao, cờ sự cố; API 74 thiếu tham số hướng tiền, `balanceAfter`, mã giao dịch hiển thị; API 76/78 thiếu `createdAt`, mã hiển thị (RT-00088), số lượt đã dùng hôm nay.

### 5.3. Tên hàm (real và mock giống hệt)

```
// ordersApi (bổ sung vào file Phase 3)
getOrders({ statuses, page, size })     // statuses: mảng từ ORDER_TABS
getOrder(id)                            // (đã có)
getTracking(id)
cancelOrder(id)
confirmReceipt(id)
rateOrder(id, serviceRating)

// paymentApi (Phase 3) — thêm nhánh WALLET
startPayment({ orderIds, method })      // WALLET → { paid: true, orders } ; MOMO → { payUrl }

// walletApi
getWallet()
getTransactions({ direction, type, page, size })  // direction: "IN" | "OUT" | undefined
getRevenue({ page, size })
createPayout(amount)
getPayout(id)
getPayouts({ page, size })
getWalletConfig()                       // [CHỜ BE] min, max/ngày, số lượt đã dùng — chưa có thì trả WALLET_LIMITS
```

`getOrders` nhận **mảng** `statuses`: real gửi theo cách BE hỗ trợ (`status=PAID&status=PACKING` hoặc `status=PAID,PACKING` — [CHỜ BE]); BE chỉ nhận một giá trị thì real gọi song song từng status rồi gộp + sắp theo `createdAt` (chấp nhận cho Phase 4, ghi vào PR).

### 5.4. Mock "sống", nối với mock Phase 3

Một kho dữ liệu RAM dùng chung cho đơn và ví (vd `features/orders/api/mockStore.js` hoặc mở rộng store mock đơn hiện có) để các màn thấy cùng một sự thật:

- **Đơn mẫu đủ trạng thái**: 1 Chờ thanh toán (còn 12 phút), 1 Đã thanh toán, 1 Đang đóng gói, 1 Đang giao (có hành trình 3 mốc), 1 Đã giao (còn 2 ngày tự hoàn thành), 1 Hoàn thành chưa đánh giá, 1 Hoàn thành đã đánh giá, 1 Đã huỷ (đã hoàn tiền), 1 Đang giao **có sự cố** (giao không thành công 2 lần).
- Đơn tạo ở **BR-08 (mock Phase 3)** phải xuất hiện ở BR-10; trả MoMo mock thành công → `PAID`.
- `cancelOrder`: chỉ `PAID`, khác → `ApiError` 409; thành công → đơn `CANCELLED` + **thêm giao dịch `REFUND` = `totalAmount`** vào ví mock + món về `ON_SALE` (nếu mock sản phẩm dùng chung).
- `confirmReceipt`: chỉ `DELIVERED` → `COMPLETED`, ghi `completedAt`.
- `rateOrder`: chỉ `COMPLETED`, 1–5, lưu `serviceRating`, `ratedAt`.
- `startPayment(WALLET)`: tổng các đơn ≤ `availableBalance` → trừ ví (giao dịch `ORDER_PAYMENT` âm) + đơn `PAID`; thiếu → 409.
- **Ví mẫu**: số dư 1.284.000 đ, đang khoá 500.000 đ (một yêu cầu rút Đang xử lý), lịch sử 5 dòng như VI-01 (Bán hàng, Rút tiền, Hoàn tiền huỷ đơn, Phí rút lại hàng, Bán hàng) + doanh thu 3 đơn ở 3 kỳ (10/15/20%) như VI-03.
- `createPayout`: kiểm min / khả dụng / lượt trong ngày → 409; thành công → `PENDING`, **khoá tiền** (`lockedBalance += amount`), sau ~2 giây `PROCESSING`, sau ~5 giây `SUCCESS` (trừ `balance`, nhả khoá, thêm giao dịch `WITHDRAWAL`) hoặc `FAILED` (nhả khoá, `failureReason`). Kết quả mặc định SUCCESS; `mockNextPayoutFails()` cho lần sau thất bại.
- **Khung Mock** (`__DEV__ && MOCK.orders`) ở BR-11: nút "Kho đóng gói" (PAID → PACKING), "Giao cho GHN" (→ SHIPPING, sinh mã vận đơn), "Giao xong" (→ DELIVERED, `deliveredAt = now`, `autoCompleteDeadline = now + 3 ngày`), "Hết hạn tự hoàn thành" (→ COMPLETED). Ở VI-04: "Lần rút sau thất bại".
- Mỗi hàm `await sleep(400–800ms)`.

### 5.5. React Query

```js
// features/orders/api/queryKeys.js — Phase 3 ĐÃ CÓ orderKeys.statuses (BR-09) → THÊM vào object đó, không tạo object mới
export const orderKeys = {
  statuses: (ids) => ["orders", "status", ...ids], // (Phase 3)
  list: (tabKey) => ["orders", "list", tabKey],
  detail: (id) => ["orders", "detail", id],
  tracking: (id) => ["orders", "tracking", id],
};
export const walletKeys = {
  wallet: ["wallet"],
  transactions: (direction) => ["wallet", "transactions", direction ?? "ALL"],
  revenue: ["wallet", "revenue"],
  payouts: ["wallet", "payouts"],
  payout: (id) => ["wallet", "payout", id],
  config: ["wallet", "config"],
};
```

| Mutation            | Làm mới                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| cancelOrder         | `orders.detail(id)`, `["orders","list"]`, `["wallet"]` (có hoàn tiền), `["products"]` (món về sàn) |
| confirmReceipt      | `orders.detail(id)`, `["orders","list"]`                                                           |
| rateOrder           | `orders.detail(id)`, `["orders","list"]`                                                           |
| startPayment WALLET | như PAID ở Phase 3 + `["wallet"]`                                                                  |
| createPayout        | `["wallet"]` (số dư, khoá, lịch sử, danh sách rút)                                                 |

VI-05 (`getPayout`) khi trạng thái chưa kết thúc: `refetchInterval: 2000`, **dừng** khi `SUCCESS`/`FAILED` hoặc sau 60 giây (rồi để kéo tải lại). Kết thúc → invalidate `["wallet"]`.

---

## 6. Business rules áp dụng trên app

| Quy tắc                                                                                    | Nguồn                | App làm gì                                                                                                                |
| ------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Huỷ được **chỉ khi kho chưa đóng gói** (PAID), hoàn **100% kể cả phí ship** vào **ví**     | F-061, API 65        | Nút "Huỷ đơn — hoàn 100%" chỉ ở PAID; hỏi lại; 409 (vừa đóng gói) → tải lại, toast "Kho vừa đóng gói, không huỷ được nữa" |
| Tiền hoàn vào **ví ReHome**, không về ngân hàng                                            | mục 7                | BR-11 Đã huỷ ghi rõ; nút "Xem ví của tôi"                                                                                 |
| Xác nhận nhận hàng → Hoàn thành; không bấm thì **tự hoàn thành sau 3 ngày** kể từ khi giao | F-063, F-064         | Dialog BR-13; đếm "Tự hoàn thành sau …" theo `autoCompleteDeadline` của BE                                                |
| Xác nhận **không mất quyền trả hàng** (3 ngày kể từ khi nhận)                              | BR-11, BR-13         | Giữ câu nhắc; nút trả hàng Phase 5                                                                                        |
| Hoa hồng tính theo **kỳ lúc đặt đơn**, không theo kỳ lúc hoàn tất                          | F-065, mục 8         | Doanh thu / chi tiết giao dịch hiện mức BE trả theo **từng đơn** (`commission`), không tự tính lại theo kỳ hiện tại       |
| Đánh giá chấm **dịch vụ kho** (đóng gói + giao), không chấm người ký gửi                   | BR-14                | NoteBox ở BR-14                                                                                                           |
| Số dư khả dụng = số dư − đang khoá                                                         | mục 7, API 73        | Dùng `availableBalance` BE trả; không tự trừ                                                                              |
| Rút tiền: tối thiểu 10.000 đ, tối đa 3 lần/ngày, **không cần duyệt**, khoá tiền ngay       | F-042, F-043, mục 11 | Chặn sớm bằng `validatePayoutAmount`; vẫn xử lý 409 của BE                                                                |
| Chi tiền là **giả lập**: PENDING → PROCESSING → SUCCESS / FAILED; thất bại nhả tiền khoá   | F-044                | VI-05 tự cập nhật; thất bại hiện "Tiền đã được trả lại đầy đủ" + "Tạo lại yêu cầu rút"                                    |
| Ví không liên kết ngân hàng, không lưu số tài khoản                                        | mục 7                | VI-04 **không có** ô số tài khoản; ghi chú "Đây là giao dịch mô phỏng" [CHỜ LEAD câu chữ]                                 |
| Trả trọn một phương thức (ví **hoặc** MoMo) cho đơn                                        | F-056                | BR-08: chọn một cho cả nhóm đơn; Ví thiếu tiền → mờ, không trộn                                                           |

---

## 7. Spec từng màn hình

Chung: loading lần đầu, `ErrorBox` + "Thử lại", kéo xuống tải lại, lỗi mạng `status 0`, 403/404 chi tiết → `EmptyState`. Tiền `formatVnd`, thời gian `dd/MM/YYYY HH:mm`.

### PR-01 · Tab Cá nhân (bổ sung)

- **Thẻ ví** (đang ẩn → bật): "Số dư khả dụng" + số tiền lớn (`availableBalance`), chữ nhỏ "Đang khoá 500.000 đ" nếu > 0, nút **Rút tiền** → `wallet/withdraw`; bấm thẻ → `wallet`. Lỗi tải ví → thẻ hiện "—" + bấm để thử lại (không chặn cả màn).
- Dòng **Đơn hàng của tôi** (đang "Sắp có" → bật) → `orders`; badge "n đang giao" (đếm `SHIPPING` + `DELIVERED`, lấy từ trang đầu của API 62 hoặc số đếm BE trả [CHỜ BE]).
- Dòng **Hàng ký gửi** → tab Ký gửi mục Sản phẩm (nếu đang "Sắp có").

### BR-10 · Đơn hàng của tôi (`orders/index.js`)

- Header "Đơn hàng của tôi". `ChipGroup horizontal` theo `ORDER_TABS`; nhận `?tab=` để mở thẳng một chip (vd từ PR-01 badge → `tab=SHIPPING`).
- `OrderCard`: "Mã đơn · Kho …" + nhãn trạng thái · món đầu (ảnh, tên, giá) + "và n món khác" · tổng tiền · hàng cuối theo trạng thái:
  - **Chờ thanh toán:** "Còn mm:ss để thanh toán" (đếm theo `paymentDeadline`) + nút **Thanh toán** → `payment?orderIds=<id>`. Hết giờ → chữ "Đã hết hạn thanh toán", không nút.
  - **Đã thanh toán / Đang đóng gói:** "Kho đang chuẩn bị hàng".
  - **Đang giao:** "GHN · <mã vận đơn>" + nút **Theo dõi** → `orders/[id]/tracking`.
  - **Đã giao:** "Tự hoàn thành sau n ngày" + nút **Đã nhận hàng** → mở BR-13 ngay tại danh sách (dùng chung `ConfirmReceiptDialog`).
  - **Hoàn thành:** chưa đánh giá → nút **Đánh giá**; đã đánh giá → "★ 4/5".
  - **Đã huỷ:** "Đã hoàn <số tiền> vào ví của bạn" (nếu BE trả số tiền hoàn; không có thì "Đã huỷ").
- Bấm thẻ → `orders/[id]`.
- Rỗng theo chip: "Chưa có đơn nào" (Tất cả: thêm nút "Khám phá sản phẩm"); chip khác: "Không có đơn ở mục này".
- Đơn Chờ thanh toán (từ API) **thay cho** `checkoutStore` khi BE có API 62: dải "Đơn chờ thanh toán" ở giỏ (Phase 3) đổi sang đọc `getOrders({statuses:["PENDING_PAYMENT"]})`. Trong lúc mock thì giữ `checkoutStore`, nhưng mock đơn phải có đơn đó trong danh sách.

### BR-09 · Mở lại từ danh sách (sửa `payment.js` của Phase 3)

- Nhận `?orderIds=a,b`. Có tham số → dùng danh sách đó, lấy dữ liệu bằng `getOrder` cho từng đơn. Không có tham số → như cũ (`checkoutStore.pendingOrders`). Cả hai không có → về giỏ.
- Mọi phần khác giữ nguyên (đếm ngược, MoMo, kết quả).

### BR-11 · Chi tiết đơn (`orders/[id]/index.js`)

Phần chung: header = mã đơn; dòng "Đặt lúc … · Kho …" + nhãn trạng thái; `OrderStepper` (5 bước ngang, theo `orderStepOf`; ẩn khi Đã huỷ); **Sản phẩm** (`OrderItemRow` từng món: ảnh, tên, "Thương hiệu · Size · Tình trạng" — trường nào có thì hiện, giá chốt lúc đặt; bấm → `products/[id]`); **Giao đến** (địa chỉ lúc đặt); **Tiền** (Tiền hàng · Phí vận chuyển · Tổng + "Đã thanh toán qua MoMo / Ví ReHome").

Khối và nút theo trạng thái:

- **Chờ thanh toán:** khối "Còn mm:ss để thanh toán" + nút **Thanh toán** (→ `payment?orderIds=`). Hết giờ → "Đơn sẽ tự huỷ" + tải lại.
- **Đã thanh toán (PAID):** khối nổi bật "**Vẫn huỷ được** — Kho chưa đóng gói. Huỷ bây giờ bạn được hoàn **100%, kể cả phí vận chuyển**, tiền vào thẳng ví. Khi kho bắt đầu đóng gói thì không huỷ được nữa, chỉ còn cách trả hàng sau khi nhận." Footer: **Huỷ đơn — hoàn 100%** (secondary) →
  `Alert` "Huỷ đơn <mã>? Bạn được hoàn <tổng> vào ví ReHome." [Không] [Huỷ đơn — destructive] → `cancelOrder` → toast "Đã huỷ đơn, hoàn tiền vào ví" → trang tự thành Đã huỷ. 409 → toast + tải lại.
- **Đang đóng gói (PACKING):** khối "Kho đang đóng gói. Đơn không huỷ được nữa." (không nút).
- **Đang giao (SHIPPING):** thẻ **Mã vận đơn GHN** + nút **Sao chép** (toast "Đã sao chép"); khối "Hành trình" rút gọn 3 mốc mới nhất (từ API 64) + "Xem tất cả" → `tracking`; khối "Không huỷ đơn được nữa. Nếu nhận hàng không đúng mô tả, bạn có 3 ngày kể từ khi nhận để gửi yêu cầu trả hàng." Footer: **Xem trên GHN** (0.4 #5).
- **Đã giao (DELIVERED):** khối lớn "**Bạn đã nhận được hàng chưa?** Kiểm tra hàng rồi bấm xác nhận. Không bấm cũng không sao — hệ thống tự hoàn thành đơn sau **2 ngày 7 giờ** nữa." + ô "Xác nhận **không làm mất quyền trả hàng**…". Danh sách gợi ý kiểm hàng (0.4 #2). Footer: **Xác nhận đã nhận hàng** → BR-13.
- **Hoàn thành (COMPLETED):** dòng "Hoàn thành dd/MM/YYYY". Khối đánh giá: chưa có → 5 sao rỗng + "Chấm dịch vụ của kho" (bấm → `rating`); có rồi → số sao đã chấm. Footer: **Đánh giá dịch vụ** (chưa đánh giá) / **Xem đánh giá của bạn**. (Khối "Còn n ngày để yêu cầu trả hàng" + nút Trả hàng → Phase 5.)
- **Đã huỷ (CANCELLED):** khối **Lý do huỷ** (bạn huỷ / hết hạn thanh toán / GHN lỗi — [CHỜ BE] field lý do; chưa có thì "Đơn đã huỷ"); khối **Đã hoàn tiền** (số tiền + Tiền hàng + Phí vận chuyển + "Hoàn 100%… Tiền vào ví ReHome lúc …, không chuyển về tài khoản ngân hàng.") — **chỉ hiện khi đơn đã từng được thanh toán** (đơn huỷ do hết hạn thanh toán thì không có hoàn tiền). Footer: **Xem ví của tôi** · **Mua lại món này** (chỉ khi món đang ON_SALE; nhiều món → ẩn).
- Khung Mock (chỉ `__DEV__ && MOCK.orders`) ở cuối màn (mục 5.4).

### BR-13 · Xác nhận đã nhận hàng (`ConfirmReceiptDialog`)

- Modal: "Xác nhận đã nhận hàng?" · "Chỉ bấm khi bạn đã mở gói và kiểm tra món hàng." · thẻ món (tên, mã đơn · tổng).
- 3 dòng đánh số: "Đơn chuyển sang Hoàn thành ngay lập tức." · "Bạn vẫn còn 3 ngày để gửi yêu cầu trả hàng nếu phát hiện vấn đề." · câu về thời điểm tiền vào ví người ký gửi — **giữ hoặc bỏ tuỳ lead chốt** (0.4 #7).
- Chữ nhỏ: "Không bấm cũng được — hệ thống tự hoàn thành đơn sau 3 ngày kể từ khi giao."
- **Để sau** · **Xác nhận** (loading) → `confirmReceipt` → đóng, toast "Đã xác nhận nhận hàng" → gợi ý ngay: `Alert` "Chấm dịch vụ của kho?" [Để sau] [Đánh giá] → `rating` (tuỳ chọn, theo thông lệ Shopee).
- 409 (đơn chưa ở trạng thái cho phép / đã tự hoàn thành) → tải lại chi tiết.

### BR-12 · Theo dõi vận chuyển (`orders/[id]/tracking.js`)

- Header "Theo dõi vận chuyển". Đầu màn: "Đơn <mã>" · "GHN · <mã vận đơn>" (bấm giữ / nút để sao chép) · "Dự kiến giao dd/MM/YYYY" (nếu có).
- `TrackingTimeline` (dùng lại `StatusTimeline` nếu được): mốc **mới nhất ở trên**, mỗi mốc: tên (`TRACKING_EVENT_LABEL` hoặc mô tả BE) · thời gian ("Hôm nay 08:15", "Hôm qua 22:10", còn lại `dd/MM HH:mm`) · địa điểm (nếu có).
- **Có sự cố** (BE báo cờ sự cố hoặc mốc mới nhất là giao không thành công [CHỜ BE]): khối cảnh báo "Đơn này đang có vấn đề" + mô tả BE trả; chữ nhỏ "Không giao được, kiện hàng trả về kho và tiền hoàn vào ví bạn" (F-062).
- Chưa có mốc nào: "Chưa có cập nhật từ GHN".
- NoteBox: "Mốc thời gian lấy từ GHN gửi về, không phải kho tự gõ. Nếu GHN chưa cập nhật thì màn này cũng chưa đổi."
- Footer: **Xem chi tiết đơn** (← về BR-11) · **Xem trên GHN**.

### BR-14 · Đánh giá dịch vụ (`orders/[id]/rating.js`)

- NoteBox: "Bạn đang chấm dịch vụ của **Kho …** — đóng gói và giao hàng. Không phải chấm người ký gửi."
- Thẻ món: tên · "Mã đơn · hoàn thành dd/MM/YYYY".
- `StarRating` 5 sao lớn (chạm để chọn) + chữ "4 / 5 · Tốt" (1 Rất tệ · 2 Tệ · 3 Bình thường · 4 Tốt · 5 Rất tốt [GIẢ ĐỊNH chữ]).
- Footer **Gửi đánh giá** (mờ khi chưa chọn sao) → `rateOrder` → toast "Cảm ơn bạn đã đánh giá" → quay lại BR-11.
- Đã đánh giá rồi (mở lại) → chỉ đọc: sao đã chấm + "Đánh giá lúc …" (sửa đánh giá: [CHỜ BE] — contract không có).
- 409 (đơn chưa hoàn thành) → toast + quay lại.

### VI-01 · Ví của tôi (`wallet/index.js`)

- `BalanceCard`: "Số dư" (lớn, `balance`) · hai cột **Khả dụng** (`availableBalance`) / **Đang khoá** (`lockedBalance`) · khi đang khoá > 0: "Phần đang khoá là tiền của yêu cầu rút đang xử lý, chưa dùng được." · nút **Rút tiền** (mờ khi khả dụng < mức tối thiểu, kèm chữ lý do) · nút phụ **Doanh thu** → `revenue` · dòng "Yêu cầu rút tiền" → `payouts`.
- Chip **Tất cả · Tiền vào · Tiền ra** (0.4 #8) + danh sách `TransactionRow` (`useInfiniteQuery`): tên loại (`txLabel`) · dòng phụ (`note`, hoặc "Đơn <mã> · thời gian") · số tiền có dấu (+ đậm cho tiền vào) · trạng thái (`TX_STATUS_LABEL`, chỉ hiện khi khác Thành công, hoặc luôn hiện như wireframe — chọn một). Bấm → `wallet/transactions/[id]` (truyền dữ liệu dòng qua cache, mục 0.4 #9).
- **Rỗng** (chưa có giao dịch): số dư 0 đ, nút Rút tiền mờ; "Ví chưa có giao dịch nào. Tiền sẽ tự vào đây, bạn không phải liên kết tài khoản ngân hàng."; khối "Tiền vào ví khi nào" 3 ý (bán được món ký gửi · đơn bị huỷ / trả hàng hợp lệ · nền tảng đền bù); nút **Ký gửi món đầu tiên** → tab Ký gửi.

### VI-02 · Chi tiết giao dịch (`wallet/transactions/[id].js`)

- Đầu: "Tiền vào ví · Bán hàng" · số tiền lớn có dấu · nhãn trạng thái.
- **Bán hàng (`ORDER_PAYOUT`):** khối "Tiền được tính thế nào" — Giá bán · Hoa hồng (r%) · Thuế khấu trừ · **Vào ví** — lấy từ dòng doanh thu API 75 cùng `orderId` (tìm trong cache doanh thu; chưa có thì gọi `getRevenue` trang đầu). Ghi chú "Hoa hồng tính theo kỳ đang chạy lúc đơn được đặt…" — **chỉ ghi chung**, không tự suy ra "kỳ 1, ngày thứ 28" nếu BE không trả.
- **Thông tin giao dịch:** Mã giao dịch (nếu có mã hiển thị; UUID thì ẩn) · Loại · Thời điểm · Đơn liên quan (bấm → `orders/[id]`, chỉ với đơn **mua** của mình — đơn bán của người khác thì không mở được → [CHỜ BE] `relatedOrderId` của ORDER_PAYOUT có mở được không; tạm **không** cho bấm với `ORDER_PAYOUT`) · Số dư sau GD (nếu có).
- **Hoàn tiền / Thanh toán đơn hàng:** Đơn liên quan bấm được → BR-11.
- **Rút tiền:** dòng "Yêu cầu rút" → `wallet/payouts/[id]` nếu BE trả id liên kết [CHỜ BE].

### VI-03 · Doanh thu của tôi (`wallet/revenue.js`)

- Đầu: tháng hiện tại (chọn tháng trước/sau bằng ‹ › — [GIẢ ĐỊNH], lọc trên dữ liệu đã tải theo `completedAt`; BE có lọc theo tháng thì dùng) · "n đơn đã bán" · "tổng giá bán" · **Bạn nhận** (tổng `netAmount`) "sau hoa hồng, thuế".
- `RevenueRow` mỗi đơn: tên món (nếu có) · "Mã đơn · dd/MM" · Giá bán · Hoa hồng (r% = `commission / salePrice`, làm tròn) · Thuế (ẩn khi 0) · **Đã vào ví** `netAmount`.
- NoteBox cuối: "Mỗi đơn chịu mức hoa hồng của kỳ lúc được đặt. Món bán càng sớm trong kỳ 1 thì bạn giữ được càng nhiều."
- Rỗng: "Chưa có đơn bán nào hoàn thành."

### VI-04 · Rút tiền (`wallet/withdraw.js`)

- Ô **Số tiền muốn rút** (`MoneyField` lớn) + helper "Khả dụng 784.000 đ".
- Chip nhanh: 100.000 · 500.000 · **Tất cả** (= khả dụng); chip lớn hơn khả dụng → mờ.
- Lỗi dưới ô theo `validatePayoutAmount` (gõ tới đâu báo tới đó sau lần chạm đầu). Trường hợp **vượt khả dụng** (VI-04-Loi) thêm khối giải thích: Số dư ví · Đang khoá cho yêu cầu RT-… · **Rút được tối đa** + nút nhỏ **Rút <khả dụng>** (điền sẵn) và **Xem yêu cầu đang khoá** (nếu có id).
- Khối **Điều kiện rút**: Số tiền tối thiểu `formatVnd(minPayout)` · Lượt rút hôm nay "đã dùng 2 / 3" (0.4 #10) · Người duyệt "không cần — xử lý ngay".
- Khối **Sau khi bấm rút**: "<số tiền> bị khoá ngay trong ví, số dư khả dụng còn <…>. Nếu giao dịch thất bại, tiền được nhả lại đầy đủ."
- Footer **Rút <số tiền>** (mờ khi có lỗi / trống) → `Alert` xác nhận → `createPayout` → `router.replace("/wallet/payouts/<id>")`.
- 409 → hiện `message` BE dưới ô + tải lại ví (số dư có thể đã đổi).
- Không có ô ngân hàng (mục 6).

### VI-05 · Yêu cầu rút tiền (`wallet/payouts/[id].js`)

- Header "Yêu cầu <mã hiển thị hoặc 'rút tiền'>". Số tiền lớn + nhãn trạng thái.
- `PayoutStatusTimeline` 3 bước: **Đã tạo yêu cầu** (thời gian · "đã khoá <số tiền>") → **Đang chi tiền** → **Thành công / Thất bại**. Ẩn chữ PENDING/PROCESSING tiếng Anh của wireframe, dùng nhãn tiếng Việt.
- **Đang xử lý:** khối thông tin (mã · tạo lúc · khả dụng còn lại) + NoteBox "Trong lúc chờ, <số tiền> bị khoá và không dùng để mua hàng hay tạo yêu cầu rút khác được." Tự hỏi lại 2 giây/lần (mục 5.5).
- **Thành công:** "Đã chuyển <số tiền>" + ghi chú mô phỏng (mục 6).
- **Thất bại:** khối "Giao dịch chi tiền không thành công" + `failureReason` · khối "**Tiền đã được trả lại đầy đủ** — <số tiền> đã quay lại số dư khả dụng. Bạn không mất đồng nào." Footer **Tạo lại yêu cầu rút** → `wallet/withdraw` (điền sẵn số tiền).
- Footer chung: **Về ví của tôi** → `dismissTo("/wallet")`.

### Danh sách yêu cầu rút (`wallet/payouts/index.js`)

- Danh sách: số tiền · thời gian · nhãn trạng thái; bấm → VI-05. Rỗng: "Chưa có yêu cầu rút tiền nào."

### BR-08 / BR-09 · Thanh toán bằng Ví ReHome (sửa màn Phase 3)

- BR-08 khối **Thanh toán** có 2 `RadioCard` trong cột: **Ví MoMo** · **Ví ReHome** ("Số dư khả dụng 784.000 đ").
  - Khả dụng ≥ tổng phải trả → chọn được. Mặc định giữ MoMo [GIẢ ĐỊNH] (hoặc nhớ lựa chọn lần trước trong RAM).
  - Thiếu → mờ + "Thiếu <tổng − khả dụng>". **Không** gợi ý trả nửa ví nửa MoMo (F-056).
  - Phí ship chưa biết trước khi đặt (Phase 3, chưa có API 58) → so với **tiền hàng**, và nhắc "Cần đủ cả phí vận chuyển khi thanh toán"; BR-09 so lại với tổng thật.
- Chọn Ví: nút BR-08 vẫn là "Đặt hàng · giữ hàng 15 phút" (đặt trước, trả sau như Phase 3) → BR-09 hiện nút **Trả bằng Ví ReHome · <tổng>** → `Alert` xác nhận → `startPayment({ orderIds, method: WALLET })` → thành công: màn kết quả Phase 3 (ghi "Đã thanh toán bằng Ví ReHome") + invalidate `["wallet"]`. 409 thiếu số dư (ví đổi giữa chừng) → toast + cho chọn MoMo ngay trên BR-09.
- Nhiều đơn trả bằng ví: API 60 mỗi đơn một lần → `startPayment` gọi **lần lượt**; một đơn lỗi giữa chừng → hiện đơn nào đã trả / chưa, cho trả tiếp đơn còn lại (bằng MoMo hoặc ví). [CHỜ BE] API trả gộp (PHASE3_GUIDE câu 1).

---

## 8. Tự kiểm tra trước khi push

Chạy trên Android thật, mock.

**Đơn hàng**

- [ ] PR-01: dòng "Đơn hàng của tôi" mở BR-10; badge đúng số đơn đang giao.
- [ ] BR-10: 6 chip lọc đúng; thẻ mỗi trạng thái có đúng nút; kéo tải lại; rỗng từng chip.
- [ ] Đặt hàng ở BR-08 (mock) → đơn hiện ở chip Chờ thanh toán → "Thanh toán" mở BR-09 đúng đơn, đồng hồ đúng; tắt app mở lại vẫn mở được từ danh sách.
- [ ] Chi tiết 7 trạng thái hiện đúng khối và nút (dùng khung Mock chuyển trạng thái).
- [ ] Huỷ đơn PAID → hỏi lại → Đã huỷ, ví có thêm giao dịch Hoàn tiền đúng tổng (cả ship); huỷ khi vừa sang PACKING (khung Mock) → 409 → toast + tải lại.
- [ ] Đang giao: sao chép mã vận đơn; "Xem trên GHN" mở trình duyệt.
- [ ] Đã giao: đếm "Tự hoàn thành sau …"; xác nhận qua dialog (từ chi tiết và từ danh sách) → Hoàn thành → hỏi đánh giá.
- [ ] Đánh giá: chưa chọn sao nút mờ; gửi xong mở lại thấy chỉ đọc; danh sách hiện "★ n/5".
- [ ] Theo dõi: mốc mới nhất trên cùng; đơn có sự cố hiện khối cảnh báo; chưa có mốc.

**Ví và rút tiền**

- [ ] PR-01 thẻ ví hiện **khả dụng**; "Rút tiền" mở VI-04.
- [ ] VI-01: số dư / khả dụng / đang khoá khớp nhau; chip Tiền vào / Tiền ra lọc đúng dấu; rỗng (sửa mock) hiện khối "Tiền vào ví khi nào".
- [ ] VI-02: giao dịch bán hàng có cách tính đúng (giá − hoa hồng − thuế = vào ví); hoàn tiền mở được đơn.
- [ ] VI-03: 3 đơn 3 mức hoa hồng khác nhau; tổng "Bạn nhận" đúng.
- [ ] VI-04: 5.000 đ → lỗi tối thiểu; vượt khả dụng → khối giải thích + "Rút <khả dụng>"; chip Tất cả; rút lần thứ 4 trong ngày → lỗi.
- [ ] VI-05: tự đổi Đang xử lý → Thành công (số dư giảm, khoá nhả); "Lần rút sau thất bại" → Thất bại, khả dụng trở lại như trước khi rút.

**Thanh toán bằng ví**

- [ ] Ví đủ tiền → chọn Ví → đặt → trả bằng ví → thành công, số dư giảm đúng tổng.
- [ ] Ví thiếu → lựa chọn mờ + "Thiếu …".

---

## 9. Commit, push, Pull Request

Như các phase trước. Gợi ý commit nhánh đầu:

```
feat(orders): add order tabs, order rules and extend orders mock
feat(orders): order list with status chips (BR-10)
feat(orders): order detail with 7 states and cancel (BR-11)
feat(orders): confirm receipt dialog (BR-13)
feat(account): enable "My orders" entry on account tab
```

Mô tả PR: Đã làm · Đang dùng mock (`MOCK.orders`, `MOCK.wallet`) · Lệch wireframe (bảng 0.4) · Cách test (khung Mock) · Ảnh chụp.

---

## 10. Cập nhật Phase 3 khi làm Phase 4

- `payment.js`: nhận `?orderIds=` (mục 7). Kết quả thành công: bật nút **Xem đơn hàng** (→ `orders/[id]` khi 1 đơn, `orders?tab=PROCESSING` khi nhiều đơn).
- Dải "Đơn chờ thanh toán" ở giỏ: chuyển sang đọc API 62 khi BE có (giữ `checkoutStore` tới lúc đó).
- BR-07 địa chỉ: nếu BE thêm mã vùng GHN (PHASE3_GUIDE câu 12) → đổi sang chọn Tỉnh / Phường từ danh sách (chú ý từ 01/07/2025 bỏ cấp quận/huyện — làm theo danh sách BE trả, không tự vẽ 3 cấp).
- KG-09 "Đã có đơn" (Phase 2): vẫn **không** mở đơn của người mua (người bán không được xem đơn người khác); tiến trình đơn chỉ hiện nếu API sản phẩm trả.

---

## 11. Cần hỏi (gom gửi backend / lead)

**Backend (Tài — API 62–78)**

1. **Mã lỗi:** contract để mã trong `message` (`"BELOW_MIN_PAYOUT: …"`, `"INSUFFICIENT_BALANCE: …"`, `"CANNOT_CANCEL_AFTER_PACKING: …"`, `"DAILY_PAYOUT_LIMIT_REACHED: …"`). Đề nghị đưa vào field **`code`** (như `ACCOUNT_BANNED`), `message` chỉ còn câu cho người dùng.
2. Bao giờ có API **62 → 67** và **73 → 78**? Thứ tự mobile cần: 62, 63 → 65 → 73, 74 → 66, 67 → 75 → 76–78.
3. **API 62** lọc **nhiều** trạng thái một lần được không (`status=PAID,PACKING`)? Item trả thêm: món đầu (tên, ảnh), số món, `warehouseName`, `paymentDeadline`, `deliveredAt`, `autoCompleteDeadline`, `serviceRating`, số tiền đã hoàn (đơn huỷ). Có số đếm theo trạng thái (cho badge "3 đang giao") không?
4. **API 63** trả thêm: `createdAt`, `paidAt`, `paymentMethod`, `subtotal`, `shippingFee`, `totalAmount`, `warehouseName`, **địa chỉ giao lúc đặt** (snapshot), từng món (`name`, `thumbnailUrl`, `size`, `brandName`, `condition`, giá lúc đặt), `deliveredAt`, `autoCompleteDeadline`, `completedAt`, `serviceRating`, `ratedAt`, `cancelReason` (`BUYER_CANCELLED` / `PAYMENT_EXPIRED` / `CARRIER_FAILED`…), `cancelledAt`, `refundAmount`.
4b. *(Đọc entity 20/10)* Bảng `Order` chưa có `paidAt`, `completedAt`, `cancelledAt`, `cancelReason`, `refundAmount` — màn chi tiết đơn / danh sách cần (Hoàn thành ngày…, lý do huỷ, đã hoàn bao nhiêu). Thêm cột hay tính từ bảng khác (Payment, WalletTransaction)?
4c. ⚠️ *(Quan trọng)* `Order.shippingAddress` đang là **khoá ngoại** tới `ShippingAddress` → Member sửa địa chỉ sau khi đặt thì đơn cũ đổi theo; **xoá** địa chỉ đã dùng cho đơn có thể lỗi khoá ngoại (500). Đề xuất: đơn lưu **bản chụp** (tên, SĐT, địa chỉ) lúc đặt; hoặc tối thiểu chặn xoá địa chỉ đã có đơn bằng 409 có `code`.
5. **API 64**: danh sách giá trị `events[].status`; mỗi mốc có `description`, `location`; có `expectedDeliveryDate`, cờ **sự cố** (giao thất bại / thất lạc) không? Đường dẫn tra cứu GHN công khai cho mã vận đơn là gì (để nút "Xem trên GHN")?
6. **Xác nhận nhận hàng** (API 66): cho phép khi `SHIPPING` hay chỉ `DELIVERED`? (Contract ghi lỗi "chưa ở trạng thái đang giao".)
7. **Đánh giá** (API 67): chỉ `COMPLETED` (contract) nhưng wireframe mở từ **Đã giao** và có chip, ảnh, nhận xét — BE có định thêm không? Có sửa đánh giá không?
8. **Thời điểm cộng tiền cho người ký gửi:** ngay khi đơn `COMPLETED` (contract API 66) hay sau khi **hết hạn trả hàng** (wireframe BR-13, VI-01)? Ảnh hưởng chữ hiển thị ở BR-13 và lịch sử ví.
9. **API 74**: lọc theo **hướng tiền** (`direction=IN|OUT`) hoặc nhiều `type`; trả thêm `balanceAfter`, mã giao dịch hiển thị, tên món / mã đơn (để không phải gọi thêm), id yêu cầu rút với giao dịch `WITHDRAWAL`. Có `GET /wallet/transactions/{id}` không?
10. Với giao dịch `ORDER_PAYOUT`, `relatedOrderId` là đơn của **người mua** — người bán gọi `GET /orders/{id}` sẽ 403. Có API cho người bán xem chi tiết đơn đã bán (tên món, kỳ, hoa hồng) không, hay chỉ qua API 75?
11. **API 75**: có lọc theo tháng; trả thêm `productName`, `commissionRate`, `termNo` (kỳ lúc đặt) để hiện "Hoa hồng kỳ 1 · 10%"?
12. **Cấu hình ví công khai**: API trả `minPayout`, `maxPayoutsPerDay`, **số lượt đã dùng hôm nay** (cho dòng "đã dùng 2/3")?
13. **API 76/78**: trả `createdAt`, `processedAt`, mã hiển thị (RT-00088); giả lập chi tiền mất bao lâu, kết quả thất bại theo tỷ lệ hay có cách ép thất bại để demo?
14. **Thanh toán bằng ví** (API 60 `WALLET`): trừ ví ngay và đơn `PAID` trong cùng request? Nhiều đơn → có API trả gộp không (trùng câu 1 của PHASE3_GUIDE)? Thiếu số dư trả `code` gì?
15. **Huỷ đơn** (API 65) hoàn tiền vào ví ngay trong cùng request (giao dịch `REFUND` có ngay khi gọi `GET /wallet/transactions`)? Món trở về `ON_SALE` ngay?
16. Đơn huỷ do **hết hạn thanh toán** (F-058) và do **GHN lỗi** (F-062) có phân biệt được qua API không?
17. Toàn bộ thời điểm (`deliveredAt`, `autoCompleteDeadline`, `createdAt` …) là ISO UTC có `Z`?

**Lead**

18. Chip trạng thái BR-10 thành 6 mục — đồng ý? (0.4 #1)
19. Bỏ ô tích bắt buộc ở BR-11 Đã giao, chỉ để gợi ý — đồng ý? (0.4 #2)
20. Đánh giá chỉ số sao, chỉ mở khi Hoàn thành (theo API) — đồng ý tạm thời? (0.4 #3, #4)
21. Tiền vào ví người ký gửi: lúc hoàn thành hay sau hạn trả hàng? (0.4 #7 — cùng câu 8 cho BE)
22. Thẻ ví ở PR-01 hiện **số dư khả dụng** — đồng ý? (0.4 #13)
23. Câu chữ ghi chú "rút tiền là giao dịch mô phỏng" ở VI-04/VI-05 (để hội đồng không hỏi tiền đi đâu) — viết thế nào?
