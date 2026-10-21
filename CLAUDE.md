# CLAUDE.md — ReHome Mobile

## Cách làm việc với người phát triển

- Người phát triển **tự viết code**. Claude ưu tiên giải thích, hướng dẫn từng bước, review và chỉ ra lỗi.
- **Chỉ tạo/sửa/xoá file khi được yêu cầu rõ ràng** cho đúng việc đó. Không tự refactor, không tự thêm tính năng ngoài yêu cầu.
- Trả lời bằng tiếng Việt; giữ nguyên tên biến, hàm, API, field theo code.
- Phân biệt rõ: điều tài liệu yêu cầu · điều code đang làm · **[GIẢ ĐỊNH]** · điều chưa xác định. Không đoán endpoint, tên field, enum hay mã lỗi.
- Không sửa backend, database, web. Không đưa secret/token vào code hay tài liệu.

## Dự án

ReHome: nền tảng **ký gửi** quần áo cũ có kiểm định tại kho, mua bán (tiền đi qua ví), thử đồ AI, và cộng đồng quyên góp cho tổ chức từ thiện đã xác minh. Đồ án tốt nghiệp FPT (FA26SE043). Bảo vệ từ 28/11/2026.

- **Mobile (repo này):** Guest, Member (mua + ký gửi + quyên góp, một ví) và **Organization** (chiến dịch, bài viết, chat). Demo trên Android.
- **Web (repo `rehome-frontend`):** Moderator (nhân viên kho) và Admin.
- **Backend:** Spring Boot modular monolith + PostgreSQL, JWT, Google OAuth2. Repo `re-backend`, code ở `../rehome-backend` (nhánh develop).
  - Swagger: https://re-backend-9a98.onrender.com/swagger-ui/index.html (JSON: `/v3/api-docs`).
  - **Code theo thứ đang chạy thật** (Swagger + code BE), không theo `docs/API_CONTRACT.md` khi hai bên lệch. Mọi URL, tên field, cách bóc response chỉ nằm trong `features/*/api/*.real.js` và `lib/api`, để BE đổi thì chỉ sửa ở đó.
  - Server chạy trên Render: request đầu tiên có thể chậm vài chục giây vì server đang ngủ.
  - Realtime chat/thông báo qua STOMP/WebSocket (theo web).

**Nguồn sự thật (theo thứ tự):**

1. _Tài liệu tổng quan hệ thống (sau Review 1)_: UC-01…90, F-001…162, luồng L-01…L-11, tham số mục 11.
2. _Kế hoạch triển khai code_ (13/10).
3. _Thiết kế Database_ (45 bảng).
4. Wireframe của lead (canvas "ReHome — Wireframe toàn hệ thống", mã màn AU-/PR-/OA-/BR-/KG-…).
5. `docs/API_CONTRACT.md`: hợp đồng API do BE viết (base `/api/v1`, mọi lỗi bọc envelope). **Chưa qua review, chưa khớp code; lệch thì ưu tiên code thật** (mục "API backend đang chạy thật" bên dưới).

Bản "mô hình cửa hàng/Shop, PayOS" (bản 5, 07/10) và mô hình C2C tháng 9 đã **bỏ**.

## Stack và quy ước code

- **Nền tảng:** Expo SDK 58, **JavaScript** (không TypeScript), expo-router (thư mục `src/app`).
- **Thư viện:** axios · @tanstack/react-query · zustand · react-hook-form + zod · expo-secure-store · jwt-decode · dayjs · expo-image-picker · expo-document-picker · @react-native-community/datetimepicker (đều chạy trong Expo Go) · **@react-native-google-signin/google-signin + expo-dev-client** (chỉ chạy trong **dev build**, không chạy trong Expo Go).
- **Chạy app:** Expo Go (`npx expo start`) vẫn dùng được cho mọi màn trừ Google; **dev build** (`npx expo start --dev-client`, mở app "ReHome" đã cài từ APK) dùng được tất cả. Đổi cấu hình native (thêm thư viện native, plugin, quyền trong `app.json`) → phải **build lại** dev APK (`eas build --profile development --platform android`, ~20 phút, link tải APK giữ 13 ngày).
- **EAS:** tài khoản Expo cá nhân `tranthimyhanh`, project `rehome-mobile`; `eas.json` profile `development` = dev client + `distribution: internal` + `buildType: apk`; keystore lưu trên máy chủ Expo (xem SHA-1: `eas credentials -p android` → development; **không** tạo/xoá keystore). Package Android **`com.rehome.mobile`** (lead chốt 17/10).
- **Cài thư viện:** có native → `npx expo install`; thuần JS → `npm install`.
- **Cấu trúc:**
  - `src/app` chỉ khai báo route, file mỏng.
  - Logic và giao diện ở `src/features/<feature>/{api,screens,components,schemas.js}`.
  - Còn lại: `components/ui` dùng chung · `lib/api` (client, errors) · `lib/storage` · `stores` · `config` · `constants` · `theme` · `hooks` (custom hook dùng chung, vd `useCountdown`) · `utils` (`validators.js`, `format.js` — `formatPhone`, `toast.js` — `showToast`).
  - Component chỉ dùng trong một nghiệp vụ: `features/<feature>/components` (vd `profile/components/MemberQr.js`).
  - Route đang có: `(auth)/login · register · verify-email · forgot-password · reset-password`; `(auth)/org-register/info · representative · documents · location · review · submitted`; `(member)/(tabs)/index (Mua sắm) · community · consign · account`; `(member)/settings`; `(member)/profile/index · edit · member-code · change-password`; **ký gửi (Phase 2):** `(member)/consign-forms/new · [id]/index · [id]/edit`, `(member)/receipts/[id]`, `(member)/my-products/[id]/index · reduce-price · end-of-term · reconsign` (không tạo thư mục `consign/` vì trùng URL tab `/consign`).
  - Nghiệp vụ ký gửi: `features/consignment/{api, hooks, utils/photos.js, components, screens, schemas.js, receiptTerms.js}`; danh mục/thương hiệu dùng chung ở `features/catalog/`. Chi tiết: `docs/PHASE2_GUIDE.md` mục 3.
  - Nghiệp vụ tổ chức: `features/organization/{api, screens, components, store/orgRegisterStore.js, utils/{files, summary, payload}.js, constants.js, schemas.js}`.
- **Gọi API:** màn hình không gọi axios trực tiếp, chỉ gọi `features/*/api/*Api.js` qua useQuery/useMutation.
  - API BE đã có → **gọi thật** (`*.real.js`). Chỉ nhóm BE chưa có/chưa dùng được mới có `*.mock.js` cùng hình dạng dữ liệu, bật bằng `MOCK` trong `src/config/env.js` (hiện: `password: false`, `upload: true`, `organization: true`, `consignment: true`). `authApi.js` = `...real` + ghi đè các hàm nhóm mock; `profileApi.js` (`updateMe`) chỉ có real; `organizationApi.js` (`registerOrganization`), `consignmentApi.js`, `catalogApi.js` hiện **chỉ có mock** — BE xong thì thêm `*.real.js` cùng tên hàm. **Upload dùng chung một hàm** `uploadFile` ở `src/lib/api/upload.js` (mock trả lại `uri` để ảnh vẫn hiện). Mock giữ dữ liệu trong RAM (reload app là về dữ liệu mẫu); hàm chỉ để demo đặt tên `mock…` và gọi sau điều kiện `__DEV__ && MOCK.<nhóm>`.
  - Đọc dữ liệu: `useQuery` (vd PR-02 `queryKey: ["me"]`, `initialData` từ store + `initialDataUpdatedAt: 0` để vẫn tải lại). Ghi xong thì cập nhật cả store (`setUser`) và cache (`queryClient.setQueryData`).
  - Phiên đăng nhập: `authStore.signIn(tokens)` tự lưu token + gọi `getMe()`; lỗi thì xoá token. Màn hình chỉ gọi `signIn(await authApi.login(values))`.
  - Form: react-hook-form + `Controller` + `zodResolver`; schema ở `features/*/schemas.js`; regex dùng chung ở `utils/validators.js`. Lỗi server: so theo `status`/`code` (`ERROR_CODES` ở `constants/errorCodes.js`), **không so chữ trong message**.
