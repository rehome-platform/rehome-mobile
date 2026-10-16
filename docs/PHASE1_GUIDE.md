# ReHome Mobile — Hướng dẫn Phase 1 (Auth & Hồ sơ)

> Phase 1: 13/10 – 19/10/2026 (theo _Kế hoạch triển khai code_ 13/10).
> Stack: React Native + **Expo (SDK 58)** + **JavaScript** + expo-router. Demo trên Android thật.
> Nguồn: _Tài liệu tổng quan hệ thống (sau Review 1)_, _Thiết kế Database_, wireframe của lead (canvas "ReHome — Wireframe toàn hệ thống"), và các quyết định bạn đã chốt trong chat.
> Ký hiệu: **[GIẢ ĐỊNH]** = mình tạm đặt vì chưa có quyết định, phải sửa khi có thông tin thật. **[CHỜ BE]** / **[CHỜ LEAD]** = đã hỏi, đang chờ trả lời (danh sách ở `CLAUDE.md`).
> API: **code theo thứ đang chạy thật** (Swagger + code `../rehome-backend` nhánh develop), không theo `docs/API_CONTRACT.md` khi lệch. URL, field, cách bóc response chỉ nằm trong `features/*/api/*.real.js` và `src/lib/api`.

> **Trạng thái 17/10 (trưa):** xong mục 1 → 8 và **AU-02 → AU-07, thanh tab Member, PR-01 → PR-04 chạy với BE thật**. Còn: AU-01 splash, OA (tổ chức), Google. **Code trong repo là bản chuẩn** — các đoạn code mẫu từ mục 9 trở đi chỉ là spec rút gọn; khi lệch thì theo code. Bảng tiến độ ở `CLAUDE.md` → "Tiến độ".
> **Wireframe là tham khảo** (chốt 17/10): chỗ nào thực tế các app làm tốt hơn thì làm theo thực tế, ghi lại trong bảng 0.3 để lead xem.
> **Thay đổi lớn so với bản đầu:** không mock auth nữa (gọi thật, test bằng tài khoản thật); `authStore.signIn(tokens)` tự gọi `getMe()`; BE đã có `code` lỗi (`ACCOUNT_BANNED`, `EMAIL_NOT_VERIFIED`, `WRONG_PASSWORD`…) và gửi được mail OTP.

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
| BR-01 (tab)   | Thanh tab Member (4 tab), 3 tab đầu "Sắp có"      | `(member)/(tabs)/_layout`, `index`, `community`, `consign`  | P0      |
| PR-01         | Tab Cá nhân (menu tài khoản), có bản Guest        | `(member)/(tabs)/account`                                   | P0      |
| (mới)         | Cài đặt (Hồ sơ, Đổi mật khẩu, Phiên bản)          | `(member)/settings`                                         | P1      |
| PR-02         | Xem hồ sơ                                         | `(member)/profile` (`profile/index.js`)                     | P1      |
| PR-03         | Sửa hồ sơ                                         | `(member)/profile/edit`                                     | P1      |
| PR-04         | Mã Member (QR + mã chữ)                           | `(member)/profile/member-code`                              | P1      |
| OA-01 → OA-04 | Đăng ký tổ chức 4 bước                            | `(auth)/org-register/*`                                     | P1      |
| (OA-05)       | Xem lại hồ sơ trước khi gửi (wireframe chưa vẽ)   | `(auth)/org-register/review`                                | P1      |
| OA-06         | Tổ chức: chờ xác minh / bị từ chối                | `(org-status)/verification`                                 | P1      |
| —             | Khung tab của Organization đã duyệt (màn giữ chỗ) | `(org)/(tabs)/*`                                            | P2      |

**Thứ tự (cập nhật 17/10):**

- 16/10 ✅: tạo project, theme, component, lớp API, store, khung điều hướng, **AU-02, AU-03, AU-04** (thật).
- 17/10 ✅ (sáng): AU-07, AU-05/06 (**thật**, không cần mock), thanh tab Member, PR-01 + Cài đặt, PR-02 → PR-04. Chiều: AU-01 splash, bắt đầu OA.
- 18/10: OA-01 → OA-06 (mock phần BE chưa có), khung tab tổ chức.
- 19/10: Google (nếu có OAuth client + dev build), tự test checklist mục 10, mở PR `feature/phase1-auth` → `develop`.

Nếu không kịp, để sau theo thứ tự: đăng nhập Google thật, đổi ảnh đại diện thật, đổi email.

### 0.2. Định nghĩa "xong"

- **4 tiêu chí của kế hoạch:** Guest đăng ký được Member/Organization · Đăng nhập (kể cả Google) · Đổi/quên mật khẩu · Member xem/sửa hồ sơ.

| Tiêu chí                 | Màn         | Gọi thật / mock                         | Trạng thái 17/10             |
| ------------------------ | ----------- | --------------------------------------- | ---------------------------- |
| Guest đăng ký Member     | AU-03, AU-04 | Thật                                   | ✅ chạy với BE thật           |
| Guest đăng ký Tổ chức    | OA-01 → 06  | Mock (BE thiếu mật khẩu, upload, trạng thái) | ⏳                        |
| Đăng nhập email          | AU-02       | Thật                                    | ✅                            |
| Đăng nhập Google         | AU-02       | Tạm `Alert` tới khi có OAuth client + dev build | ⏳ [CHỜ BE/LEAD]     |
| Đổi mật khẩu             | AU-07       | Thật                                    | ✅                            |
| Quên mật khẩu            | AU-05, 06   | Thật (`resend-otp` FORGOT_PASSWORD)     | ✅ [CHỜ BE xác nhận cách dùng] |
| Member xem/sửa hồ sơ     | Tab, PR-01 → 04 | Thật (ảnh đại diện: Toast "sắp có") | ✅                            |

- Chạy được trên Android thật qua Expo Go, không màn đỏ, không warning nghiêm trọng.
- Mọi luồng trong mục 10 (checklist) chạy được: API BE đã có thì **gọi thật**, chưa có thì mock.
- Tắt app mở lại vẫn giữ đăng nhập; đăng xuất thì về chế độ Guest.
- Không có mã màu viết trực tiếp trong màn hình, không có secret trong code.
- Đã push nhánh và mở Pull Request cho lead, kèm hướng dẫn test.

### 0.3. Quyết định đang áp dụng và chỗ lệch (báo lead)

