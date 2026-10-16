# ReHome Mobile — Hướng dẫn Phase 1 (Auth & Hồ sơ)

> Phase 1: 13/10 – 19/10/2026 (theo _Kế hoạch triển khai code_ 13/10).
> Stack: React Native + **Expo (SDK 58)** + **JavaScript** + expo-router. Demo trên Android thật.
> Nguồn: _Tài liệu tổng quan hệ thống (sau Review 1)_, _Thiết kế Database_, wireframe của lead (canvas "ReHome — Wireframe toàn hệ thống"), và các quyết định bạn đã chốt trong chat.
> Ký hiệu: **[GIẢ ĐỊNH]** = mình tạm đặt vì chưa có quyết định, phải sửa khi có thông tin thật. **[CHỜ BE]** / **[CHỜ LEAD]** = đã hỏi, đang chờ trả lời (danh sách ở `CLAUDE.md`).
> API: **code theo thứ đang chạy thật** (Swagger + code `../rehome-backend` nhánh develop), không theo `docs/API_CONTRACT.md` khi lệch. URL, field, cách bóc response chỉ nằm trong `features/*/api/*.real.js` và `src/lib/api`.

---

## 0. Phase 1 gồm những gì và thế nào là "xong"

### 0.1. Danh sách màn hình

| Mã wireframe  | Màn                                               | Route đề xuất                                               | Ưu tiên |
| ------------- | ------------------------------------------------- | ----------------------------------------------------------- | ------- |
| AU-01         | Splash, khôi phục phiên đăng nhập                 | (splash native)                                             | P0      |
| AU-02         | Đăng nhập (email + mật khẩu, nút Google)          | `(auth)/login`                                              | P0      |
| AU-03         | Đăng ký: chọn Cá nhân / Tổ chức, form Member      | `(auth)/register`                                           | P0      |
| AU-04         | Xác thực email bằng OTP 6 số                      | `(auth)/verify-email`                                       | P0      |
| AU-05         | Quên mật khẩu: nhập email → gửi OTP               | `(auth)/forgot-password`                                    | P0      |
| AU-06         | Đặt mật khẩu mới: OTP + mật khẩu mới              | `(auth)/reset-password`                                     | P0      |
| AU-07         | Đổi mật khẩu                                      | `(member)/profile/change-password`, `(org)/change-password` | P1      |
| PR-01         | Tab Cá nhân (menu tài khoản), có bản Guest        | `(member)/(tabs)/account`                                   | P0      |
| PR-02         | Xem hồ sơ                                         | `(member)/profile`                                          | P1      |
| PR-03         | Sửa hồ sơ                                         | `(member)/profile/edit`                                     | P1      |
| PR-04         | Mã Member (mã text + QR)                          | `(member)/profile/member-code`                              | P1      |
| OA-01 → OA-04 | Đăng ký tổ chức 4 bước                            | `(auth)/org-register/*`                                     | P1      |
| (OA-05)       | Xem lại hồ sơ trước khi gửi (wireframe chưa vẽ)   | `(auth)/org-register/review`                                | P1      |
| OA-06         | Tổ chức: chờ xác minh / bị từ chối                | `(org-status)/verification`                                 | P1      |
| —             | Khung tab của Organization đã duyệt (màn giữ chỗ) | `(org)/(tabs)/*`                                            | P2      |

**Thứ tự gợi ý (còn 4 ngày):**

- 16/10: tạo project, theme, component, lớp API, store, khung điều hướng.
- 17/10: AU-02 → AU-06.
- 18/10: PR-01 → PR-04, AU-07, OA-01 → OA-04.
- 19/10: OA-05, OA-06, khung tab tổ chức, tự test, mở PR.

Nếu không kịp, để sau theo thứ tự: đăng nhập Google thật, đổi ảnh đại diện thật, đổi email.

### 0.2. Định nghĩa "xong"

- Chạy được trên Android thật qua Expo Go, không màn đỏ, không warning nghiêm trọng.
- Mọi luồng trong mục 10 (checklist) chạy được với **dữ liệu giả**. API nào backend đã có thì gọi thật.
- Tắt app mở lại vẫn giữ đăng nhập; đăng xuất thì về chế độ Guest.
- Không có mã màu viết trực tiếp trong màn hình, không có secret trong code.
- Đã push nhánh và mở Pull Request cho lead, kèm hướng dẫn test.

### 0.3. Quyết định đang áp dụng và chỗ lệch (báo lead)

| #   | Nội dung                                                                                                                                                   | Cách làm trong Phase 1                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quên mật khẩu: wireframe AU-05/06 dùng **liên kết qua email**; bạn đã chốt dùng **OTP 6 số**                                                               | Làm OTP, **gọi mock** (BE hiện gửi link web) [CHỜ BE]. Màn AU-06 gộp: ô OTP + mật khẩu mới. Nhờ lead sửa wireframe               |
| 2   | Mã Member: ghi chú wireframe ngày 11/10 **bỏ quét QR** (PR-04 chỉ hiện mã text); bạn muốn **QR + mã text**                                                 | Làm cả hai, QR tách thành component riêng để bỏ dễ. Cần chốt với lead                                                            |
| 3   | Tab dưới của Member lệch giữa các màn: BR-01 có 4 tab (Mua sắm, Cộng đồng, Ký gửi, Cá nhân); PR-01 có 5 tab (Khám phá, Cộng đồng, Thử đồ, Ký gửi, Cá nhân) | **[GIẢ ĐỊNH]** 4 tab theo BR-01; khai báo bằng mảng cấu hình để đổi nhanh. Hỏi lead                                              |
| 4   | Tab Organization (OC-01, OP-01): Chiến dịch, Bài viết, Tin nhắn, Hồ sơ                                                                                     | Làm khung, nội dung để Phase 6                                                                                                   |
| 5   | Đăng ký tổ chức (OA-01 → 04) **không có ô mật khẩu**, và OA-05 "Xem lại hồ sơ" chưa vẽ                                                                     | **[GIẢ ĐỊNH]** thêm Mật khẩu + Nhập lại ở bước 2, và tự làm màn Xem lại. Toàn bộ tổ chức **gọi mock** (BE chưa có mật khẩu, upload) [CHỜ BE] [CHỜ LEAD] |
| 6   | PR-02/PR-03 có Ngày sinh, Giới tính; bảng `MemberProfile` trong thiết kế DB **không có cột này**                                                           | Làm UI, đánh dấu chờ backend. Hỏi backend                                                                                        |
| 7   | PR-03 có "Đổi email (xác thực lại OTP)": không có trong UC/Function                                                                                        | Để sau (P2)                                                                                                                      |
| 8   | Đăng nhập sai: "còn 3 lần thử trước khi khoá 15 phút" (AU-02) không có trong bảng tham số mục 11                                                           | Chỉ hiển thị thông báo backend trả về, không tự đếm                                                                              |
| 9   | AU-04 ghi chú ③: chưa xác thực email vẫn đăng nhập được. **Đã chốt ngược lại** theo L-01 + BE: chưa xác thực thì **không đăng nhập được**                  | Chỉ có Guest và Member đã xác thực. Bỏ nút "Xác thực email" ở PR-02. Lỗi đăng nhập xử lý theo AU-02 [CHỜ LEAD xoá ghi chú ③]    |
| 10  | Thử đồ có Đầm (Áo + Quần **hoặc** Đầm)                                                                                                                     | Không thuộc Phase 1, ghi nhận cho Phase 6                                                                                        |

---

## 1. Chuẩn bị máy

1. Cài **Node.js bản LTS** (nodejs.org) và **Git**. Kiểm tra:
   ```bash
   node -v
   npm -v
   git --version
   ```
2. Điện thoại Android: cài **Expo Go** từ CH Play. Máy tính và điện thoại **cùng Wi-Fi**.
3. VS Code nên cài: ESLint, Prettier, "Expo Tools".
4. Tạo sẵn tài khoản ở **expo.dev** (dùng ở mục 12).

---

## 2. Nhánh Git

Repo `rehome-mobile` hiện chỉ có `README.md` và `.gitignore` trên `main`.

```bash
cd rehome-mobile
git checkout main
git pull
git checkout -b feature/phase1-auth
```