- **Lỗi:** chuẩn hoá thành `ApiError { status, code, message, fieldErrors, reason }` (`toApiError`): `code` = `data.code` của BE, không có thì `HTTP_<status>`. `status 0` = lỗi mạng/timeout. `reason` = lý do khoá (BE chưa trả).
- **Component UI có sẵn** (`components/ui`): `Screen` (`header`, `footer` cố định đáy, `scroll`, `scrollRef`, `padded={false}` khi tự dùng `ScrollView`/`FlatList` có kéo tải lại, `edges` — màn trong tab dùng `["top"]`), `AppHeader` (`onBack`, `right` tuỳ chọn), `Button` (primary/secondary/text, `loading`, `disabled`), `TextField` (`secure`, `helper`, `error`, `multiline`, `suffix`), `MoneyField` (number, ô trống = `undefined`, chữ "đ" cuối ô), `SelectField` (bottom sheet, `searchable` tìm không dấu), `StatusTimeline` (dòng thời gian dọc, `state` done/active/todo), `DateField` / `TimeField` (picker hệ thống, giá trị `"YYYY-MM-DD"` / `"HH:mm"`; chỉ làm Android), `OtpInput`, `PasswordChecklist` (`currentPassword` tuỳ chọn), `RadioCard` (mặc định `flex: 1`; trong cột truyền `style={{ flex: 0 }}`), `Checkbox`, `ChipGroup` (`multiple`), `Stepper`, `NoteBox` (chỉ tự bọc `<Text>` khi children là chuỗi thuần; chữ trộn `<Text>` in đậm thì tự bọc cả khối trong một `<Text>`), `Divider`, `ErrorBox`, `EmptyState`, `BootSplash`, `Avatar` (chưa có ảnh → chữ cái đầu; `initialOf="last"` tên người, `"first"` tên tổ chức), `ListItem` (`badge`, `disabled`, `muted` = mờ nhưng bấm được, `danger`) + `ListGroup` (khung bo góc, tự kẻ giữa các dòng). Icon: `@expo/vector-icons` (Ionicons). Xác nhận: `Alert.alert` (nút `destructive`). Thông báo ngắn: `showToast`.
- **Điều hướng an toàn:** nút ← dùng `router.canGoBack() ? router.back() : router.replace(...)`. Link nằm giữa câu: `Text` lồng `Text onPress` (tránh Android cắt chữ khi dùng `Pressable` trong hàng ngang).
- **Token:** lưu trong expo-secure-store. Token hết hạn thì refresh một lần, thất bại thì đăng xuất. Tạm thời coi **401 hoặc 403 body rỗng** là token hết hạn [CHỜ BE trả 401]. Bất kỳ API nào (trừ login/google) trả `code: ACCOUNT_BANNED` → đăng xuất ngay, giữ lý do ở `authStore.sessionError` (AU-02 hiện).
- **Điều hướng:** `Stack.Protected` ở `src/app/_layout.js` theo vai.
  - Nhóm `(member)`: Guest + Member.
  - Nhóm `(auth)`: chưa đăng nhập.
  - Nhóm `(org-status)`: tổ chức PENDING/REJECTED.
  - Nhóm `(org)`: tổ chức VERIFIED.
- **Giao diện:** không viết mã màu/cỡ chữ trong màn hình, lấy từ `@/theme`.
  - Màu, font, bo góc, khoảng cách: theo `docs/design-tokens.md` (nạp sẵn ở cuối file này). Lỗi `#D92D20`.
  - Font Be Vietnam Pro: trên Android chọn độ đậm bằng `fontFamily`, không bằng `fontWeight`.