| #   | Nội dung                                                                                                                                                   | Cách làm trong Phase 1                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Quên mật khẩu: wireframe AU-05/06 dùng **liên kết qua email**; bạn đã chốt dùng **OTP 6 số**                                                               | Làm OTP, **gọi thật** qua `resend-otp` (FORGOT_PASSWORD) — `/password/forgot` gửi link web nên không dùng [CHỜ BE xác nhận]. Màn AU-06 gộp: ô OTP + mật khẩu mới. Nhờ lead sửa wireframe |
| 2   | Mã Member: ghi chú wireframe ngày 11/10 **bỏ quét QR** (PR-04 chỉ hiện mã text); bạn muốn **QR + mã text**                                                 | Làm cả hai, QR tách thành component riêng `MemberQr` để bỏ dễ (xem #21). Cần chốt với lead                                        |
| 3   | Tab dưới của Member lệch giữa các màn: BR-01 có 4 tab (Mua sắm, Cộng đồng, Ký gửi, Cá nhân); PR-01 có 5 tab (Khám phá, Cộng đồng, Thử đồ, Ký gửi, Cá nhân) | **[GIẢ ĐỊNH]** 4 tab theo BR-01; khai báo bằng mảng cấu hình để đổi nhanh. Hỏi lead                                              |
| 4   | Tab Organization (OC-01, OP-01): Chiến dịch, Bài viết, Tin nhắn, Hồ sơ                                                                                     | Làm khung, nội dung để Phase 6                                                                                                   |
| 5   | Đăng ký tổ chức (OA-01 → 04) **không có ô mật khẩu**, và OA-05 "Xem lại hồ sơ" chưa vẽ                                                                     | **[GIẢ ĐỊNH]** thêm Mật khẩu + Nhập lại ở bước 2, và tự làm màn Xem lại. Toàn bộ tổ chức **gọi mock** (BE chưa có mật khẩu, upload) [CHỜ BE] [CHỜ LEAD] |
| 6   | PR-02/PR-03 có Ngày sinh, Giới tính; bảng `MemberProfile` trong thiết kế DB **không có cột này**                                                           | Làm UI, đánh dấu chờ backend. Hỏi backend                                                                                        |
| 7   | PR-03 có "Đổi email (xác thực lại OTP)": không có trong UC/Function                                                                                        | Để sau (P2)                                                                                                                      |
| 8   | Đăng nhập sai: "còn 3 lần thử trước khi khoá 15 phút" (AU-02) không có trong bảng tham số mục 11                                                           | Chỉ hiển thị thông báo backend trả về, không tự đếm                                                                              |
| 9   | AU-04 ghi chú ③: chưa xác thực email vẫn đăng nhập được. **Đã chốt ngược lại** theo L-01 + BE: chưa xác thực thì **không đăng nhập được**                  | Chỉ có Guest và Member đã xác thực. Bỏ nút "Xác thực email" ở PR-02. Lỗi đăng nhập xử lý theo AU-02 [CHỜ LEAD xoá ghi chú ③]    |
| 10  | Thử đồ có Đầm (Áo + Quần **hoặc** Đầm)                                                                                                                     | Không thuộc Phase 1, ghi nhận cho Phase 6                                                                                        |
| 11  | Wireframe viết label **hoa toàn bộ** ("EMAIL \*")                                                                                                          | Dùng **kiểu câu** ("Email \*") theo Material/HIG; chữ hoa khó đọc, tiếng Việt in hoa chật dấu                                   |
| 12  | Nút chính ở đáy màn (AU-03 → AU-07); nút mờ khi form chưa đủ                                                                                               | Nút **cố định ở đáy** (`Screen footer`), AU-02 để nút trong nội dung. **Chỉ khoá nút ở màn OTP**; form khác nút luôn bấm được, bấm thì báo lỗi dưới từng ô |
| 13  | AU-02: label "Email hoặc số điện thoại"; khung ghi chú "tổ chức đăng nhập bằng SĐT"                                                                        | Label "Email" (login chỉ nhận email); **ẩn khung tổ chức** [CHỜ LEAD/BE]; lỗi 401 hiện dưới ô Mật khẩu như wireframe            |
| 14  | AU-04: "Mã có hiệu lực 10 phút"; lỗi riêng "mã đã hết hạn"                                                                                                 | **5 phút** theo BE; hiện nguyên message BE (BE không phân biệt sai/hết hạn)                                                      |
| 15  | AU-05/06 vẽ luồng **link**, có màn "Liên kết không còn dùng được"                                                                                          | OTP: AU-05 "Gửi mã"; AU-06 thêm `OtpInput`, bỏ màn liên kết hỏng                                                                |
| 16  | AU-07 ghi "thiết bị này giữ nguyên" sau khi đổi mật khẩu                                                                                                   | BE thu hồi token mọi thiết bị → mobile **chủ động đăng xuất** [CHỜ BE xác nhận]                                                 |
| 17  | Thanh tab: BR-01 vẽ 4 tab, PR-01 vẽ 5 tab (có "Thử đồ")                                                                                                    | **4 tab** (Mua sắm · Cộng đồng · Ký gửi · Cá nhân): thử đồ mở từ trang sản phẩm (business rule), ảnh đã thử ở PR-01 [CHỜ LEAD] |
| 18  | PR-01: thẻ ví + Rút tiền; các mục đơn hàng/ký gửi… có số đếm; không có Đổi mật khẩu; nút "Cài đặt" chưa có màn                                              | Ẩn thẻ ví (Phase 4); mục phase sau **mờ + nhãn "Sắp có", bấm → Toast**; thêm **màn Cài đặt** (Hồ sơ, Đổi mật khẩu, Phiên bản); Đăng xuất **hỏi xác nhận** |
| 19  | PR-02/03 có Ngày sinh, Giới tính, "Hoạt động trên ReHome", "Đổi email"                                                                                      | **Ẩn** (DB chưa có cột / phase sau / không có UC). Dòng thông tin: nhãn trên, giá trị dưới (email dài không vỡ dòng)            |
| 20  | PR-03 "Đổi ảnh đại diện"; nút "Lưu thay đổi" mờ                                                                                                            | Ảnh đại diện → Toast "sắp có" (chưa có `/uploads`, không gửi `file://` lên BE). Lưu **mờ khi chưa sửa** (`isDirty`); Huỷ khi đã sửa → hỏi "Bỏ thay đổi?" |
| 21  | PR-04 chỉ mã chữ (ghi chú 11/10 bỏ QR)                                                                                                                     | **QR + mã chữ** (API 25 `/counter/lookup` có `qrPayload`), tự tăng độ sáng, Sao chép mã [CHỜ LEAD giữ QR] [CHỜ BE định dạng `qrPayload`] |

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
Commit nhỏ, mỗi commit một việc. **PR vào `develop`** (lead đồng ý 17/10; đã tạo `develop` từ `main` và push). Nhánh sau tạo từ `develop`: `git checkout develop && git pull && git checkout -b feature/<việc>`.

---

## 3. Tạo project Expo bên trong repo có sẵn

`create-expo-app` không tạo vào thư mục đã có file, nên tạo ở thư mục tạm rồi chép sang. Đã làm 16/10 (commit `65d2adf`).

**Trước tiên, Expo Go phải khớp SDK 58:** Expo Go → Settings → App Info → "Supported SDKs". CH Play có thể còn bản 57; khi đó tải APK Expo Go cho SDK 58 ở https://expo.dev/go (chọn SDK 58 → Android) và cài đè.

```bash
# đứng ở thư mục CHA của rehome-mobile
npx create-expo-app@latest rehome-mobile-tmp --template blank@sdk-58
```

- **Phải ghi `blank@sdk-58`**: menu chọn SDK của `create-expo-app` (16/10) chỉ đưa tới SDK 57, dù template SDK 58 đã có trên npm.
- Template `blank` là JavaScript, chưa có expo-router (mục 4 sẽ cài).
- Template SDK 58 có thêm vài file **không chép sang**:

| Không chép             | Lý do                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| `.git/`                | Repo git riêng của template, chép sẽ đè git thật của `rehome-mobile`                                   |
| `node_modules/`        | Nặng, `npm install` lại                                                                                |
| `AGENTS.md`            | Hướng dẫn AI viết cho TypeScript, bắt "luôn `npx expo install`" — mâu thuẫn với `CLAUDE.md`           |
| `.claude/settings.json`| Chỉ bật plugin Expo cho Claude Code                                                                    |
| `LICENSE`              | Giấy phép MIT của Expo, không phải của dự án                                                           |

```bash
# đứng ở thư mục CHA; chép đúng danh sách file, không chép cả thư mục
cp rehome-mobile-tmp/{package.json,package-lock.json,app.json,App.js,index.js,.gitignore} rehome-mobile/
cp -r rehome-mobile-tmp/assets/. rehome-mobile/assets/   # gộp, giữ assets/logo/
```

- `.gitignore`: lấy bản của Expo (có `.expo/`, `*.jks`, `/android`…), thêm ở cuối: `.env`, `.env.*`, `!.env.example`.
- `package.json`: `"name": "rehome-mobile"`. `app.json`: `"name": "ReHome"`, `"slug": "rehome-mobile"`.
- Kiểm tra xong mới xoá thư mục tạm.

```bash
rm -rf rehome-mobile-tmp
cd rehome-mobile
npm install
npx expo start
```

Quét QR bằng Expo Go → thấy màn trắng "Open up App.js…" là đúng.

```bash
git add .
git commit -m "chore: init expo project (sdk 58, blank, javascript)"
```

`git add` trên Windows báo "LF will be replaced by CRLF": chỉ là cảnh báo đổi kiểu xuống dòng, không phải lỗi.

---

## 4. Cài thư viện và cấu hình

**Nguyên tắc:** thư viện có code native → `npx expo install` (tự chọn bản khớp SDK). Thư viện thuần JS → `npm install`.

### 4.1. expo-router

Đã làm 16/10 (commit `9467c74`), đối chiếu tài liệu Expo Router cho SDK 58.

1. Cài thư viện (tắt `npx expo start` trước):

   ```bash
   npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
   ```

   Lệnh này **tự thêm** `"plugins": ["expo-router", "expo-status-bar"]` vào `app.json`, không cần thêm tay.

2. `package.json`: đổi `"main": "index.js"` thành `"main": "expo-router/entry"`.
3. `app.json`: thêm `"scheme": "rehome"` trong `"expo"` (deep link, đăng nhập Google sau này). `"name": "ReHome"`, `"slug": "rehome-mobile"` đã đổi ở mục 3.
   - Sau này build APK cần `"android": { "package": "com.rehome.mobile" }` **[GIẢ ĐỊNH]**, hỏi lead tên package.
   - Tài liệu Expo có bật `experiments.typedRoutes`: **bỏ qua**, chỉ dùng cho TypeScript.
   - Không cần `babel.config.js` (template SDK 58 không có, preset mặc định là `babel-preset-expo`).
4. Xoá `App.js` và `index.js` ở gốc (expo-router thay thế): `git rm App.js index.js`.
5. Tạo 2 route tạm để kiểm tra (sẽ thay ở mục 8):

   ```js
   // src/app/_layout.js — layout gốc, tạm chỉ có Stack
   import { Stack } from "expo-router";

   export default function RootLayout() {
     return <Stack />;
   }
   ```

   ```js
   // src/app/index.js — route "/"
   import { Text, View } from "react-native";

   export default function Index() {
     return (
       <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
         <Text>ReHome — expo-router OK</Text>
       </View>
     );
   }
   ```

6. Chạy với xoá cache (vì điểm bắt đầu app vừa đổi): `npx expo start --clear`. Đúng khi thấy header "index" và dòng "ReHome — expo-router OK".

```bash
git add .
git commit -m "chore: setup expo-router (src/app, scheme rehome)"
```

### 4.2. Các thư viện Phase 1

Đã làm 16/10 (commit `dc1845c`). **Cài `react-dom` trước**, nếu không lệnh `npx expo install` thứ hai sẽ lỗi `ERESOLVE`: `expo-router` kèm `@radix-ui/react-tabs` (cho web) cần `react-dom`; npm tự lấy `react-dom@19.3.1` (đòi `react@^19.3.1`) trong khi SDK 58 khoá `react@19.3.0`. Không dùng `--force` / `--legacy-peer-deps`.

```bash
npx expo install react-dom   # SDK 58 → react-dom 19.3.0, khớp react 19.3.0
npx expo install @expo/vector-icons   # icon (con mắt ở TextField, tab) — template SDK 58 KHÔNG có sẵn
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
| react-dom                                                        | Chỉ để thoả peer dependency của expo-router (web)          |
| @expo/vector-icons                                               | Icon (Ionicons…)                                           |

Kiểm tra sau khi cài: `npx expo install --check` → "Dependencies are up to date". Lệnh `npx expo install` tự thêm plugin `expo-secure-store`, `expo-splash-screen`, `expo-font` vào `app.json`, giữ nguyên.

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

| Component                                 | Yêu cầu                                                                                          | 17/10 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------ | ----- |
| `Screen`                                  | SafeArea + nền + `KeyboardAvoidingView` + `scroll`; `header` (đứng yên), `footer` (nút cố định đáy, nằm trên bàn phím) | ✅ |
| `AppHeader`                               | Nút ← trong ô vuông (`onBack` tuỳ chọn, không truyền = không có ←) + tiêu đề + `right`           | ✅    |
| `Button`                                  | `variant`: primary / secondary / text; `loading` (chặn bấm 2 lần, vẫn giữ màu); `disabled` (mờ); cao ≥ 48 | ✅ |
| `TextField`                               | label kiểu câu (có `*`), helper, error (đỏ), ẩn/hiện mật khẩu (Ionicons), truyền thẳng prop cho `TextInput` | ✅ |
| `OtpInput`                                | 6 ô vẽ + **một** `TextInput` trong suốt phủ lên (gõ liên tục, xoá lùi, dán cả mã), chỉ nhận số   | ✅    |
| `RadioCard`, `Checkbox`                   | Chọn Cá nhân / Tổ chức (AU-03), loại hình (OA-01); điều khoản có link lồng (AU-03)               | ✅    |
| `NoteBox`, `Divider`, `ErrorBox`          | Ghi chú viền đứt; "── hoặc ──"; khung lỗi server của form                                        | ✅    |
| `PasswordChecklist`                       | Các dòng ✓ cập nhật theo `watch`: ≥ 8 ký tự, có chữ và số (+ "Khác mật khẩu hiện tại" khi truyền `currentPassword`) | ✅ |
| `EmptyState`                              | Icon tròn + tiêu đề + mô tả (+ children); dùng cho tab "Sắp có", danh sách trống                 | ✅    |
| `Avatar`                                  | Ảnh tròn; chưa có ảnh → chữ cái đầu của **tên gọi** (từ cuối) trên nền `primary`                  | ✅    |
| `ListItem`, `ListGroup`                   | Dòng menu (icon, tiêu đề, mô tả, `badge`, `›`; `disabled`, `muted`, `danger`); nhóm bo góc tự kẻ giữa các dòng | ✅ |
| `ChipGroup`                               | Chọn ngày T2 … CN (OA-04)                                                                        | ⏳    |
| `Stepper`                                 | 4 bước: Tổ chức · Đại diện · Giấy tờ · Nhận đồ (✓ cho bước đã xong)                              | ⏳    |
| `FileItem`                                | Tên file, nút Xoá, các ô khai báo giấy tờ (OA-03)                                                | ⏳    |
| `ErrorState`, `LoadingView`               | Dùng chung cho màn có dữ liệu (khi cần)                                                          | ⏳    |
| ~~`ConfirmDialog`~~                       | Không cần: dùng `Alert.alert` (nút `destructive`) của hệ điều hành                                | —     |

Icon dùng `@expo/vector-icons` (Ionicons) — phải cài (mục 4.2). Ngoài `components/ui`: `src/hooks/useCountdown.js` (+ `formatCountdown`), `src/utils/format.js` (`formatPhone`), `src/utils/toast.js` (`showToast`: Android `ToastAndroid`, iOS `Alert`), `features/profile/components/MemberQr.js`.

---

## 7. Lớp gọi API, xử lý lỗi, dữ liệu giả

### 7.1. `src/config/env.js`

```js
// Phải viết đúng process.env.EXPO_PUBLIC_..., không destructure — Expo thay giá trị lúc build
export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  USE_MOCK: process.env.EXPO_PUBLIC_USE_MOCK === "true",
};

