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
  - Còn lại: `components/ui` dùng chung · `lib/api` (client, errors) · `lib/storage` · `stores` · `config` · `constants` · `theme` · `utils`.
- **Gọi API:** màn hình không gọi axios trực tiếp, chỉ gọi `features/*/api/*Api.js` qua useQuery/useMutation.
  - Mỗi nhóm API có `*.real.js` và `*.mock.js` cùng hình dạng dữ liệu; chọn bằng `MOCK` trong `src/config/env.js`.
- **Lỗi:** chuẩn hoá thành `ApiError { status, code, message, fieldErrors, reason }`. `status 0` = lỗi mạng. `reason` = lý do khoá tài khoản.
- **Token:** lưu trong expo-secure-store. Token hết hạn thì refresh một lần, thất bại thì đăng xuất. Tạm thời coi **401 hoặc 403 body rỗng** là token hết hạn [CHỜ BE trả 401].
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
- **Git:** nhánh `feature/<việc>`; commit kiểu `feat: / fix: / chore: / docs: / refactor:`.

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

- Đặt lại mật khẩu bằng **OTP 6 số qua email** (wireframe AU-05/06 đang vẽ link → chờ sửa).
- Mã Member hiển thị **mã text + QR** (ghi chú wireframe 11/10 đã bỏ QR → chờ lead chốt; QR để trong component riêng).
- API nào backend có thì gọi thật, chưa có thì mock.
  - **Phase 1 gọi thật:** đăng ký, verify-otp (REGISTER), resend-otp, đăng nhập email, refresh, logout, đổi mật khẩu (AU-07), `GET/PATCH /members/me`, `GET /members/me/code`.
  - **Phase 1 mock:** quên / đặt lại mật khẩu, upload ảnh, toàn bộ đăng ký và trạng thái tổ chức.
- Đổi mật khẩu xong: **chủ động đăng xuất**, hiện "Đổi mật khẩu thành công, mời đăng nhập lại" (BE thu hồi refresh token của mọi thiết bị, kể cả máy đang dùng).
- Bỏ nút "Xác thực email" ở PR-02 (không còn Member chưa xác thực trong app).
- Lỗi đăng nhập xử lý theo `code` (`EMAIL_NOT_VERIFIED`, `ACCOUNT_BANNED`), **không so khớp chữ trong message**. Chi tiết: `docs/PHASE1_GUIDE.md` mục AU-02.
- Role: lấy từ `account` trong response login khi BE thêm; tạm thời giải mã JWT (claim `roles`) bằng `jwt-decode`.
- Mock: `unverified@rehome.vn` → `EMAIL_NOT_VERIFIED`; `banned@rehome.vn` → `ACCOUNT_BANNED` kèm `reason`.

## API backend đang chạy thật (Swagger + code `develop`, đọc 16/10)

- **Base path:** auth và tổ chức có `/api` (`/api/auth/...`, `/api/organizations/...`); member và sản phẩm **không có `/api`** (`/members/...`, `/products/...`). `/api/v1` trong `API_CONTRACT.md` chưa áp dụng.
- **Envelope khi thành công:** `{ result, statusCode, message, isSuccess }`. Chỉ nhóm `/members` bọc; nhóm `/api/auth` trả thẳng. Bóc bằng `res.data?.result ?? res.data`.
- **Lỗi: 2 dạng, chưa có `code` hay `fieldErrors`** (cả hai đều có `message`):
  - Dạng A `{ timestamp, status, error, message, path }`: OTP, validate, sai mật khẩu, 403 chưa xác thực/bị khoá, email trùng, 500.
  - Dạng B `{ result: null, isSuccess: false, statusCode, message }`: các lỗi 400/403/404/409 còn lại.
  - Lỗi validate gộp một chuỗi: `"email: email không hợp lệ; password: ..."`.