Quy ước commit dùng giống repo web của nhóm (Conventional Commits): `feat: ...`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`.
Commit nhỏ, mỗi commit một việc. Hỏi lead PR merge vào `develop` hay `main` (repo web đang có `develop`).

---

## 3. Tạo project Expo bên trong repo có sẵn

`create-expo-app` không tạo vào thư mục đã có file, nên tạo ở thư mục tạm rồi chép sang.

```bash
# đứng ở thư mục CHA của rehome-mobile
npx create-expo-app@latest rehome-mobile-tmp --template blank
```

- Template `blank` là JavaScript, chưa có expo-router (mục 4 sẽ cài).
- Chép **toàn bộ** nội dung `rehome-mobile-tmp` sang `rehome-mobile`, **trừ** thư mục `.git` (nếu có) và `node_modules`.
- File `.gitignore`: dùng bản của Expo, rồi thêm dòng `.env` nếu chưa có.
- Xoá thư mục `rehome-mobile-tmp`.

```bash
cd rehome-mobile
npm install
npx expo start
```

Quét QR bằng Expo Go → thấy màn trắng "Open up App.js…" là đúng.

```bash
git add .
git commit -m "chore: init expo project (blank, javascript)"
```

---

## 4. Cài thư viện và cấu hình

**Nguyên tắc:** thư viện có code native → `npx expo install` (tự chọn bản khớp SDK). Thư viện thuần JS → `npm install`.

### 4.1. expo-router

```bash
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

- `package.json`: đổi `"main"` thành `"expo-router/entry"`.
- Xoá `App.js` và `index.js` ở gốc (expo-router thay thế).
- `app.json`: thêm `"scheme": "rehome"` trong `"expo"`. Đổi `"name": "ReHome"`. Sau này build APK cần `"android": { "package": "com.rehome.mobile" }` **[GIẢ ĐỊNH]**, hỏi lead tên package.

### 4.2. Các thư viện Phase 1

```bash
npx expo install expo-secure-store expo-splash-screen expo-font @expo-google-fonts/be-vietnam-pro expo-image-picker expo-document-picker react-native-svg expo-clipboard expo-brightness
npm install axios @tanstack/react-query zustand react-hook-form zod @hookform/resolvers react-native-qrcode-svg dayjs jwt-decode
```

| Thư viện                                                         | Dùng cho                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------- |
| expo-secure-store                                                | Lưu access/refresh token an toàn                           |
| expo-splash-screen, expo-font, @expo-google-fonts/be-vietnam-pro | Giữ splash khi đang tải font và phiên; font Be Vietnam Pro |
| expo-image-picker                                                | Ảnh đại diện, chụp CCCD, chụp giấy tờ                      |
| expo-document-picker                                             | Chọn file PDF giấy tờ tổ chức                              |
| react-native-svg + react-native-qrcode-svg                       | Vẽ QR mã Member                                            |
| expo-clipboard                                                   | Nút "Sao chép mã"                                          |
| expo-brightness                                                  | PR-04 tự tăng độ sáng (P2, có thể bỏ)                      |
| axios                                                            | Gọi HTTP                                                   |
| @tanstack/react-query                                            | Cache dữ liệu server, loading/error, gọi lại               |
| zustand                                                          | State đăng nhập, state form đăng ký tổ chức nhiều bước     |
| react-hook-form + zod + @hookform/resolvers                      | Form và validate                                           |
| dayjs                                                            | Định dạng ngày                                             |
| jwt-decode                                                       | Đọc role và hạn (`exp`) trong access token (không kiểm chữ ký) |

Bản đồ (OA-04) và đăng nhập Google **chưa cài**:

- Bản đồ để sau. Phase 1 nhập địa chỉ bằng chữ, toạ độ để trống hoặc giả.
- Google cần dev build (Expo Go không chạy được thư viện native ngoài bộ có sẵn). Phase 1 chỉ làm nút và gọi mock.

### 4.3. Đường dẫn rút gọn `@/`

Tạo `jsconfig.json` ở gốc:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  }
}
```

Viết `import { colors } from '@/theme'` thay vì `../../../theme`. Đổi file này xong thì tắt và chạy lại `npx expo start`.

### 4.4. Biến môi trường

Tạo `.env` (**không commit**) và `.env.example` (**có commit**, chỉ chứa giá trị mẫu):

```bash
EXPO_PUBLIC_API_BASE_URL=https://<backend-dev-url>
EXPO_PUBLIC_USE_MOCK=true
```

- Biến `EXPO_PUBLIC_*` được nhúng vào app, **ai cũng đọc được**. Không bao giờ để secret ở đây.
- Trên điện thoại thật, `localhost` là chính điện thoại. Dùng URL Railway/Render của backend, hoặc IP LAN của máy chạy backend (ví dụ `http://192.168.1.10:8080`).

```bash
git commit -am "chore: setup expo-router, libraries, path alias, env"
```

---

## 5. Cấu trúc thư mục

```
rehome-mobile/
├─ app.json · package.json · jsconfig.json · .env.example
├─ assets/                       # icon, splash, ảnh tĩnh
└─ src/
   ├─ app/                       # CHỈ khai báo route (expo-router). File route mỏng: import Screen từ features rồi export
   │  ├─ _layout.js              # Root: font, splash, providers, khôi phục phiên, chặn route theo vai
   │  ├─ (auth)/                 # Chỉ cho người CHƯA đăng nhập
   │  │  ├─ _layout.js
   │  │  ├─ login.js · register.js · verify-email.js · forgot-password.js · reset-password.js
   │  │  └─ org-register/
   │  │     ├─ _layout.js        # header + stepper 4 bước
   │  │     └─ info.js · representative.js · documents.js · location.js · review.js
   │  ├─ (member)/               # Guest + Member
   │  │  ├─ _layout.js
   │  │  ├─ (tabs)/
   │  │  │  ├─ _layout.js        # thanh tab dưới (khai báo bằng mảng cấu hình)
   │  │  │  └─ index.js (Mua sắm) · community.js · consign.js · account.js
   │  │  └─ profile/
   │  │     └─ index.js · edit.js · member-code.js · change-password.js
   │  ├─ (org-status)/           # Tổ chức chưa được duyệt: chờ xác minh / bị từ chối
   │  │  └─ _layout.js · verification.js   # KHÔNG đặt index.js ở đây: trùng URL "/" với tab Mua sắm
   │  └─ (org)/                  # Tổ chức đã xác minh
   │     ├─ _layout.js
   │     ├─ (tabs)/
   │     │  └─ _layout.js · campaigns.js · posts.js · messages.js · profile.js
   │     └─ change-password.js
   ├─ features/                  # Mỗi nghiệp vụ một thư mục, chứa mọi thứ của nó
   │  ├─ auth/
   │  │  ├─ api/                 # authApi.js (chọn mock/real) · authApi.real.js · authApi.mock.js
   │  │  ├─ screens/             # LoginScreen.js, RegisterScreen.js, VerifyEmailScreen.js …
   │  │  ├─ components/
   │  │  └─ schemas.js           # zod schema của các form auth
   │  ├─ profile/                # api/ screens/ components/ schemas.js
   │  └─ organization/           # api/ screens/ components/ schemas.js
   │                             # store/orgRegisterStore.js, constants.js (loại hình, checklist giấy tờ)
   ├─ components/ui/             # Component dùng chung, không biết gì về nghiệp vụ
   ├─ lib/
   │  ├─ api/                    # client.js (axios + token + refresh) · errors.js (chuẩn hoá lỗi)
   │  ├─ storage/                # tokenStorage.js (SecureStore)
   │  └─ query/                  # queryClient.js
   ├─ stores/                    # authStore.js
   ├─ config/                    # env.js
   ├─ constants/                 # roles.js, status.js: enum dùng chung, không viết chuỗi rải rác
   ├─ theme/                     # colors.js · typography.js · spacing.js · index.js
   └─ utils/                     # format.js (tiền, ngày, SĐT) · validators.js
```

**Quy tắc:**

1. `src/app` chỉ chứa route. Logic và giao diện nằm trong `features/*/screens`.
2. Màn hình **không gọi axios trực tiếp**. Chỉ gọi hàm trong `features/*/api`, thường qua `useQuery` / `useMutation`.
3. Màu, cỡ chữ, khoảng cách luôn lấy từ `@/theme`.
4. Trạng thái, role, enum lấy từ `@/constants`.
5. Mọi chữ trên giao diện bằng tiếng Việt có dấu.

---

## 6. Theme và component dùng chung

### 6.1. `src/theme/colors.js`

Nguồn: `docs/design-tokens.md` (file này là chuẩn; lệch thì sửa theo nó):