// Nhóm API BE chưa có / chưa dùng được → mock. BE xong nhóm nào thì đổi nhóm đó sang false
export const MOCK = {
  password: false, // quên / đặt lại mật khẩu — gọi thật qua resend-otp + verify-otp + password/reset
  upload: true, // [CHỜ BE] POST /uploads
  organization: true, // [CHỜ BE] đăng ký có mật khẩu, trạng thái hồ sơ
};
```

Bản đầu có thêm `auth`, `profile` — đã bỏ (auth và hồ sơ luôn gọi thật). Nhóm BE chưa có thì để `true` cứng: dù `.env` đặt `USE_MOCK=false`, các nhóm này vẫn chạy mock.

### 7.2. `src/lib/api/errors.js`

Màn hình chỉ làm việc với **một kiểu lỗi**, dù lỗi đến từ mock hay axios.

BE trả **2 dạng lỗi**, cả hai đều có `message` (chi tiết ở `CLAUDE.md` → "API backend đang chạy thật"):

- Dạng A: `{ timestamp, status, error, message, path }` — không có `code` (401 sai mật khẩu, OTP, 409, 503…).
- Dạng B: `{ result: null, isSuccess: false, statusCode, code?, message }` — lỗi qua `AppException` **có `code`** (từ 16/10: `ACCOUNT_BANNED`, `EMAIL_NOT_VERIFIED`, `WRONG_PASSWORD`…).
- 403 do thiếu/hết hạn token: body **rỗng**.

`toApiError` đọc `data.code` nếu có, không có thì dùng `HTTP_<status>`. BE thêm `code` mới thì file này không phải sửa.

```js
// src/constants/errorCodes.js — mã lỗi màn hình được phép so sánh
export const ERROR_CODES = {
  NETWORK: "NETWORK",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED", // BE đã có (16/10)
  ACCOUNT_BANNED: "ACCOUNT_BANNED", // BE đã có (16/10)
};
```
Thêm `WRONG_PASSWORD` khi làm AU-07.

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
import { ERROR_CODES } from "@/constants/errorCodes";

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

    // Bị khoá khi ĐANG dùng app (BE chặn ở JwtAuthenticationFilter / refresh) → đăng xuất ngay, giữ lý do.
    // Bỏ qua API đăng nhập: lúc đó chưa đăng nhập, LoginScreen tự hiện lỗi bị khoá.
    const apiError = toApiError(error);
    const isLoginCall = /\/api\/auth\/(login|google)/.test(original?.url ?? "");
    if (apiError.code === ERROR_CODES.ACCOUNT_BANNED && !isLoginCall) {
      onSessionExpired(apiError);
      return Promise.reject(apiError);
    }
    // Lỗi khác, đã thử lại rồi, hoặc chính API auth → trả lỗi luôn
    if (!isTokenExpired(error) || original?._retry || original?.url?.includes("/api/auth/")) {
      return Promise.reject(apiError);
    }
    original._retry = true;
    try {
      refreshing ??= refreshTokens().finally(() => {
        refreshing = null;
      });
      await refreshing;
      return api(original);
    } catch (refreshError) {
      // Mất mạng lúc refresh: KHÔNG đăng xuất, chỉ báo lỗi mạng
      if (!refreshError?.response && refreshError?.message !== "NO_REFRESH_TOKEN") {
        return Promise.reject(toApiError(refreshError));
      }
      // Refresh bị BE từ chối (hết hạn, ACCOUNT_BANNED) hoặc không có refresh token → đăng xuất
      const reason = refreshError.response ? toApiError(refreshError) : toApiError(error);
      onSessionExpired(reason);
      return Promise.reject(reason);
    }
  },
);
```