- **Auth:**
  - `POST /api/auth/register` `{email, password, fullName, phone}` → 201 `{message}`
  - `POST /api/auth/verify-otp` `{email, otp, purpose: REGISTER|FORGOT_PASSWORD}` → `{message}`; với FORGOT_PASSWORD trả thêm `resetToken`. Xác thực REGISTER **không trả token**.
  - `POST /api/auth/resend-otp` `{email, purpose}` → `{message}`, luôn trả như nhau dù email có tồn tại hay không.
  - `POST /api/auth/login` `{email, password}` → `{accessToken, refreshToken, tokenType}` (không có user/role).
  - `POST /api/auth/refresh` `{refreshToken}` → cặp token mới; refresh token **xoay vòng** (token cũ hết dùng).
  - `POST /api/auth/logout`: cần header `Authorization`, trả 204.
  - `POST /api/auth/google` `{idToken}` → như login.
  - `POST /api/auth/password/forgot` `{email}` → 204 nhưng **gửi link web (`localhost:5500`), không gửi OTP** → mobile chưa dùng được.
  - `POST /api/auth/password/reset` `{email, resetToken, newPassword, confirmPassword}`.
  - `POST /api/auth/password/change` `{oldPassword, newPassword, newPasswordRepeat}` → 200, body là **chuỗi** "Đổi mật khẩu thành công" (mới, F008). Lỗi 400 dạng B: "Mật khẩu xác nhận không khớp." · "WRONG_PASSWORD: mật khẩu cũ không đúng." (mã lỗi nằm trong message) · "Mật khẩu mới phải khác mật khẩu cũ." · "Tài khoản chưa có mật khẩu" (tài khoản Google). Thu hồi refresh token **mọi thiết bị**. Nằm dưới `/api/auth/**` (public) → token hết hạn thì 500 và `client.js` không tự refresh. DTO không có `@NotBlank` (thiếu field → 500).
- **Member:**
  - `GET /members/me` → `result: {accountId, email, phone, fullName, avatarUrl, memberCode, emailVerified}`. Không có `createdAt`.
  - `PATCH /members/me` `{fullName, phone, avatarUrl}`: ô trống = giữ nguyên. Response thiếu `email`, `memberCode` → lưu xong gọi lại `GET /members/me`.
  - `GET /members/me/code` → `result: {memberCode}`.
- **Địa chỉ giao hàng** (mới, 16/10, Phase sau): `GET /addresses`, `POST /addresses` `{recipientName, phone, addressDetail, isDefault}` → có envelope, không có `/api`.
- **Tổ chức:** `POST /api/organizations/register/organization` (JSON, giấy tờ là URL; email tài khoản = `contactEmail`; không có mật khẩu) → 201 `{accountId, verificationStatus}`.
- **JWT:** `sub` = email; claim `roles` là **chuỗi** `"ROLE_MEMBER"` | `"ROLE_ORGANIZATION"` | `"ROLE_MODERATOR"` | `"ROLE_ADMIN"`. Access token 15 phút, refresh token 7 ngày.
- **OTP:** 6 số, hết hạn **5 phút**, sai tối đa 5 lần, phải chờ **60 giây** mới gửi lại (sớm hơn → 429).
- **Hành vi cần biết:**
  - Đăng nhập (code develop `4a42a5d`, F008, đọc 16/10): BE đã **xoá** `isEnabled()`/`isAccountNonLocked()` khỏi `Account` (mặc định của Spring = `true`), nên `authenticate()` chỉ còn kiểm mật khẩu. Thứ tự hiện tại:
    - Sai mật khẩu / email không tồn tại → 401 "Sai email hoặc password". **Đã kiểm tra thật 16/10** (trước F008; theo code vẫn vậy).
    - Đúng mật khẩu, bị khoá → 403 dạng A "Tài khoản đã bị khoá!!".
    - Đúng mật khẩu, chưa xác thực → 403 dạng A "Tài khoản chưa được xác thực. Vui lòng thử lại sau!!".
    - **Vẫn chưa có field `code`** → mobile không phân biệt được 2 trường hợp 403 (không so chữ trong message) [CHỜ BE]. Chưa curl kiểm tra trên server.
  - **Lỗi bảo mật do F008** [CHỜ BE, đã báo 16/10]: `isEnabled()` giờ luôn `true` nhưng còn dùng ở `JwtAuthenticationFilter`, `refreshToken()`, `OtpServiceImpl` → tài khoản **bị khoá vẫn dùng token và refresh được mãi**; quên mật khẩu không chặn tài khoản bị khoá/chưa xác thực.
  - Thiếu hoặc hết hạn access token trên API cần đăng nhập: trả **403 body rỗng**, không phải 401. **Đã kiểm tra thật 16/10** với `GET /members/me` không có token. Refresh token sai/hết hạn: 403 (theo code).
  - Logout khi access token đã hết hạn → 500.
  - Đăng ký trùng email → 409; trùng SĐT → 500 (BE chưa kiểm tra).
  - BE chỉ kiểm mật khẩu ≥ 6 ký tự; mobile vẫn dùng ≥ 8, có chữ và số.