```js
export const colors = {
  primary: "#006B2C", // nút chính, giá, trạng thái hoạt động
  secondary: "#FEA619", // nhấn mạnh, badge — luôn dùng chữ tối trên nền này
  accent: "#00685F", // link, hành động phụ
  neutral: "#DDE5D9", // viền, khung ảnh
  background: "#F6F9F4",
  surface: "#FFFFFF",
  text: "#1F2A37",
  textSecondary: "#5B6776",
  onPrimary: "#FFFFFF",
  error: "#D92D20",
  success: "#006B2C",
  disabled: "#C4CBC1", // [GIẢ ĐỊNH] chưa có trong design-tokens.md
};
```

### 6.2. `src/theme/typography.js`

Trên Android, `fontWeight` **không tự chọn file font**. Mỗi độ đậm phải là một `fontFamily` riêng:

```js
export const fonts = {
  regular: "BeVietnamPro_400Regular",
  medium: "BeVietnamPro_500Medium",
  semibold: "BeVietnamPro_600SemiBold",
  bold: "BeVietnamPro_700Bold",
};

export const textStyles = {
  title: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 28 },
  heading: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
};
```

`spacing.js` theo `design-tokens.md`: khoảng cách `xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32`; bo góc `radius: { input: 12, button: 12, card: 16, pill: 999 }`; bóng nhẹ cho thẻ `shadow.card` (Android dùng `elevation: 2`, iOS dùng `shadowOpacity` thấp). `index.js` export tất cả.

### 6.3. Component cần cho Phase 1 (`src/components/ui/`)

| Component                                 | Yêu cầu                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Screen`                                  | SafeArea + nền `background` + `KeyboardAvoidingView` + tuỳ chọn cuộn                             |
| `AppHeader`                               | Nút ← (có `accessibilityLabel="Quay lại"`) + tiêu đề + chỗ cho nút phải                          |
| `Button`                                  | `variant`: primary / secondary / text; `loading` (spinner, chặn bấm 2 lần); `disabled`; cao ≥ 48 |
| `TextField`                               | label (có `*` nếu bắt buộc), helper, error (đỏ, đậm), ẩn/hiện mật khẩu, `keyboardType`           |
| `OtpInput`                                | 6 ô, tự nhảy ô, dán được cả mã, chỉ nhận số; dùng chung AU-04, AU-06                             |
| `PasswordChecklist`                       | Các dòng ✓: ≥ 8 ký tự, có chữ và số (thêm "khác mật khẩu hiện tại" ở AU-07)                      |
| `Checkbox`, `RadioCard`                   | Điều khoản (AU-03), chọn Cá nhân / Tổ chức (AU-03), loại hình tổ chức (OA-01)                    |
| `ChipGroup`                               | Chọn ngày T2 … CN (OA-04)                                                                        |
| `Stepper`                                 | 4 bước: Tổ chức · Đại diện · Giấy tờ · Nhận đồ (✓ cho bước đã xong)                              |
| `FileItem`                                | Tên file, nút Xoá, các ô khai báo giấy tờ (OA-03)                                                |
| `NoteBox`                                 | Ô ghi chú viền đứt (wireframe dùng nhiều)                                                        |
| `EmptyState`, `ErrorState`, `LoadingView` | Dùng chung cho mọi màn có dữ liệu                                                                |
| `ConfirmDialog`                           | Xác nhận đăng xuất                                                                               |

Làm `Button` và `TextField` trước, test kỹ, rồi mới làm màn hình.

---

## 7. Lớp gọi API, xử lý lỗi, dữ liệu giả

### 7.1. `src/config/env.js`

```js
// Phải viết đúng process.env.EXPO_PUBLIC_..., không destructure — Expo thay giá trị lúc build
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === "true",
};

// Bật/tắt mock theo từng nhóm API: backend xong nhóm nào thì đổi nhóm đó sang ENV.USE_MOCK
export const MOCK = {
  auth: ENV.USE_MOCK, // đăng ký, OTP, đăng nhập, refresh, logout — BE đã có
  profile: ENV.USE_MOCK, // /members/me, /members/me/code — BE đã có
  password: true, // quên / đặt lại / đổi mật khẩu — [CHỜ BE] bản OTP, API đổi mật khẩu
  upload: true, // [CHỜ BE] POST /uploads
  organization: true, // [CHỜ BE] đăng ký có mật khẩu, trạng thái hồ sơ
};
```

Nhóm nào BE chưa có thì để `true` cứng: dù `.env` đặt `USE_MOCK=false` để test API thật, các nhóm này vẫn chạy mock.

### 7.2. `src/lib/api/errors.js`

Màn hình chỉ làm việc với **một kiểu lỗi**, dù lỗi đến từ mock hay axios.

BE hiện trả **2 dạng lỗi**, cả hai đều có `message`, **chưa có `code`** [CHỜ BE]:

- Dạng A: `{ timestamp, status, error, message, path }`
- Dạng B: `{ result: null, isSuccess: false, statusCode, message }`
- 403 do thiếu/hết hạn token: body **rỗng**.

`toApiError` đọc `data.code` nếu có, không có thì dùng `HTTP_<status>`. Khi BE thêm `code`, file này không phải sửa.

```js
// src/constants/errorCodes.js — mã lỗi màn hình được phép so sánh
export const ERROR_CODES = {
  NETWORK: "NETWORK",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED", // [CHỜ BE] hiện BE trả HTTP_403
  ACCOUNT_BANNED: "ACCOUNT_BANNED", // [CHỜ BE] hiện BE trả HTTP_403
};
```

```js
// src/lib/api/errors.js
export class ApiError extends Error {
  constructor({ status = 0, code = "UNKNOWN", message, fieldErrors = {}, reason = null }) {
    super(message);
    this.status = status; // 0 = lỗi mạng / timeout
    this.code = code; // data.code của BE, hoặc "HTTP_<status>" khi BE chưa có code
    this.fieldErrors = fieldErrors; // { email: '…' } — BE hiện chưa trả, luôn rỗng
    this.reason = reason; // lý do khoá tài khoản (ACCOUNT_BANNED) — [CHỜ BE]
  }
}

const DEFAULT_MESSAGE = "Có lỗi xảy ra, vui lòng thử lại.";

export function toApiError(error) {
  if (error instanceof ApiError) return error;
  if (!error?.response) {
    return new ApiError({
      status: 0,
      code: "NETWORK",
      message: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.",
    });
  }
  const { status, data } = error.response;
  const body = data && typeof data === "object" ? data : {}; // 403 thiếu token: body rỗng
  return new ApiError({
    status,
    code: body.code ?? "HTTP_" + status,
    message: body.message || DEFAULT_MESSAGE, // có ở cả dạng A và dạng B
    fieldErrors: body.fieldErrors ?? {},
    reason: body.reason ?? null,
  });
}
```

**Không so khớp chữ trong `message`** để đoán loại lỗi (ví dụ tìm chữ "chưa xác minh"): BE đổi câu chữ là hỏng. Chỉ so `code` và `status`.

### 7.3. `src/lib/storage/tokenStorage.js`

```js
import * as SecureStore from "expo-secure-store";

const ACCESS = "rehome_access_token";
const REFRESH = "rehome_refresh_token";

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH),
  async save({ accessToken, refreshToken }) {
    await SecureStore.setItemAsync(ACCESS, accessToken);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH, refreshToken);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS);
    await SecureStore.deleteItemAsync(REFRESH);
  },
};
```

### 7.4. `src/lib/api/client.js`

Axios, gắn token, tự làm mới token khi token hết hạn. Cùng ý tưởng với `baseApi.js` của web.

> **Token hết hạn hiện trả 403, không phải 401** [CHỜ BE]. BE chưa khai báo `AuthenticationEntryPoint`, nên khi thiếu hoặc hết hạn access token, Spring Security trả **403 với body rỗng**. 403 do BE tự ném (không đủ quyền…) thì **có body** (`message`). Vì vậy tạm coi "401, hoặc 403 body rỗng" là token hết hạn. Khi BE sửa thành 401, chỉ cần xoá điều kiện 403 trong `isTokenExpired`.
> Refresh token sai hoặc hết hạn cũng trả 403 → đăng xuất.

```js
import axios from "axios";
import { ENV } from "@/config/env";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { toApiError } from "./errors";

// Server Render ngủ khi không dùng: request đầu tiên có thể mất vài chục giây
export const api = axios.create({ baseURL: ENV.API_BASE_URL, timeout: 30000 });

