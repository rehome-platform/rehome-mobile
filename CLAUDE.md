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
- **Thư viện:** axios · @tanstack/react-query · zustand · react-hook-form + zod · expo-secure-store · jwt-decode.
- **Cài thư viện:** có native → `npx expo install`; thuần JS → `npm install`.
- **Cấu trúc:**
  - `src/app` chỉ khai báo route, file mỏng.
  - Logic và giao diện ở `src/features/<feature>/{api,screens,components,schemas.js}`.
  - Còn lại: `components/ui` dùng chung · `lib/api` (client, errors) · `lib/storage` · `stores` · `config` · `constants` · `theme` · `hooks` (custom hook dùng chung, vd `useCountdown`) · `utils` (`validators.js`, `format.js` — `formatPhone`, `toast.js` — `showToast`).
  - Component chỉ dùng trong một nghiệp vụ: `features/<feature>/components` (vd `profile/components/MemberQr.js`).
  - Route đang có: `(auth)/login · register · verify-email · forgot-password · reset-password`; `(member)/(tabs)/index (Mua sắm) · community · consign · account`; `(member)/settings`; `(member)/profile/index · edit · member-code · change-password`.
- **Gọi API:** màn hình không gọi axios trực tiếp, chỉ gọi `features/*/api/*Api.js` qua useQuery/useMutation.
  - API BE đã có → **gọi thật** (`*.real.js`). Chỉ nhóm BE chưa có/chưa dùng được mới có `*.mock.js` cùng hình dạng dữ liệu, bật bằng `MOCK` trong `src/config/env.js` (hiện: `password: false`, `upload: true`, `organization: true`). `authApi.js` = `...real` + ghi đè các hàm nhóm mock; `profileApi.js` (`updateMe`) chỉ có real.
  - Đọc dữ liệu: `useQuery` (vd PR-02 `queryKey: ["me"]`, `initialData` từ store + `initialDataUpdatedAt: 0` để vẫn tải lại). Ghi xong thì cập nhật cả store (`setUser`) và cache (`queryClient.setQueryData`).
  - Phiên đăng nhập: `authStore.signIn(tokens)` tự lưu token + gọi `getMe()`; lỗi thì xoá token. Màn hình chỉ gọi `signIn(await authApi.login(values))`.
  - Form: react-hook-form + `Controller` + `zodResolver`; schema ở `features/*/schemas.js`; regex dùng chung ở `utils/validators.js`. Lỗi server: so theo `status`/`code` (`ERROR_CODES` ở `constants/errorCodes.js`), **không so chữ trong message**.
- **Lỗi:** chuẩn hoá thành `ApiError { status, code, message, fieldErrors, reason }` (`toApiError`): `code` = `data.code` của BE, không có thì `HTTP_<status>`. `status 0` = lỗi mạng/timeout. `reason` = lý do khoá (BE chưa trả).
- **Component UI có sẵn** (`components/ui`): `Screen` (`header`, `footer` cố định đáy, `scroll`, `edges` — màn trong tab dùng `["top"]`), `AppHeader` (`onBack`, `right` tuỳ chọn), `Button` (primary/secondary/text, `loading`, `disabled`), `TextField` (`secure`, `helper`, `error`), `OtpInput`, `PasswordChecklist` (`currentPassword` tuỳ chọn), `RadioCard`, `Checkbox`, `NoteBox`, `Divider`, `ErrorBox`, `EmptyState`, `Avatar` (chưa có ảnh → chữ cái đầu của tên gọi), `ListItem` (`badge`, `disabled`, `muted` = mờ nhưng bấm được, `danger`) + `ListGroup` (khung bo góc, tự kẻ giữa các dòng). Icon: `@expo/vector-icons` (Ionicons). Xác nhận: `Alert.alert` (nút `destructive`). Thông báo ngắn: `showToast`.
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
- **Biến môi trường:** chỉ dùng `EXPO_PUBLIC_*` (bị nhúng vào app, không chứa secret). `.env` không commit.
- **Git:** nhánh `feature/<việc>` tạo từ `develop`, mở PR vào **`develop`** (lead đã đồng ý 17/10); `develop` → `main` khi ổn định (trước demo/bảo vệ). Commit kiểu `feat: / fix: / chore: / docs: / refactor:`. Phase 1 làm ở `feature/phase1-auth` (đã push, chưa mở PR — mở khi xong Phase 1).

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
- **Tổ chức:** wireframe ghi đăng nhập bằng SĐT người đại diện, nhưng API login chỉ nhận email và BE tạo tài khoản tổ chức không có mật khẩu → hiện tổ chức chưa đăng nhập được [CHỜ BE]; chưa xác minh chỉ thấy màn trạng thái hồ sơ; một địa điểm nhận đồ.
- **Email chưa xác thực:** **không đăng nhập được** (theo L-01 và BE). App chỉ có 2 trạng thái: Guest và Member đã xác thực.