Bản trước (16/10 sáng) dùng `toApiError(refreshError)` cho mọi trường hợp → không có refresh token hoặc mất mạng lúc refresh đều thành `NETWORK`, và mất mạng còn bị đăng xuất. Đã sửa như trên (commit `6627f29`).

**Đã kiểm tra với server thật (16/10):** `POST /api/auth/login` sai email/mật khẩu → `401 / HTTP_401 / "Sai email hoặc password"`; `GET /members/me` không token → `403 / HTTP_403` body rỗng → thử refresh → không có refresh token → trả lỗi gốc. Thêm khối `ACCOUNT_BANNED` ở commit `9f40599`.

### 7.5. Nhóm API auth: `features/auth/api/` (gọi thật + mock riêng phần mật khẩu)

**Không mock auth** (đã bỏ từ 16/10): đăng ký, OTP, đăng nhập, đổi mật khẩu đều gọi thật. Chỉ quên / đặt lại mật khẩu dùng mock vì BE còn gửi link web. `authApi.js` = toàn bộ hàm thật, ghi đè 3 hàm nhóm mật khẩu:

```js
// authApi.js — màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./authApi.real";
import * as mock from "./authApi.mock";

const password = MOCK.password ? mock : real; // quên / đặt lại mật khẩu [CHỜ BE bản OTP]

export const authApi = {
  ...real, // đăng ký, OTP, đăng nhập, logout, getMe, đổi mật khẩu → API thật
  forgotPassword: password.forgotPassword,
  verifyResetOtp: password.verifyResetOtp,
  resetPassword: password.resetPassword,
};
```

`src/config/env.js` → `MOCK = { password: true, upload: true, organization: true }` (đã bỏ `auth`, `profile`). `.env` đặt `EXPO_PUBLIC_USE_MOCK=false`.

Login của BE **chỉ trả token**, không có user/role. `getMe()` ở bản real tự ghép `user` từ JWT + `/members/me`, để `authStore` (mục 8.2) không phải biết chuyện này. Hằng số `OTP_PURPOSE` ở `src/constants/auth.js` (`REGISTER`, `FORGOT_PASSWORD`).

```js
// authApi.real.js — chỉ file này biết URL và tên field của BE
import { jwtDecode } from "jwt-decode";
import { api, unwrap } from "@/lib/api/client";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { ROLES } from "@/constants/roles";
import { OTP_PURPOSE } from "@/constants/auth";

// ===== Đăng ký + OTP =====
export const register = async ({ fullName, email, phone, password }) =>
  unwrap(await api.post("/api/auth/register", { fullName, email, phone, password })); // { message }

export const verifyRegisterOtp = async ({ email, otp }) =>
  unwrap(await api.post("/api/auth/verify-otp", { email, otp, purpose: OTP_PURPOSE.REGISTER })); // { message }, không trả token

export const resendOtp = async ({ email, purpose }) =>
  unwrap(await api.post("/api/auth/resend-otp", { email, purpose })); // { message }; gửi lại < 60 giây → 429

// ===== Đăng nhập / phiên =====
export const login = async ({ email, password }) =>
  unwrap(await api.post("/api/auth/login", { email, password })); // { accessToken, refreshToken, tokenType } — KHÔNG có user

export const logout = async () => {
  await api.post("/api/auth/logout"); // cần header Authorization; token hết hạn → BE trả 500, nơi gọi bỏ qua lỗi
};

// [TẠM] đọc role từ claim "roles" ("ROLE_MEMBER"); bỏ khi login trả account.role [CHỜ BE]
export function roleFromToken(accessToken) {
  if (!accessToken) return null;
  const { roles = "" } = jwtDecode(accessToken);
  return roles.split(",")[0]?.replace("ROLE_", "") || null;
}

// BE chưa có /me chung → tự ghép user từ JWT + /members/me
export async function getMe() {
  const role = roleFromToken(await tokenStorage.getAccessToken());
  if (role !== ROLES.MEMBER) return { role }; // tổ chức: chưa có API thông tin [CHỜ BE]
  const profile = unwrap(await api.get("/members/me")); // không có tiền tố /api
  return { role, ...profile };
}

// ===== Mật khẩu =====
// Đổi mật khẩu (AU-07) — BE đã có (F008). Thành công trả CHUỖI "Đổi mật khẩu thành công".
// Lưu ý: nằm dưới /api/auth nên client.js KHÔNG tự refresh; token hết hạn → BE trả 500 [CHỜ BE]
export const changePassword = async ({ oldPassword, newPassword, newPasswordRepeat }) =>
  unwrap(await api.post("/api/auth/password/change", { oldPassword, newPassword, newPasswordRepeat }));

// Quên mật khẩu (AU-05) — gửi OTP "đặt lại mật khẩu" qua resend-otp (purpose FORGOT_PASSWORD).
// KHÔNG dùng /api/auth/password/forgot vì API đó gửi LINK web (localhost), điện thoại không mở được.
// Luôn trả như nhau dù email có tồn tại hay không. Gửi lại < 60 giây → 429. [Báo BE xác nhận cách dùng này]
export const forgotPassword = ({ email }) =>
  resendOtp({ email, purpose: OTP_PURPOSE.FORGOT_PASSWORD });

export const verifyResetOtp = async ({ email, otp }) =>
  unwrap(await api.post("/api/auth/verify-otp", { email, otp, purpose: OTP_PURPOSE.FORGOT_PASSWORD })); // { message, resetToken }

export const resetPassword = async ({ email, resetToken, newPassword, confirmPassword }) =>
  unwrap(await api.post("/api/auth/password/reset", { email, resetToken, newPassword, confirmPassword })); // { message }
```

Đăng nhập thành công: màn hình gọi `signIn(await authApi.login(values))`; `authStore.signIn` tự lưu token → `getMe()` → cập nhật store (mục 8.2).