// BE bọc { result, statusCode, message, isSuccess } ở /members; /api/auth trả thẳng
export const unwrap = (res) => res.data?.result ?? res.data;

let onSessionExpired = () => {};
export const setOnSessionExpired = (fn) => {
  onSessionExpired = fn; // authStore đăng ký: nhận ApiError để biết lý do (ví dụ ACCOUNT_BANNED)
};

api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// [TẠM] bỏ điều kiện 403 khi BE trả 401 cho token hết hạn
function isTokenExpired(error) {
  const { status, data } = error.response ?? {};
  return status === 401 || (status === 403 && !data);
}

let refreshing = null;
async function refreshTokens() {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) throw new Error("NO_REFRESH_TOKEN");
  // Dùng axios gốc (không qua interceptor) để không lặp vô hạn
  const res = await axios.post(`${ENV.API_BASE_URL}/api/auth/refresh`, { refreshToken });
  const data = unwrap(res);
  // Refresh token xoay vòng: luôn lưu đè cả hai
  await tokenStorage.save({ accessToken: data.accessToken, refreshToken: data.refreshToken });
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!isTokenExpired(error) || original?._retry || original?.url?.includes("/api/auth/")) {
      return Promise.reject(toApiError(error));
    }
    original._retry = true;
    try {
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });
      await refreshing;
      return api(original);
    } catch (refreshError) {
      // Lỗi của chính lần refresh: ACCOUNT_BANNED [CHỜ BE] hoặc refresh token hết hạn
      const reason = toApiError(refreshError);
      onSessionExpired(reason);
      return Promise.reject(reason);
    }
  },
);
```

### 7.5. Mẫu một nhóm API có mock: `features/auth/api/`

Trong cùng nhóm auth, có hàm BE đã có (đăng nhập, OTP…) và hàm chưa có (mật khẩu). `authApi.js` chọn mock/real **theo từng nhóm hàm**:

```js
// authApi.js — màn hình chỉ import file này
import { MOCK } from "@/config/env";
import * as real from "./authApi.real";
import * as mock from "./authApi.mock";

const base = MOCK.auth ? mock : real;
const password = MOCK.password ? mock : real;

export const authApi = {
  ...base,
  forgotPassword: password.forgotPassword,
  resetPassword: password.resetPassword,
  changePassword: password.changePassword,
};
```

Login của BE **chỉ trả token**, không có user/role. `getMe()` ở bản real tự ghép `user` từ JWT + `/members/me`, để `authStore` (mục 8.2) không phải biết chuyện này:

```js
// authApi.real.js
import { jwtDecode } from "jwt-decode";
import { api, unwrap } from "@/lib/api/client";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { ROLES } from "@/constants/roles";

export const login = async ({ email, password }) =>
  unwrap(await api.post("/api/auth/login", { email, password })); // { accessToken, refreshToken, tokenType }

// [TẠM] đọc role từ claim "roles" ("ROLE_MEMBER"); bỏ khi login trả account.role [CHỜ BE]
export function roleFromToken(accessToken) {
  const { roles = "" } = jwtDecode(accessToken);
  return roles.split(",")[0]?.replace("ROLE_", "") || null;
}

export async function getMe() {
  const role = roleFromToken(await tokenStorage.getAccessToken());
  if (role !== ROLES.MEMBER) return { role }; // tổ chức: chưa có API thông tin [CHỜ BE]
  const profile = unwrap(await api.get("/members/me")); // không có tiền tố /api
  return { role, ...profile };
}
// … các hàm còn lại theo bảng 7.6
```

Sau khi đăng nhập thành công: lưu token → gọi `getMe()` → `signIn({ accessToken, refreshToken, user })`.

```js
// authApi.mock.js — trả về ĐÚNG hình dạng như real, có độ trễ và có lỗi
import { ApiError } from "@/lib/api/errors";
import { ERROR_CODES } from "@/constants/errorCodes";
const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));

export async function login({ email, password }) {
  await delay();
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user || password !== "Rehome123") {
    throw new ApiError({ status: 401, code: "HTTP_401", message: "Sai email hoặc password" });
  }
  // Cùng thứ tự với BE: kiểm bị khoá trước, rồi mới tới chưa xác thực
  if (user.status === "BANNED") {
    throw new ApiError({
      status: 403,
      code: ERROR_CODES.ACCOUNT_BANNED,
      message: "Tài khoản đã bị khoá.",
      reason: user.banReason,
    });
  }
  if (!user.emailVerified) {
    throw new ApiError({
      status: 403,
      code: ERROR_CODES.EMAIL_NOT_VERIFIED,
      message: "Tài khoản chưa xác minh email.",
    });
  }
  return { accessToken: "mock-access", refreshToken: "mock-refresh", tokenType: "Bearer" };
}
```

**Tài khoản giả** (`MOCK_USERS`), mật khẩu chung `Rehome123`:

| Email                     | Dùng để test                                                                 |
| ------------------------- | ---------------------------------------------------------------------------- |
| `member@rehome.vn`        | Member đã xác thực email                                                     |
| `unverified@rehome.vn`    | Đăng nhập → `EMAIL_NOT_VERIFIED` → tự gửi lại OTP, sang AU-04                |
| `banned@rehome.vn`        | Đăng nhập → `ACCOUNT_BANNED`, `reason: "Đăng bán hàng giả nhiều lần."`       |
| `org-pending@rehome.vn`   | Tổ chức PENDING → OA-06 chờ xác minh                                         |
| `org-rejected@rehome.vn`  | Tổ chức REJECTED → OA-06 bị từ chối, có lý do                                |
| `org-verified@rehome.vn`  | Tổ chức VERIFIED → khung tab tổ chức                                         |
| `taken@rehome.vn`         | Đăng ký bị trùng email                                                       |

Tài khoản tổ chức mock đăng nhập bằng email vì API login chỉ nhận email. Tổ chức đăng nhập bằng gì: [CHỜ BE] [CHỜ LEAD].

OTP giả: `123456` đúng, `000000` hết hạn, mã khác thì sai.

### 7.6. API cho Phase 1 — theo API đang chạy thật (Swagger + code BE develop, 16/10)

**Base path lệch nhau:** nhóm auth/tổ chức có `/api`; nhóm member **không có `/api`**. **Envelope:** chỉ `/members` bọc `{ result, … }`; `/api/auth` trả thẳng. `unwrap` xử lý được cả hai.

**Gọi thật:**

| Việc                | Method + path                    | Body gửi đi                                    | Kết quả (sau `unwrap`)                                       |
| ------------------- | -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| Đăng ký Member      | `POST /api/auth/register`        | `email, password, fullName, phone`             | 201 `{ message }`, BE gửi OTP. Trùng email 409; trùng SĐT hiện ra 500 |
| Xác thực email      | `POST /api/auth/verify-otp`      | `email, otp, purpose: 'REGISTER'`              | `{ message }`, **không trả token** → về Đăng nhập            |
| Gửi lại OTP         | `POST /api/auth/resend-otp`      | `email, purpose: 'REGISTER'`                   | `{ message }`, luôn như nhau. Gửi sớm hơn 60 giây → 429       |
| Đăng nhập           | `POST /api/auth/login`           | `email, password`                              | `{ accessToken, refreshToken, tokenType }`, **không có user** |
| Làm mới token       | `POST /api/auth/refresh`         | `refreshToken`                                 | `{ accessToken, refreshToken }`; token cũ hết dùng (xoay vòng) |
| Đăng xuất           | `POST /api/auth/logout`          | — (cần header `Authorization`)                 | 204. Access token đã hết hạn → 500, bỏ qua lỗi này           |
| Thông tin Member    | `GET /members/me`                | —                                              | `{ accountId, email, phone, fullName, avatarUrl, memberCode, emailVerified }` |
| Sửa hồ sơ Member    | `PATCH /members/me`              | `fullName, phone, avatarUrl` (ô trống = giữ nguyên) | `{ accountId, fullName, phone, avatarUrl }` → gọi lại `GET /members/me` |
| Mã Member           | `GET /members/me/code`           | —                                              | `{ memberCode }`                                             |

**Mock** (hình dạng theo BE hiện có hoặc theo yêu cầu đã gửi BE):

| Việc                       | API BE hiện có / đang chờ                                                                 | Mock trả                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| Quên mật khẩu (AU-05)      | `POST /api/auth/password/forgot { email }`: hiện gửi **link web**, không gửi OTP [CHỜ BE] | 204                                          |
| Xác nhận OTP quên mật khẩu | `POST /api/auth/verify-otp { email, otp, purpose: 'FORGOT_PASSWORD' }`                    | `{ message, resetToken }`                    |
| Đặt lại mật khẩu (AU-06)   | `POST /api/auth/password/reset { email, resetToken, newPassword, confirmPassword }`       | `{ message }`                                |
| Đổi mật khẩu (AU-07)       | Chưa có (API 10) [CHỜ BE]                                                                 | 204                                          |
| Upload ảnh/tệp             | Chưa có (`POST /uploads`) [CHỜ BE]                                                        | `{ url }`                                    |
| Đăng ký tổ chức            | `POST /api/organizations/register/organization` (JSON, giấy tờ là URL, **không có mật khẩu**) [CHỜ BE] | `{ accountId, verificationStatus: 'PENDING' }` |
| Trạng thái / nộp lại hồ sơ | Chưa có (API 4) [CHỜ BE]                                                                  | `{ verificationStatus, rejectionReason, documents[] }` |
| Đăng nhập Google           | `POST /api/auth/google { idToken }` có sẵn, nhưng cần dev build                           | như đăng nhập                                |

AU-06 gộp OTP + mật khẩu mới trên một màn: bấm "Đặt lại" thì gọi lần lượt `verify-otp` (lấy `resetToken`) rồi `password/reset`.

**Ràng buộc từ BE:** OTP 6 số, hết hạn **5 phút**, sai tối đa 5 lần; chờ **60 giây** mới gửi lại. Access token 15 phút, refresh token 7 ngày. BE kiểm mật khẩu ≥ 6 ký tự; mobile vẫn dùng ≥ 8, có chữ và số.

**Hình dạng `user` trong `authStore`** (ghép ở `getMe()`, mục 7.5):

```json
{
  "role": "MEMBER",
  "accountId": "uuid",
  "email": "…",
  "phone": "…",
  "fullName": "Ngô Hải F",
  "avatarUrl": null,
  "memberCode": "MB-004821",
  "emailVerified": true
}
```

- `role` đọc từ JWT (claim `roles`) cho tới khi login trả `account { id, role, verificationStatus }` [CHỜ BE].
- Chưa có `createdAt` (PR-01 "tham gia 08/2026"), ngày sinh, giới tính [CHỜ BE].
- Tổ chức: tạm thêm `organization: { verificationStatus, rejectionReason }` từ mock.

---

## 8. Phiên đăng nhập và điều hướng theo vai

### 8.1. `src/constants/roles.js`

```js
export const ROLES = { MEMBER: "MEMBER", ORGANIZATION: "ORGANIZATION" };
export const ORG_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
};
```

### 8.2. `src/stores/authStore.js`

```js
import { create } from "zustand";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { setOnSessionExpired } from "@/lib/api/client";
import { queryClient } from "@/lib/query/queryClient";
import { authApi } from "@/features/auth/api/authApi";