## Quyết định đã chốt (ngoài tài liệu)

- **Wireframe là tham khảo** (người phát triển chốt 17/10): chỗ nào thực tế các app (Shopee, Grab, MoMo, ngân hàng; Material/HIG) làm tốt hơn thì làm theo thực tế, giải thích lý do và ghi chỗ lệch vào guide cho lead xem.
- Đặt lại mật khẩu bằng **OTP 6 số qua email**, **gọi thật** qua `resend-otp` (purpose `FORGOT_PASSWORD`) → `verify-otp` → `password/reset` (không dùng `/password/forgot` vì gửi link web). [CHỜ BE xác nhận cách dùng này]
- Mã Member (PR-04): **QR + mã chữ** cỡ lớn, nút Sao chép, tự tăng độ sáng (`expo-brightness`) khi mở màn. QR tạm chứa đúng `memberCode` (component `MemberQr`) vì API 25 `/counter/lookup` (API_CONTRACT) có `qrPayload` [CHỜ BE định dạng `qrPayload`] [CHỜ LEAD xác nhận giữ QR — wireframe 11/10 ghi bỏ].
- API nào backend có thì gọi thật, chưa có thì mock. **Không mock auth** (đã bỏ tài khoản mock `member@`, `banned@`…); test bằng tài khoản thật trên server Render (mẹo Gmail `ten+test1@gmail.com` để tạo nhiều email nhận chung hộp thư).
  - **Phase 1 gọi thật:** đăng ký, verify-otp, resend-otp, đăng nhập email, refresh, logout, đổi mật khẩu (AU-07), quên / đặt lại mật khẩu (AU-05/06), `GET/PATCH /members/me`. (Mã Member lấy từ `user.memberCode`, không gọi `GET /members/me/code`.)
  - **Phase 1 mock / chưa làm:** upload ảnh đại diện (bấm → Toast "sắp có"), toàn bộ đăng ký và trạng thái tổ chức, đăng nhập Google (chờ dev build).
- **Thanh tab Member: 4 tab** Mua sắm · Cộng đồng · Ký gửi · Cá nhân (theo BR-01; PR-01 vẽ 5 tab có "Thử đồ" nhưng thử đồ mở từ trang sản phẩm) [CHỜ LEAD]. Icon rỗng/đặc theo trạng thái; khai báo bằng mảng `TABS`. 3 tab đầu là `EmptyState` "Sắp có".
- **PR-01 Tab Cá nhân:** thẻ đầu (Avatar, tên, mã) → PR-02; "Mã Member của tôi" → PR-04; nhóm "Sắp có" (đơn hàng, ký gửi, trả hàng, địa chỉ, ảnh thử đồ, tổ chức theo dõi, tin nhắn) **mờ nhưng bấm được → Toast**; Đăng xuất đỏ, **hỏi xác nhận**; thẻ ví (Phase 4) **ẩn**; nút ⚙ → màn **Cài đặt** (Hồ sơ cá nhân, Đổi mật khẩu, Phiên bản). Bản khách: thẻ mời Đăng nhập / Tạo tài khoản. Không hiện "tham gia MM/YYYY" (chưa có `createdAt`).
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
- Luồng AU-03 → AU-04: đăng ký xong `router.push` sang `/verify-email` (để "Quay lại sửa" được); xác thực xong `router.dismissTo("/login", { email, verified: "1" })` → AU-02 điền sẵn email + báo thành công.