```js
// authApi.mock.js — CHỈ mock phần BE chưa dùng được: quên / đặt lại mật khẩu [CHỜ BE]
// Cùng tên hàm + hình dạng dữ liệu với authApi.real.js
import { ApiError } from "@/lib/api/errors";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const OTP_INVALID = "Mã xác thực không hợp lệ, hết hạn hoặc đã sử dụng."; // giống message BE

export async function forgotPassword() {
  await delay(); // BE trả 204, không có dữ liệu
}

// OTP giả: 123456 đúng; mã khác → lỗi giống BE
export async function verifyResetOtp({ otp }) {
  await delay();
  if (otp !== "123456") throw new ApiError({ status: 400, code: "HTTP_400", message: OTP_INVALID });
  return { message: "OTP hợp lệ.", resetToken: "mock-reset-token" };
}

export async function resetPassword() {
  await delay();
  return { message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập." };
}
```

**Test bằng tài khoản thật** trên server Render (không còn tài khoản mock). Tạo nhiều email nhận chung một hộp thư bằng mẹo Gmail: `tenban+test1@gmail.com`, `tenban+test2@gmail.com`…

| Cần                         | Cách tạo                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- |
| Member đã xác thực          | Đăng ký trong app (AU-03) → nhập OTP (AU-04)                                 |
| Member **chưa** xác thực    | Đăng ký nhưng không nhập OTP → đăng nhập sẽ ra `EMAIL_NOT_VERIFIED`          |
| Tài khoản bị khoá           | Nhờ BE đặt `status = BANNED` cho một tài khoản test                          |
| Tổ chức PENDING/REJECTED/VERIFIED | Chưa có (tổ chức chưa đăng nhập được) → mock khi làm OA [CHỜ BE/LEAD]   |

### 7.6. API cho Phase 1 — theo API đang chạy thật (Swagger + code BE develop, 16/10)

**Base path lệch nhau:** nhóm auth/tổ chức có `/api`; nhóm member **không có `/api`**. **Envelope:** chỉ `/members` bọc `{ result, … }`; `/api/auth` trả thẳng. `unwrap` xử lý được cả hai.

**Gọi thật:**

| Việc                | Method + path                    | Body gửi đi                                    | Kết quả (sau `unwrap`)                                       |
| ------------------- | -------------------------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| Đăng ký Member      | `POST /api/auth/register`        | `email, password, fullName, phone`             | 201 `{ message }`, BE gửi OTP (Brevo, có thể chậm). Trùng email 409; trùng SĐT hiện ra 500; gửi mail lỗi 503 (không tạo tài khoản) |
| Xác thực email      | `POST /api/auth/verify-otp`      | `email, otp, purpose: 'REGISTER'`              | `{ message }`, **không trả token** → về Đăng nhập            |
| Gửi lại OTP         | `POST /api/auth/resend-otp`      | `email, purpose: 'REGISTER'`                   | `{ message }`, luôn như nhau. Gửi sớm hơn 60 giây → 429       |
| Đăng nhập           | `POST /api/auth/login`           | `email, password`                              | `{ accessToken, refreshToken, tokenType }`, **không có user**. Lỗi: 401 sai mật khẩu; 403 `ACCOUNT_BANNED` / `EMAIL_NOT_VERIFIED` (chỉ khi đúng mật khẩu) |
| Làm mới token       | `POST /api/auth/refresh`         | `refreshToken`                                 | `{ accessToken, refreshToken }`; token cũ hết dùng (xoay vòng) |
| Đăng xuất           | `POST /api/auth/logout`          | — (cần header `Authorization`)                 | 204. Access token đã hết hạn → 500, bỏ qua lỗi này           |
| Đổi mật khẩu (AU-07) | `POST /api/auth/password/change` | `oldPassword, newPassword, newPasswordRepeat` | Chuỗi "Đổi mật khẩu thành công"; thu hồi token mọi thiết bị → mobile đăng xuất. Lỗi 400 có `code`: `WRONG_PASSWORD`, `NEW_PASSWORD_SAME_AS_OLD`, `PASSWORD_CONFIRM_MISMATCH`, `PASSWORD_NOT_SET`. Token hết hạn → 500 (không tự refresh) |
| Thông tin Member    | `GET /members/me`                | —                                              | `{ accountId, email, phone, fullName, avatarUrl, memberCode, emailVerified }` |
| Sửa hồ sơ Member    | `PATCH /members/me`              | `fullName, phone, avatarUrl` (ô trống = giữ nguyên) | `{ accountId, fullName, phone, avatarUrl }` → gọi lại `GET /members/me` |
| Mã Member           | `GET /members/me/code`           | —                                              | `{ memberCode }` — **không dùng** (đã có `user.memberCode`)   |
| Quên mật khẩu (AU-05) | `POST /api/auth/resend-otp`    | `email, purpose: 'FORGOT_PASSWORD'`            | `{ message }`, mail "ReHome - Mã OTP đặt lại mật khẩu". **Không** dùng `/password/forgot` (gửi link web) |
| Kiểm OTP (AU-06)    | `POST /api/auth/verify-otp`      | `email, otp, purpose: 'FORGOT_PASSWORD'`       | `{ message, resetToken }`                                    |
| Đặt lại mật khẩu (AU-06) | `POST /api/auth/password/reset` | `email, resetToken, newPassword, confirmPassword` | `{ message }`; thu hồi token mọi thiết bị                   |

**Mock / chưa làm** (hình dạng theo BE hiện có hoặc theo yêu cầu đã gửi BE):

| Việc                       | API BE hiện có / đang chờ                                                                 | Mock trả                                     |
| -------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------- |
| Upload ảnh/tệp             | Chưa có (`POST /uploads`) [CHỜ BE]. PR-03 "Đổi ảnh đại diện" tạm hiện Toast "sắp có"      | `{ url }`                                    |
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
  "memberCode": "MB000001",
  "emailVerified": true
}
```

- `memberCode` dạng `MB000001` (6 chữ số, không gạch) — hiện đúng chuỗi BE trả, không tự định dạng. Wireframe vẽ `MB-004821` chỉ là ví dụ.

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

  // Nhận token từ login → lưu → lấy thông tin user. Lỗi thì xoá token và ném lỗi ra cho màn hình
  signIn: async ({ accessToken, refreshToken }) => {
    await tokenStorage.save({ accessToken, refreshToken });
    try {
      const user = await authApi.getMe();
      set({ status: "authenticated", user, sessionError: null });
    } catch (e) {
      await tokenStorage.clear();
      throw e;
    }
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

// Refresh thất bại (refresh token hết hạn, bị khoá…) hoặc API trả ACCOUNT_BANNED → client.js gọi hàm này → đăng xuất, giữ lý do
setOnSessionExpired((reason) => useAuthStore.getState().signOut(reason));
```

- `signIn` nhận **chỉ token** (bản đầu nhận cả `user`); gom "lưu token → `getMe` → cập nhật store" vào store để Google login dùng lại, và không để lại token "nửa đăng nhập" khi `getMe` lỗi.
- Đăng xuất → `status` thành `guest` → `Stack.Protected` tự mở nhóm `(auth)`. Khi `sessionError.code === ACCOUNT_BANNED`, AU-02 hiện khung "Tài khoản của bạn đã bị khoá."

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

**Đang có trong code (16/10):** chỉ 2 nhóm `(member)` và `(auth)`; `(org-status)`, `(org)` thêm khi làm phần tổ chức. Mỗi nhóm có `_layout.js` riêng (`<Stack screenOptions={{ headerShown: false }} />`). Route: `(auth)/login.js`, `(auth)/register.js`, `(auth)/verify-email.js` (mỗi file 1 dòng `export { default } from "@/features/auth/screens/…"`), `(member)/index.js` (màn tạm "Xin chào…" + Đăng xuất).

**Kết quả:**