export const useAuthStore = create((set, get) => ({
  status: "loading", // 'loading' | 'guest' | 'authenticated'
  user: null,
  sessionError: null, // ApiError khi bị đăng xuất ngoài ý muốn (ví dụ ACCOUNT_BANNED) — AU-02 đọc để hiện

  bootstrap: async () => {
    const refresh = await tokenStorage.getRefreshToken();
    if (!refresh) return set({ status: "guest", user: null });
    try {
      const user = await authApi.getMe();
      set({ status: "authenticated", user });
    } catch (e) {
      // Chỉ xoá phiên khi chắc chắn token hỏng (401/403, gồm cả refresh thất bại).
      // Mất mạng (status 0) thì KHÔNG xoá token, để lần mở sau còn thử lại.
      if (e.status === 401 || e.status === 403) await tokenStorage.clear();
      set({ status: "guest", user: null }); // [GIẢ ĐỊNH] hiện đơn giản; có thể làm màn "Thử lại" sau
    }
  },

  signIn: async ({ accessToken, refreshToken, user }) => {
    await tokenStorage.save({ accessToken, refreshToken });
    set({ status: "authenticated", user, sessionError: null });
  },

  signOut: async (reason = null) => {
    try {
      await authApi.logout(); // BE trả 500 nếu access token đã hết hạn — bỏ qua
    } catch {}
    await tokenStorage.clear();
    queryClient.clear();
    set({ status: "guest", user: null, sessionError: reason });
  },

  clearSessionError: () => set({ sessionError: null }),
  setUser: (user) => set({ user }),
}));

// Refresh thất bại (refresh token hết hạn, hoặc ACCOUNT_BANNED [CHỜ BE]) → đăng xuất, giữ lý do
setOnSessionExpired((reason) => useAuthStore.getState().signOut(reason));
```

Khi `sessionError.code === ERROR_CODES.ACCOUNT_BANNED`: điều hướng về AU-02 và hiện thông báo bị khoá (xem AU-02).

### 8.3. `src/app/_layout.js`: chặn route bằng `Stack.Protected`

Nhóm route nào có `guard` = `false` thì không vào được; expo-router tự chuyển về màn hợp lệ đầu tiên.

```js
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from "@expo-google-fonts/be-vietnam-pro";
import { queryClient } from "@/lib/query/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { ROLES, ORG_STATUS } from "@/constants/roles";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    useAuthStore.getState().bootstrap();
  }, []);

  const ready = fontsLoaded && status !== "loading";
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null; // AU-01: splash native vẫn đang hiện

  const isAuthed = status === "authenticated";
  const isOrg = isAuthed && user?.role === ROLES.ORGANIZATION;
  const orgVerified =
    isOrg && user?.organization?.verificationStatus === ORG_STATUS.VERIFIED;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isOrg}>
          <Stack.Screen name="(member)" />
        </Stack.Protected>
        <Stack.Protected guard={!isAuthed}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isOrg && !orgVerified}>
          <Stack.Screen name="(org-status)" />
        </Stack.Protected>
        <Stack.Protected guard={orgVerified}>
          <Stack.Screen name="(org)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
```

**Kết quả:**

- **Guest:** vào thẳng tab Mua sắm. Bấm thao tác cần đăng nhập → mở `/(auth)/login`.
- **Member:** đăng nhập xong, nhóm `(auth)` bị khoá, tự quay về tab.
- **Tổ chức chưa duyệt:** chỉ thấy màn OA-06. **Tổ chức đã duyệt:** chỉ thấy tab tổ chức.

`queryClient.js`: `export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });`

### 8.4. Tab Member: khai báo bằng mảng để đổi nhanh

```js
// src/app/(member)/(tabs)/_layout.js
import { Tabs } from "expo-router";
import { colors } from "@/theme";

const TABS = [
  // [GIẢ ĐỊNH] theo BR-01 — chờ lead chốt
  { name: "index", title: "Mua sắm" },
  { name: "community", title: "Cộng đồng" },
  { name: "consign", title: "Ký gửi" },
  { name: "account", title: "Cá nhân" },
];

export default function MemberTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title }} />
      ))}
    </Tabs>
  );
}
```

Icon: dùng `@expo/vector-icons` (có sẵn trong Expo). Tab Mua sắm, Cộng đồng, Ký gửi ở Phase 1 là màn giữ chỗ "Sắp có".

---

## 9. Spec từng màn hình

**Mẫu form chung** (áp dụng mọi màn có form):

```js
const { control, handleSubmit, setError, formState } = useForm({
  resolver: zodResolver(schema),
  defaultValues,
});
const mutation = useMutation({ mutationFn: authApi.login });