## API backend đang chạy thật (Swagger + code `develop` `c62dca4`, đọc 16/10)

- **Base path:** auth và tổ chức có `/api` (`/api/auth/...`, `/api/organizations/...`); member, sản phẩm, địa chỉ **không có `/api`** (`/members/...`, `/products/...`, `/addresses`). `/api/v1` trong `API_CONTRACT.md` chưa áp dụng.
- **Envelope khi thành công:** `{ result, statusCode, message, isSuccess }`. Chỉ nhóm `/members`, `/addresses` bọc; nhóm `/api/auth` trả thẳng. Bóc bằng `res.data?.result ?? res.data`.
- **Lỗi: 2 dạng** (cả hai đều có `message`; chưa có `fieldErrors`):
  - Dạng A `{ timestamp, status, error, message, path }` — **không có `code`**: OTP (400, 429), validate (400), sai email/mật khẩu (401 "Sai email hoặc password"), email trùng (409), gửi mail lỗi (503), 500.
  - Dạng B `{ result: null, isSuccess: false, statusCode, code?, message }` — lỗi qua `AppException` **có `code`** (`enum ErrorCode`, từ 16/10): `ACCOUNT_BANNED` (403), `EMAIL_NOT_VERIFIED` (403), `WRONG_PASSWORD` (400), `PASSWORD_CONFIRM_MISMATCH` (400), `PASSWORD_NOT_SET` (400), `NEW_PASSWORD_SAME_AS_OLD` (400), `GOOGLE_ACCOUNT_CONFLICT` (409). Các lỗi 400/403/404/409 khác dạng B không có `code`.
  - Lỗi validate gộp một chuỗi: `"email: email không hợp lệ; password: ..."` (**đã kiểm tra thật 16/10**).
- **Auth:**
  - `POST /api/auth/register` `{email, password, fullName, phone}` → 201 `{message}`. BE gửi OTP **qua Brevo REST API** (Render chặn SMTP) trước khi trả kết quả → có thể chậm; gửi lỗi → 503 và **rollback** (không tạo tài khoản). **Đã chạy thật trong app 16/10.** Mail có thể tới chậm 1–2 phút; Gmail gộp các mail OTP vào cùng một cuộc hội thoại.
  - `POST /api/auth/verify-otp` `{email, otp, purpose: REGISTER|FORGOT_PASSWORD}` → `{message}`; với FORGOT_PASSWORD trả thêm `resetToken`. Xác thực REGISTER **không trả token**.
  - `POST /api/auth/resend-otp` `{email, purpose}` → `{message}`, luôn trả như nhau dù email có tồn tại hay không.
  - `POST /api/auth/login` `{email, password}` → `{accessToken, refreshToken, tokenType}` (không có user/role).
  - `POST /api/auth/refresh` `{refreshToken}` → cặp token mới; refresh token **xoay vòng** (token cũ hết dùng).
  - `POST /api/auth/logout`: cần header `Authorization`, trả 204.
  - `POST /api/auth/google` `{idToken}` → như login.
  - `POST /api/auth/password/forgot` `{email}` → 204 nhưng **gửi link web (`localhost:5500`), không gửi OTP** → mobile **không dùng**. Thay vào đó `resend-otp` với `purpose: FORGOT_PASSWORD` gửi mail "ReHome - Mã OTP đặt lại mật khẩu" (mẫu mail BE có sẵn) → `verify-otp` (FORGOT_PASSWORD) trả `resetToken`. **Đã chạy thật 17/10.**
  - `POST /api/auth/password/reset` `{email, resetToken, newPassword, confirmPassword}`.
  - `POST /api/auth/password/change` `{oldPassword, newPassword, newPasswordRepeat}` → 200, body là **chuỗi** "Đổi mật khẩu thành công". Lỗi 400 dạng B có `code`: `PASSWORD_CONFIRM_MISMATCH` · `WRONG_PASSWORD` ("Mật khẩu cũ không đúng.") · `NEW_PASSWORD_SAME_AS_OLD` · `PASSWORD_NOT_SET` (tài khoản Google). Thu hồi refresh token **mọi thiết bị**. Nằm dưới `/api/auth/**` (public) → token hết hạn thì 500 và `client.js` không tự refresh (gọi `getMe()` trước để chắc token còn hạn). DTO không có `@NotBlank` (thiếu field → 500).