- **Guest:** vào thẳng tab Mua sắm. Bấm thao tác cần đăng nhập → mở `/login` (tên nhóm `(auth)` không nằm trong đường dẫn).
- **Member:** đăng nhập xong, nhóm `(auth)` bị khoá, tự quay về tab.
- **Tổ chức chưa duyệt:** chỉ thấy màn OA-06. **Tổ chức đã duyệt:** chỉ thấy tab tổ chức.

`queryClient.js`: `export const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });`

### 8.4. Tab Member: khai báo bằng mảng để đổi nhanh

```js
// src/app/(member)/(tabs)/_layout.js — ✅ đã làm 17/10
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/theme";

// [GIẢ ĐỊNH] 4 tab theo BR-01 — chờ lead chốt (PR-01 vẽ 5 tab). Đổi tab chỉ cần sửa mảng này
const TABS = [
  { name: "index", title: "Mua sắm", icon: "bag-handle" },
  { name: "community", title: "Cộng đồng", icon: "people" },
  { name: "consign", title: "Ký gửi", icon: "cube" },
  { name: "account", title: "Cá nhân", icon: "person-circle" },
];

export default function MemberTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.neutral },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Đang chọn: icon đặc; chưa chọn: icon rỗng ("-outline")
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
```

- Tab Mua sắm, Cộng đồng, Ký gửi ở Phase 1 là `EmptyState` "… — sắp có". Màn trong tab dùng `Screen edges={["top"]}` (thanh tab tự lo phía dưới).
- Màn con (Cài đặt, Hồ sơ, Đổi mật khẩu…) đặt **ngoài** `(tabs)` (trong `(member)/`), nên mở ra **che thanh tab**.
- Thêm/xoá/đổi tên file trong `src/app` → chạy lại `npx expo start --clear` (Fast Refresh không nhận đổi cấu trúc route).

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
> **✅ Đã làm 16/10** (`features/auth/screens/LoginScreen.js`, commit `cfc0677` + sửa sau), chạy với BE thật. Bố cục theo wireframe: header không có ←, logo `assets/logo/logoIcon.png` + "ReHome" + 2 dòng mô tả, "Quên mật khẩu?" căn phải, nút Đăng nhập trong nội dung, `Divider` "hoặc", nút Google (tạm `Alert` "đang phát triển"), đáy cố định "Chưa có tài khoản? **Đăng ký**" (một `Text` lồng `Text onPress`). Khung ghi chú tổ chức **ẩn**.

- **Thành công:** `signIn(await authApi.login(values))` (store tự `getMe`). `Stack.Protected` tự chuyển sang `(member)`, không cần `router.push`.
- **Quay về từ AU-04:** params `email`, `verified: "1"` → `useEffect` + `setValue("email", …)` điền sẵn email (màn đã mở sẵn nên `defaultValues` không chạy lại) + dòng xanh "Xác thực email thành công, mời bạn đăng nhập."
- Tổ chức: wireframe ghi đăng nhập bằng SĐT người đại diện, nhưng BE hiện chưa cho tổ chức đăng nhập [CHỜ BE] [CHỜ LEAD].
- **Lỗi:** 401 → `setError("password")` (message BE **dưới ô Mật khẩu**, như wireframe); các `code` dưới đây xử lý riêng; **mọi lỗi còn lại hiện `message` của BE** trong khung lỗi trên nút Đăng nhập. Không so chữ trong message, không tự đếm số lần thử.