const onSubmit = handleSubmit((values) =>
  mutation.mutate(values, {
    onSuccess: (session) => useAuthStore.getState().signIn(session),
    onError: (e) => {
      Object.entries(e.fieldErrors ?? {}).forEach(([field, message]) =>
        setError(field, { message }),
      );
      if (!Object.keys(e.fieldErrors ?? {}).length)
        setError("root", { message: e.message });
    },
  }),
);
```

Nút chính dùng `loading={mutation.isPending}` để không bấm hai lần. Lỗi chung (`root`) hiện dưới ô cuối cùng.

**Validate dùng chung** (`src/utils/validators.js` + zod):

- **SĐT:** 10 số, bắt đầu bằng 0 → `/^0\d{9}$/`. Bỏ dấu cách trước khi kiểm.
- **Mật khẩu:** ≥ 8 ký tự, có cả chữ và số → `/^(?=.*[A-Za-z])(?=.*\d).{8,}$/`.
- **Email:** `z.string().email('Email không hợp lệ')`.

### AU-01 · Splash

- Splash native (`expo-splash-screen`) giữ trên màn cho tới khi tải xong font và chạy xong `bootstrap()`.
- Ảnh splash và icon đặt ở `app.json`. Đổi ảnh splash chỉ thấy khi build APK, Expo Go không hiện đúng.

### AU-02 · Đăng nhập

- **Trường:**
  - "Email \*" → field `email` (API login chỉ nhận email), kiểm định dạng email.
  - "Mật khẩu \*", có nút ẩn/hiện, chỉ kiểm không rỗng.
- **Hành động:** "Quên mật khẩu?" → AU-05 · "Đăng nhập" · "Đăng nhập bằng Google" · "Chưa có tài khoản? Đăng ký" → AU-03.
- **Thành công:** `login` → lưu token → `getMe()` → `signIn(...)`. Điều hướng tự xử lý theo `role`.
- Tổ chức: wireframe ghi đăng nhập bằng SĐT người đại diện, nhưng BE hiện chưa cho tổ chức đăng nhập [CHỜ BE] [CHỜ LEAD]. Phase 1 test tổ chức bằng tài khoản mock.
- **Lỗi:** chỉ 3 `code` được xử lý riêng; **mọi lỗi còn lại hiện `message` của BE** trong khung lỗi trên nút Đăng nhập. Không so chữ trong message, không tự đếm số lần thử.

| `code`               | Xử lý                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMAIL_NOT_VERIFIED` | Tự gọi `resend-otp { email, purpose: 'REGISTER' }`, rồi chuyển sang AU-04 kèm `email` và `reason: 'unverified'`. AU-04 hiện: "Tài khoản chưa xác thực email. Mình đã gửi mã mới tới **{email}**." Nếu resend trả 429 (vừa gửi < 60 giây) vẫn chuyển màn, bắt đầu đếm ngược. |
| `ACCOUNT_BANNED`     | Ở lại AU-02, **không chuyển màn**. Khung lỗi trên nút Đăng nhập: "Tài khoản của bạn đã bị khoá." + `reason` (nếu có) + "Cần hỗ trợ? Liên hệ email hỗ trợ ReHome" **[GIẢ ĐỊNH]** chưa có địa chỉ [CHỜ LEAD].                                                                 |
| `NETWORK`            | "Không kết nối được máy chủ…". Render ngủ: lần đầu có thể chậm, nút vẫn ở trạng thái loading.                                                                                                                                                                               |
| Còn lại              | Hiện `message` của BE (`toApiError` đã lo cả 2 dạng lỗi và body rỗng).                                                                                                                                                                                                      |

- **Link tạm "Chưa xác thực email? Gửi lại mã"** [CHỜ BE thêm `code`]: hiện dưới khung lỗi khi `status === 403` và chưa có `code` riêng (`HTTP_403`). Bấm → gọi resend-otp (REGISTER) với email đang nhập rồi sang AU-04. **Chỉ dùng nếu curl bên dưới xác nhận sai mật khẩu KHÔNG trả 403**; nếu sai mật khẩu cũng 403 thì không hiện link (sẽ gây hiểu nhầm). Bỏ link khi BE thêm `code`.
- Theo code BE hiện tại (chưa curl): sai mật khẩu → **401**; chưa xác thực và bị khoá → **403 cùng message**, và trả 403 **ngay cả khi sai mật khẩu** (Spring kiểm trạng thái tài khoản trước mật khẩu). Chi tiết ở `CLAUDE.md`.

**Việc cần kiểm — gọi thử login thật, ghi kết quả vào bảng dưới.** Chạy trong Git Bash (lần đầu có thể chờ vài chục giây vì server Render đang ngủ). Dùng tài khoản test do bạn tự tạo, **không** dán mật khẩu thật vào tài liệu.

```bash
BASE=https://re-backend-9a98.onrender.com

# 1. Sai mật khẩu (tài khoản đã xác thực)
curl -s -i -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"<email-da-xac-thuc>","password":"saimatkhau123"}'

# 2. Tài khoản chưa xác thực (đăng ký nhưng chưa nhập OTP) — thử cả đúng và sai mật khẩu
curl -s -i -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"<email-chua-xac-thuc>","password":"<mat-khau-dung>"}'

# 3. Tài khoản bị khoá (nhờ BE/admin khoá một tài khoản test)
curl -s -i -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d '{"email":"<email-bi-khoa>","password":"<mat-khau-dung>"}'
```

| Trường hợp                       | Status | Body (rút gọn) | Ngày kiểm |
| -------------------------------- | ------ | -------------- | --------- |
| Sai mật khẩu                     |        |                |           |
| Chưa xác thực, đúng mật khẩu     |        |                |           |
| Chưa xác thực, sai mật khẩu      |        |                |           |
| Bị khoá                          |        |                |           |

- **Bị khoá giữa chừng:** đang dùng app mà refresh trả `ACCOUNT_BANNED` → `signOut(reason)` (mục 8.2) → về AU-02, hiện cùng khung lỗi bị khoá từ `sessionError`, đóng thông báo thì gọi `clearSessionError()`.
- **Google:** Phase 1 chỉ có nút và gọi mock. Bản thật cần dev build và OAuth client Android (mục 12.3).

### AU-03 · Đăng ký

- **Chọn vai:** 2 thẻ "Cá nhân — Mua, ký gửi, quyên góp" / "Tổ chức — Cần giấy tờ pháp lý".
  - Chọn **Tổ chức** → chuyển sang `org-register/info`, không hiện form bên dưới.
- **Form Cá nhân:**
  - Họ và tên _ · Email _ · Số điện thoại _ · Mật khẩu _ (gợi ý: "Ít nhất 8 ký tự, có chữ và số") · Nhập lại mật khẩu \*.
  - ☐ "Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật": bắt buộc tích.
- **Zod:** `confirmPassword` phải khớp `password` (dùng `.refine`), `agree` phải `true`.
- **Lỗi:** email trùng → dưới ô Email: "Email này đã có tài khoản. Đăng nhập hoặc dùng email khác."
- **Thành công:** chuyển sang AU-04, truyền `email` qua params (`router.push({ pathname: '/verify-email', params: { email } })`).

### AU-04 · Xác thực email (OTP)

- **Mở từ:** AU-03 (vừa đăng ký) hoặc AU-02 (đăng nhập gặp `EMAIL_NOT_VERIFIED`). Params: `email`, `reason` (`'unverified'` khi mở từ AU-02).
- Chữ:
  - Từ AU-03: "Nhập mã 6 số", "Mình vừa gửi mã tới **{email}**. Kiểm tra cả mục Spam nếu chưa thấy."
  - Từ AU-02: "Tài khoản chưa xác thực email. Mình đã gửi mã mới tới **{email}**."
- `OtpInput` 6 ô. Nút "Xác nhận" chỉ bật khi đủ 6 số. API: `verify-otp { email, otp, purpose: 'REGISTER' }`.
- "Mã có hiệu lực 5 phút" (theo BE; wireframe ghi 10 phút).
- "Gửi lại mã sau 0:SS": đếm ngược **60 giây** (theo BE), hết giờ hiện link "Gửi lại mã" (gọi `resend-otp`, rồi đếm lại). BE trả 429 nếu gửi sớm.
- "Nhập sai email? Quay lại sửa" → `router.back()`.
- **Trạng thái lỗi:** BE trả **cùng một lỗi 400** cho mã sai, mã hết hạn, đã dùng hoặc sai quá 5 lần ("Mã xác thực không hợp lệ, hết hạn hoặc đã sử dụng."). Hiện message đó + gợi ý "Gửi lại mã"; không tự phân biệt.
- **Thành công:** BE **không trả token** → về Đăng nhập, điền sẵn email, hiện "Xác thực thành công, mời bạn đăng nhập."

### AU-05 · Quên mật khẩu (bản OTP — khác wireframe)

- **Phase 1 gọi mock** (`MOCK.password`): BE hiện gửi link web, chưa gửi OTP [CHỜ BE]. Luồng mục tiêu: forgot → verify-otp (FORGOT_PASSWORD) → reset (bảng 7.6).
- Nhập "Email \*" → nút "Gửi mã" → luôn chuyển sang AU-06.
- Không báo "email không tồn tại", để tránh dò tài khoản.
- Ghi chú: tài khoản tổ chức đặt lại bằng email người đại diện, cùng luồng này.

### AU-06 · Đặt mật khẩu mới

