# ReHome Mobile — Hướng dẫn Phase 5 (Trả hàng, rút lại hàng ký gửi, hàng xuống cấp — phía Member)

> Phase 5 theo kế hoạch: 12/11 – 17/11/2026, luồng **L-05** (trả hàng, hoàn tiền) và **L-06** (rút lại hàng ký gửi), cộng nhánh **hàng xuống cấp** (F-036, F-162). Mobile đi trước lịch (Phase 4 xong UI 20/10) → làm Phase 5 từ **21/10**, vẫn chừa **28–30/10** cho nối API thật Phase 2/3/4 khi BE có.
> Nguồn: _Tài liệu tổng quan_ (F-032 … F-036, F-041, F-067 … F-071, F-136, F-162; L-05, L-06; mục 7 "Luồng tiền"; mục 11 tham số trả hàng / rút hàng), _Thiết kế Database_ (ReturnRequest, ReturnRequestPhoto, ItemWithdrawalRequest, DegradedItemCase, WalletTransaction), _API_CONTRACT_ (API 79 – 82, 90 – 92, 94 – 95), wireframe của lead (**RT-01 → RT-04**, **KG-13 → KG-16**).
> Quy ước như `CLAUDE.md` và PHASE2/3/4_GUIDE. File này chỉ ghi phần **mới**.
> Ký hiệu: **[GIẢ ĐỊNH]** · **[CHỜ BE]** · **[CHỜ LEAD]** · **[KIỂM TRA]**.
> **Trạng thái BE (Claude đọc code `develop` `2c3b597`, 20/10 — Render CHƯA deploy bản này):** **chưa có controller** nào của Phase 5 (79–82, 90–95). **Entity + enum đã có** và **khớp** mục 4.1/4.2: `ReturnRequest` (+ `ReturnRequestPhoto`), `ItemWithdrawalRequest`, `DegradedItemCase`; `ReturnRequestStatus` 8 giá trị, `InvalidReturnChoice`, `ItemWithdrawalStatus`, `WithdrawalFeePaymentMethod`, `DegradedItemChoice`, `WalletTransactionType` có `WITHDRAWAL_FEE`, `DEGRADED_COMPENSATION`. Chưa có `/uploads` (BE mới có lưu file nội bộ cho PDF biên nhận), MoMo mới chỉ trả cho **đơn hàng** (`/api/momo/create?orderId=`). Đã có thật liên quan: API 19 biên nhận (`GET /consignment-receipts/{id}` — có `freeWithdrawalWindowDays`, `withdrawalFee`, `degradedCompensationRate`), API 62/63/65–67 đơn, 74 lịch sử ví (xem `CLAUDE.md`). → Phase 5 làm **toàn bộ bằng mock**, nối vào kho mock chung đơn + ví của Phase 4 (trả hàng hợp lệ → giao dịch `REFUND`; phí rút hàng → `WITHDRAWAL_FEE`; đền hàng hỏng → `DEGRADED_COMPENSATION`).

---

## 0. Phase 5 gồm những gì và thế nào là "xong"

### 0.1. Ngoài phạm vi (đừng làm)

- **Phía Moderator** (duyệt yêu cầu trả, kiểm hàng về, kết luận hàng giả, đánh dấu thất lạc, mở ca hàng xuống cấp, bàn giao tại quầy — TH-01 → TH-08, BG-01) là **web**. Mobile chỉ **thấy kết quả** qua trạng thái.
- **"Nhắn cho kho", "Khiếu nại kết luận", "Báo cáo vi phạm"** (RT-01, RT-02) → chat / báo cáo là Phase 6. **Ẩn**.
- **Thông báo đẩy** ("Bạn sẽ nhận thông báo…") → phase sau. Phase 5 dùng dải nhắc trong app (mục 7, "Lối vào").

### 0.2. Danh sách màn hình

| Mã | Màn hình | Route đề xuất (dưới `src/app/(member)/`) | API | F |
|---|---|---|---|---|
| RT-01 | Gửi yêu cầu trả hàng / Quá hạn trả hàng | `returns/new.js?orderId=` | 63, 79 | F-067 |
| — | Danh sách yêu cầu trả hàng | `returns/index.js` | 80 | F-067 |
| RT-02 | Chi tiết yêu cầu trả: Chờ duyệt / Chờ bàn giao GHN / Đang về kho / Đang kiểm tra / Đã hoàn tiền / Không hợp lệ / Thất lạc / Đã huỷ | `returns/[id]/index.js` | 80, 81 | F-068, F-069, F-136 |
| RT-04 | Chọn cách nhận lại hàng trả không hợp lệ | `returns/[id]/pickup-choice.js` | 82 | F-070, F-071 |
| KG-13 | Rút lại hàng: Miễn phí / Có phí (chọn cách trả phí) | `withdrawals/new.js?productId=` | 19, 22, 73, 90, 91 | F-032, F-033 |
| KG-14 | Trả phí: Ví không đủ / MoMo thất bại | trạng thái trong `withdrawals/new.js` | 91 | F-033 |
| KG-15 | Yêu cầu rút hàng: Chờ đến kho / Đã bàn giao / Hết hạn | `withdrawals/[id].js` | 92 | F-034, F-035 |
| KG-16 | Hàng của bạn bị hỏng — chọn cách đền | `degraded-cases/[id].js` | 94, 95 | F-036, F-162 |
| BR-11 | **Bật** nút "Trả hàng" (Phase 4 đã ẩn, `returnDeadlineOf` tính sẵn) + dòng "Yêu cầu trả hàng" của đơn | `orders/[id]/index.js` (đã có) | 63 | F-067 |
| KG-09 | **Bật** nút "Rút hàng về" (Phase 2 đã ẩn) + trạng thái "Đang chờ đến kho lấy" / "Bị hỏng — cần bạn chọn" | `my-products/[id]/index.js` (đã có) | 22 | F-032, F-036 |
| PR-01 | **Bật** dòng "Yêu cầu trả hàng" (+ badge) | `(tabs)/account.js` (đã có) | 80 | — |

> **Không trùng route:** `returns/`, `withdrawals/`, `degraded-cases/` đều mới. Tất cả cần đăng nhập → Guest mở thẳng: `<Redirect href="/login" />` (sau mọi hook).
> Màn hoàn tiền / số dư dùng lại ví Phase 4 (không viết màn ví mới).

### 0.3. Định nghĩa "xong"

Chạy trên Android thật, mock (`MOCK.returns`, `MOCK.withdrawals` = true):