| `code`               | Xử lý                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EMAIL_NOT_VERIFIED` | Tự gọi `resend-otp { email, purpose: 'REGISTER' }`, rồi chuyển sang AU-04 kèm `email` và `reason: 'unverified'`. AU-04 hiện: "Tài khoản chưa xác thực email. Mình đã gửi mã mới tới **{email}**." Nếu resend trả 429 (vừa gửi < 60 giây) vẫn chuyển màn, bắt đầu đếm ngược. |
| `ACCOUNT_BANNED`     | Ở lại AU-02, **không chuyển màn**. Khung lỗi trên nút Đăng nhập: "Tài khoản của bạn đã bị khoá." + `reason` (nếu có) + "Cần hỗ trợ? Liên hệ email hỗ trợ ReHome" **[GIẢ ĐỊNH]** chưa có địa chỉ [CHỜ LEAD].                                                                 |
| `NETWORK`            | "Không kết nối được máy chủ…". Render ngủ: lần đầu có thể chậm, nút vẫn ở trạng thái loading.                                                                                                                                                                               |
| Còn lại              | Hiện `message` của BE (`toApiError` đã lo cả 2 dạng lỗi và body rỗng).                                                                                                                                                                                                      |

- **Link tạm "Chưa xác thực email? Gửi lại mã"**: chỉ hiện khi 403 **không có** `code` (`HTTP_403`). BE đã có `code` (16/10) nên link **tự ẩn**; giữ code phòng khi BE trả 403 không `code`. Có thể xoá khi dọn code.
- **Đã kiểm tra thật trên server (16/10, gọi từ app):**

| Trường hợp                         | Kết quả                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| Sai email / mật khẩu               | 401 dạng A "Sai email hoặc password" → dưới ô Mật khẩu          |
| Để trống (gửi thẳng lên BE)        | 400 "password: password không được để trống; email: …" (app đã chặn bằng zod nên không còn gửi) |
| Đúng mật khẩu, chưa xác thực       | 403 `EMAIL_NOT_VERIFIED` → app gửi lại mã (mail mới tới) → AU-04 |
| Đúng mật khẩu, tài khoản thật      | Vào "Xin chào {tên}", `MEMBER`, `MB00000x`                       |
| Bị khoá                            | Chưa test (cần BE khoá một tài khoản test)                      |

- **Bị khoá giữa chừng:** API bất kỳ (filter) hoặc refresh trả `ACCOUNT_BANNED` → `client.js` gọi `signOut(reason)` (mục 7.4, 8.2) → về AU-02, hiện khung lỗi bị khoá từ `sessionError`; bấm Đăng nhập lại thì `clearSessionError()`.
- **Google:** Phase 1 chỉ có nút và gọi mock. Bản thật cần dev build và OAuth client Android (mục 12.3).

### AU-03 · Đăng ký

> **✅ Đã làm 16/10** (`features/auth/screens/RegisterScreen.js`, route `(auth)/register.js`), chạy với BE thật (đăng ký → mail OTP về).

- **Chọn vai:** 2 `RadioCard` cạnh nhau "Cá nhân — Mua, ký gửi, quyên góp" (đang chọn) / "Tổ chức — Cần giấy tờ pháp lý".
  - Bấm **Tổ chức** → `router.push("/org-register/info")` (OA-01, chưa làm → "Unmatched Route").
- **Form Cá nhân:**
  - Họ và tên \* · Email \* · Số điện thoại \* (`phone-pad`, cho gõ dấu cách) · Mật khẩu \* (helper "Ít nhất 8 ký tự, có chữ và số", `autoComplete="new-password"`) · Nhập lại mật khẩu \*.
  - `Checkbox` "Tôi đồng ý với **Điều khoản sử dụng** và **Chính sách bảo mật**" (link lồng, tạm `Alert` "Sắp có" [GIẢ ĐỊNH]): bắt buộc tích.
  - Nút "Tạo tài khoản" ở `footer` (cố định đáy), **luôn bấm được**.
- **Zod** (`registerSchema` trong `features/auth/schemas.js`, regex ở `utils/validators.js`): SĐT bỏ dấu cách rồi kiểm `/^0\d{9}$/`; mật khẩu `/^(?=.*[A-Za-z])(?=.*\d).{8,}$/`; `.refine` 2 mật khẩu khớp (lỗi gắn `confirmPassword`); `agree` phải `true`. Chỉ gửi 4 field BE cần.
- **Lỗi:** 409 → dưới ô Email "Email này đã có tài khoản. Đăng nhập hoặc dùng email khác."; 500 (trùng SĐT, BE chưa kiểm) → `ErrorBox` "Không tạo được tài khoản. Nếu số điện thoại đã dùng…"; 503 / mạng / khác → `ErrorBox` message BE.
- **Thành công:** `router.push({ pathname: "/verify-email", params: { email } })` (push để "Quay lại sửa" được).
- Request đăng ký chờ BE gửi mail xong mới trả → có thể chậm; nếu quá 30 giây (timeout) app báo "Không kết nối được máy chủ" dù server có thể đã tạo tài khoản (bấm lại sẽ ra 409).

### AU-04 · Xác thực email (OTP)

> **✅ Đã làm 16/10** (`features/auth/screens/VerifyEmailScreen.js`, route `(auth)/verify-email.js`), chạy với BE thật (cả 2 đường vào). Ghi chú ③ của wireframe **ẩn**.

- **Mở từ:** AU-03 (vừa đăng ký) hoặc AU-02 (đăng nhập gặp `EMAIL_NOT_VERIFIED`). Params: `email`, `reason` (`'unverified'` khi mở từ AU-02).
- Chữ:
  - Từ AU-03: "Nhập mã 6 số", "Mình vừa gửi mã tới **{email}**. Kiểm tra cả mục Spam nếu chưa thấy."
  - Từ AU-02: "Tài khoản chưa xác thực email. Mình đã gửi mã mới tới **{email}**."
- `OtpInput` 6 ô. Nút "Xác nhận" chỉ bật khi đủ 6 số. API: `verify-otp { email, otp, purpose: 'REGISTER' }`.
- "Mã có hiệu lực 5 phút" (theo BE; wireframe ghi 10 phút).
- "Gửi lại mã sau 0:SS": đếm ngược **60 giây** (hook `useCountdown`, theo BE), hết giờ hiện nút text "Gửi lại mã" (gọi `resend-otp` → xoá mã đang nhập, báo "Đã gửi mã mới. Mã cũ không dùng được nữa.", đếm lại). BE trả 429 nếu gửi sớm → `ErrorBox`.
- "Nhập sai email? Quay lại sửa" → `router.back()` (an toàn: không có lịch sử thì về `/login`).
- **Trạng thái lỗi:** BE trả **cùng một lỗi 400** cho mã sai, mã hết hạn, đã dùng hoặc sai quá 5 lần ("Mã xác thực không hợp lệ, hết hạn hoặc đã sử dụng."). Hiện message đó **dưới 6 ô** + 6 ô viền đỏ; gõ lại thì lỗi mất. Lỗi khác → `ErrorBox`.
- **Thành công:** BE **không trả token** → `router.dismissTo({ pathname: "/login", params: { email, verified: "1" } })` (bỏ AU-03/AU-04 khỏi lịch sử) → AU-02 điền sẵn email + dòng xanh "Xác thực email thành công, mời bạn đăng nhập."
- Chỉ **mã mới nhất** dùng được (gửi mã mới thì BE huỷ mã cũ). Mail có thể tới chậm; Gmail gộp các mail OTP vào cùng cuộc hội thoại.

### AU-05 · Quên mật khẩu (bản OTP — khác wireframe)

> **✅ Đã làm 17/10** (`ForgotPasswordScreen.js`, route `(auth)/forgot-password.js`), **gọi thật**.

- "Quên mật khẩu?" ở AU-02 mang theo email đã gõ (`params.email`) → điền sẵn.
- "Nhập email đã đăng ký" + mô tả "gửi **mã 6 số**… hiệu lực 5 phút"; nút **"Gửi mã"** ở footer → `authApi.forgotPassword` = `resend-otp` (FORGOT_PASSWORD) → luôn `router.push("/reset-password", { email })`.
- Không báo "email không tồn tại" (BE trả như nhau — chống dò tài khoản).
- Khung ghi chú tổ chức của wireframe **ẩn** (tổ chức chưa đăng nhập được), như AU-02.

### AU-06 · Đặt mật khẩu mới

> **✅ Đã làm 17/10** (`ResetPasswordScreen.js`, route `(auth)/reset-password.js`), **gọi thật**.

- Header có ← (wireframe không có — để quay lại sửa email). "Nhập mã 6 số đã gửi tới **email**…".
- **Trường:** `OtpInput` trong `Controller` (zod: `/^\d{6}$/`), "Mã có hiệu lực 5 phút", đếm ngược 60 giây + "Gửi lại mã" (`useCountdown`) · Mật khẩu mới \* + `PasswordChecklist` (2 dòng) · Nhập lại \*. Nút "Đặt mật khẩu" ở footer, luôn bấm được.
- **Bấm "Đặt mật khẩu":** gọi lần lượt `verifyResetOtp` → `resetToken` → `resetPassword`. Lỗi ở bước kiểm mã (gắn `e.field = "otp"`) → dưới 6 ô; lỗi khác → `ErrorBox`. Mã đã bị dùng nếu bước 2 lỗi → phải gửi lại mã.
- **Thành công:** `router.dismissTo("/login", { email, passwordReset: "1" })` → AU-02 điền sẵn email + "Đặt lại mật khẩu thành công…". BE đăng xuất mọi thiết bị (ghi chú ② giữ, "liên kết" → "mã").
- AU-02 gom thông báo xanh vào `NOTICES` (`verified`, `passwordChanged`, `passwordReset`).

### AU-07 · Đổi mật khẩu

> **✅ Đã làm 17/10** (`ChangePasswordScreen.js`, route `(member)/profile/change-password.js`, mở từ **Cài đặt**), **gọi thật**.

- **Trường:** Mật khẩu hiện tại \* · Mật khẩu mới \* + `PasswordChecklist` 3 dòng (`currentPassword` = ô hiện tại, theo `watch`) · Nhập lại \*. `changePasswordSchema`: tên field giống BE (`oldPassword`, `newPassword`, `newPasswordRepeat`), `.refine` mới ≠ cũ, nhập lại khớp.
- **API:** `authApi.changePassword` → `POST /api/auth/password/change`. Nằm dưới `/api/auth` nên `client.js` **không tự refresh** → gọi `authApi.getMe()` trước trong `mutationFn` [CHỜ BE chuyển đường dẫn / trả 401].
- **Lỗi theo `code`:** `WRONG_PASSWORD` → dưới ô "Mật khẩu hiện tại"; `NEW_PASSWORD_SAME_AS_OLD` → dưới ô "Mật khẩu mới"; khác (`PASSWORD_NOT_SET`, mạng) → `ErrorBox`.
- **Thành công:** BE thu hồi token mọi thiết bị → `signOut()` rồi `router.replace("/login", { passwordChanged: "1" })` (phải tự chuyển vì `(member)` vẫn mở cho khách). Ghi chú sửa thành "bạn và mọi thiết bị… phải đăng nhập lại".
- Tổ chức dùng lại màn này khi làm `(org)`.

### PR-01 · Tab Cá nhân

> **✅ Đã làm 17/10** (`features/profile/screens/AccountScreen.js`, route `(member)/(tabs)/account.js`). Thiết kế theo wireframe PR-01 + điều chỉnh (bảng 0.3 #18).

- **Member:** header "Cá nhân" + nút ⚙ (ô vuông) → **Cài đặt**. Thẻ đầu: `Avatar` (chữ cái đầu tên gọi) + tên + mã Member + `›` → PR-02 (không có "tham gia MM/YYYY" — chưa có `createdAt` [CHỜ BE]). `ListGroup`: "Mã Member của tôi — Đọc cho nhân viên khi tới kho" → PR-04. `ListGroup` "Sắp có": 7 mục `muted` + nhãn "Sắp có", bấm → `showToast("… sẽ có ở phiên bản sau.")`. `ListGroup`: **Đăng xuất** (`danger`) → `Alert.alert` xác nhận (nút `destructive`) → `signOut()`. Thẻ ví **ẩn** (Phase 4).
- **Guest:** thẻ "Bạn đang xem với tư cách khách" + mô tả + Đăng nhập (`/login`) / Tạo tài khoản (`/register`).
- **Cài đặt** (`SettingsScreen.js`, route `(member)/settings.js`): nhóm "Tài khoản" (Hồ sơ cá nhân → PR-02, Đổi mật khẩu → AU-07), nhóm "Khác" (Phiên bản ứng dụng = `Constants.expoConfig.version`).

### PR-02 · Hồ sơ cá nhân

> **✅ Đã làm 17/10** (`ProfileScreen.js`, route `(member)/profile/index.js`), **gọi thật**.

- Header ← "Hồ sơ cá nhân" + nút **"Sửa"** (ô vuông) → PR-03. `Avatar` 80 + tên + mã.
- `ListGroup` 3 dòng (nhãn trên, giá trị dưới): Họ và tên · Email + "✓ Đã xác minh" · Số điện thoại (`formatPhone`, chưa có thì "Chưa cập nhật"). **Ẩn** Ngày sinh, Giới tính, "Hoạt động trên ReHome". Không có nút "Xác thực email".
- **Dữ liệu:** `useQuery({ queryKey: ["me"], queryFn: getMe + setUser, initialData: storeUser, initialDataUpdatedAt: 0 })` → hiện ngay dữ liệu store, vẫn tải lại khi mở màn. Lỗi tải → `ErrorBox` "Không tải được thông tin mới nhất…" + "Thử lại", vẫn hiện dữ liệu cũ.

### PR-03 · Sửa hồ sơ

> **✅ Đã làm 17/10** (`EditProfileScreen.js`, route `(member)/profile/edit.js`), **gọi thật** (`profileApi.updateMe` → `PATCH /members/me { fullName, phone }`).

- `Avatar` + "Đổi ảnh đại diện" → **Toast "sắp có"** [CHỜ BE `POST /uploads`] — không gửi `file://` lên BE.
- Họ và tên \* · Email **chỉ đọc** (nền xám, "Đã xác minh", helper "Email dùng để đăng nhập, không thay đổi được.") · Số điện thoại \* (định dạng sẵn `0912 345 678`, helper "Kho gọi số này…"). **Ẩn** Ngày sinh, bỏ "Đổi email". `NoteBox` "không phải địa chỉ giao hàng".
- Footer: **Huỷ** + **Lưu thay đổi** (`disabled={!isDirty}`). Huỷ / ← khi `isDirty` → `Alert` "Bỏ thay đổi?" ("Sửa tiếp" / "Bỏ thay đổi").
- **Lưu thành công:** `updateMe` → `getMe()` (PATCH thiếu email/memberCode) → `setUser` + `queryClient.setQueryData(["me"])` → Toast "Đã lưu thay đổi" → quay lại. Lỗi 500 (trùng SĐT, BE chưa kiểm) → dưới ô SĐT.
- Chưa chặn cử chỉ Back của Android khi đang sửa (nâng cao, để sau).