- **Trường:** `OtpInput` (mã gửi tới email) + Mật khẩu mới _ + `PasswordChecklist` + Nhập lại _.
- **Lỗi:** "Hai mật khẩu chưa khớp" · OTP sai · OTP hết hạn (kèm link "Gửi lại mã").
- **Thành công:**
  - Hiện thông báo "Đổi mật khẩu thành công", về Đăng nhập.
  - Ghi chú wireframe: đặt xong, **mọi thiết bị đang đăng nhập bị đăng xuất** (backend xử lý).

### AU-07 · Đổi mật khẩu

- **Trường:** Mật khẩu hiện tại _ · Mật khẩu mới _ · checklist (≥ 8, có chữ và số, **khác mật khẩu hiện tại**) · Nhập lại \*.
- **Lỗi:** "Mật khẩu hiện tại không đúng" dưới ô đầu.
- **Ghi chú:** đổi xong, thiết bị khác phải đăng nhập lại, thiết bị này giữ nguyên. Nếu backend trả token mới → lưu đè.
- Dùng chung cho Member (từ PR-01) và Tổ chức (từ tab Hồ sơ).

### PR-01 · Tab Cá nhân

- **Member:**
  - **Đầu trang:** họ tên + "MB-004821 · tham gia 08/2026" → bấm mở PR-02. BE chưa có `createdAt` [CHỜ BE] → tạm chỉ hiện mã Member.
  - **Danh sách mục:**
    - Số dư ví → Phase 4: ẩn hoặc "—".
    - "Mã Member của tôi — Đọc cho nhân viên khi tới kho" → PR-04.
    - Đơn hàng, Hàng ký gửi, Yêu cầu trả hàng, Địa chỉ giao hàng, Ảnh thử đồ, Tổ chức đang theo dõi, Tin nhắn → Phase sau: hiện mờ kèm "Sắp có".
    - Đổi mật khẩu → AU-07.
    - Đăng xuất → `ConfirmDialog` "Bạn có chắc muốn đăng xuất?" → `signOut()`.
- **Guest:** "Bạn đang xem với tư cách khách" + nút Đăng nhập / Tạo tài khoản.

### PR-02 · Hồ sơ cá nhân

- Hiện: ảnh đại diện, Họ và tên, mã Member, Email (badge "Đã xác minh"), Số điện thoại, Ngày sinh, Giới tính (chưa có thì "—").
- **Không có nút "Xác thực email"**: Member chưa xác thực không đăng nhập được nên không bao giờ thấy màn này.
- Nút "Sửa" → PR-03.
- Khối "Hoạt động trên ReHome" (đơn đã mua, món ký gửi, đánh giá) → Phase sau, ẩn.
- Dữ liệu: `useQuery(['me'], authApi.getMe)`, khởi tạo bằng `user` trong store.

### PR-03 · Sửa hồ sơ