- **Chưa có:** API `/me` chung (role, trạng thái tổ chức), upload file, trạng thái/nộp lại hồ sơ tổ chức.

## Đang chờ xác nhận

- [CHỜ BE] Lỗi đăng nhập có field `code` riêng: chưa xác thực → 403 `EMAIL_NOT_VERIFIED`; bị khoá → 403 `ACCOUNT_BANNED` (+ `reason`). Áp dụng cho `/auth/login`, `/auth/login/google` và `/auth/refresh` khi bị khoá.
- [CHỜ BE] Login trả thêm `account { id, role, verificationStatus }`.
- [CHỜ BE] Mọi lỗi theo một dạng envelope, có field `code`.
- [CHỜ BE] Quên mật khẩu bằng OTP: forgot gửi OTP → verify-otp (FORGOT_PASSWORD) trả `resetToken` → reset.
- [CHỜ BE] `POST /uploads`; đăng ký tổ chức có mật khẩu; token hết hạn trả 401; logout không lỗi 500 khi token hết hạn.
- [CHỜ BE] Thống nhất base path, tên field OTP (`otp` hay `otpCode`), body reset password; API 4 (nộp lại hồ sơ tổ chức).
- [CHỜ BE] (báo 16/10, sau F008) Thay các chỗ dùng `isEnabled()` bằng kiểm `status == ACTIVE` (+ `emailVerified` nơi cần); `/refresh` khi bị khoá → 403 `ACCOUNT_BANNED`.
- [CHỜ BE] (báo 16/10) Đổi mật khẩu: lỗi sai mật khẩu cũ có `code: WRONG_PASSWORD` riêng; chuyển khỏi `/api/auth/**` (hoặc trả 401 khi thiếu token); DTO có `@NotBlank`; xác nhận việc thu hồi token cả thiết bị đang dùng có chủ ý không.
- [CHỜ BE] Ngày sinh/giới tính (DB chưa có cột); `createdAt` cho "tham gia MM/YYYY" ở PR-01.
- [CHỜ LEAD] Xoá ghi chú ③ ở wireframe AU-04 (chưa xác thực vẫn đăng nhập được).
- [CHỜ LEAD] Địa chỉ email hỗ trợ ReHome (thông báo tài khoản bị khoá).
- [CHỜ LEAD] Mã Member có QR không (ghi chú wireframe 11/10 đã bỏ QR).
- [CHỜ LEAD] Tab dưới Member: 4 hay 5 tab (tạm dùng 4: Mua sắm · Cộng đồng · Ký gửi · Cá nhân).
- [CHỜ LEAD] Ô mật khẩu ở form đăng ký tổ chức; màn "Xem lại hồ sơ".
- [CHỜ LEAD] Thời điểm tiền vào ví người bán; điều kiện hiện nút trả hàng.

## Tiến độ

Phase 1 (13–19/10): Auth & Hồ sơ. Hướng dẫn chi tiết: `docs/PHASE1_GUIDE.md`.

## Design tokens

@docs/design-tokens.md