- **Member:**
  - `GET /members/me` → `result: {accountId, email, phone, fullName, avatarUrl, memberCode, emailVerified}`. Không có `createdAt`. `memberCode` dạng `MB000001`. **Đã chạy thật 16/10.**
  - `PATCH /members/me` `{fullName, phone, avatarUrl}`: ô trống = giữ nguyên. Response thiếu `email`, `memberCode` → lưu xong gọi lại `GET /members/me`.
  - `GET /members/me/code` → `result: {memberCode}`.
- **Địa chỉ giao hàng** (mới, 16/10, Phase sau): `GET /addresses`, `POST /addresses` `{recipientName, phone, addressDetail, isDefault}` → có envelope, không có `/api`.
- **Tổ chức:** `POST /api/organizations/register/organization` (JSON, giấy tờ là URL; email tài khoản = `contactEmail`; không có mật khẩu) → 201 `{accountId, verificationStatus}`.
- **JWT:** `sub` = email; claim `roles` là **chuỗi** `"ROLE_MEMBER"` | `"ROLE_ORGANIZATION"` | `"ROLE_MODERATOR"` | `"ROLE_ADMIN"`. Access token 15 phút, refresh token 7 ngày.
- **OTP:** 6 số, hết hạn **5 phút**, sai tối đa 5 lần, phải chờ **60 giây** mới gửi lại (sớm hơn → 429).
- **Hành vi cần biết:**
  - Đăng nhập (`authenticate()` chỉ kiểm mật khẩu; kiểm trạng thái tài khoản **sau** mật khẩu):
    - Sai mật khẩu / email không tồn tại → 401 dạng A "Sai email hoặc password". **Đã kiểm tra thật 16/10.**
    - Đúng mật khẩu, `status != ACTIVE` → 403 `ACCOUNT_BANNED`.
    - Đúng mật khẩu, chưa xác thực → 403 `EMAIL_NOT_VERIFIED`. **Đã kiểm tra thật 16/10** (app tự gửi lại mã, sang AU-04).
  - Bị khoá khi đang dùng app: `JwtAuthenticationFilter` trả 403 `ACCOUNT_BANNED` (có body); `/refresh` cũng 403 `ACCOUNT_BANNED`.
  - Thiếu hoặc hết hạn access token trên API cần đăng nhập: trả **403 body rỗng**, không phải 401. **Đã kiểm tra thật 16/10** với `GET /members/me` không có token. Refresh token sai/hết hạn: 403 (theo code).
  - Logout khi access token đã hết hạn → 500.
  - Đăng ký trùng email → 409; trùng SĐT → 500 (BE chưa kiểm tra).
  - BE chỉ kiểm mật khẩu ≥ 6 ký tự; mobile vẫn dùng ≥ 8, có chữ và số.
- **Chưa có:** API `/me` chung (role, trạng thái tổ chức), upload file, trạng thái/nộp lại hồ sơ tổ chức.

## Đang chờ xác nhận

Đã xong phía BE (16/10): field `code` cho lỗi đăng nhập/đổi mật khẩu; chặn tài khoản bị khoá ở filter + refresh; gửi mail OTP trên Render (Brevo API).