- **Trường:**
  - Đổi ảnh đại diện (`expo-image-picker`). Cách upload chưa rõ → mock.
  - Họ và tên \*.
  - Ngày sinh (không có trong DB, xem 0.3 #6).
  - Email chỉ đọc, kèm "Đổi email" để P2.
  - Số điện thoại \* (lỗi: "Số điện thoại phải có 10 chữ số"; helper: "Kho gọi số này khi có việc gấp với hàng ký gửi của bạn").
- **Ghi chú:** "Hồ sơ này không phải địa chỉ giao hàng."
- **Nút:** Huỷ · Lưu thay đổi.
- **API:** `PATCH /members/me { fullName, phone, avatarUrl }`. Ảnh đại diện: upload mock trả `{ url }` rồi gửi `avatarUrl` [CHỜ BE `POST /uploads`].
- **Lưu thành công:** response PATCH thiếu `email`, `memberCode` → không `setUser` bằng response; gọi lại `getMe()` (hoặc `invalidateQueries(['me'])`) rồi `setUser` + quay lại.

### PR-04 · Mã Member

- **Nội dung:**
  - Mã cỡ lớn "MB-004821" + họ tên.
  - QR của chính chuỗi mã (`react-native-qrcode-svg`, `value={memberCode}`).
  - Nút "Sao chép mã" (`expo-clipboard`, kèm thông báo "Đã sao chép").
- Chữ: "Đọc mã này cho nhân viên khi tới kho ký gửi, rút hàng hoặc nhận hàng".
- **P2:** tăng độ sáng màn hình khi mở, trả lại khi rời (`expo-brightness`).

### OA-01 → OA-04 · Đăng ký tổ chức (4 bước)

**Chung:**

- Giữ dữ liệu cả 4 bước trong `features/organization/store/orgRegisterStore.js` (zustand). Back lại bước trước không mất dữ liệu.
- Mỗi bước có schema zod riêng; validate xong mới cho sang bước sau.
- `Stepper` trên đầu: Tổ chức · Đại diện · Giấy tờ · Nhận đồ.

**OA-01 Thông tin tổ chức:**

- Tên đầy đủ theo giấy tờ \*.
- Tên hiển thị trên nền tảng \* (helper: "Tên người dùng nhìn thấy, có thể ngắn gọn hơn").
- Loại hình tổ chức \* (radio, 5 lựa chọn):
  - Quỹ xã hội, quỹ từ thiện
  - Hội, hiệp hội, câu lạc bộ có pháp nhân
  - Câu lạc bộ trực thuộc một pháp nhân
  - Cơ sở trợ giúp xã hội ngoài công lập
  - Doanh nghiệp xã hội
  - Loại hình quyết định danh sách giấy tờ gợi ý ở bước 3.
- Mã số thuế (không bắt buộc).
- Phạm vi hoạt động \*: Toàn quốc / Tỉnh-thành / Quận-huyện / Phường-xã.
- Địa chỉ trụ sở \*.
- Số điện thoại liên hệ \* (helper: "Moderator gọi số này để xác minh — nhớ bắt máy").
- Email liên hệ \*.
- Website hoặc fanpage.
- Mô tả hoạt động \*.
- Logo (không bắt buộc; chưa có thì hiện chữ cái đầu).

**OA-02 Người đại diện:**

- Ghi chú: "Tên dưới đây phải khớp tên ghi trên giấy phép…".
- Họ và tên _ · Chức vụ _ · Số điện thoại _ ("Dùng làm tài khoản đăng nhập của tổ chức") · Email _.
- **[GIẢ ĐỊNH]** thêm Mật khẩu _ + Nhập lại _ (xem 0.3 #5).

**OA-03 Giấy tờ:**

- **Nhóm 1 — CCCD người đại diện:**
  - Ảnh mặt trước + mặt sau (bắt buộc cả 2).
  - Họ tên trên thẻ _, Số CCCD _, Ngày cấp _, Nơi cấp _.
  - Ghi chú: hai ảnh tự xoá sau khi hồ sơ được duyệt.
- **Nhóm 2 — Giấy tờ pháp lý:**
  - ≥ 1 tệp. Mỗi tệp: Loại giấy tờ \*, Số giấy tờ, Ngày cấp, Cơ quan cấp; có nút Xoá.
  - Hai nút: "Chụp giấy tờ" (image-picker, camera) và "Chọn tệp" (document-picker, cho PDF).
- **Gợi ý giấy tờ theo loại hình** (mục 9 Tài liệu tổng quan, lưu ở `constants.js`): chỉ là gợi ý, **không khoá nút**.
- **Ràng buộc:**
  - JPG/PNG/PDF; mỗi tệp ≤ 5 MB (kiểm `size` của asset trước khi thêm).
  - Tối đa 10 tệp; tối thiểu 3 tệp (2 mặt CCCD + 1 giấy tờ).

**OA-04 Địa điểm nhận đồ:**

- ☑ "Nhận đồ tại địa chỉ trụ sở đã khai ở bước 1". Bỏ tích thì nhập "Địa chỉ nhận đồ \*".
- Bản đồ kéo ghim → **để sau**. Toạ độ tạm `null` hoặc giả **[GIẢ ĐỊNH]**.
- Ngày nhận trong tuần \* (chip T2 … CN, ≥ 1 ngày).
- Khung giờ \* (từ … đến …, giờ kết thúc sau giờ bắt đầu).
- Ghi chú: mỗi tổ chức **một** địa điểm; sửa được sau khi xác minh, không cần duyệt lại.

**OA-05 Xem lại (tự làm):**

- Tóm tắt 4 bước; mỗi khối có nút "Sửa" về đúng bước.
- Nút "Gửi hồ sơ" → gửi multipart (`FormData`, mỗi file `{ uri, name, type }`).
- Thành công [GIẢ ĐỊNH]: đăng nhập luôn bằng tài khoản vừa khai → điều hướng tự đưa vào OA-06. Phase 1 chạy bằng mock; BE chưa có mật khẩu cho tổ chức [CHỜ BE].

### OA-06 · Trạng thái hồ sơ tổ chức (`(org-status)`)

- **Chờ xác minh:**
  - Tiêu đề "Hồ sơ đang được xác minh", thời điểm gửi.
  - Timeline 3 mốc: Đã gửi hồ sơ → Moderator đang xác minh ("Phản hồi trong 5 ngày làm việc") → Có kết quả.
  - Ghi chú: tổ chức chưa xác minh không vào được chức năng chính.
  - Nút: "Xem lại hồ sơ đã nộp" (P2) · "Đăng xuất".
- **Bị từ chối:**
  - "Hồ sơ chưa được duyệt", ngày xét, khối "Lý do từ chối".
  - Danh sách giấy tờ: ✓ đạt / ✕ chưa đủ.
  - Nút "Bổ sung giấy tờ còn thiếu" → mở lại OA-03, điền sẵn dữ liệu cũ, chỉ gửi phần thiếu ("không giới hạn số lần nộp").
- **Cập nhật trạng thái:** kéo để làm mới + gọi lại `authApi.getMe()` khi app quay lại foreground (Phase 1: mock; API trạng thái hồ sơ [CHỜ BE]). Push để Phase 6.

### Khung tab Tổ chức (`(org)`)

- 4 tab: Chiến dịch · Bài viết · Tin nhắn · Hồ sơ. Ba tab đầu là màn "Sắp có".
- Tab Hồ sơ Phase 1 chỉ cần: tên tổ chức, "Đã xác minh {ngày}", Đổi mật khẩu, Đăng xuất.

---

## 10. Tự kiểm tra trước khi push

Chạy trên Android thật (Expo Go), với `EXPO_PUBLIC_USE_MOCK=true`:

- [ ] Mở app lần đầu: splash → tab Mua sắm (Guest). Tab Cá nhân hiện bản Guest.
- [ ] Đăng ký Member: bỏ trống / email sai / SĐT 9 số / mật khẩu yếu / không khớp / chưa tích điều khoản → đều báo lỗi đúng ô.
- [ ] Đăng ký với `taken@rehome.vn` → lỗi "Email này đã có tài khoản…".
- [ ] OTP: mã sai, mã `000000` (hết hạn), đếm ngược rồi Gửi lại mã, mã `123456` thành công.
- [ ] Đăng nhập Member bằng email; sai mật khẩu báo lỗi dưới ô mật khẩu; nút không bấm được 2 lần khi đang tải.
- [ ] Đăng nhập `unverified@rehome.vn` → tự gửi mã, sang AU-04 với câu "Tài khoản chưa xác thực email…"; xác thực xong về Đăng nhập, email điền sẵn.
- [ ] Đăng nhập `banned@rehome.vn` → ở lại AU-02, khung lỗi bị khoá có lý do, không chuyển màn.
- [ ] (API thật, `USE_MOCK=false`) Đăng nhập tài khoản chưa xác thực → 403 hiện message BE + link "Chưa xác thực email? Gửi lại mã" hoạt động.
- [ ] (API thật) Để access token hết hạn (> 15 phút) rồi mở PR-02 → app tự refresh (BE trả 403 body rỗng), không bị đăng xuất.
- [ ] **Tắt hẳn app rồi mở lại → vẫn đăng nhập.** Đăng xuất → về Guest; mở lại app → vẫn là Guest.
- [ ] Quên mật khẩu: nhập email → OTP + mật khẩu mới → về Đăng nhập.
- [ ] Đổi mật khẩu: sai mật khẩu hiện tại; mật khẩu mới trùng mật khẩu cũ; thành công.
- [ ] Hồ sơ: xem, sửa, lưu → PR-02 cập nhật ngay; không có nút "Xác thực email".
- [ ] Mã Member: mã text đúng, QR hiện, Sao chép mã hoạt động.
- [ ] Đăng ký tổ chức đủ 4 bước + Xem lại; back giữ dữ liệu; file > 5 MB bị chặn; thiếu CCCD mặt sau bị chặn; gửi xong → OA-06 Chờ xác minh.
- [ ] Đăng nhập `org-rejected@rehome.vn` → OA-06 Bị từ chối có lý do; `org-verified@rehome.vn` → tab tổ chức; tổ chức **không** vào được màn Member.
- [ ] Tắt Wi-Fi rồi thao tác → báo lỗi mạng, app không crash.
- [ ] Không còn `console.log` thừa; không có mã màu viết trực tiếp trong màn hình.

Lệnh kiểm tra:

```bash
npx expo-doctor   # kiểm tra cấu hình và phiên bản thư viện khớp SDK
npx expo lint     # lần đầu sẽ hỏi cài ESLint config của Expo — đồng ý
```

---

## 11. Commit, push, mở Pull Request

```bash
git status                    # chắc chắn KHÔNG có .env, node_modules
git add .
git commit -m "feat(auth): login, register, otp, forgot password (mock api)"
git push -u origin feature/phase1-auth
```

Lên GitHub → **Compare & pull request** → base là `develop` (hoặc `main`, theo lead). Nội dung PR gợi ý:

```markdown
## Phase 1 — Auth & Hồ sơ (Mobile)

### Đã làm

- AU-01…AU-07, PR-01…PR-04, OA-01…OA-06 (+ màn Xem lại), khung tab Member/Tổ chức

### Đang dùng mock (chờ backend)

- Toàn bộ API auth/profile/organization — bật/tắt ở `src/config/env.js`

### Lệch so với wireframe (cần lead chốt)

- Quên mật khẩu dùng OTP thay link · Mã Member có QR · 4 tab Member · thêm ô mật khẩu ở OA-02

### Cách test

1. `npm install` → tạo `.env` từ `.env.example` (USE_MOCK=true) → `npx expo start` → quét QR bằng Expo Go
2. Tài khoản mock: member@rehome.vn / Rehome123 … (bảng ở PHASE1_GUIDE mục 7.5)

### Ảnh chụp

(đính kèm vài ảnh màn hình)
```

---

## 12. Gửi bản cho lead test

### 12.1. Nhanh nhất (lead ngồi cùng hoặc đang họp)

```bash
npx expo start --tunnel
```

Lead cài Expo Go, quét QR. Máy bạn phải đang chạy.

### 12.2. Lead tự test bất cứ lúc nào: EAS Update

```bash
npm install -g eas-cli
eas login
eas update:configure
eas update --branch preview --message "Phase 1 auth"
```

- Lệnh xong in ra link trên expo.dev. Lead mở link, quét QR bằng Expo Go.
- Cách này chạy được vì Phase 1 chỉ dùng thư viện có sẵn trong Expo Go. Khi thêm Google Sign-In/push thì phải chuyển sang dev build (12.3).
- Khi làm, đối chiếu lại docs "EAS Update" vì lệnh có thể thay đổi theo phiên bản.

### 12.3. Sau này (Google Sign-In, push, bản đồ): dev build APK

- `eas build --profile development --platform android` → tải APK, cài lên điện thoại một lần.
- Google Sign-In cần **OAuth client Android** trong Google Cloud project của backend, gắn với package name + SHA-1 của bản build. Hỏi người làm backend.

---

## 13. Cần hỏi (gom gửi lead / backend)

**Lead:**

1. Tab dưới của Member: 4 hay 5 tab, tên gì?
2. Mã Member: giữ QR hay chỉ mã text (ghi chú ngày 11/10 bỏ QR)?
3. Đăng ký tổ chức: mật khẩu nhập ở bước nào; có màn Xem lại không?
4. Sửa wireframe AU-05/06 sang OTP; xoá ghi chú ③ ở AU-04.
5. PR merge vào `develop` hay `main`; tên package Android.
6. Địa chỉ email hỗ trợ ReHome (thông báo tài khoản bị khoá).

**Backend:** đã gửi, đang chờ; danh sách đầy đủ ở mục "Đang chờ xác nhận" trong `CLAUDE.md` (nhãn [CHỜ BE]). Còn hỏi thêm:

1. Upload ảnh/tệp: giới hạn dung lượng, định dạng.
2. Google Cloud project để tạo OAuth client Android.