- **Chữ trên giao diện:** tiếng Việt có dấu; tiền dạng `1.000.000 đ`; SĐT 10 số `/^0\d{9}$/`; mật khẩu ≥ 8 ký tự, có chữ và số.
- **Enum/trạng thái:** khai báo trong `src/constants`, không viết chuỗi rải rác.
- **Biến môi trường:** chỉ dùng `EXPO_PUBLIC_*` (bị nhúng vào app, không chứa secret), đọc qua `src/config/env.js` (`ENV`). Hiện có: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_USE_MOCK`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (Web client ID của BE — không phải secret nhưng vẫn chỉ để trong `.env`, không ghi vào code/tài liệu). `.env` không commit; `.env.example` giữ tên biến, để trống giá trị. Đổi `.env` → `npx expo start --clear`.
- **Git:**
  - **Mỗi việc một nhánh tạo từ `develop`** (`feature/<việc>`, `fix/<việc>`) → push → PR vào **`develop`** (lead đồng ý 17/10) → merge. Không code thẳng trên `develop`; nhánh đã merge thì không làm tiếp trên đó. `develop` → `main` chỉ khi ổn định (trước demo/bảo vệ, gắn tag).
  - Commit kiểu `feat: / fix: / chore: / docs: / refactor:`. **Trước khi commit đọc kỹ `git status`**: không có `.env`, không có file đuôi lạ (đã 2 lần commit nhầm `.j` thay `.js` → máy khác pull về lỗi "Unable to resolve module"); dòng `MM` = bản sửa mới chưa `git add`.
  - Đã merge vào `develop`: PR #2, #3 (`feature/phase1-auth`, sửa `.j` + Avatar thiếu `box`), #4 (`feature/consign-form` — gộp luôn `feature/google-login`), #5 (`feature/consign-receipt`), #6 (`feature/consign-products`), #7 (`feature/consign-end-of-term`).
  - **Mô tả PR dán TRƯỚC khi merge** (mẫu: Đã làm · Đang dùng mock · Lệch wireframe · Cách test · Ảnh chụp). Merge xong vẫn sửa được mô tả (⋯ → Edit).
  - Lệnh `git merge` mở Vim → `Esc`, gõ `:wq`, Enter (hoặc dùng `--no-edit`). `git diff` dài vào chế độ trang (`:`) → `q` để thoát; dùng `git --no-pager diff --staged --stat` để xem nhanh.
  - Sửa component dùng chung (`components/ui`) → mở lại **mọi màn** dùng nó trước khi commit.

## Business rules hay dùng (Tài liệu tổng quan, mục 7, 8, 11)

- Mỗi Member đúng 1 ví. Số dư khả dụng = số dư − tiền đang khóa.
- Rút tiền: tối thiểu 10.000 đ, tối đa 3 lần/ngày, không cần người duyệt.
- **Ký gửi:**
  - Tối đa 5 form chờ; mang đồ đến kho trong 7 ngày sau khi duyệt.
  - Kỳ 30 ngày × tối đa 3 kỳ. Hoa hồng 10/15/20% theo kỳ, **chốt lúc đặt đơn**.
  - Giá sàn 50% giá chốt; chỉ được giảm giá, 1 lần/ngày.
  - 7 ngày đầu mỗi kỳ rút hàng miễn phí; cuối kỳ có 30 ngày để chọn xử lý.
- **Đơn hàng:**
  - Thanh toán trong 15 phút, trả trọn bằng **ví hoặc MoMo** (không trộn).
  - Phí rút hàng: trừ ví trước, thiếu thì MoMo.
  - Tự hoàn thành sau 3 ngày kể từ khi giao; yêu cầu trả hàng trong 3 ngày.
- **Thử đồ AI:** mở từ trang sản phẩm; outfit = **Áo + Quần, hoặc Đầm**. Ảnh trả về < 120 giây, xử lý bất đồng bộ.
- **Tổ chức:** đăng nhập bằng **email + mật khẩu** (wireframe ghi SĐT người đại diện, nhưng login chỉ nhận email). **1 email = 1 tài khoản**: email đã là Member thì BE từ chối 409. Chưa xác minh chỉ thấy màn trạng thái hồ sơ; một địa điểm nhận đồ.
- **Đăng ký tổ chức — "tạo account trước" (chốt với BE 17/10, BE đang làm):**
  1. AU-03 chọn "Tổ chức" → email + mật khẩu → OTP xác thực email (dùng lại AU-04) → đăng nhập (role ORGANIZATION, chưa có hồ sơ).
  2. Đã đăng nhập → điền 4 bước → `POST /api/organizations/me/registration` (cần token) → hồ sơ PENDING gắn vào account. **F002.**
  3. Bị từ chối → sửa / bổ sung → `PUT` **cùng đường dẫn** (chỉ khi REJECTED, sai trạng thái 403) → PENDING. **F003** — dùng chung body/DTO với F002.
  4. Điều hướng theo `role` + `verificationStatus` từ login / `/me`: chưa nộp → 4 bước; PENDING/REJECTED → `(org-status)`; VERIFIED → `(org)`. **F005.**
  - Lý do: email xác thực trước; upload (CCCD — dữ liệu nhạy cảm) **bắt buộc đăng nhập**; F002/F003/F005 dùng một bộ API. Code OA hiện tại (mật khẩu ở bước 2, gửi khi chưa đăng nhập, mock) sẽ sửa theo — danh sách ở mục "Đang chờ xác nhận".
- **Giấy tờ tổ chức:** JPG/PNG/PDF, ≤ 5 MB/tệp; 2 ảnh CCCD + 1–8 giấy tờ pháp lý (tối đa 10, tối thiểu 3 tệp). Gợi ý giấy tờ theo loại hình chỉ là gợi ý, không khoá nút.
- **Email chưa xác thực:** **không đăng nhập được** (theo L-01 và BE). App chỉ có 2 trạng thái: Guest và Member đã xác thực.

## Quyết định đã chốt (ngoài tài liệu)

- **Wireframe là tham khảo** (người phát triển chốt 17/10): chỗ nào thực tế các app (Shopee, Grab, MoMo, ngân hàng; Material/HIG) làm tốt hơn thì làm theo thực tế, giải thích lý do và ghi chỗ lệch vào guide cho lead xem.
- Đặt lại mật khẩu bằng **OTP 6 số qua email**, **gọi thật** qua `resend-otp` (purpose `FORGOT_PASSWORD`) → `verify-otp` → `password/reset` (không dùng `/password/forgot` vì gửi link web). [CHỜ BE xác nhận cách dùng này]
- Mã Member (PR-04): **QR + mã chữ** cỡ lớn, nút Sao chép, tự tăng độ sáng (`expo-brightness`) khi mở màn. QR tạm chứa đúng `memberCode` (component `MemberQr`) vì API 25 `/counter/lookup` (API_CONTRACT) có `qrPayload` [CHỜ BE định dạng `qrPayload`] [CHỜ LEAD xác nhận giữ QR — wireframe 11/10 ghi bỏ].
- API nào backend có thì gọi thật, chưa có thì mock. **Không mock auth** (đã bỏ tài khoản mock `member@`, `banned@`…); test bằng tài khoản thật trên server Render (mẹo Gmail `ten+test1@gmail.com` để tạo nhiều email nhận chung hộp thư).
  - **Phase 1 gọi thật:** đăng ký, verify-otp, resend-otp, đăng nhập email, refresh, logout, đổi mật khẩu (AU-07), quên / đặt lại mật khẩu (AU-05/06), `GET/PATCH /members/me`. (Mã Member lấy từ `user.memberCode`, không gọi `GET /members/me/code`.)
  - **Phase 1 mock / chưa làm:** upload ảnh đại diện (bấm → Toast "sắp có"), toàn bộ đăng ký và trạng thái tổ chức. Đăng nhập Google: **chạy thật từ 19/10** (dev build).
- **Thanh tab Member: 4 tab** Mua sắm · Cộng đồng · Ký gửi · Cá nhân (theo BR-01; PR-01 vẽ 5 tab có "Thử đồ" nhưng thử đồ mở từ trang sản phẩm) [CHỜ LEAD]. Icon rỗng/đặc theo trạng thái; khai báo bằng mảng `TABS`. Tab Mua sắm (Phase 3) và Ký gửi (Phase 2) đã có màn; Cộng đồng vẫn `EmptyState` "Sắp có".
- **PR-01 Tab Cá nhân:** thẻ đầu (Avatar, tên, mã) → PR-02; "Mã Member của tôi" → PR-04; "Địa chỉ giao hàng" → `/addresses` (bật 19/10, Phase 3); nhóm "Sắp có" (đơn hàng, ký gửi, trả hàng, ảnh thử đồ, tổ chức theo dõi, tin nhắn) **mờ nhưng bấm được → Toast**; Đăng xuất đỏ, **hỏi xác nhận**; thẻ ví (Phase 4) **ẩn**; nút ⚙ → màn **Cài đặt** (Hồ sơ cá nhân, Đổi mật khẩu, Phiên bản). Bản khách: thẻ mời Đăng nhập / Tạo tài khoản. Không hiện "tham gia MM/YYYY" (chưa có `createdAt`).
- **PR-02 / PR-03:** **ẩn Ngày sinh, Giới tính** (DB chưa có cột) và khối "Hoạt động trên ReHome" (phase sau); dòng thông tin kiểu nhãn trên / giá trị dưới; SĐT hiển thị `0912 345 678`. PR-03: email chỉ đọc (nền xám), bỏ "Đổi email"; nút **Lưu mờ khi chưa sửa** (`isDirty`); Huỷ/← khi đã sửa → hỏi "Bỏ thay đổi?"; lưu xong Toast + về PR-02; trùng SĐT (BE trả 500) → lỗi dưới ô SĐT.
- Đổi mật khẩu xong: **chủ động đăng xuất**, hiện "Đổi mật khẩu thành công, mời đăng nhập lại" (BE thu hồi refresh token của mọi thiết bị, kể cả máy đang dùng).
- Bỏ nút "Xác thực email" ở PR-02 (không còn Member chưa xác thực trong app).
- Lỗi đăng nhập xử lý theo `code`: `EMAIL_NOT_VERIFIED` → tự `resend-otp` rồi sang AU-04 (`reason: "unverified"`); `ACCOUNT_BANNED` → khung lỗi, ở lại AU-02; 401 → message BE **dưới ô Mật khẩu**. Chi tiết: `docs/PHASE1_GUIDE.md` mục AU-02.
- Role: lấy từ `account` trong response login khi BE thêm; tạm thời giải mã JWT (claim `roles`) bằng `jwt-decode`.
- Mã Member hiển thị **đúng chuỗi BE trả** (dạng `MB000001`, không có gạch), không tự định dạng.
- **Theo wireframe, có điều chỉnh** (đã chốt 16/10, theo thông lệ Material/HIG):
  - Label ô nhập **viết kiểu câu** ("Email \*"), không viết hoa toàn bộ như wireframe.
  - Nút chính **cố định ở đáy** (`Screen footer`) ở AU-03 → AU-07; AU-02 để nút trong nội dung như wireframe.
  - Nút **chỉ khoá (mờ)** ở màn OTP (tới khi đủ 6 số); form khác nút luôn bấm được, bấm thì zod báo lỗi dưới từng ô.
  - AU-02: label "Email" (không "hoặc số điện thoại"); không đếm "còn 3 lần thử"; **ẩn khung ghi chú tổ chức** [CHỜ LEAD/BE].
  - AU-04: "Mã có hiệu lực **5 phút**" (wireframe 10); lỗi mã hiện nguyên message BE (BE không phân biệt sai/hết hạn); **ẩn ghi chú ③**.
  - AU-05/06: dùng **OTP** thay link (đổi chữ "Gửi liên kết" → "Gửi mã", AU-06 thêm `OtpInput`, bỏ màn "Liên kết không còn dùng được").
  - AU-07: lỗi sai mật khẩu cũ (`WRONG_PASSWORD`) hiện dưới ô "Mật khẩu hiện tại"; đổi xong đăng xuất (wireframe ghi "thiết bị này giữ nguyên" — chờ BE chốt).
- **Đăng nhập Google (code xong 17/10, ✅ chạy thật 19/10 trên dev build sau khi BE sửa `GOOGLE_CLIENT_ID` + nhận nhiều client ID; đã bỏ log debug — PR #15):**
  - `src/features/auth/google.js`: `require` thư viện **chỉ khi không phải Expo Go** (`Constants.executionEnvironment !== "storeClient"`) → Expo Go không crash; `GOOGLE_AVAILABLE`; `getGoogleIdToken()` = `configure({ webClientId })` → `hasPlayServices` → `signOut()` (luôn cho chọn tài khoản) → `signIn()` → `idToken` (huỷ → `null`, lỗi → `Error` tiếng Việt).
  - AU-02: nút "Đăng nhập bằng Google" → `getGoogleIdToken` → `authApi.loginWithGoogle({ idToken })` → `signIn(tokens)` (giống email). Expo Go → `Alert` "Cần bản cài đặt ReHome (dev build)". Lỗi BE (`ACCOUNT_BANNED`, `GOOGLE_ACCOUNT_CONFLICT`, mạng) → khung lỗi.
  - `DEVELOPER_ERROR` khi chọn tài khoản = chưa có / sai OAuth client Android (package + SHA-1) hoặc client ID không cùng project.
- **Ký gửi phía Member (Phase 2, KG-01 → KG-12, xong UI 18/10, chạy mock):** quyết định và chỗ lệch wireframe ở `docs/PHASE2_GUIDE.md` mục 0.4 (#1–#18). Điểm chính:
  - Tab Ký gửi 2 mục Form · Sản phẩm (gộp KG-01, KG-08). Bản khách: thẻ mời đăng nhập; màn chi tiết Guest mở thẳng → `Redirect /login`.
  - Mọi số nghiệp vụ (số ngày một kỳ, số kỳ, % hoa hồng, giá sàn) **lấy từ biên nhận / sản phẩm**, không viết cứng 10/15/20%, 30/90 ngày.
  - Trạng thái hiển thị sản phẩm qua **một hàm** `getProductView` (`utils/consignment.js`): SELLING · HAS_ORDER · AWAITING_DECISION · REPRICING · PICKUP (Chờ nhận lại, mobile tự thêm) · ENDED. BE chốt cách báo "chờ cuối kỳ" thì chỉ sửa hàm này.
  - Form nhập: một `useForm` cho 2 bước (KG-02/03); ô dùng chung `ConsignFormFields` (Tạo + Sửa); tiền là **number**, ô trống = `undefined`; `SelectField` (bottom sheet, tìm không dấu), `MoneyField` (`suffix` "đ").
  - Hoa hồng "đã chốt" khi có đơn dùng `order.lockedCommissionRate` (chốt lúc đặt đơn), không dùng kỳ hiện tại.
  - Ẩn: Huỷ form, Rút hàng (Phase 5), Theo dõi đơn (Phase 3), Nhắn cho kho, Từ chối giá / đổi ý (chưa có API), Thuế khấu trừ.
  - ⚠️ Điều 4–7, 9, 10 của biên nhận đang là bản tóm tắt **[GIẢ ĐỊNH]** (`receiptTerms.js`) — thay bằng nguyên văn mục 12 trước demo.
- **Đăng ký tổ chức (OA, chốt 17/10, chạy mock — sẽ sửa theo hướng "tạo account trước" ở trên):**
  - 4 bước (`Stepper`): Tổ chức · Đại diện · Giấy tờ · Nhận đồ → **Xem lại** (OA-05, tự thiết kế) → **Đã gửi / chờ xác minh** (OA-06 bản PENDING). Dữ liệu ở `orgRegisterStore` (chỉ trong RAM); bước 2–4 **tự lưu nháp** khi gõ (`watch` subscription) nên vuốt Back không mất; mỗi bước tự `Redirect` về bước 1 nếu thiếu dữ liệu bước trước.
  - Bước 1: loại hình, phạm vi **không chọn sẵn**; MST không bắt buộc (10 số hoặc 10-3); SĐT liên hệ nhận cả số bàn 11 số. Bấm ← khi đã nhập → hỏi "Thoát đăng ký tổ chức?" (thoát = xoá store).
  - Bước 2: thêm khối **"Tài khoản đăng nhập"** (email bước 1 chỉ đọc + "Sửa", mật khẩu + nhập lại + `PasswordChecklist`). SĐT người đại diện là số di động 10 số, dùng để xác minh, **không** dùng đăng nhập.
  - Bước 3: ảnh CCCD chọn **Chụp ảnh / Chọn từ thư viện** (có hướng dẫn chụp), họ tên trên thẻ **điền sẵn** từ bước 2, số CCCD 12 số; giấy tờ pháp lý dạng danh sách (`useFieldArray`, `LegalDocCard`) — chip gợi ý theo loại hình + tự nhập; kiểm định dạng/dung lượng **ngay khi chọn tệp**.
  - Bước 4: tích sẵn "Nhận đồ tại địa chỉ trụ sở" (lưu cờ `useOfficeAddress`, không copy địa chỉ); thêm **tên điểm nhận** (BE bắt buộc, điền sẵn tên hiển thị) và **SĐT điểm nhận** (điền sẵn SĐT liên hệ); ngày không chọn sẵn; giờ điền sẵn 08:00–17:00. **Bản đồ ghim để sau**, gửi `latitude/longitude: null` [GIẢ ĐỊNH].
  - Xem lại: 4 khối có "Sửa" (`router.dismissTo` về đúng bước); ô **cam đoan** bắt buộc; Gửi = upload song song mọi tệp → `registerOrganization`. Lỗi 409 (email/MST trùng) hiện `ErrorBox` + gợi ý sửa. Mock: email chứa `used` → trùng email; MST `0000000000` → trùng MST.
  - Gửi xong: `dismissAll` + `replace` sang `submitted` (Back Android / "Về trang chủ" → `dismissTo("/")`; vào màn là `reset()` store). Bản **Bị từ chối**, làm mới trạng thái, nhóm `(org-status)` / `(org)`: chờ tổ chức đăng nhập được [CHỜ BE].
  - Body gửi BE ghép ở `utils/payload.js` (`buildRegisterPayload`); field BE chưa nhận đánh dấu [GIẢ ĐỊNH]: `password`, `representative.phone/email/cccdName/cccdIssueDate/cccdIssuePlace`.
- Luồng AU-03 → AU-04: đăng ký xong `router.push` sang `/verify-email` (để "Quay lại sửa" được); xác thực xong `router.dismissTo("/login", { email, verified: "1" })` → AU-02 điền sẵn email + báo thành công.

## API backend đang chạy thật (Swagger + code `develop`; đọc 16/10 tại `c62dca4`, đọc lại 18/10 tại `1852963`, 19/10 xem nhanh `2af9d85`: 401/403 mới, Google nhiều client ID, login trả `role`, API kho gần nhất `/warehouses/**` (MEMBER), tổ chức sửa thêm — **chưa đọc kỹ phần tổ chức / kho**)

- **Base path:** auth và tổ chức có `/api` (`/api/auth/...`, `/api/organizations/...`); member, sản phẩm, địa chỉ **không có `/api`** (`/members/...`, `/products/...`, `/addresses`). `/api/v1` trong `API_CONTRACT.md` chưa áp dụng.
- **Envelope khi thành công:** `{ result, statusCode, message, isSuccess }`. **Từ `2af9d85` (18/10 tối) mọi nhóm đều bọc, kể cả `/api/auth`** (login, google, refresh, OTP, register, logout, đổi / đặt lại mật khẩu) và `/api/organizations`. Bóc bằng `res.data?.result ?? res.data` → mobile không phải sửa (mọi hàm `authApi.real` đều dùng `unwrap`).
- **Lỗi: 2 dạng** (cả hai đều có `message`; chưa có `fieldErrors`):
  - Dạng A `{ timestamp, status, error, message, path }` — **không có `code`**: OTP (400, 429), validate (400), sai email/mật khẩu (401 "Sai email hoặc password"), email trùng (409), gửi mail lỗi (503), 500.
  - Dạng B `{ result: null, isSuccess: false, statusCode, code?, message }` — lỗi qua `AppException` **có `code`** (`enum ErrorCode`, từ 16/10): `ACCOUNT_BANNED` (403), `EMAIL_NOT_VERIFIED` (403), `WRONG_PASSWORD` (400), `PASSWORD_CONFIRM_MISMATCH` (400), `PASSWORD_NOT_SET` (400), `NEW_PASSWORD_SAME_AS_OLD` (400), `GOOGLE_ACCOUNT_CONFLICT` (409). Các lỗi 400/403/404/409 khác dạng B không có `code`.
  - Lỗi validate gộp một chuỗi: `"email: email không hợp lệ; password: ..."` (**đã kiểm tra thật 16/10**).
- **Auth:**
  - `POST /api/auth/register` `{email, password, fullName, phone, role}` → 201 `{message}`. **Từ `2af9d85` có thêm `role` (`MEMBER` | `ORGANIZATION`) và BE lấy thẳng `request.getRole()`** → không gửi `role` thì account bị `role = null` → lỗi DB (cột NOT NULL) → **đăng ký Member hỏng** cho tới khi mobile gửi `role: "MEMBER"` hoặc BE mặc định MEMBER. ⚠️ BE chưa chặn `role: "ADMIN"/"MODERATOR"` từ API công khai (đã báo). BE vẫn tạo `MemberProfile` cho cả account tổ chức. BE gửi OTP **qua Brevo REST API** (Render chặn SMTP) trước khi trả kết quả → có thể chậm; gửi lỗi → 503 và **rollback** (không tạo tài khoản). **Đã chạy thật trong app 16/10.** Mail có thể tới chậm 1–2 phút; Gmail gộp các mail OTP vào cùng một cuộc hội thoại.
  - `POST /api/auth/verify-otp` `{email, otp, purpose: REGISTER|FORGOT_PASSWORD}` → `{message}`; với FORGOT_PASSWORD trả thêm `resetToken`. Xác thực REGISTER **không trả token**.
  - `POST /api/auth/resend-otp` `{email, purpose}` → `{message}`, luôn trả như nhau dù email có tồn tại hay không.
  - `POST /api/auth/login` `{email, password}` → `{accessToken, refreshToken, tokenType, role}` (từ `2af9d85` có `role`; mobile vẫn đọc role từ JWT, chưa cần đổi).
  - `POST /api/auth/refresh` `{refreshToken}` → cặp token mới; refresh token **xoay vòng** (token cũ hết dùng).
  - `POST /api/auth/logout`: cần header `Authorization`, trả 200 envelope (trước 204).
  - `POST /api/auth/google` `{idToken}` → như login.
  - `POST /api/auth/password/forgot` `{email}` → 204 nhưng **gửi link web (`localhost:5500`), không gửi OTP** → mobile **không dùng**. Thay vào đó `resend-otp` với `purpose: FORGOT_PASSWORD` gửi mail "ReHome - Mã OTP đặt lại mật khẩu" (mẫu mail BE có sẵn) → `verify-otp` (FORGOT_PASSWORD) trả `resetToken`. **Đã chạy thật 17/10.**
  - `POST /api/auth/password/reset` `{email, resetToken, newPassword, confirmPassword}`.
  - `POST /api/auth/password/change` `{oldPassword, newPassword, newPasswordRepeat}` → 200, body là **chuỗi** "Đổi mật khẩu thành công". Lỗi 400 dạng B có `code`: `PASSWORD_CONFIRM_MISMATCH` · `WRONG_PASSWORD` ("Mật khẩu cũ không đúng.") · `NEW_PASSWORD_SAME_AS_OLD` · `PASSWORD_NOT_SET` (tài khoản Google). Thu hồi refresh token **mọi thiết bị**. Nằm dưới `/api/auth/**` (public) → token hết hạn thì 500 và `client.js` không tự refresh (gọi `getMe()` trước để chắc token còn hạn). DTO không có `@NotBlank` (thiếu field → 500).
- **Member:**
  - `GET /members/me` → `result: {accountId, email, phone, fullName, avatarUrl, memberCode, emailVerified}`. Không có `createdAt`. `memberCode` dạng `MB000001`. **Đã chạy thật 16/10.**
  - `PATCH /members/me` `{fullName, phone, avatarUrl}`: ô trống = giữ nguyên. Response thiếu `email`, `memberCode` → lưu xong gọi lại `GET /members/me`.
  - `GET /members/me/code` → `result: {memberCode}`.
- **Địa chỉ giao hàng** (Phase 3, **đã chạy thật trong app 19/10**): `GET /addresses`, `POST /addresses` `{recipientName, phone, addressDetail, isDefault}`, **`PUT /addresses/{id}`** (body như POST), **`DELETE /addresses/{id}`** → có envelope, không có `/api`, chỉ role MEMBER. `isDefault: true` → BE tự bỏ mặc định ở địa chỉ khác. POST trả `{id, recipientName, isDefault}`, PUT trả `{id, phone}` (thiếu trường → tải lại danh sách). BE **không** giới hạn 5, **không** chặn xoá mặc định, **không** tự đặt mặc định cho địa chỉ đầu tiên → app tự làm.
- **Mua hàng** (Phase 3, có từ 18/10, **đã đọc kỹ 19/10** — bảng đầy đủ + chỗ lệch contract: `docs/PHASE3_GUIDE.md` mục 5.2, 5.2b): `GET /products?search&categoryId&brandId&priceMin&priceMax&warehouseId&page&size` (public, chỉ ON_SALE, mới lên sàn trước; id lọc là **UUID**; `condition` = chữ tự do; tìm theo tên có phân biệt dấu) · `GET /cart`, `POST /cart/items`, `DELETE /cart/items/{id}` · `POST /orders` (có `productIds` thì **không xoá khỏi giỏ**; không có thì lấy cả giỏ, 1 món hết hàng → 409 cả lần; phí ship 25.000 đ, hạn thanh toán 15 phút). **Chưa có:** `GET /products/{id}`, checkout-preview, thanh toán, xem đơn, danh mục/thương hiệu (API 44).
  - **20/10 `2bfc66c` (code `develop`, Render CHƯA deploy):** BE làm đủ 5 điểm mobile xin: `GET /products/{id}` (public; `photos` là **mảng chuỗi URL**, `inspectionDate`, `warehouseId/Name`, `status` mọi trạng thái; **thiếu `categoryId`**; `description` đang trùng `condition`) · `POST /orders` có `productIds` thì BE **tự xoá** các món đó khỏi giỏ · địa chỉ: tối đa 5 (409 `MAX_ADDRESSES_REACHED`), địa chỉ đầu tự mặc định, chặn xoá mặc định khi còn địa chỉ khác (409 `DEFAULT_ADDRESS_DELETE_BLOCKED`), POST/PUT trả đủ địa chỉ · giỏ có `brandName`, `condition` · 409 có `code`: `PRODUCT_NOT_AVAILABLE`, `ALREADY_IN_CART`. Mobile áp dụng ở nhánh 3b `feature/shop-real-api` (đổi format `photos`, `inspectionDate`, thêm mã lỗi, bỏ tự xoá giỏ sau khi đặt).
  - **`8c1a6b5` (Render ĐÃ deploy — Swagger có `/api/momo/*`, `/consignment-forms`, `/products/{id}`):** `GET /products` trên Render **vẫn 0 sản phẩm** → 3b vẫn chờ. Mới:
    - **MoMo (F-056):** `POST /api/momo/create?orderId=&redirectUrl=` (MEMBER, **một đơn mỗi lần**; `redirectUrl` bỏ trống → `MOMO_RETURN_URL` mặc định `localhost:3000`) → `result` là response MoMo `{payUrl, deeplink, qrCodeUrl, resultCode, message, orderId (= "<uuid>-<ms>"), amount}` · `GET /api/momo/status/{orderId}` → `{orderId, status: PENDING|SUCCESS|FAILED, amount, momoTransactionId, paidAt}` (PENDING thì BE tự hỏi MoMo → dùng để poll) · IPN `/api/momo/ipn-handler` (public) → `SUCCESS` thì đơn `PAID`. Lỗi: đơn không chờ thanh toán / đã trả → 409 **không có `code`**; không tìm thấy đơn → `IllegalArgumentException` (chưa rõ mã HTTP). **Chưa có:** trả nhiều đơn một lần, thanh toán bằng ví.
    - **Tự huỷ (F-058):** mỗi 60 giây huỷ đơn `PENDING_PAYMENT` quá `paymentDeadline` (15 phút), món `RESERVED` → `ON_SALE`. ⚠️ IPN / poll về muộn vẫn đặt đơn **đã huỷ** thành `PAID` (`applyResult` không kiểm trạng thái đơn) — đã báo BE.
    - **Form ký gửi (API 15–17):** **`/consignment-forms`** (không `/api`): `POST` `{categoryId, brandId, productName, description, desiredPrice, warehouseId, photoUrls[]}` → 201 `{id, status, bringInDeadline, createdAt}` · `GET ?status&page&size` → trang `{id, status, productName, desiredPrice}` · `GET /{id}` → `{id, status, productName, rejectReason, bringInDeadline}`. Trạng thái: `PENDING|APPROVED|REJECTED|EXPIRED|CANCELLED`. Lỗi có `code`: `CONSIGNMENT_FORM_NOT_FOUND`, `CONSIGNMENT_FORM_FORBIDDEN`, `NOT_MEMBER_ACCOUNT`. Request **chưa validate** (thiếu id → 500). Response thiếu ảnh, danh mục, kho, giá mong muốn ở chi tiết… so với mock. **Vẫn chưa có** `/uploads`, API danh mục / thương hiệu (44 — BE chỉ seed bằng `Brand/CategoryInitializer`), API 18–24 → `feature/consign-real-api` chưa làm được trọn.
    - **Chưa có API Phase 4 nào** (62–67, 73–78), `Order.shippingAddress` vẫn là khoá ngoại.
  - **`2c3b597` (code `develop` 20/10, Render CHƯA deploy — Swagger Render vẫn chỉ `POST /orders`):**
    - Sản phẩm: chi tiết có **`categoryId`**, `description` = `null`. Render vẫn 0 sản phẩm.
    - **Đơn lưu bản chụp địa chỉ:** `shippingRecipientName`, `shippingPhone`, `shippingAddressDetail` (cả trong response `POST /orders`). Xoá địa chỉ đã dùng cho đơn → 409 **`ADDRESS_IN_USE`** (đã hỏi BE có cần chặn nữa không).
    - **API 62** `GET /orders?status=A,B&page&size` (lọc **nhiều** trạng thái, cách dấu phẩy) → `result: {orders: <trang>, statusCounts: {PENDING_PAYMENT: n, …}}`; mỗi đơn `{id, orderNo, status, totalAmount, warehouseName, itemCount, firstItemName, firstItemThumbnail, paymentDeadline, deliveredAt, autoCompleteDeadline, serviceRating}`.
    - **API 63** `GET /orders/{id}` → `{id, orderNo, status, createdAt, paymentMethod, paidAt, subtotal, shippingFee, totalAmount, warehouseName, shippingRecipientName, shippingPhone, shippingAddressDetail, items[{productId, name, thumbnailUrl, size, brandName, condition, priceAtOrder}], ghnTrackingCode, deliveredAt, autoCompleteDeadline, completedAt, serviceRating, ratedAt, ratingComment, cancelReason (BUYER_CANCELLED|PAYMENT_EXPIRED|CARRIER_FAILED), cancelledAt, refundAmount}`. **Thiếu `paymentDeadline`** (BR-09 mở từ danh sách cần), `returnRequestId`, `returnDeadline` (Phase 5).
    - **API 65** `POST /orders/{id}/cancel` → `{id, status}`: chỉ `PAID`; hoàn **toàn bộ** vào ví (giao dịch `REFUND`) + món về `ON_SALE` **trong cùng request**. 409: `ORDER_NOT_PAID_YET`, `ORDER_ALREADY_CANCELLED`, `CANNOT_CANCEL_AFTER_PACKING`.
    - **API 66** `POST /orders/{id}/confirm-receipt` → `{id, status}`: chỉ `DELIVERED`, 409 **`ORDER_NOT_DELIVERED_YET`** (mobile đang đặt `ORDER_NOT_DELIVERED` → đổi). Món → `SOLD`, **cộng tiền người bán ngay** (`ORDER_PAYOUT` = giá − giá × `commissionRateApplied`, không trừ thuế).
    - **API 67** `POST /orders/{id}/rating` `{serviceRating 1–5, comment}` → `{id, serviceRating, comment}`: chỉ `COMPLETED` (409 `ORDER_NOT_COMPLETED`); gửi lại thì **ghi đè**.
    - **API 74** `GET /wallet/transactions?type=A,B&direction=IN|OUT&page&size` (hướng theo dấu `amount`) + **`GET /wallet/transactions/{id}`** → `{id, transactionNo (WT-…), type, amount, balanceAfter, relatedOrderId, relatedOrderNo, itemName, status, note, createdAt}`.
    - **API 19/20 biên nhận:** `GET /consignment-receipts/{id}` → `{id, receiptNo, agreedPrice, floorPrice, termLengthDays, maxRenewals, freeWithdrawalWindowDays, commissionRateTerm1..3, withdrawalFee, degradedCompensationRate, confirmedAt, pdfUrl}` · `POST /consignment-receipts/{id}/confirm` → `{id, confirmedAt, pdfUrl}` (409 `CONSIGNMENT_RECEIPT_ALREADY_CONFIRMED`). Form ký gửi chi tiết thêm `receiptId`.
    - Lỗi "không tìm thấy" ở đơn/ví dùng `IllegalArgumentException` (chưa rõ HTTP); sai chủ → 403 `ForbiddenException`.
    - **Chưa có:** API 64 (vận chuyển), 73 (số dư ví), 75 (doanh thu), 76–78 (rút tiền), thanh toán bằng ví, `/uploads` (mới có lưu file nội bộ cho PDF), toàn bộ API Phase 5 (entity/enum đã có, khớp PHASE5_GUIDE).
- **Khác (18/10):** `GET /health` (public, BE dùng để giữ server không ngủ); BE tự tạo tài khoản `admin@rehome.com` + `moderator1..3@rehome.com` khi khởi động (cho web; mật khẩu hỏi BE, không ghi vào tài liệu).
- **Tổ chức:** `POST /api/organizations/register/organization` (JSON, giấy tờ là URL; email tài khoản = `contactEmail`; không có mật khẩu) → 201 `{accountId, verificationStatus}`. Đọc lại 17/10:
  - Body: `legalName*, displayName*, orgType*, taxCode, operationScope*, address*, contactPhone*, contactEmail*, website, description*, logoUrl, representative* {fullName*, position, cccdNumber*, cccdFrontUrl*, cccdBackUrl*}, documents* (≥ 1) [{docType*, docNumber, issueDate (LocalDate), issuingAuthority, fileUrl*}], donationPoint* {name*, address*, latitude*, longitude*, receivingHours, contactPhone}`.
  - Email trùng (không phân biệt hoa thường) → 409 "Email đã được sử dụng!!"; MST trùng → 409 "Mã số thuế đã được sử dụng!!" (dạng A, không có `code`).
  - Chưa có danh sách mã cho `orgType` / `operationScope` → mobile tạm dùng `SOCIAL_FUND…`, `NATIONAL…` [GIẢ ĐỊNH].
- **Google:** `GoogleTokenVerifier` kiểm `idToken` với `audience` = `google.client-id` (từ `2af9d85` nhận **nhiều** client ID cách dấu phẩy; Render đã đặt đúng — chạy thật 19/10) → mobile phải xin idToken với **Web client ID** đó (OAuth client Android chỉ để Google cho phép app đăng nhập). BE đã gửi Web client ID (17/10, nằm trong `.env`). `loginWithGoogle` (BE):
  - Email chưa có → tạo **Member** mới (`emailVerified: true`, tên từ Google, **không có SĐT**).
  - Email đã có → gắn `googleId`; đăng nhập được cả mật khẩu lẫn Google. Nếu tài khoản đó **chưa xác thực** → BE **xoá mật khẩu cũ** + thu hồi token (chống giả mạo).
  - Bị khoá → `ACCOUNT_BANNED`; email đã gắn Google khác → 409 `GOOGLE_ACCOUNT_CONFLICT`. Tài khoản chỉ có Google đổi mật khẩu → `PASSWORD_NOT_SET`.
- **JWT:** `sub` = email; claim `roles` là **chuỗi** `"ROLE_MEMBER"` | `"ROLE_ORGANIZATION"` | `"ROLE_MODERATOR"` | `"ROLE_ADMIN"`. Access token 15 phút, refresh token 7 ngày.
- **OTP:** 6 số, hết hạn **5 phút**, sai tối đa 5 lần, phải chờ **60 giây** mới gửi lại (sớm hơn → 429).
- **Hành vi cần biết:**
  - Đăng nhập (`authenticate()` chỉ kiểm mật khẩu; kiểm trạng thái tài khoản **sau** mật khẩu):
    - Sai mật khẩu / email không tồn tại → 401 dạng A "Sai email hoặc password". **Đã kiểm tra thật 16/10.**
    - Đúng mật khẩu, `status != ACTIVE` → 403 `ACCOUNT_BANNED`.
    - Đúng mật khẩu, chưa xác thực → 403 `EMAIL_NOT_VERIFIED`. **Đã kiểm tra thật 16/10** (app tự gửi lại mã, sang AU-04).
  - Bị khoá khi đang dùng app: `JwtAuthenticationFilter` trả 403 `ACCOUNT_BANNED` (có body); `/refresh` cũng 403 `ACCOUNT_BANNED`.
  - Thiếu hoặc hết hạn access token trên API cần đăng nhập: **từ `2af9d85` (18/10 tối) trả 401** envelope `code: UNAUTHORIZED` (`JwtAuthenticationEntryPoint`); sai quyền (vd tổ chức gọi API Member) → 403 envelope "Bạn không có quyền truy cập chức năng này." (`JwtAccessDeniedHandler`). Trước đó là 403 body rỗng — `client.js` vẫn coi "403 rỗng" là hết hạn cho chắc, có thể bỏ điều kiện đó sau khi BE deploy. Refresh token sai/hết hạn: 403 (theo code).
  - Logout khi access token đã hết hạn → 500.
  - Đăng ký trùng email → 409; trùng SĐT → 500 (BE chưa kiểm tra).
  - BE chỉ kiểm mật khẩu ≥ 6 ký tự; mobile vẫn dùng ≥ 8, có chữ và số.
- **Tổ chức (đọc lại 19/10 tại `2af9d85`; cập nhật `8c1a6b5` — ĐÃ theo hướng "tạo account trước", còn thiếu):**
  1. Tạo account: **từ `8c1a6b5`: `POST /api/organizations/register/account`** (body như `/api/auth/register`, bỏ `role`) → account `ORGANIZATION` + OTP (`verify-otp` REGISTER) → `login` (JWT `ROLE_ORGANIZATION`). `/api/auth/register` nay **luôn tạo MEMBER** (`RegisterRequest` bỏ `role`; mobile gửi `role` thừa không sao). ⚠️ **Lỗi BE:** `SecurityConfig` chỉ `permitAll` `POST /api/organizations/register` → `/register/account` **cần token** — Render trả **401** cho khách (đã thử). **Đã sửa trong code `2c3b597`, chờ Render deploy.** Không tạo `MemberProfile` cho tổ chức nữa. API nộp hồ sơ kiểm role → 403 `NOT_ORGANIZATION_ACCOUNT`; `contactEmail` được chuẩn hoá. *(Bản `2af9d85`: `/api/auth/register` với `role: "ORGANIZATION"`.)*
  2. Nộp hồ sơ: `POST /api/organizations/register/organization` (cần token; gắn vào **account đang đăng nhập**, không tạo account mới) → 201 envelope `{accountId, verificationStatus: "PENDING"}`. Lỗi có `code`: 409 `ORGANIZATION_PROFILE_ALREADY_EXISTS` · 409 `ORGANIZATION_EMAIL_TAKEN` (email liên hệ) · 409 `ORGANIZATION_TAX_CODE_TAKEN`. Body như cũ (`legalName*, displayName*, orgType*, taxCode, operationScope*, address*, contactPhone*, contactEmail*, website, description*, logoUrl, representative* {fullName*, position, cccdNumber*, cccdFrontUrl*, cccdBackUrl*}, documents* ≥1 [{docType*, docNumber, issueDate, issuingAuthority, fileUrl*}], donationPoint* {name*, address*, latitude* (NOT NULL), longitude* (NOT NULL), receivingHours, contactPhone}`); field lạ (representative.phone/email/cccdName…, password) bị bỏ qua.
  3. Nộp lại: `PUT /api/organizations/me/registration` (cùng body) — chỉ khi `REJECTED` (khác → 403 `ORGANIZATION_NOT_REJECTED`; chưa có hồ sơ → 404 `ORGANIZATION_PROFILE_NOT_FOUND`) → `{verificationStatus: "PENDING"}`.
  - **Chưa có:** `GET /api/organizations/me` (trạng thái, lý do từ chối — mobile không biết tổ chức đã nộp / được duyệt chưa sau khi đăng nhập lại), `POST /uploads` (ảnh CCCD, giấy tờ, logo), API danh sách mã `orgType`/`operationScope`. `/members/me` chỉ cho MEMBER (tổ chức gọi → 403).
  - **Lỗi / thiếu chặn:** API nộp hồ sơ không kiểm role (Member cũng gọi được); `existsByTaxCode(null)` → tổ chức thứ 2 **không có MST** có thể bị 409 nhầm; `latitude/longitude` bắt buộc.
- *(Bản 18/10 `1852963`, đã thay)*: `POST /api/organizations/register/organization` nay **bắt buộc token** và nhận account đang đăng nhập, nhưng `registerOrganization` **ghi đè** ngay bằng `accountRepository.save(Account.builder()…)` → vẫn tạo account mới theo `contactEmail`, **không mật khẩu** (không đăng nhập được); account đang đăng nhập bị bỏ qua. `existsByAccount` thêm vào repository nhưng chưa dùng. `/api/auth/register` vẫn luôn tạo MEMBER.
- **Chưa có (`2c3b597`):** `GET /api/organizations/me`, upload file, API ký gửi 18, 21–24 + 44, checkout-preview (58), thanh toán gộp nhiều đơn / bằng ví, API 64, 73, 75–78, toàn bộ Phase 5 (79–95). Kiểm trùng MST khi `taxCode` trống **vẫn chưa sửa**.

## Đang chờ xác nhận

Đã xong phía BE (16/10): field `code` cho lỗi đăng nhập/đổi mật khẩu; chặn tài khoản bị khoá ở filter + refresh; gửi mail OTP trên Render (Brevo API). (18/10): `OtpServiceImpl` bỏ `isEnabled()`, dùng `canResetPassword` (ACTIVE + đã xác thực) → quên mật khẩu đã chặn tài khoản bị khoá / chưa xác thực; OAuth client Android cho Google.

- [CHỜ BE] Login trả thêm `account { id, role, verificationStatus }`; lỗi bị khoá kèm `reason`.
- [CHỜ BE] Mọi lỗi theo một dạng envelope có `code` (dạng A vẫn còn: 401 sai mật khẩu, OTP, 409 email trùng…).
- [CHỜ BE] Xác nhận mobile dùng `resend-otp` (FORGOT_PASSWORD) để gửi OTP quên mật khẩu (đang chạy thật 17/10), hoặc đổi `/password/forgot` sang gửi OTP.
- [CHỜ BE] Định dạng `qrPayload` của API 25 `/counter/lookup` (mobile tạm mã hoá đúng `memberCode`).
- [CHỜ BE] Đổi mật khẩu: chuyển khỏi `/api/auth/**` hoặc trả 401 khi thiếu token (đang 500); DTO có `@NotBlank`; xác nhận thu hồi token cả thiết bị đang dùng có chủ ý không.
- [CHỜ BE] `POST /uploads`; ~~token hết hạn trả 401~~ (xong `2af9d85`); logout không lỗi 500 khi token hết hạn; đăng ký trùng SĐT trả 409 thay vì 500.
- [CHỜ BE] **Tổ chức (19/10):** code BE `2af9d85` đã theo hướng "tạo account trước" (xem "API backend" → Tổ chức); mobile làm xong bước 1–3 (bảng "Khi BE xong tổ chức" bên dưới). **Đã báo BE 19/10:**
  - ~~Deploy `develop` lên Render~~ (xong `8c1a6b5`).
  - ~~`register` mặc định MEMBER, chặn ADMIN, không tạo `MemberProfile` cho tổ chức~~ (xong `8c1a6b5` theo cách tách API `/api/organizations/register/account`). ~~`permitAll` sai đường dẫn → khách gọi 401~~ (sửa trong code `2c3b597`, chờ deploy).
  - `GET /api/organizations/me` (`verificationStatus` — `null` khi chưa nộp, `rejectionReason`, `displayName`…), `POST /uploads`, danh sách mã `orgType` / `operationScope` — **chưa làm**.
  - ~~API nộp hồ sơ kiểm role~~ (xong, 403 `NOT_ORGANIZATION_ACCOUNT`); bỏ kiểm trùng MST khi `taxCode` trống — **chưa làm**.
- *(Bản chốt gửi BE 18/10, giữ để tra cứu)* Cần BE gửi khi xong (Swagger/code `develop`):
  1. API tạo account tổ chức (dùng chung `/api/auth/register` kèm loại tài khoản hay API riêng?) + OTP.
  2. `/me` cho tổ chức: `role`, `verificationStatus` (kể cả trạng thái **"chưa nộp hồ sơ"**: `null` / `NOT_SUBMITTED`?), lý do từ chối, giấy tờ chưa đạt.
  3. `POST` / `PUT` / `GET /api/organizations/me/registration`: body (đã thêm `representative.phone/email`, `cccdName/cccdIssueDate/cccdIssuePlace` chưa?), `latitude/longitude` có cho `null` không.
  4. `POST /uploads` (cần token): tên field file, giới hạn dung lượng/định dạng, response.
  5. Danh sách mã `orgType` / `operationScope`; lỗi 409 có `code`.
- ✅ **Google xong 19/10** (giữ lại để tra cứu): OAuth client **Android** đã tạo 17/10 (package `com.rehome.mobile` + SHA-1 development; hộp chọn tài khoản đã chạy). **Còn:** `POST /api/auth/google` trả 401 "Token không hợp lệ" vì biến `GOOGLE_CLIENT_ID` trên Render **không khớp** Web client ID (đặt nhầm ID Android). BE redeploy 18/10 vẫn lỗi (test bằng tài khoản đã đăng ký mật khẩu). **18/10 tối (`2af9d85`) BE đã merge `GoogleTokenVerifier` nhận nhiều client ID + log** → chờ BE xác nhận đã sửa biến trên Render rồi test lại, chạy được thì xoá log tạm ở `LoginScreen.js` (đang chưa commit). Hướng dẫn đã gửi: Render → Environment → `GOOGLE_CLIENT_ID` = **Web client ID** (cùng giá trị trong `.env` mobile, không phải ID Android) → Save → Deploy, chờ Live; tuỳ chọn cho `GoogleTokenVerifier` nhận nhiều client ID (tách dấu phẩy). Mobile không sửa gì. Muốn kiểm tra `aud` của token: tạm `console.log(jwtDecode(idToken).aud)` trong `LoginScreen` (chỉ `__DEV__`, xoá sau). Bản preview/production có keystore riêng → gửi thêm SHA-1.
- [CHỜ BE] Ký gửi (Phase 2): bản BE 18/10 (`1852963`) vẫn **chưa có controller nào** của API 14–24, 44, `/uploads` (entity/DB đã có, khớp mock). Danh sách field mobile xin thêm: `docs/PHASE2_GUIDE.md` mục 11 (câu 1–19).
- [CHỜ BE] Thống nhất base path, tên field OTP (`otp` hay `otpCode`), body reset password.
- [CHỜ BE] Ngày sinh/giới tính (DB chưa có cột); `createdAt` cho "tham gia MM/YYYY" ở PR-01.
- [CHỜ LEAD] Xoá ghi chú ③ ở wireframe AU-04 (chưa xác thực vẫn đăng nhập được).
- [CHỜ LEAD] Địa chỉ email hỗ trợ ReHome (thông báo tài khoản bị khoá).
- [CHỜ LEAD] Xác nhận giữ QR ở PR-04 (mobile làm QR + mã chữ; ghi chú wireframe 11/10 bỏ QR).
- [CHỜ LEAD] Tab dưới Member: 4 tab (BR-01) hay 5 tab (PR-01) — mobile đang dùng 4: Mua sắm · Cộng đồng · Ký gửi · Cá nhân.
- [CHỜ LEAD] Đăng ký tổ chức: ô mật khẩu ở bước 2, đăng nhập bằng email (không phải SĐT), màn "Xem lại hồ sơ" + ô cam đoan, thêm tên/SĐT điểm nhận ở bước 4 (chi tiết: guide 0.3 #22–#27).
- [CHỜ LEAD] Thời điểm tiền vào ví người bán; điều kiện hiện nút trả hàng.
- [CHỜ LEAD] Ký gửi: nguyên văn mục 12 (mẫu biên nhận); duyệt chỗ lệch PHASE2_GUIDE 0.4 (gộp tab, bỏ ô Kích cỡ/Tình trạng, trạng thái "Chờ nhận lại"…).

## Tiến độ

Phase 1 (13–19/10): Auth & Hồ sơ. Hướng dẫn chi tiết: `docs/PHASE1_GUIDE.md`. Nhánh `feature/phase1-auth`.

Tiêu chí xong Phase 1: Guest đăng ký được Member/Organization · Đăng nhập (kể cả Google) · Đổi/quên mật khẩu · Member xem/sửa hồ sơ.

| Tiêu chí               | Trạng thái (17/10)                                                            |
| ---------------------- | ----------------------------------------------------------------------------- |
| Guest đăng ký Member   | ✅ AU-03, AU-04 — API thật                                                     |
| Đăng nhập email        | ✅ AU-02 — API thật                                                            |
| Đổi / quên mật khẩu    | ✅ AU-07, AU-05, AU-06 — API thật                                              |
| Member xem/sửa hồ sơ   | ✅ Tab bar, PR-01 (+ Cài đặt), PR-02, PR-03, PR-04 — API thật (ảnh đại diện chờ upload) |
| Guest đăng ký Tổ chức  | ✅ UI OA-01 → OA-04, Xem lại, OA-06 (chờ xác minh) — **mock**. ⏳ Sửa theo hướng "tạo account trước" + nối API thật khi BE xong (T-002, T-003, T-005). 18/10: API BE chưa đúng, đã gửi lại bản chốt. **19/10: BE `2af9d85` đã theo hướng tạo account trước → nhánh `feature/org-real-api` xong bước 1–3 (code, chưa test với server; `MOCK.organization = true`). Bước 4 chờ `GET /me` + `/uploads`. `8c1a6b5`: BE đổi tạo account sang `POST /api/organizations/register/account` → mobile phải đổi `authApi.real.register` (role ORGANIZATION gọi API này); chờ BE sửa `permitAll` (đang 401) rồi mới test** |
| Đăng nhập Google       | ✅ **Chạy thật 19/10** (dev build) — BE đã sửa `GOOGLE_CLIENT_ID`; bỏ log debug (PR #15) |

Còn lại khác: AU-01 Splash ✅ · PR `feature/phase1-auth` → `develop` ✅ (PR #2, #3) · server Render ngủ → lần mở đầu có thể trắng / chờ 30–50 giây (không phải lỗi code; cân nhắc thêm chữ "Đang kết nối máy chủ…" ở `BootSplash` và tăng timeout axios lên 60 giây) · tự test checklist mục 10 (OA-03, Xem lại chưa test hết) · trước khi build bản cho lead/demo: thay icon, `preventAutoHideAsync` (guide 12.3).

**Khi BE xong tổ chức — mobile phải sửa** (nhánh `feature/org-real-api`). **19/10 đã làm:** fix `register` gửi `role`; AU-03 chọn Tổ chức = cùng form với `role: ORGANIZATION`; nhóm `(org)` + màn `/org` (`OrgHomeScreen`); 4 bước chuyển sang `(org)/org/registration` (bỏ mật khẩu, email liên hệ điền sẵn); `organizationApi.real` (POST nộp, PUT nộp lại, lỗi theo `code`); toạ độ điểm nhận từ `expo-location.geocodeAsync` (`utils/geocode.js`). **Còn:** test với server sau khi BE deploy (đổi `MOCK.organization = false`); màn trạng thái theo `GET /me` (mục 4, 7, 8); upload thật (mục 6); khung tab cho VERIFIED (mục 9). Danh sách gốc:
1. AU-03 "Tổ chức" → form email + mật khẩu → AU-04 OTP → đăng nhập.
2. Chuyển `org-register` **ra khỏi nhóm `(auth)`** (nhóm này chỉ mở khi chưa đăng nhập) sang nhóm cho tổ chức đã đăng nhập.
3. `authStore` / `getMe`: tổ chức gọi `/me` của tổ chức, **không** gọi `/members/me` (gọi sẽ lỗi → bị văng ra).
4. `_layout.js`: thêm `(org-status)`, `(org)`; điều hướng theo `verificationStatus`.
5. OA-02 bỏ khối "Tài khoản đăng nhập" (mật khẩu) + schema.
6. `organizationApi.real.js` (`uploadFile` có token, `POST`/`PUT`/`GET` registration); `MOCK.organization`, `MOCK.upload` → `false`; upload ảnh đại diện PR-03 thật.
7. Gửi xong → gọi lại `/me` → tự sang màn PENDING (bỏ màn `submitted` trong `(auth)`).
8. OA-06 Bị từ chối (lý do, giấy tờ chưa đạt) → "Bổ sung hồ sơ" mở lại 4 bước điền sẵn → `PUT`.
9. Khung 4 tab tổ chức (Chiến dịch · Bài viết · Tin nhắn · Hồ sơ) cho VERIFIED.

Phase 2 (20–30/10): Ký gửi phía Member (luồng L-02). Hướng dẫn chi tiết: `docs/PHASE2_GUIDE.md`.

| Phần | Trạng thái (18/10) |
| ---- | ------------------ |
| KG-01 → KG-05 Form ký gửi (danh sách, tạo 2 bước + kho gần nhất, chi tiết 4 trạng thái, sửa, tạo lại) | ✅ mock — PR #4 |
| KG-06, KG-07 Biên nhận (chờ / đã xác nhận, dialog, PDF, chia sẻ) | ✅ mock — PR #5 |
| KG-08 → KG-10 Sản phẩm (danh sách, chi tiết 6 trạng thái, giảm giá 3 trạng thái) | ✅ mock — PR #6 |
| KG-11, KG-12 Cuối kỳ (nhận lại / ký gửi lại, biên nhận mới) | ✅ mock — PR #7 |
| Nối API thật (`feature/consign-real-api`): `consignmentApi.real.js`, `catalogApi.real.js`, `upload.real.js`, tắt `MOCK.consignment`/`upload`, timeout axios 60 giây, test với web Moderator | ⏳ chờ BE (dự kiến 28–30/10) |

Phase 3 (làm sớm từ 19/10, kế hoạch 31/10 – 05/11): Mua hàng & thanh toán phía Member (luồng L-03). Hướng dẫn chi tiết: `docs/PHASE3_GUIDE.md` (quyết định + chỗ lệch wireframe: mục 0.4 #1–#23). **19/10: xong UI cả Phase 3 (BR-01 → BR-09)**, chỉ địa chỉ gọi thật; còn lại chờ BE.

| Nhánh | Trạng thái (19/10) |
| ----- | ------------------ |
| 1 `feature/shop-browse`: BR-01 trang chủ, BR-02/03 tìm kiếm + bộ lọc, BR-04 chi tiết (4 trạng thái + 404), quay lại sau đăng nhập | ✅ mock — PR #10 (`MOCK.products`, `MOCK.productDetail` = true: chờ API 44, API 50) |
| 2 `feature/cart-address`: BR-05 giỏ (ô tích từng món / kho), BR-06/07 địa chỉ, badge giỏ, thêm vào giỏ ở BR-04, mục "Địa chỉ giao hàng" ở tab Cá nhân | ✅ PR #12 — giỏ **mock** (`MOCK.cart = true`, đi cùng `MOCK.products`; chờ BE tạo sản phẩm mẫu trên Render), địa chỉ **API thật** (đã test 19/10) |
| 3 `feature/checkout-payment`: BR-08 đặt hàng (chọn địa chỉ, tách đơn theo kho, giữ hàng thất bại, Mua ngay), BR-09 chờ thanh toán (đếm ngược theo `paymentDeadline`, kết quả, dải đơn chờ ở giỏ), `checkoutStore` | ✅ PR #14 — **mock** (`MOCK.orders`, `MOCK.payment` = true; `ordersApi.mock` làm giống `OrderServiceImpl`); khung Mock: 409, MoMo thành công / thất bại, còn 30 giây |
| 3b `feature/shop-real-api`: tắt `MOCK.products/cart/orders`, test với server | ⏳ chờ BE tạo sản phẩm mẫu (+ API 44 cho bộ lọc, API 50 chi tiết) |
| 4 `feature/payment-momo`: MoMo sandbox (cài `expo-web-browser` + build lại) | ⏳ BE có `POST /api/momo/create` + `GET /api/momo/status/{orderId}` (`8c1a6b5`, một đơn mỗi lần) nhưng chưa test được: Render chưa có sản phẩm để tạo đơn thật (làm sau 3b); chờ BE trả lời thanh toán nhiều đơn |

Phase 4 (làm sớm từ 20/10, kế hoạch 06/11 – 11/11): Đơn hàng, hoàn tất đơn & Ví phía Member (L-04, L-07). Hướng dẫn chi tiết: `docs/PHASE4_GUIDE.md` (lệch wireframe: mục 0.4). **Xong UI cả Phase 4 — toàn bộ mock** (BE `8c1a6b5` chưa có API 62–67, 73–78).

| Nhánh | Trạng thái |
| ----- | ---------- |
| 1 `feature/orders`: BR-10 (6 chip), BR-11 (7 trạng thái, huỷ → hoàn ví), BR-13, mở BR-09 từ danh sách (`payment?orderIds=`), dòng "Đơn hàng của tôi" + badge ở PR-01 | ✅ PR #18 |
| 2 `feature/order-tracking-rating`: BR-12 (sao chép mã, "Xem trên GHN", sự cố), BR-14 (chỉ số sao) | ✅ PR #19 |
| 3 `feature/wallet`: VI-01 → VI-03, thẻ ví (số dư khả dụng) ở PR-01 | ✅ PR #20 |
| 4 `feature/payout`: VI-04, VI-05 (tự hỏi lại 2 giây/lần), danh sách yêu cầu rút | ✅ PR #21 |
| 5 `feature/checkout-wallet`: Ví ReHome ở BR-08/09 (`PaymentMethodPicker`, trả bằng ví trừ số dư), nút "Xem đơn hàng" sau khi trả | ✅ PR #22 |
| 6 `feature/orders-wallet-real-api`: `*.real.js`, tắt `MOCK.orderList` / `MOCK.wallet` | ⏳ BE `2c3b597` có 62, 63, 65–67, 74 (chưa deploy; còn thiếu 64, 73, 75–78) → làm một phần khi Render deploy + có sản phẩm mẫu. Nhớ: đổi `ORDER_NOT_DELIVERED` → `ORDER_NOT_DELIVERED_YET`, thêm `ORDER_NOT_COMPLETED`, `ORDER_NOT_PAID_YET`, `ORDER_ALREADY_CANCELLED`, `ADDRESS_IN_USE`; danh sách đơn bọc trong `orders` + `statusCounts`; địa chỉ đơn là 3 trường phẳng; BR-14 có thể thêm ô nhận xét |

Phase 5 (làm sớm từ 20/10, kế hoạch 12/11 – 17/11): Trả hàng, rút lại hàng ký gửi, hàng xuống cấp (L-05, L-06). Hướng dẫn chi tiết: `docs/PHASE5_GUIDE.md` (lệch wireframe: mục 0.4 #1–#13). **Toàn bộ mock** (`MOCK.returns`, `MOCK.withdrawals`) — BE `2c3b597` mới có entity/enum, chưa có API 79–95.

| Nhánh | Trạng thái |
| ----- | ---------- |
| 1 `feature/returns`: RT-01, RT-02, danh sách yêu cầu trả, bật nút Trả hàng ở BR-11, dòng PR-01 | ✅ PR #25 — `MOCK.returns`; route `(member)/returns/index · new (?orderId=) · [id]/index`; `features/returns/{api, hooks, utils/returnRules, schemas, components, screens}`; khung Mock ở RT-02 và BR-11 ("Rút hạn trả hàng còn 1 phút"). Chi tiết chỗ làm khác: PHASE5_GUIDE mục 1 |
| 2 `feature/return-invalid-choice`: RT-04 | ⏳ |
| 3 `feature/item-withdrawal`: KG-13/14/15, bật nút KG-09 | ⏳ |
| 4 `feature/degraded-item`: KG-16, dải nhắc tab Ký gửi | ⏳ |

Dev build hiện có: `expo-location`, Google Sign-In, `expo-dev-client` (build 17/10). Thêm thư viện native khác → build lại.

## Design tokens

@docs/design-tokens.md