- [CHỜ BE] Login trả thêm `account { id, role, verificationStatus }`; lỗi bị khoá kèm `reason`.
- [CHỜ BE] Mọi lỗi theo một dạng envelope có `code` (dạng A vẫn còn: 401 sai mật khẩu, OTP, 409 email trùng…).
- [CHỜ BE] Xác nhận mobile dùng `resend-otp` (FORGOT_PASSWORD) để gửi OTP quên mật khẩu (đang chạy thật 17/10), hoặc đổi `/password/forgot` sang gửi OTP.
- [CHỜ BE] Định dạng `qrPayload` của API 25 `/counter/lookup` (mobile tạm mã hoá đúng `memberCode`).
- [CHỜ BE] `OtpServiceImpl` dòng 86/115/131/154 còn dùng `isEnabled()` (luôn `true`) → quên mật khẩu chưa chặn tài khoản bị khoá/chưa xác thực.
- [CHỜ BE] Đổi mật khẩu: chuyển khỏi `/api/auth/**` hoặc trả 401 khi thiếu token (đang 500); DTO có `@NotBlank`; xác nhận thu hồi token cả thiết bị đang dùng có chủ ý không.
- [CHỜ BE] `POST /uploads`; đăng ký tổ chức có mật khẩu + API trạng thái/nộp lại hồ sơ (API 4); token hết hạn trả 401; logout không lỗi 500 khi token hết hạn; đăng ký trùng SĐT trả 409 thay vì 500.
- [CHỜ BE] Thống nhất base path, tên field OTP (`otp` hay `otpCode`), body reset password.
- [CHỜ BE] Ngày sinh/giới tính (DB chưa có cột); `createdAt` cho "tham gia MM/YYYY" ở PR-01.
- [CHỜ BE/LEAD] Đăng nhập Google: quyền Google Cloud project để tạo OAuth client Android; tên package Android (tạm `com.rehome.mobile`). Cần development build (Expo Go không chạy được).
- [CHỜ LEAD] Xoá ghi chú ③ ở wireframe AU-04 (chưa xác thực vẫn đăng nhập được).
- [CHỜ LEAD] Địa chỉ email hỗ trợ ReHome (thông báo tài khoản bị khoá).
- [CHỜ LEAD] Xác nhận giữ QR ở PR-04 (mobile làm QR + mã chữ; ghi chú wireframe 11/10 bỏ QR).
- [CHỜ LEAD] Tab dưới Member: 4 tab (BR-01) hay 5 tab (PR-01) — mobile đang dùng 4: Mua sắm · Cộng đồng · Ký gửi · Cá nhân.
- [CHỜ LEAD] Ô mật khẩu ở form đăng ký tổ chức; màn "Xem lại hồ sơ".
- [CHỜ LEAD] Thời điểm tiền vào ví người bán; điều kiện hiện nút trả hàng.

## Tiến độ

Phase 1 (13–19/10): Auth & Hồ sơ. Hướng dẫn chi tiết: `docs/PHASE1_GUIDE.md`. Nhánh `feature/phase1-auth`.

Tiêu chí xong Phase 1: Guest đăng ký được Member/Organization · Đăng nhập (kể cả Google) · Đổi/quên mật khẩu · Member xem/sửa hồ sơ.

| Tiêu chí               | Trạng thái (17/10)                                                            |
| ---------------------- | ----------------------------------------------------------------------------- |
| Guest đăng ký Member   | ✅ AU-03, AU-04 — API thật                                                     |
| Đăng nhập email        | ✅ AU-02 — API thật                                                            |
| Đổi / quên mật khẩu    | ✅ AU-07, AU-05, AU-06 — API thật                                              |
| Member xem/sửa hồ sơ   | ✅ Tab bar, PR-01 (+ Cài đặt), PR-02, PR-03, PR-04 — API thật (ảnh đại diện chờ upload) |
| Guest đăng ký Tổ chức  | ⏳ OA-01 → OA-06 + khung tab tổ chức (mock phần BE chưa có)                    |
| Đăng nhập Google       | ⏳ chờ OAuth client + dev build                                                |

Còn lại khác: AU-01 Splash (đang làm 17/10) · tự test checklist mục 10 · mở PR `feature/phase1-auth` → `develop`.

## Design tokens

@docs/design-tokens.md