1. BR-11: nút **Trả hàng** chỉ hiện khi còn trong 3 ngày kể từ lúc giao **và** đơn chưa có yêu cầu trả; đã có yêu cầu thì thay bằng dòng "Yêu cầu trả hàng · <trạng thái>" mở RT-02.
2. RT-01: chọn lý do, mô tả, 1–5 ảnh (chụp / thư viện); lỗi dưới từng ô; đếm "Còn 2 ngày 7 giờ"; hết hạn trong lúc đang điền → chuyển sang trạng thái Quá hạn, không gửi được.
3. RT-02 hiện đúng mọi trạng thái với dòng thời gian; **Chờ bàn giao**: mã vận đơn trả, hạn bàn giao đếm ngược, nút "Tôi đã giao hàng cho shipper"; **Đã hoàn tiền**: số tiền + "Xem ví" (ví có giao dịch Hoàn tiền); **Không hợp lệ**: kết luận của kho + nút "Chọn cách nhận lại hàng".
4. RT-04: chọn Đến kho lấy (miễn phí, hạn 7 ngày, nút Mã Member) / Kho gửi lại (có phí); hết hạn chọn → báo rõ hậu quả.
5. KG-09: nút **Rút hàng về** chỉ khi món đang bán và chưa có đơn / chưa có yêu cầu rút / không ở cuối kỳ; hiện trước "Miễn phí — còn n ngày" hoặc "Phí 50.000 đ".
6. KG-13/14: miễn phí → gửi ngay; có phí → trừ ví trước, thiếu thì phần còn lại qua MoMo (mục 0.4 #1); MoMo thất bại → ví **chưa** bị trừ, thử lại được.
7. KG-15: đếm "Còn 5 ngày để đến kho", nút **Mã Member của tôi**; tự hiện Đã bàn giao / Hết hạn khi BE đổi trạng thái.
8. KG-16: 2 lựa chọn có số tiền rõ (đền đủ / nhận lại hàng + đền 50%); xác nhận xong ví có giao dịch Đền bù; nhận lại hàng thì có hạn đến kho.
9. Mọi số tiền (phí rút, % đền, hạn ngày) **lấy từ BE / biên nhận**, không viết cứng 50.000 đ, 50%, 3 / 7 ngày trong logic.
10. Không chuỗi trạng thái rải rác, không mã màu trong màn hình, không so chữ trong message lỗi.

### 0.4. Quyết định đang áp dụng và chỗ lệch (báo lead)

| # | Wireframe | Mobile làm | Lý do |
|---|---|---|---|
| 1 | **KG-14**: "Ví không đủ thì trả **toàn bộ** qua MoMo — không chia một phần ví, một phần MoMo"; **KG-13** cho chọn "Trừ từ ví" **hoặc** "MoMo" | **Trừ ví trước, thiếu thì phần còn lại qua MoMo** (MIXED). Hiện rõ "Trừ ví 32.000 đ · MoMo 18.000 đ". Ví đủ → trừ ví hết, không hỏi | Tài liệu tổng quan mục 7 + L-06 + API 91 (`MIXED`) + DB `fee_payment_method` đều ghi "trừ ví trước, thiếu mới MoMo". Tài liệu tổng quan đứng trên wireframe [CHỜ LEAD sửa KG-13/14] |
| 2 | **KG-15** Chờ đến kho: "Quá hạn… **không mất phí đã trả**" | "Quá hạn… **phí đã trả không được hoàn**" | L-06 "không hoàn phí", KG-13 "Phí không hoàn lại", F-035 — wireframe tự mâu thuẫn [CHỜ LEAD] |
| 3 | **RT-01** chọn **từng món** trong đơn để trả | Trả **cả đơn** (hiện danh sách món chỉ để xem) | Bảng ReturnRequest gắn với `order_id`, không có bảng món trả; API 79 không nhận danh sách món [CHỜ BE nếu muốn trả từng món] |
| 4 | **RT-01** "Nơi shipper tới lấy hàng" (sửa được, chọn từ địa chỉ đã lưu); **RT-02** Chờ duyệt có nút "Sửa" | Chỉ **hiển thị** địa chỉ giao của đơn (đọc), không sửa | API 79 / bảng ReturnRequest không có địa chỉ lấy hàng [CHỜ BE] |
| 5 | **RT-01** lý do = 4 lựa chọn + ô mô tả | Giữ 4 lựa chọn + mô tả; gửi BE **một chuỗi** `reason` = "<lựa chọn>: <mô tả>" | API 79 chỉ có `reason` (chữ) [CHỜ BE nếu muốn tách mã lý do] |
| 6 | **RT-02** Chờ duyệt: "Huỷ yêu cầu trả hàng"; **KG-15**: "Huỷ yêu cầu" (rút hàng) | **Ẩn** cả hai | Không có API huỷ [CHỜ BE] |
| 7 | **RT-02** Chờ bàn giao: không có nút; "Shipper mang phiếu tới…" | Thêm nút **"Tôi đã giao hàng cho shipper"** (API 81) | API 81 là việc của Member (F-068); nếu BE tự nhận biết qua GHN thì bỏ nút [CHỜ BE] |
| 8 | **RT-04** "Kho gửi lại · trả 30.000 đ" — wireframe ghi "CHƯA CHỐT: trừ ví hay MoMo" | Làm lựa chọn **Đến kho lấy** đầy đủ; **Kho gửi lại** hiện phí nếu BE trả, trả phí theo cùng cách phí rút hàng (ví trước, thiếu MoMo) — tạm **mờ** nếu BE chưa có API trả phí | Mục 7 tài liệu: "phí gửi lại hàng trả không hợp lệ" thu qua MoMo; API 82 không có bước trả phí [CHỜ BE + LEAD] |
| 9 | **KG-16** "Nếu không chọn trong 7 ngày, hệ thống **mặc định nhận tiền đền**"; nhận lại hàng "đến kho trong **30 ngày**" | Giữ chữ nhưng **hạn lấy từ BE** (`decisionDeadline`, `pickupDeadline`); BE chưa trả thì ẩn số ngày, giữ câu mặc định | API 94/95 không có hạn; tài liệu tổng quan không ghi 7 / 30 ngày [CHỜ BE + LEAD] |
| 10 | **KG-16** số tiền đền "442.000 đ" (có vẻ = giá + ship) | Hiện đúng `compensationAmount` BE trả; đền một phần = `compensationAmount × degradedCompensationRate` (tỷ lệ lấy từ biên nhận, mặc định 0.5) | API 93: `compensationAmount` = giá bán trừ hoa hồng lẽ ra người ký gửi nhận |
| 11 | **RT-01-QuaHan** nút mờ "Gửi yêu cầu" + "Báo cáo vi phạm" | Chỉ khối "Đã quá hạn" + mốc thời gian; **ẩn** cả hai nút | Nút mờ không có tác dụng; báo cáo là Phase 6 |
| 12 | **RT-02** "YC-00084", **KG-15** không có mã | Hiện mã hiển thị nếu BE trả; UUID thì ẩn | Bảng không có mã hiển thị [CHỜ BE] |
| 13 | Lối vào KG-16 (người ký gửi biết món bị hỏng) không vẽ | Dải nhắc ở **tab Ký gửi** + trạng thái mới ở KG-08/09 "Bị hỏng — cần bạn chọn" | Không có thông báo đẩy; Member phải có đường vào màn quyết định |
| 14 | **RT-02** Không hợp lệ: nút "So sánh với ảnh kiểm định lúc nhập kho" | **Ẩn** | Người mua chưa có API xem ảnh kiểm định của món đã mua [CHỜ BE] |
| 15 | **RT-02** Đã hoàn tiền: nút "Rút tiền" | Nút **"Xem ví"** + thẻ "Số dư ví hiện tại" | Member thấy giao dịch Hoàn tiền trước; rút tiền mở từ ví |

---

## 1. Nhánh Git

| Thứ tự | Nhánh | Nội dung | Ngày (gợi ý) |
|---|---|---|---|
| 0 | — | ✅ Đã đọc BE `2c3b597` (20/10): chưa có API 79–95, `/uploads`, MoMo cho phí; entity/enum khớp guide; điền mục 5.2 | 20/10 |
| 1 | `feature/returns` | ✅ PR #25 — constants, `returnRules`, mock trả hàng (nối kho mock đơn + ví), RT-01, RT-02 (mọi trạng thái), danh sách, bật nút ở BR-11, dòng PR-01 | 20–21/10 |
| 2 | `feature/return-invalid-choice` | RT-04 | 24/10 |
| 3 | `feature/item-withdrawal` | `withdrawalRules`, mock rút hàng, KG-13/14/15, bật nút KG-09, trạng thái mới ở KG-08/09 | 25–26/10 |
| 4 | `feature/degraded-item` | KG-16, dải nhắc tab Ký gửi | 27/10 |
| — | nối thật Phase 2/3/4 | khi BE xong | 28–30/10 |
| 5 | `feature/returns-withdrawal-real-api` | `*.real.js`, tắt mock Phase 5 | khi BE xong |

**Nhánh 1 đã làm khác / thêm so với kế hoạch** (đều trong code, ghi để nối API thật cho đúng):

- Route RT-01 là `returns/new.js?orderId=` (tên cố định `new` được ưu tiên hơn `[id]`); RT-02 là `returns/[id]/index.js` (nhánh 2 thêm `[id]/pickup-choice.js`).
- `returnStepOf` trả chỉ số bước **đã xong** (giống `orderStepOf` Phase 4): PENDING = 0 → bước "Kho duyệt" đang chạy. Đã huỷ → -1, RT-02 hiện khối lý do thay cho dòng thời gian.
- BR-11: khối "Hàng có vấn đề? Còn … để yêu cầu trả" + nút **Trả hàng** đặt **trong nội dung** (trên mục Sản phẩm), không chiếm chân màn — nút chính ở chân vẫn là Xác nhận đã nhận hàng / Đánh giá. Đơn đã có yêu cầu → dòng "Yêu cầu trả hàng · <trạng thái>" (`useReturn(order.returnRequestId)`). BR-10 thẻ đơn có nhãn "↩ Có yêu cầu trả hàng".
- PR-01 badge "n cần bạn làm" = số yêu cầu ở chip **Cần bạn làm** (APPROVED + INVALID); INVALID đã chọn cách nhận vẫn được đếm cho tới khi BE có số đếm riêng [CHỜ BE].
- Mock dùng **một hạn** `pickupDeadline` cho cả chọn cách nhận lẫn đến kho lấy (đặt lúc kết luận Không hợp lệ, 7 ngày) [GIẢ ĐỊNH — entity chỉ có `pickupDeadline`]. `SHIP_BACK` trong mock trả 409 (chưa có API trả phí, 0.4 #8).
- Field mock chưa có ở BE (đánh dấu [CHỜ BE] trong `returnsApi.mock.js`): `code` (YC-…), `approvedAt`, `handedOverAt`, `inspectedAt`, `resolutionPhotoUrls`, `refundAmount`, `cancelReason` (`RETURN_CANCEL_REASON`: REJECTED / HANDOVER_EXPIRED), `cancelNote`; kèm thông tin đơn (`orderNo`, `items`, `subtotal`, `shippingFee`, `totalAmount`, 3 field địa chỉ theo tên BE `2c3b597`). Đơn có thêm `returnRequestId` (câu 3).
- Mã lỗi [GIẢ ĐỊNH tên]: `RETURN_ALREADY_EXISTS` (API 79), `RETURN_HANDOVER_EXPIRED` (API 81); `RETURN_WINDOW_EXPIRED` theo contract.
- Mock nối: đơn mẫu `od-seed-11 … 16` ↔ yêu cầu `rr-seed-1 … 6` (đủ 6 trạng thái); kết luận hợp lệ / thất lạc → `mockRefund` ghi giao dịch REFUND "Hoàn tiền trả hàng". Khung Mock RT-02: Kho duyệt / từ chối / quá hạn bàn giao / hàng về kho / thất lạc / hợp lệ / không hợp lệ. Khung Mock BR-11: "Rút hạn trả hàng còn 1 phút" (`mockExpireReturnWindow`).
- `PhotoPicker` (Phase 2) thêm prop `label`, `helper`, `pickTitle`, `pickMessage` (mặc định giữ chữ ký gửi) — dùng lại ở RT-01, chưa chuyển ra `components/ui`.
- Thành phần mới dùng lại được: `PhotoThumbs` (hàng ảnh nhỏ, bấm xem to), `ReturnStatusTimeline` (dựa trên `StatusTimeline`).

---

## 2. Thư viện

Không cần thư viện mới.

| Cần | Dùng |
|---|---|
| Ảnh chứng minh (RT-01) | `expo-image-picker` (đã có) + `PhotoPicker` của Phase 2 (`features/consignment/components/PhotoPicker.js`) — **dùng lại**, nếu cần thì chuyển ra `components/ui` (một lần, mở lại các màn đang dùng) |
| Upload ảnh | `uploadFile` ở `src/lib/api/upload.js` (đang mock — chờ `/uploads`) |
| Trả phần MoMo của phí | Cùng cách với Phase 3 nhánh `feature/payment-momo`: `expo-web-browser` `openAuthSessionAsync` (**chưa cài**, cài ở nhánh MoMo — Phase 5 dùng mock nên chưa cần) |
| Mã Member tại quầy (KG-15, RT-04, KG-16) | `router.push("/profile/member-code")` (PR-04 có sẵn) |

---

## 3. Cấu trúc thư mục thêm mới

```
src/
├─ constants/returns.js               # RETURN_STATUS(+LABEL), RETURN_REASONS, INVALID_RETURN_CHOICE
├─ constants/withdrawal.js            # WITHDRAWAL_STATUS(+LABEL), FEE_PAYMENT_METHOD, DEGRADED_CHOICE, DEGRADED_STATUS
├─ features/returns/
│  ├─ api/ returnsApi.js · returnsApi.real.js · returnsApi.mock.js · queryKeys.js
│  ├─ utils/ returnRules.js           # canRequestReturn, returnStepOf, returnViewOf, buildReasonText
│  ├─ schemas.js                      # zod RT-01
│  ├─ components/ ReturnStatusTimeline.js · ReturnCard.js · ReasonPicker.js · RefundSummary.js · ReturnMockPanel.js (__DEV__)
│  └─ screens/ ReturnFormScreen.js · ReturnListScreen.js · ReturnDetailScreen.js · PickupChoiceScreen.js
├─ features/withdrawals/              # rút lại hàng ký gửi + hàng xuống cấp (cùng phía người ký gửi)
│  ├─ api/ withdrawalApi.js · .real.js · .mock.js · degradedApi.js · .real.js · .mock.js · queryKeys.js
│  ├─ utils/ withdrawalRules.js       # canWithdraw, freeWindowOf, estimateFee, splitFee
│  ├─ components/ FeeSplit.js (ví / MoMo) · WithdrawalTimeline.js · DegradedOptionCard.js · WithdrawalMockPanel.js (__DEV__)
│  └─ screens/ WithdrawalNewScreen.js · WithdrawalDetailScreen.js · DegradedCaseScreen.js
└─ app/(member)/
   ├─ returns/index.js  new.js  [id]/index.js  [id]/pickup-choice.js
   ├─ withdrawals/new.js  [id].js
   └─ degraded-cases/[id].js
```

Đặt rút hàng + hàng hỏng trong `features/withdrawals` vì cùng người dùng (người ký gửi) và cùng điểm vào (KG-09). Nếu thấy `features/consignment` hợp hơn thì để đó — **chọn một**, ghi vào CLAUDE.md.

---

## 4. Hằng số và quy tắc

### 4.1. `src/constants/returns.js`

Theo **DB** (ReturnRequest). [KIỂM TRA] với code BE.

```js
export const RETURN_STATUS = {
  PENDING: "PENDING",           // chờ kho duyệt
  APPROVED: "APPROVED",         // đã duyệt, có vận đơn trả — chờ Member bàn giao GHN
  SHIPPED_BACK: "SHIPPED_BACK", // đã bàn giao, hàng đang về kho
  INSPECTING: "INSPECTING",     // kho đang kiểm
  VALID: "VALID",               // hợp lệ → đã hoàn tiền
  INVALID: "INVALID",           // không hợp lệ → chọn cách nhận lại
  LOST: "LOST",                 // thất lạc khi về kho → vẫn hoàn tiền (F-136)
  CANCELLED: "CANCELLED",       // kho từ chối ngay / quá hạn bàn giao
};

export const RETURN_STATUS_LABEL = {
  PENDING: "Chờ kho duyệt",
  APPROVED: "Chờ bàn giao cho GHN",
  SHIPPED_BACK: "Đang gửi về kho",
  INSPECTING: "Kho đang kiểm tra",
  VALID: "Đã hoàn tiền",
  INVALID: "Không hợp lệ",
  LOST: "Thất lạc — đã hoàn tiền",
  CANCELLED: "Đã huỷ",
};

// Lý do theo RT-01 — chỉ ở app, ghép vào chuỗi reason (0.4 #5)
export const RETURN_REASONS = [
  { key: "NOT_AS_DESCRIBED", label: "Không đúng mô tả hoặc ảnh" },
  { key: "WORSE_CONDITION", label: "Tình trạng tệ hơn kết luận kiểm định" },
  { key: "DAMAGED_IN_TRANSIT", label: "Hỏng hoặc bẩn khi vận chuyển" },
  { key: "WRONG_ITEM", label: "Nhận sai món" },
];

export const INVALID_RETURN_CHOICE = { SHIP_BACK: "SHIP_BACK", WAREHOUSE_PICKUP: "WAREHOUSE_PICKUP" };

export const RETURN_LIMITS = { MIN_PHOTOS: 1, MAX_PHOTOS: 5 }; // theo RT-01 "tối thiểu 1 ảnh · 2/5"
```

`CANCELLED` có 2 nguồn (kho từ chối ở API 84 có lý do / quá hạn bàn giao F-069) → [CHỜ BE] field phân biệt (`cancelReason`), chưa có thì hiện chung "Yêu cầu đã huỷ" + lý do nếu có.

### 4.2. `src/constants/withdrawal.js`

```js
export const WITHDRAWAL_STATUS = { PENDING_PICKUP: "PENDING_PICKUP", COMPLETED: "COMPLETED", EXPIRED: "EXPIRED" };
export const WITHDRAWAL_STATUS_LABEL = {
  PENDING_PICKUP: "Chờ bạn đến kho", COMPLETED: "Đã bàn giao", EXPIRED: "Quá hạn — hàng đăng bán lại",
};
export const FEE_PAYMENT_METHOD = { WALLET: "WALLET", MOMO: "MOMO", MIXED: "MIXED" };

export const DEGRADED_CHOICE = { FULL_COMPENSATION: "FULL_COMPENSATION", PARTIAL_WITH_ITEM_BACK: "PARTIAL_WITH_ITEM_BACK" };
export const DEGRADED_STATUS = { PENDING_DECISION: "PENDING_DECISION", DECIDED: "DECIDED" }; // API 93/94 — [CHỜ BE] tên đủ
```

⚠️ DB `DegradedItemCase.choice` **NOT NULL** nhưng API 93 tạo ca ở `PENDING_DECISION` (chưa chọn) → hai tài liệu lệch [CHỜ BE] (mục 11 câu 12). **Entity BE `2c3b597` xác nhận:** `choice` `nullable = false` và bảng **không có cột `status`** (chỉ `product`, `returnRequest`, `choice`, `compensationAmount`, `moderator`, `createdAt`) → `DEGRADED_STATUS` hiện **chỉ có ở mock**.

### 4.3. `features/returns/utils/returnRules.js`

Mở rộng `orderRules.returnDeadlineOf` của Phase 4 — **không viết lại** mốc hạn.

```js
// RT-01 điều kiện mở: theo MỐC THỜI GIAN (ghi chú BR-11 Hoàn thành), không theo status
export const canRequestReturn = (order, now = dayjs()) =>
  ["DELIVERED", "COMPLETED"].includes(order.status) &&
  !order.returnRequestId &&                              // [CHỜ BE] field liên kết
  returnDeadlineOf(order)?.isAfter(now);

// Dòng thời gian RT-02: 0 Gửi · 1 Kho duyệt · 2 Bàn giao GHN · 3 Về kho, kiểm định · 4 Kết quả
export const returnStepOf = (r) => ({
  PENDING: 1, APPROVED: 2, SHIPPED_BACK: 3, INSPECTING: 3,
  VALID: 4, INVALID: 4, LOST: 4,
}[r.status] ?? -1); // CANCELLED → vẽ riêng

export const buildReasonText = (reasonKey, detail) =>
  `${RETURN_REASONS.find((r) => r.key === reasonKey)?.label}${detail?.trim() ? `: ${detail.trim()}` : ""}`;
```

`returnDeadlineOf` hiện lấy `days = 3` mặc định — đổi sang đọc cấu hình BE nếu có (mục 11 câu 3); vẫn giữ một chỗ duy nhất.

### 4.4. `features/withdrawals/utils/withdrawalRules.js`

```js
// KG-09 nút "Rút hàng về": chỉ khi món đang bán bình thường
export const canWithdraw = (product) =>
  getProductView(product) === PRODUCT_VIEW.SELLING && !product.activeWithdrawalId; // [CHỜ BE] field

// Cửa sổ miễn phí: termStartedAt + freeWithdrawalWindowDays (biên nhận)
export function freeWindowOf(product, receipt, now = dayjs()) {
  const end = dayjs(product.termStartedAt).add(receipt.freeWithdrawalWindowDays, "day");
  return { isFree: now.isBefore(end), endsAt: end, daysLeft: Math.max(0, end.diff(now, "day")) };
}

// Chỉ để XEM TRƯỚC — số phí thật là feeCharged BE trả ở API 90
export const estimateFee = (product, receipt) =>
  freeWindowOf(product, receipt).isFree ? 0 : receipt.withdrawalFee;

// Trừ ví trước, thiếu mới MoMo (0.4 #1)
export const splitFee = (fee, available) => {
  const fromWallet = Math.min(fee, Math.max(0, available));
  return { fromWallet, fromMomo: fee - fromWallet };
};
```

`getProductView` (Phase 2) thêm 2 giá trị: `WITHDRAWING` (có yêu cầu rút đang chờ đến kho) và `DEGRADED_DECISION` (có ca hàng hỏng chờ chọn) — vẫn **một hàm duy nhất**, mọi màn KG-08/09 tự đổi theo.

---

## 5. Lớp API

### 5.1. `src/config/env.js`

```js
export const MOCK = {
  // … Phase 1–4 giữ nguyên
  returns: true,      // Phase 5 — API 79–82
  withdrawals: true,  // Phase 5 — API 90–92, 94–95
};
```

### 5.2. Bảng API Phase 5 (theo API_CONTRACT — [KIỂM TRA] với code BE)

Base path dự kiến như Phase 3/4: không `/api`, có envelope.

| API | Method + path | Body / query | Trả về (contract) | Lỗi (contract) | BE thật |
|---|---|---|---|---|---|
| 79 | `POST /orders/{id}/return-requests` | `{reason, photoUrls[]}` | `{id, status:"PENDING", handoverDeadline}` | 400 thiếu lý do / ảnh · 404 · 409 `RETURN_WINDOW_EXPIRED` (**trong message**) | ❌ (`2c3b597`: chỉ có entity) |
| 80 | `GET /return-requests` · `GET /return-requests/{id}` | `status, page, size` | `{id, status, reason}` | 404 | ❌ |
| 81 | `POST /return-requests/{id}/handover` | — | `{id, status:"SHIPPED_BACK", ghnReturnTrackingCode}` | 404 · 409 quá hạn bàn giao | ❌ |
| 82 | `POST /return-requests/{id}/invalid-choice` | `{choice: SHIP_BACK \| WAREHOUSE_PICKUP}` | `{pickupDeadline}` | 404 · 409 chưa INVALID | ❌ |
| 90 | `POST /item-withdrawal-requests` | `{productId}` | `{id, feeCharged, status:"PENDING_PICKUP", pickupDeadline}` | 404 · 409 `PRODUCT_ALREADY_ORDERED` (**trong message**) | ❌ |
| 91 | `POST /item-withdrawal-requests/{id}/pay-fee` | `{paymentMethod: "MIXED"}` | đủ: `{id, feeCharged, status}` · thiếu: `{payUrl}` | 404 | ❌ |
| 92 | `GET /item-withdrawal-requests/{id}` | — | `{id, feeCharged, status, pickupDeadline}` | 404 | ❌ |
| 94 | `GET /degraded-item-cases/{id}` | — | `{id, compensationAmount, status}` | 403 · 404 | ❌ (bảng không có `status`) |
| 95 | `POST /degraded-item-cases/{id}/decide` | `{choice}` | `{id, choice, paidAmount}` | 404 · 409 đã quyết định | ❌ |
| 19 | (Phase 2) biên nhận | — | cần `freeWithdrawalWindowDays`, `withdrawalFee`, `degradedCompensationRate` | — | ✅ code `2c3b597`: **`GET /consignment-receipts/{id}`** (không `/api`) → `{id, receiptNo, agreedPrice, floorPrice, termLengthDays, maxRenewals, freeWithdrawalWindowDays, commissionRateTerm1..3, withdrawalFee, degradedCompensationRate, confirmedAt, pdfUrl}`; lỗi `CONSIGNMENT_RECEIPT_NOT_FOUND/FORBIDDEN` |
| 22 | (Phase 2) chi tiết sản phẩm của mình | — | cần `termStartedAt` (tính cửa sổ miễn phí) | — | ❌ |
| 63 | (Phase 4) chi tiết đơn | — | cần `returnRequestId`, `returnDeadline` | — | ⚠️ có API (`2c3b597`) nhưng **thiếu** 2 trường này; có `deliveredAt` để tự tính hạn |
| 73 | (Phase 4) ví | — | `availableBalance` để chia phí | — | ❌ (chỉ có 74 lịch sử) |

**Thiếu so với wireframe** (gom vào mục 11): API 80 thiếu `orderId/orderNo`, món, ảnh đã gửi, `createdAt`, mốc từng bước, `ghnReturnTrackingCode`, ca lấy hàng, `handoverDeadline`, kết luận kho (`resolutionNote`, ảnh kho chụp), số tiền đã hoàn, `pickupDeadline`, `invalidReturnChoice`, lý do huỷ; API 63 thiếu `returnRequestId`; API 92 thiếu thông tin món, kho, `createdAt`, `completedAt`, lịch sử trạng thái; API 94 thiếu món, ảnh hư hỏng, mô tả, hạn quyết định, tỷ lệ đền; không có API **liệt kê** yêu cầu rút / ca hàng hỏng của mình; không có API **xem trước phí** rút.

### 5.3. Tên hàm (real và mock giống hệt)

```
// returnsApi
createReturn(orderId, { reason, photoUrls })
getReturns({ status, page, size })
getReturn(id)
confirmHandover(id)
chooseInvalidReturn(id, choice)           // → { pickupDeadline, fee? }

// withdrawalApi
createWithdrawal(productId)               // → { id, feeCharged, status, pickupDeadline }
payWithdrawalFee(id)                      // → { paid: true, ... } | { payUrl }
getWithdrawal(id)
getMyWithdrawals()                        // [CHỜ BE] — mock có; real tạm suy từ sản phẩm (activeWithdrawalId)

// degradedApi
getDegradedCase(id)
decideDegradedCase(id, choice)            // → { choice, paidAmount }
getMyDegradedCases({ status })            // [CHỜ BE] — để hiện dải nhắc ở tab Ký gửi
```

### 5.4. Mock "sống", nối với kho mock Phase 4

Dùng chung kho RAM đơn + ví của Phase 4 (thêm `returns`, `withdrawals`, `degradedCases`):

- **Đơn mẫu bổ sung**: 1 đơn Đã giao **còn hạn trả** (chưa có yêu cầu), 1 đơn Hoàn thành **đã quá hạn trả** (để thấy RT-01-QuaHan).
- **Yêu cầu trả mẫu** đủ trạng thái: Chờ duyệt, Chờ bàn giao (có mã vận đơn, hạn bàn giao còn 2 ngày), Đang về kho, Đã hoàn tiền, Không hợp lệ (còn 6 ngày chọn), Thất lạc.
- `createReturn`: kiểm hạn (409 nếu quá), 1–5 ảnh, đơn đã có yêu cầu → 409; tạo `PENDING`, `handoverDeadline = now + 3 ngày` (lúc duyệt mới có thật, mock đặt sẵn).
- `confirmHandover`: chỉ `APPROVED` → `SHIPPED_BACK`.
- `chooseInvalidReturn`: chỉ `INVALID`; `WAREHOUSE_PICKUP` → `pickupDeadline = now + 7 ngày`.
- **Khung Mock** ở RT-02 (`__DEV__ && MOCK.returns`): "Kho duyệt" (→ APPROVED, sinh mã vận đơn), "Kho từ chối", "Hàng về kho" (→ INSPECTING), "Kết luận hợp lệ" (→ VALID + **giao dịch `REFUND` = tổng đơn** vào ví mock), "Kết luận không hợp lệ" (→ INVALID + `resolutionNote`), "Thất lạc" (→ LOST + `REFUND`), "Quá hạn bàn giao" (→ CANCELLED).
- `createWithdrawal`: sản phẩm `RESERVED` → 409; trong cửa sổ miễn phí → `feeCharged: 0`; ngoài → `withdrawalFee` của biên nhận mock. Sản phẩm mock chuyển sang view `WITHDRAWING`.
- `payWithdrawalFee`: ví đủ → trừ hết (giao dịch `WITHDRAWAL_FEE` âm); thiếu → trả `{ payUrl: null, needMomo: <thiếu> }` để màn chạy luồng MoMo mock (2 nút "MoMo thành công / thất bại"); thành công → trừ phần ví + ghi giao dịch.
- **Khung Mock** ở KG-15: "Kho bàn giao" (→ COMPLETED, sản phẩm `WITHDRAWN`), "Quá hạn" (→ EXPIRED, sản phẩm về `ON_SALE`).
- **Ca hàng hỏng mẫu**: 1 ca `PENDING_DECISION`, `compensationAmount: 442000`, tỷ lệ 0.5; `decideDegradedCase` → giao dịch `DEGRADED_COMPENSATION` (= đủ hoặc 50%) vào ví mock; `PARTIAL_WITH_ITEM_BACK` → sản phẩm view `PICKUP` (Chờ nhận lại, có từ Phase 2).
- Mỗi hàm `await sleep(400–800ms)`.

### 5.5. React Query

```js
export const returnKeys = {
  list: (status) => ["returns", "list", status ?? "ALL"],
  detail: (id) => ["returns", "detail", id],
};
export const withdrawalKeys = {
  detail: (id) => ["withdrawals", "detail", id],
  mine: ["withdrawals", "mine"],
  degraded: (id) => ["degraded", "detail", id],
  degradedMine: ["degraded", "mine"],
};
```

| Mutation | Làm mới |
|---|---|
| createReturn | `["returns"]`, `["orders","detail",orderId]`, `["orders","list"]` |
| confirmHandover / chooseInvalidReturn | `returns.detail(id)`, `["returns","list"]` |
| createWithdrawal / payWithdrawalFee | `["withdrawals"]`, `["consign","products"]`, `["consign","product",productId]`, `["products"]` (món rời sàn), `["wallet"]` |
| decideDegradedCase | `["degraded"]`, `["consign","products"]`, `["wallet"]` |

RT-02 và KG-15 đang ở trạng thái chờ người khác (kho / GHN): **không** tự hỏi lại liên tục — kéo tải lại + `refetchOnWindowFocus`/khi app quay lại `active` là đủ (khác VI-05 vì chờ tính bằng ngày, không phải giây).

---

## 6. Business rules áp dụng trên app

| Quy tắc | Nguồn | App làm gì |
|---|---|---|
| Gửi yêu cầu trả trong **3 ngày kể từ khi giao** (theo mốc thời gian, kể cả khi đơn đã Hoàn thành) | F-067, mục 11, ghi chú BR-11 | `canRequestReturn`; đếm ngược ở RT-01; quá hạn → RT-01-QuaHan |
| Bắt buộc **lý do + ít nhất 1 ảnh** | API 79 | zod; nút gửi vẫn bấm được, lỗi dưới từng ô |
| Không bàn giao GHN trong **3 ngày** sau khi duyệt → tự huỷ, **không gửi lại** được | F-069, RT-02 | Đếm "Còn 2 ngày 14 giờ" theo `handoverDeadline`; câu cảnh báo |
| Hợp lệ → hoàn **toàn bộ tiền đơn** (tiền hàng + ship gốc) vào **ví** | F-041, mục 7, RT-02-DaHoanTien | Hiện số tiền BE trả + "Xem ví" |
| Không hợp lệ → **không hoàn tiền**, món vẫn là của người mua; chọn gửi lại (tự trả phí) hoặc đến kho lấy trong **7 ngày**; quá hạn → hàng vô chủ | F-070, F-071, mục 11 | RT-04; hạn từ `pickupDeadline` |
| Hàng trả **thất lạc** → vẫn hoàn tiền người mua | F-136 | Trạng thái LOST = hoàn tiền |
| Nghi hàng giả → 2 Moderator; kết luận giả → hoàn tiền, huỷ hàng, **không phạt người bán** | F-134, F-135 | Người mua chỉ thấy VALID / hoàn tiền; người bán thấy sản phẩm kết thúc (`DESTROYED`) |
| Trả không hợp lệ **vẫn tính bán thành công** (không hoàn hoa hồng) | mục 8, plan Phase 5 | Phía người bán không có giao dịch bị trừ lại |
| Rút hàng **7 ngày đầu mỗi kỳ miễn phí**, sau đó mất `withdrawalFee` (snapshot biên nhận) | F-032, biên nhận | `freeWindowOf` xem trước; số thật `feeCharged` |
| Phí rút: **trừ ví trước, thiếu thì MoMo** | mục 7, L-06, API 91 | `splitFee`; 0.4 #1 |
| Sản phẩm **đã có đơn** → không rút được | L-06, API 90 | Ẩn nút khi `HAS_ORDER`; 409 → tải lại |
| Rút hàng: đến kho trong **7 ngày**; quá hạn → huỷ, **đăng bán lại**, kỳ tiếp tục, **không hoàn phí** | F-034, F-035 | KG-15; 0.4 #2 |
| Hàng hỏng: chọn **đền đủ** (hàng thuộc nền tảng) hoặc **nhận lại + đền `degradedCompensationRate`** (mặc định 50%, không mất phí rút); tiền vào ví **ngay** | F-036, F-162, API 95 | KG-16; tỷ lệ lấy từ biên nhận |

---

## 7. Spec từng màn hình

Chung: loading, `ErrorBox` + "Thử lại", kéo tải lại, lỗi mạng, 403/404 → `EmptyState`. Thời gian còn lại dạng "Còn 2 ngày 7 giờ" (dùng chung một hàm format, dùng lại nếu Phase 4 đã có cho "Tự hoàn thành sau …").

### Lối vào

- **BR-11 (Phase 4) Đã giao / Hoàn thành:** `canRequestReturn` → nút **Trả hàng** (secondary, cạnh "Xác nhận đã nhận hàng" / "Đánh giá dịch vụ") + dòng "Còn n ngày để yêu cầu trả hàng (hạn dd/MM)". Đơn đã có yêu cầu → `ListItem` "Yêu cầu trả hàng · <nhãn trạng thái>" → `returns/[id]`. Hết hạn → ẩn nút (không hiện nút mờ).
- **BR-10 (Phase 4):** thẻ đơn có yêu cầu trả → thêm nhãn nhỏ "Đang trả hàng".
- **PR-01:** dòng **Yêu cầu trả hàng** (đang "Sắp có" → bật) → `returns`; badge số yêu cầu cần Member làm (APPROVED chờ bàn giao + INVALID chờ chọn).
- **KG-09 (Phase 2) Đang bán:** nút **Rút hàng về** (đang ẩn → bật theo `canWithdraw`) + dòng nhỏ dưới nút: "Miễn phí — còn n ngày" hoặc "Phí <withdrawalFee>" (`freeWindowOf`). Khối "cửa sổ rút miễn phí" của wireframe KG-09 (Phase 2 đã ẩn) → bật lại.
- **KG-08/09 trạng thái mới** (qua `getProductView`): `WITHDRAWING` → "Chờ bạn đến kho lấy · còn n ngày" → bấm mở `withdrawals/[id]`; `DEGRADED_DECISION` → nhãn "BỊ HỎNG" + "Cần bạn chọn cách đền" → `degraded-cases/[id]`.
- **Tab Ký gửi:** có ca hàng hỏng chờ chọn → dải nhắc đầu tab "1 món của bạn bị hỏng khi trả về kho — chọn cách đền" (0.4 #13).

### RT-01 · Gửi yêu cầu trả hàng (`returns/new.js?orderId=`)

- Dải đầu: "Đơn <mã> · giao dd/MM HH:mm" + **"Còn 2 ngày 7 giờ"** (đếm theo `returnDeadlineOf`).
- **Món trong đơn** (chỉ xem, 0.4 #3): ảnh, tên, "Thương hiệu · Size · Tình trạng", giá. Chữ nhỏ: "Yêu cầu trả áp dụng cho cả đơn."
- **Lý do trả hàng**: `RadioCard` (hoặc radio danh sách) theo `RETURN_REASONS` + ô **Mô tả cụ thể** (`TextField multiline`, placeholder "Mô tả cụ thể chỗ không đúng…").
- **Ảnh chứng minh · bắt buộc**: `PhotoPicker` 1–5 ảnh (chụp / thư viện), chữ "Bằng chứng của bạn nếu kho kết luận khác" + "n / 5 ảnh · tối thiểu 1 ảnh".
- **Địa chỉ shipper tới lấy** (0.4 #4): thẻ chỉ đọc = địa chỉ giao của đơn; chữ nhỏ "Shipper GHN tới địa chỉ này. Cần đổi địa chỉ thì liên hệ kho sau khi gửi."
- NoteBox: "Sau khi kho duyệt, bạn có 3 ngày để giao hàng cho shipper. Hoàn tiền vào ví ReHome khi kho kiểm tra hàng về hợp lệ."
- Footer cố định **Gửi yêu cầu trả hàng** (loading suốt quá trình): upload ảnh (`uploadFile`) → `createReturn(orderId, { reason: buildReasonText(...), photoUrls })` → toast → `router.replace("/returns/<id>")`.
  - 409 quá hạn → chuyển trạng thái Quá hạn. 409 đã có yêu cầu → tải lại đơn, mở yêu cầu đó. 400 → lỗi dưới ô.
- Thoát khi đã nhập → "Bỏ yêu cầu đang soạn?".
- **Quá hạn (RT-01-QuaHan)** — vào màn khi đã quá hạn, hoặc hạn hết khi đang điền: khối "Đã quá hạn yêu cầu trả hàng. Đơn <mã> giao thành công ngày dd/MM. Cửa sổ trả hàng là 3 ngày kể từ lúc giao, đã hết từ dd/MM." + bảng mốc (Giao thành công · Hết hạn trả hàng · Hôm nay) + món mờ. Không có nút gửi (0.4 #11).

Schema (`features/returns/schemas.js`, zod 4):

```js
export const returnSchema = z.object({
  reasonKey: z.enum(RETURN_REASONS.map((r) => r.key), { error: "Chọn lý do trả hàng" }),
  detail: z.string().trim().min(10, "Mô tả cụ thể ít nhất 10 ký tự").max(500), // [GIẢ ĐỊNH]
  photos: z.array(z.string())
    .min(RETURN_LIMITS.MIN_PHOTOS, "Cần ít nhất 1 ảnh chứng minh")
    .max(RETURN_LIMITS.MAX_PHOTOS, `Tối đa ${RETURN_LIMITS.MAX_PHOTOS} ảnh`),
});
```

### Danh sách yêu cầu trả hàng (`returns/index.js`)

- Chip: Tất cả · Cần bạn làm (APPROVED, INVALID) · Đang xử lý (PENDING, SHIPPED_BACK, INSPECTING) · Xong (VALID, INVALID đã chọn, LOST, CANCELLED) — lọc như BR-10 (mảng trạng thái, [CHỜ BE] lọc nhiều).
- `ReturnCard`: mã (nếu có) · "Đơn <mã>" · món đầu · nhãn trạng thái · dòng việc cần làm ("Giao cho shipper trước dd/MM", "Chọn cách nhận lại · còn n ngày").
- Rỗng: "Chưa có yêu cầu trả hàng nào."

### RT-02 · Chi tiết yêu cầu trả (`returns/[id]/index.js`)

Phần chung: header = mã hoặc "Yêu cầu trả hàng"; dòng "Gửi dd/MM HH:mm" + nhãn; `ReturnStatusTimeline` 5 bước theo `returnStepOf` (Đã gửi yêu cầu · Kho duyệt · Bàn giao GHN · Hàng về kho, kiểm định · Kết quả) — mốc nào BE có thời gian thì ghi; **Món trả**; **Lý do bạn đã gửi** (chữ + ảnh, bấm ảnh xem to); "Xem đơn hàng" → `orders/[orderId]`.

- **Chờ kho duyệt (PENDING):** bước 2 "Đang xử lý · thường trong 1 ngày làm việc"; thẻ địa chỉ lấy hàng (chỉ đọc). Không nút (0.4 #6).
- **Chờ bàn giao (APPROVED):** dải "Kho đã duyệt dd/MM HH:mm · **Còn 2 ngày 14 giờ**" (theo `handoverDeadline`); khối lớn "Shipper GHN sẽ đến lấy hàng" + Ca lấy hàng (nếu có) + **Mã vận đơn** (Sao chép); thẻ địa chỉ "ĐÃ KHOÁ"; **Đóng gói trước khi shipper tới** 3 ý (giữ nguyên tem SKU · dùng lại túi/thùng đơn gốc · shipper mang phiếu tới); khối cảnh báo "Nếu quá dd/MM HH:mm chưa bàn giao được: yêu cầu tự huỷ, đơn trở lại bình thường, hàng vẫn là của bạn. Không bị phạt, nhưng không gửi lại yêu cầu được." Footer **Tôi đã giao hàng cho shipper** (0.4 #7) → `Alert` xác nhận → `confirmHandover` → toast. 409 (quá hạn) → tải lại.
- **Đang gửi về kho (SHIPPED_BACK) / Kho đang kiểm tra (INSPECTING):** mã vận đơn trả; "Kho sẽ kiểm tra khi hàng về, thường trong 1–2 ngày làm việc."
- **Đã hoàn tiền (VALID):** khối "Kho xác nhận yêu cầu hợp lệ" + Tiền hàng · Phí vận chuyển đơn gốc · Phí trả hàng "kho chịu" · **Đã hoàn vào ví** (số BE trả, [CHỜ BE] field); thẻ "Số dư ví hiện tại" + nút **Xem ví** (→ `wallet`) — wireframe ghi "Rút tiền", dùng "Xem ví" để Member thấy giao dịch hoàn tiền trước [GIẢ ĐỊNH].
- **Không hợp lệ (INVALID):** khối "Kho không chấp nhận yêu cầu trả. Không hoàn tiền, món vẫn thuộc về bạn." · **Kết luận kiểm định của kho** (`resolutionNote`, ảnh kho chụp nếu có) · khối nhắc "Món này đang ở kho, cần bạn chọn cách nhận. Còn 6 ngày 13 giờ." · Footer **Chọn cách nhận lại hàng** → `pickup-choice`. Đã chọn rồi → hiện lựa chọn + hạn ("Đến Kho … trước dd/MM" + nút **Mã Member của tôi**). ("Khiếu nại kết luận" ẩn — 0.1.)
- **Thất lạc (LOST):** "Hàng trả bị thất lạc trên đường về kho. ReHome vẫn hoàn tiền cho bạn." + số tiền + Xem ví.
- **Đã huỷ (CANCELLED):** lý do (kho từ chối kèm lý do / quá hạn bàn giao); "Đơn trở lại bình thường."
- Khung Mock ở cuối màn (mục 5.4).

### RT-04 · Chọn cách nhận lại hàng (`returns/[id]/pickup-choice.js`)

- Dải: "<mã> · không hợp lệ · **Còn 6 ngày 13 giờ**". Thẻ món: tên · "đang ở Kho …".
- "Bạn muốn nhận lại bằng cách nào? Món này vẫn là của bạn. Kho không giữ hộ quá 7 ngày."
- 2 `RadioCard` trong cột:
  - **Đến kho lấy** — "Miễn phí. Mang mã Member tới quầy." + kho, địa chỉ, giờ mở cửa (nếu có).
  - **Kho gửi lại cho bạn** — "Giao về địa chỉ cũ trong 2–3 ngày. Bạn trả phí vận chuyển." + Phí gửi lại (BE trả); chưa có API trả phí → mờ + "Sắp có" (0.4 #8).
- Khối hậu quả: "Nếu hết hạn mà bạn không chọn: món thành hàng vô chủ và kho xử lý theo quy định. Bạn mất quyền với món này."
- Footer: **Xác nhận đến kho lấy** / **Xác nhận gửi lại · trả <phí>** → `Alert` → `chooseInvalidReturn` → về RT-02 (hiện lựa chọn + hạn + nút Mã Member).
- Gửi lại có phí: trả theo cùng cách phí rút hàng (`splitFee` → ví, thiếu MoMo) khi BE có API.

### KG-13 / KG-14 · Rút lại hàng (`withdrawals/new.js?productId=`)

Dữ liệu: sản phẩm (API 22) + biên nhận (API 19, lấy `freeWithdrawalWindowDays`, `withdrawalFee`) + ví (API 73). Thẻ món: tên · "Thương hiệu · Size · giá" · "SKU · Kho".

- **Miễn phí (KG-13-MienPhi):** dải "Rút hàng miễn phí — Bạn đang ở ngày 4 của cửa sổ 7 ngày đầu kỳ 2, còn 3 ngày rút không mất phí." · **Sau khi gửi yêu cầu** 4 bước (Sản phẩm gỡ khỏi sàn ngay · Đến Kho … trong 7 ngày · Đọc mã Member tại quầy · Biên nhận ký gửi kết thúc) · khối "Nếu quá 7 ngày không đến nhận: yêu cầu bị huỷ, sản phẩm đăng bán lại và kỳ ký gửi tiếp tục như cũ." · Footer **Gửi yêu cầu rút hàng** → `Alert` → `createWithdrawal` → `router.replace("/withdrawals/<id>")`.
- **Có phí (KG-13-CoPhi):** dải "Rút hàng mất phí <phí> — Bạn đang ở ngày 12 của kỳ 2, đã qua cửa sổ 7 ngày rút miễn phí." · `FeeSplit` (0.4 #1): "Trừ ví <fromWallet> · Thanh toán MoMo <fromMomo>" kèm "Số dư khả dụng <…>" · khối **Có thể chờ để khỏi mất phí** (chỉ khi còn kỳ sau): "Kỳ <n+1> bắt đầu dd/MM (còn n ngày), bạn sẽ có <freeWithdrawalWindowDays> ngày rút miễn phí. Nhưng sang kỳ <n+1> hoa hồng tăng lên <rate>% nếu món bán được trong lúc chờ." · khối **Phí không hoàn lại** "Quá 7 ngày không đến nhận: yêu cầu bị huỷ, sản phẩm đăng bán lại và phí không được hoàn." · Footer **Trả <phí> và gửi yêu cầu**:
  1. `createWithdrawal(productId)` → nhận `feeCharged` thật (khác số xem trước → cập nhật màn, hỏi lại).
  2. `feeCharged = 0` → sang KG-15.
  3. `feeCharged > 0` → `payWithdrawalFee(id)`: đủ ví → sang KG-15; còn thiếu → trạng thái **Thanh toán phần còn lại qua MoMo**.
- **Ví không đủ (KG-14-KhongDu, đã sửa theo 0.4 #1):** "Số dư ví <a> · Phí rút hàng <phí> · Trừ ví <a> · Còn lại qua MoMo <phí − a>" · Footer **Thanh toán <phí − a> qua MoMo** (cùng luồng `openAuthSessionAsync` của Phase 3; mock dùng 2 nút).
- **MoMo thất bại (KG-14-ThatBai):** "Giao dịch <số> không hoàn tất. Ví của bạn chưa bị trừ tiền." [CHỜ BE xác nhận: MIXED thất bại thì phần ví có được trả lại không] · **Quay lại** · **Thử lại**.
- 409 sản phẩm đã có đơn → `Alert` "Món này vừa có người đặt mua, không rút được nữa." → quay lại KG-09 (tải lại).
- Bỏ dở sau bước 1 (đã tạo yêu cầu nhưng chưa trả phí): [CHỜ BE] trạng thái của yêu cầu chưa trả phí — mock coi là chưa có hiệu lực, KG-09 hiện "Chưa trả phí rút hàng · Tiếp tục".

### KG-15 · Yêu cầu rút hàng (`withdrawals/[id].js`)

- Thẻ món (tên, SKU · Kho).
- **Chờ đến kho (PENDING_PICKUP):** khối "**Còn 5 ngày để đến kho.** Hạn cuối dd/MM/YYYY. Sản phẩm đã gỡ khỏi sàn, không ai mua được." · `WithdrawalTimeline` (mới nhất ở trên: Chờ bạn đến kho · Sản phẩm gỡ khỏi sàn · Đã gửi yêu cầu rút hàng) · NoteBox "Đến quầy đọc mã Member để Moderator đối chiếu rồi bàn giao. Quá hạn không đến: yêu cầu tự huỷ, sản phẩm đăng bán lại, kỳ ký gửi tiếp tục, **phí đã trả không được hoàn**." (0.4 #2) · Footer **Mã Member của tôi** (Huỷ yêu cầu ẩn — 0.4 #6) + "Chỉ đường" (như KG-04).
- **Đã bàn giao (COMPLETED):** "Bạn đã nhận lại hàng tại Kho … Biên nhận ký gửi kết thúc." + dòng thời gian + NoteBox "Muốn bán lại thì tạo form ký gửi mới — kỳ và hoa hồng tính lại từ đầu." · Footer **Về Hàng ký gửi**.
- **Hết hạn (EXPIRED):** "Đã quá hạn — hàng đăng bán lại. Yêu cầu bị huỷ tự động, sản phẩm đã quay lại sàn và kỳ ký gửi tiếp tục như cũ." · Footer **Xem sản phẩm đang bán** → `my-products/[productId]`.
- Phí đã trả (nếu > 0): dòng "Phí rút hàng <số> · đã trả <ví/MoMo>".
- Khung Mock ở cuối màn.

### KG-16 · Hàng của bạn bị hỏng (`degraded-cases/[id].js`)

- Dải: "<tên món> · <SKU>" + **"Còn n ngày"** (nếu BE có hạn — 0.4 #9).
- Khối giải thích: "Món bị hỏng khi vận chuyển về kho" + mô tả BE trả + "Không phải lỗi của bạn." · **Ảnh kho chụp khi nhận lại** (nếu có).
- "Bạn muốn ReHome xử lý thế nào? Kho đền vì lỗi nằm ở khâu vận chuyển do kho sắp xếp."
- 2 `DegradedOptionCard` (RadioCard):
  - **Nhận tiền đền** — "Món thuộc về kho, bạn không phải tới lấy." · **Cộng vào ví <compensationAmount>**.
  - **Nhận lại hàng kèm đền một phần** — "Đến kho lấy trong <n> ngày. Món vẫn hỏng như ảnh trên. Không mất phí rút hàng." · **Cộng vào ví · <rate>% <compensationAmount × rate>** (làm tròn xuống đồng).
- Khối mặc định: "Nếu bạn không chọn trong <n> ngày, hệ thống mặc định nhận tiền đền." (chỉ khi BE xác nhận — 0.4 #9).
- Footer **Xác nhận nhận <số tiền>** (đổi theo lựa chọn) → `Alert` → `decideDegradedCase` → toast "Đã cộng <paidAmount> vào ví" → trạng thái **Đã chọn**: số tiền đã nhận (`paidAmount`), nút **Xem ví**; nhận lại hàng → thêm "Đến Kho … trước dd/MM" + **Mã Member của tôi**.
- 409 (đã chọn trước đó, vd hệ thống tự chọn) → tải lại, hiện trạng thái Đã chọn.

---

## 8. Tự kiểm tra trước khi push

Chạy trên Android thật, mock.

**Trả hàng**
- [x] BR-11 Đã giao còn hạn → có nút Trả hàng + "Còn n ngày"; đơn quá hạn (khung Mock rút ngắn hạn) → nút biến mất; đơn đã có yêu cầu → dòng mở RT-02.
- [x] RT-01: bỏ trống hết bấm gửi → lỗi lý do / mô tả / ảnh; 6 ảnh bị chặn; gửi xong sang RT-02 Chờ duyệt; danh sách + PR-01 badge cập nhật.
- [x] RT-01 mở khi đã quá hạn → màn Quá hạn, không có nút gửi.
- [x] RT-02 qua khung Mock: Chờ duyệt → Chờ bàn giao (mã vận đơn sao chép được, đếm ngược) → bấm "Tôi đã giao hàng cho shipper" → Đang về kho → Kết luận hợp lệ → **ví có giao dịch Hoàn tiền đúng tổng đơn**.
- [ ] (nhánh 2) Kết luận không hợp lệ → RT-04 → Đến kho lấy → RT-02 hiện hạn + nút Mã Member. Gửi lại: mờ / có phí tuỳ mock.
- [x] Thất lạc → hoàn tiền; Quá hạn bàn giao → Đã huỷ.

**Rút hàng**
- [ ] KG-09 Đang bán trong 7 ngày đầu kỳ → nút Rút hàng về "Miễn phí — còn n ngày"; ngoài cửa sổ → "Phí 50.000 đ"; Đã có đơn / Chờ cuối kỳ → không có nút.
- [ ] Miễn phí → gửi → KG-15 Chờ đến kho; món biến khỏi sàn (BR-01); KG-08 hiện "Chờ bạn đến kho lấy".
- [ ] Có phí, ví đủ → trừ ví, ví có giao dịch "Phí rút lại hàng".
- [ ] Có phí, ví thiếu → hiện chia "Trừ ví … · MoMo …" → Mock MoMo thất bại → ví chưa bị trừ, Thử lại được → Mock thành công → KG-15.
- [ ] Khung Mock: Kho bàn giao → Đã bàn giao; Quá hạn → Hết hạn, món quay lại sàn, phí không hoàn.

**Hàng hỏng**
- [ ] Tab Ký gửi có dải nhắc; KG-08/09 nhãn "BỊ HỎNG".
- [ ] KG-16: đổi lựa chọn → số tiền nút đổi; xác nhận → ví có giao dịch "Đền bù hàng xuống cấp" đúng số; chọn nhận lại hàng → có hạn + Mã Member; mở lại → chỉ đọc.

---

## 9. Commit, push, Pull Request

Như các phase trước. Gợi ý commit nhánh đầu:

```
feat(returns): add return constants, rules and mock linked to order/wallet mock
feat(returns): return request form with photos and expired state (RT-01)
feat(returns): return detail with status timeline and handover (RT-02)
feat(orders): enable return button on order detail within return window
feat(account): enable "Return requests" entry on account tab
```

Mô tả PR: Đã làm · Đang dùng mock (`MOCK.returns`, `MOCK.withdrawals`) · Lệch wireframe (bảng 0.4) · Cách test (khung Mock) · Ảnh chụp.

---

## 10. Cập nhật các phase trước khi làm Phase 5

- **Phase 2:** `getProductView` thêm `WITHDRAWING`, `DEGRADED_DECISION`; KG-09 bật nút Rút hàng về và khối cửa sổ miễn phí; dải nhắc ở tab Ký gửi. Ghi lại vào PHASE2_GUIDE 0.4 (bỏ dòng "Ẩn: Rút hàng (Phase 5)").
- **Phase 4:** BR-11 bật Trả hàng (theo `canRequestReturn`), PR-01 bật "Yêu cầu trả hàng"; `WALLET_TX_LABEL` đã có `WITHDRAWAL_FEE`, `DEGRADED_COMPENSATION` — kiểm hiển thị đúng ở VI-01/VI-02.
- **Phase 3:** BE `2c3b597` đã lưu **bản chụp** địa chỉ trong đơn (`shippingRecipientName`, `shippingPhone`, `shippingAddressDetail`) → NoteBox BR-06 "đơn đã đặt giữ nguyên địa chỉ lúc đặt" nay **đúng**, giữ nguyên; RT-01 hiển thị địa chỉ từ 3 trường này. BE còn chặn xoá địa chỉ đã dùng cho đơn: 409 `ADDRESS_IN_USE` → BR-06 xử lý mã này (toast "Địa chỉ đã dùng cho đơn hàng, không xoá được") ở nhánh nối API thật (đã hỏi BE có cần chặn nữa không khi đã có bản chụp).
- **CLAUDE.md:** thêm route Phase 5, `MOCK.returns/withdrawals`, dòng tiến độ Phase 5.

---

## 11. Cần hỏi (gom gửi backend / lead)

**Backend (Tài — API 79–95)**

1. **Mã lỗi** đang nằm trong message (`RETURN_WINDOW_EXPIRED: …`, `PRODUCT_ALREADY_ORDERED: …`) → xin đưa vào field `code` (cùng câu 1 PHASE4_GUIDE).
2. Bao giờ có API **79–82, 90–92, 94–95** và **`/uploads`** (ảnh chứng minh trả hàng bắt buộc)?
3. **Hạn trả hàng** tính từ `deliveredAt` + cấu hình (3 ngày) — có trả sẵn `returnDeadline` trong API 63 không? API 63 trả thêm **`returnRequestId`** (và trạng thái) để BR-11 biết đơn đã có yêu cầu. *(`2c3b597`: API 63 đã có, có `deliveredAt` nhưng **chưa có** 2 trường này — cũng chưa có `paymentDeadline`.)*
4. **Trả từng món** hay cả đơn? Bảng ReturnRequest chỉ có `order_id` — wireframe RT-01 chọn từng món (0.4 #3).
5. **Địa chỉ lấy hàng trả**: dùng địa chỉ giao của đơn? Có cho đổi không (wireframe RT-01/RT-02)? Lưu ý `Order.shippingAddress` là khoá ngoại, Member sửa / xoá địa chỉ sau khi đặt thì sao?
6. **API 80** trả thêm: `orderId`, `orderNo`, món, ảnh đã gửi, `createdAt`, `approvedAt`, `handedOverAt`, `inspectedAt`, `resolvedAt`, `handoverDeadline`, `ghnReturnTrackingCode`, ca lấy hàng, `resolutionNote` + ảnh kho chụp, `refundAmount` (+ phần tiền hàng / phí ship), `invalidReturnChoice`, `pickupDeadline`, lý do huỷ (kho từ chối / quá hạn bàn giao), mã hiển thị (YC-…). Lọc nhiều trạng thái một lần? *(Entity `2c3b597` chỉ có `createdAt`, `resolvedAt`, `handoverDeadline`, `pickupDeadline`, `ghnReturnTrackingCode`, `resolutionNote`, `invalidReturnChoice` — **thiếu** các mốc duyệt / bàn giao / kiểm, `refundAmount`, lý do huỷ, mã hiển thị.)*
7. **Huỷ yêu cầu trả** khi kho chưa duyệt (RT-02 có nút) — có API không?
8. **API 81 bàn giao**: Member bấm, hay BE tự đổi khi GHN báo đã lấy hàng (webhook)? Ca lấy hàng có trả về không?
9. **Gửi lại hàng trả không hợp lệ (SHIP_BACK)**: phí bao nhiêu, trả bằng gì (ví trước / MoMo), API nào? API 82 hiện chỉ trả `pickupDeadline`. Không chọn trong 7 ngày → trạng thái gì?
10. **Rút hàng (API 90/91):** có API **xem trước phí** (miễn phí / số phí / ngày hết cửa sổ) trước khi tạo yêu cầu không? Yêu cầu tạo xong mà **chưa trả phí** thì ở trạng thái gì, sản phẩm đã gỡ khỏi sàn chưa, bỏ dở thì sao? `MIXED` mà MoMo thất bại thì phần đã trừ ví có hoàn lại không? MoMo cho phí dùng endpoint nào (hiện `/api/momo/create` chỉ nhận `orderId`)? *(Entity `ItemWithdrawalRequest` `2c3b597`: `ItemWithdrawalStatus` chỉ có `PENDING_PICKUP / COMPLETED / EXPIRED` — **không có** trạng thái "chưa trả phí".)*
11. **Huỷ yêu cầu rút** (KG-15 có nút) — có API không? Quá hạn rút: phí **có hoàn** không (wireframe KG-15 và KG-13 nói ngược nhau — 0.4 #2)?
12. **Hàng xuống cấp:** DB `DegradedItemCase.choice` **NOT NULL** nhưng API 93 tạo ca ở `PENDING_DECISION` (chưa chọn) — BE theo bên nào? (Entity `2c3b597` vẫn NOT NULL và **không có cột `status`**.) Có **hạn quyết định** và **mặc định khi không chọn** (wireframe: 7 ngày, mặc định đền đủ) không? Chọn nhận lại hàng thì **hạn đến kho** bao lâu (wireframe 30 ngày), đến lấy qua API nào (bàn giao tại quầy `ITEM_WITHDRAWAL`)?
13. **Liệt kê của mình:** `GET /item-withdrawal-requests` (mine) và `GET /degraded-item-cases?status=PENDING_DECISION` (mine) — để KG-08/09 và tab Ký gửi biết món nào đang rút / bị hỏng. Hoặc API 21/22 trả kèm `activeWithdrawalId`, `degradedCaseId`.
14. **API 94** trả thêm: tên món, SKU, ảnh hư hỏng, mô tả, `degradedCompensationRate`, `decisionDeadline`, `choice`, `paidAmount`, `decidedAt`.
15. Hoàn tiền trả hàng (VALID / LOST / hàng giả) có giao dịch `REFUND` với `relatedOrderId` để VI-02 mở được đơn? Đền bù có `DEGRADED_COMPENSATION` kèm sản phẩm?
16. Người ký gửi có được biết món bị **trả về** không (không bị trừ tiền theo mục 8, nhưng sản phẩm đổi trạng thái)? Sản phẩm sau khi trả hợp lệ quay lại `ON_SALE` (RELIST) có hiện lại ở KG-08 không?

**Lead**

17. Phí rút hàng: **trừ ví trước, thiếu thì MoMo** (theo tài liệu tổng quan) thay cho KG-13/14 — đồng ý sửa wireframe? (0.4 #1)
18. Quá hạn rút hàng: phí **không hoàn** — sửa câu ở KG-15? (0.4 #2)
19. Trả **cả đơn** (không chọn từng món) cho tới khi BE có bảng món trả — đồng ý? (0.4 #3)
20. RT-02 thêm nút "Tôi đã giao hàng cho shipper" — đồng ý? (0.4 #7)
21. KG-16: hạn chọn 7 ngày, mặc định đền đủ, hạn nhận lại 30 ngày — có giữ không (tài liệu tổng quan không ghi)? (0.4 #9)
22. Thêm dải nhắc "món bị hỏng" ở tab Ký gửi — đồng ý? (0.4 #13)