### PR-04 · Mã Member

> **✅ Đã làm 17/10** (`MemberCodeScreen.js`, route `(member)/profile/member-code.js`). Lấy `user.memberCode` (không gọi `/members/me/code`).

- "Đưa mã QR cho nhân viên quét, hoặc đọc mã bên dưới…". Thẻ viền `primary`: **QR** (`MemberQr`, `react-native-qrcode-svg`, chữ đậm trên nền trắng, `ecl="M"`, tạm chứa đúng `memberCode`) + "Mã Member" + **mã cỡ 44, giãn chữ**, `selectable`, `adjustsFontSizeToFit` + tên. Footer: "Sao chép mã" (`expo-clipboard` + Toast) + "Màn này tự tăng độ sáng…".
- **Độ sáng:** `useFocusEffect` → `Brightness.setBrightnessAsync(1)` khi mở; rời màn → Android `restoreSystemBrightnessAsync()`, iOS đặt lại giá trị cũ.
- QR: [CHỜ LEAD giữ QR] [CHỜ BE định dạng `qrPayload` của API 25].

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

Chạy trên Android thật (Expo Go), với `EXPO_PUBLIC_USE_MOCK=false` (auth gọi thật; nhóm `password`, `upload`, `organization` vẫn mock theo `MOCK`). Dùng tài khoản thật (mẹo Gmail `+testN`). ✅ = đã test 16/10.

- [ ] Mở app lần đầu: splash (AU-01) → tab Mua sắm (Guest). Tab Cá nhân hiện bản Guest.
- [x] ✅ Thanh 4 tab: icon đặc/rỗng theo tab đang chọn; 3 tab đầu "Sắp có".
- [x] ✅ Đăng ký Member: bỏ trống / mật khẩu yếu / không khớp / chưa tích điều khoản → đều báo lỗi đúng ô.
- [ ] Đăng ký với email đã có tài khoản → lỗi dưới ô Email "Email này đã có tài khoản…".
- [x] ✅ Đăng ký thật trong app → AU-04 → mail OTP về → nhập mã → về Đăng nhập (email điền sẵn) → đăng nhập được.
- [ ] OTP: mã sai → 6 ô đỏ + message BE; hết 60 giây → "Gửi lại mã" → có mail mới, mã cũ không dùng được; dán mã 6 số được.
- [x] ✅ Đăng nhập Member bằng email; sai mật khẩu báo lỗi dưới ô mật khẩu; nút không bấm được 2 lần khi đang tải.
- [x] ✅ Đăng nhập tài khoản chưa xác thực → `EMAIL_NOT_VERIFIED` → tự gửi mã (mail mới), sang AU-04 với câu "Tài khoản chưa xác thực email…" → nhập mã → đăng nhập được.
- [ ] Đăng nhập tài khoản bị khoá (nhờ BE khoá) → ở lại AU-02, khung "Tài khoản của bạn đã bị khoá."; đang dùng app mà bị khoá → tự đăng xuất, về AU-02 với khung đó.
- [ ] Để access token hết hạn (> 15 phút) rồi tắt app mở lại → app tự refresh (BE trả 403 body rỗng), vẫn đăng nhập.
- [x] ✅ **Tắt hẳn app rồi mở lại → vẫn đăng nhập.** Đăng xuất → về Guest; mở lại app → vẫn là Guest. Đã đăng nhập thì vuốt Back không quay lại màn Đăng nhập (thoát app).
- [x] ✅ Quên mật khẩu (thật): nhập email → mail "Mã OTP đặt lại mật khẩu" → nhập mã + mật khẩu mới → về Đăng nhập (email điền sẵn, thông báo) → đăng nhập bằng mật khẩu mới.
- [x] ✅ Đổi mật khẩu (thật): sai mật khẩu hiện tại → lỗi dưới ô; thành công → đăng xuất, về AU-02 "mời đăng nhập lại", đăng nhập lại bằng mật khẩu mới được.
- [x] ✅ Tab Cá nhân: thẻ đầu → PR-02; mục "Sắp có" bấm → Toast; Đăng xuất hỏi xác nhận; ⚙ → Cài đặt → Đổi mật khẩu; bản khách có Đăng nhập / Tạo tài khoản.
- [x] ✅ Hồ sơ: xem (PR-02), sửa tên/SĐT, lưu → PR-02 và PR-01 cập nhật ngay; nút Lưu mờ khi chưa sửa; Huỷ khi đã sửa hỏi "Bỏ thay đổi?".
- [x] ✅ Mã Member: QR + mã chữ, Sao chép mã, độ sáng tăng khi mở và trả lại khi rời.
- [ ] Đăng ký tổ chức đủ 4 bước + Xem lại; back giữ dữ liệu; file > 5 MB bị chặn; thiếu CCCD mặt sau bị chặn; gửi xong → OA-06 Chờ xác minh.
- [ ] Tổ chức (mock, khi làm OA): trạng thái REJECTED → OA-06 Bị từ chối có lý do; VERIFIED → tab tổ chức; tổ chức **không** vào được màn Member.
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

Lên GitHub → **Compare & pull request** → **base: `develop`** ← compare: `feature/phase1-auth` (kiểm kỹ, mặc định có thể là `main`). Nội dung PR gợi ý:

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
5. ~~PR merge vào `develop` hay `main`~~ → `develop` (đã chốt 17/10); tên package Android.
6. Địa chỉ email hỗ trợ ReHome (thông báo tài khoản bị khoá).

**Backend:** đã gửi, đang chờ; danh sách đầy đủ ở mục "Đang chờ xác nhận" trong `CLAUDE.md` (nhãn [CHỜ BE]). Còn hỏi thêm:

1. Upload ảnh/tệp: giới hạn dung lượng, định dạng.
2. Google Cloud project để tạo OAuth client Android.
