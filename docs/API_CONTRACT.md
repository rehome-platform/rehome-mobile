# ReHome — Mô tả API (hợp đồng FE–Backend)

Tài liệu mô tả toàn bộ API backend, xếp theo đúng thứ tự luồng/phase
trong kế hoạch triển khai code, để FE web, FE mobile và BE code song
song theo từng phase. Mỗi API gắn mã F-xxx để đối chiếu ngược về tài
liệu tổng quan khi cần.

## Quy ước chung

**Base path:** /api/v1 · **Auth:** header Authorization: Bearer \<JWT\>
trên mọi API trừ API đánh dấu **\[Guest\]** (không cần đăng nhập) và
webhook MoMo/GHN (xác thực bằng chữ ký riêng, không qua JWT).

**Actor (role trong JWT):** MEMBER · ORGANIZATION · MODERATOR · ADMIN.
Guest = chưa có token. Mỗi API trong tài liệu ghi rõ actor được gọi ở
cột **Role**.

**Quy ước kiểu dữ liệu**

| Kiểu       | Quy ước                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| id         | UUID dạng chuỗi, riêng Product.id là mã SKU dạng chuỗi (vd Q7-AK-000845), không phải UUID |
| tiền       | số nguyên, đơn vị VNĐ, không có phần thập phân                                            |
| thời điểm  | ISO-8601 UTC, vd 2026-10-13T07:30:00Z                                                     |
| tỷ lệ %    | số thập phân 0–1, vd hoa hồng 10% = 0.10                                                  |
| enum       | chuỗi UPPER_SNAKE_CASE, giá trị liệt kê lấy nguyên từ thiết kế DB                         |
| field JSON | camelCase (vd memberCode, agreedPrice) — khác với tên cột DB là snake_case                |

**Khung response**

- Mọi response (thành công **và** lỗi) đều bọc trong envelope chung: {

  > "result": \<dữ liệu\|null\>, "isSuccess": boolean, "statusCode":
  > number, "message": string }.

- Thành công: isSuccess:true, statusCode 200/201/204, result = object

  > hoặc list thật (object/array rời, không phải HTTP body rời như bản
  > cũ). Danh sách có phân trang: ?page=0&size=20 (0-based) → result: {
  > "content": \[...\], "page": 0, "size": 20, "totalElements": N,
  > "totalPages": M }.

- Lỗi: isSuccess:false, result:null, message là câu mô tả cho FE hiển

  > thị. statusCode tương ứng — 400 validate sai, 401 chưa đăng
  > nhập/token hết hạn, 403 sai role hoặc sai kho/sai chủ sở hữu, 404
  > không tìm thấy, 409 vi phạm quy tắc nghiệp vụ (vd giá dưới sàn, quá
  > 5 form chờ, sai trạng thái để thao tác), 422 dữ liệu hợp lệ cú pháp
  > nhưng không xử lý được.

- Mỗi API trong tài liệu từ đây đánh số thứ tự (API 1, API 2, …) và
  > trình bày theo khuôn 5 phần: a. Overview (mô tả nghiệp vụ) · b. API
  > Specification (method + URL + Permission) · c. Request sample · d.
  > Response sample · e. Validation (bảng status code – mô tả – ví dụ
  > JSON lỗi theo envelope trên).

**Cách tra cứu trong tài liệu này**

- Tài liệu xếp theo đúng 7 phase của kế hoạch triển khai code (Phase 1 →

  > Phase 7), mỗi phase là một hoặc vài section bên dưới — mở đúng phase
  > đang code là thấy toàn bộ API cần cho phase đó.

- Mỗi dòng API ghi kèm mã **F-xxx** (function trong tài liệu tổng quan,

  > mục 5) và **mã màn hình** (AU-xx, KG-xx, BR-xx... theo Screen
  > Inventory) — Ctrl+F theo mã này để nhảy thẳng đến API đúng màn đang
  > vẽ/code.

- Mục lục tra cứu nhanh ở cuối tài liệu liệt kê toàn bộ API theo thứ tự

  > mã F-code tăng dần, dùng khi đã biết F-code nhưng không nhớ nằm ở
  > phase nào.

- API nào không có dòng riêng (vd F-005, F-016, F-019, F-026...) là quy
  > tắc nghiệp vụ xử lý **bên trong** một API khác (validate, tự động
  > hoá), không phải endpoint riêng — các dòng đó được ghi chú ngay dưới
  > bảng liên quan thay vì tạo API giả.

**Việc do System tự làm (scheduler), không phải API cho FE gọi:** hết
hạn form/yêu cầu quá hạn, tự gia hạn kỳ ký gửi, tự huỷ đơn chưa thanh
toán, tự hoàn thành đơn, tự nhả việc đã nhận sau 48h, tự đóng chiến dịch
hết hạn, tự xoá ảnh giấy tờ tổ chức. FE không cần gọi API cho các việc
này — chỉ cần GET lại resource để thấy trạng thái đã đổi.

## Phase 1 — Auth & Hồ sơ (L-01)

Màn hình liên quan: AU-01 → AU-07, PR-01 → PR-04.

### API 1 — POST /auth/register/member (Nguyên) done

**F-code:** F-001 · **Role:** \[Guest\]

**a. Overview**

Member tạo tài khoản mới bằng email + password. Hệ thống sinh
memberCode, tạo account với emailVerified:false và gửi OTP xác minh về
email (dùng ở API 2).

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| POST   | /auth/register/member |

Permission: Guest (không cần token)

**c. Request sample**

{  
"email": "anh.ta@gmail.com",  
"password": "Str0ngPass!",  
"fullName": "Tạ Thị Ngọc Anh",  
"phone": "0912345678"  
}

**d. Response sample**

{  
"result": {  
"accountId": "8f1c2e40-...",  
"memberCode": "MB-000123",  
"email": "anh.ta@gmail.com",  
"emailVerified": false  
},  
"isSuccess": true,  
"statusCode": 201,  
"message": "Đăng ký thành công, vui lòng xác minh email"  
}

**e. Validation**

| Status code | Description                                           | Examples                                                                                           |
| ----------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field hoặc sai định dạng (email/password/phone) | {"result":null,"isSuccess":false,"statusCode":400,"message":"Email không đúng định dạng."}         |
| 409         | Email đã được dùng để đăng ký                         | {"result":null,"isSuccess":false,"statusCode":409,"message":"EMAIL_TAKEN: email đã được sử dụng."} |

### API 2 — POST /auth/verify-email (Nguyên) done

**F-code:** F-001 · **Role:** \[Guest\]

**a. Overview**

Xác minh email bằng OTP gửi ở API 1. Ở api này có 2 mục đích : đầu tiên
là đăng ký, và thứ hai là quên mật khẩu. Thành công thì emailVerified
chuyển true. Mã hết hạn thì gọi POST /auth/resend-otp { email } để nhận
mã mới (không có bước duyệt riêng, FE tự gọi lại).

**b. API Specification**

| Method | URL                |
| ------ | ------------------ |
| POST   | /auth/verify-email |

Permission: Guest (không cần token)

**c. Request sample**

{  
"email": "[<u>anh.ta@gmail.com</u>](mailto:anh.ta@gmail.com)",  
"purpose": "REGISTER",  
"otpCode": "482913"  
}

**d. Response sample**

{  
"result": { "emailVerified": true },  
"isSuccess": true,  
"statusCode": 200,  
"message": "Xác minh email thành công"  
}

**e. Validation**

| Status code | Description        | Examples                                                                                                                      |
| ----------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 400         | OTP sai            | {"result":null,"isSuccess":false,"statusCode":400,"message":"Mã OTP không đúng."}                                             |
| 404         | Email chưa đăng ký | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tài khoản với email này."}                        |
| 409         | OTP hết hạn        | {"result":null,"isSuccess":false,"statusCode":409,"message":"OTP_EXPIRED: mã đã hết hạn, vui lòng gọi lại /auth/resend-otp."} |

### API 3 — POST /auth/register/organization (Nguyên) done

**F-code:** F-002 · **Role:** \[Guest\]

**a. Overview**

Tổ chức (đơn vị từ thiện/thu gom) đăng ký tài khoản: hồ sơ pháp lý,
người đại diện (CCCD 2 mặt), danh sách giấy tờ (documents, tối thiểu 1
tệp — checklist theo loại hình xem mục 9 tài liệu tổng quan), và điểm
nhận donation (donationPoint). Ảnh/tệp phải upload qua POST /uploads lấy
URL trước khi gửi API này (xem Quy ước chung). Tạo xong thì
verificationStatus:"PENDING", chờ Moderator duyệt ở Phase 6.

**b. API Specification**

| Method | URL                         |
| ------ | --------------------------- |
| POST   | /auth/register/organization |

Permission: Guest (không cần token)

**c. Request sample**

{  
"legalName": "Quỹ Chia Sẻ Yêu Thương",  
"displayName": "Chia Sẻ Yêu Thương",  
"orgType": "CHARITY",  
"taxCode": "0312345678",  
"operationScope": "TP.HCM",  
"address": "12 Nguyễn Trãi, Q.1, TP.HCM",  
"contactPhone": "0281234567",  
"contactEmail": "contact@chiase.org",  
"website": "https://chiase.org",  
"description": "Thu gom quần áo cũ hỗ trợ trẻ em vùng cao",  
"logoUrl": "https://cdn.rehome.vn/uploads/logo-abc.png",  
"representative": {  
"fullName": "Nguyễn Văn B",  
"position": "Giám đốc",  
"cccdNumber": "079123456789",  
"cccdFrontUrl": "https://cdn.rehome.vn/uploads/cccd-front.jpg",  
"cccdBackUrl": "https://cdn.rehome.vn/uploads/cccd-back.jpg"  
},  
"documents": \[  
{ "docType": "OPERATING_LICENSE", "docNumber": "GP-004521", "issueDate":
"2022-03-01", "issuingAuthority": "Sở Nội vụ TP.HCM", "fileUrl":
"https://cdn.rehome.vn/uploads/license.pdf" }  
\],  
"donationPoint": {  
"name": "Điểm nhận đồ Q.1",  
"address": "12 Nguyễn Trãi, Q.1, TP.HCM",  
"latitude": 10.762,  
"longitude": 106.682,  
"receivingHours": "8:00-17:00 T2-T6",  
"contactPhone": "0281234567"  
}  
}

**d. Response sample**

{  
"result": { "accountId": "a1b2c3d4-...", "verificationStatus": "PENDING"
},  
"isSuccess": true,  
"statusCode": 201,  
"message": "Đăng ký thành công, hồ sơ đang chờ duyệt"  
}

**e. Validation**

| Status code | Description                              | Examples                                                                                                          |
| ----------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field bắt buộc hoặc documents rỗng | {"result":null,"isSuccess":false,"statusCode":400,"message":"documents phải có tối thiểu 1 tệp giấy tờ pháp lý."} |
| 409         | Email/taxCode đã đăng ký                 | {"result":null,"isSuccess":false,"statusCode":409,"message":"EMAIL_TAKEN: email đã được sử dụng."}                |

### API 4 — PUT /organizations/me/registration (Nguyên) coi lại api này nha Tài. Nếu body giống api 3 thì để đó luôn

**F-code:** F-003 · **Role:** Organization

**a. Overview**

Tổ chức nộp lại hồ sơ đăng ký sau khi bị Moderator từ chối
(verificationStatus = REJECTED). Body giống hệt API 3. Nộp lại thì
verificationStatus quay về PENDING để Moderator duyệt lại.

**b. API Specification**

| Method | URL                            |
| ------ | ------------------------------ |
| PUT    | /organizations/me/registration |

Permission: Organization

**c. Request sample**

{ "legalName": "Quỹ Chia Sẻ Yêu Thương", "...": "giống API 3" }

**d. Response sample**

{  
"result": { "verificationStatus": "PENDING" },  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đã nộp lại hồ sơ, chờ duyệt"  
}

**e. Validation**

| Status code | Description                                    | Examples                                                                                                          |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field bắt buộc                           | {"result":null,"isSuccess":false,"statusCode":400,"message":"documents phải có tối thiểu 1 tệp giấy tờ pháp lý."} |
| 403         | Gọi khi verificationStatus không phải REJECTED | {"result":null,"isSuccess":false,"statusCode":403,"message":"Chỉ nộp lại hồ sơ khi trạng thái là REJECTED."}      |

### API 5 — POST /auth/login (Nguyên) done

**F-code:** F-004 · **Role:** \[Guest\]

**a. Overview**

Đăng nhập email + password, trả accessToken/refreshToken và thông tin
account. Tổ chức (role ORGANIZATION) đọc verificationStatus trong
response để FE tự điều hướng màn hình phù hợp (chờ duyệt / bị từ chối /
đã duyệt) — đây là F-005, không có API riêng.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| POST   | /auth/login |

Permission: Guest (không cần token)

**c. Request sample**

{ "email": "anh.ta@gmail.com", "password": "Str0ngPass!" }

**d. Response sample**

{  
"result": {  
"accessToken": "eyJhbGciOi...",  
"refreshToken": "d290f1ee-...",  
"account": { "id": "8f1c2e40-...", "role": "MEMBER" }  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đăng nhập thành công"  
}

**e. Validation**

| Status code | Description              | Examples                                                                                             |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------------- |
| 400         | Sai email hoặc password  | {"result":null,"isSuccess":false,"statusCode":400,"message":"Email hoặc mật khẩu không đúng."}       |
| 403         | Account bị khóa (BANNED) | {"result":null,"isSuccess":false,"statusCode":403,"message":"ACCOUNT_BANNED: tài khoản đã bị khóa."} |

### API 6 — POST /auth/login/google (Nguyên) done

**F-code:** F-004 · **Role:** \[Guest\]

**a. Overview**

Đăng nhập bằng Google ID token. Nếu account chưa tồn tại (lần đầu đăng
nhập Google) thì tự tạo account mới với role mặc định MEMBER. Response
giống /auth/login.

**b. API Specification**

| Method | URL                |
| ------ | ------------------ |
| POST   | /auth/login/google |

Permission: Guest (không cần token)

**c. Request sample**

{ "idToken": "eyJhbGciOiJSUzI1NiIs..." }

**d. Response sample**

{  
"result": {  
"accessToken": "eyJhbGciOi...",  
"refreshToken": "d290f1ee-...",  
"account": { "id": "8f1c2e40-...", "role": "MEMBER" }  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đăng nhập thành công"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                             |
| ----------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 400         | idToken không hợp lệ hoặc hết hạn | {"result":null,"isSuccess":false,"statusCode":400,"message":"idToken không hợp lệ."}                 |
| 403         | Account bị khóa (BANNED)          | {"result":null,"isSuccess":false,"statusCode":403,"message":"ACCOUNT_BANNED: tài khoản đã bị khóa."} |

### API 7 — POST /auth/logout (Nguyên) done

**F-code:** F-006 · **Role:** Member / Organization / Moderator / Admin

**a. Overview**

Đăng xuất: server huỷ refreshToken được gửi lên, chặn không cho cấp
accessToken mới từ token đó nữa.

**b. API Specification**

| Method | URL          |
| ------ | ------------ |
| POST   | /auth/logout |

Permission: Member / Organization / Moderator / Admin

**c. Request sample**

{ "refreshToken": "d290f1ee-..." }

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đăng
xuất thành công" }

**e. Validation (Không có lỗi khi user logout phải check token, vì nếu
token hết nhưng user muốn logout báo lỗi thì là sai)**

| Status code | Description                          | Examples                                                                                           |
| ----------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| 401         | Không có token hoặc token đã hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 8 — POST /auth/password/forgot (Nguyên) done

**F-code:** F-007 · **Role:** \[Guest\]

**a. Overview**

Yêu cầu quên mật khẩu, hệ thống gửi link reset về email. Luôn trả 204 kể
cả email không tồn tại trong hệ thống, để tránh lộ thông tin email nào
đã đăng ký (chống dò email).

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| POST   | /auth/password/forgot |

Permission: Guest (không cần token)

**c. Request sample**

{ "email": "anh.ta@gmail.com" }

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Nếu
email tồn tại, link đặt lại mật khẩu đã được gửi" }

**e. Validation**

| Status code | Description                | Examples                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| 400         | Email không đúng định dạng | {"result":null,"isSuccess":false,"statusCode":400,"message":"Email không đúng định dạng."} |

### API 9 — POST /auth/password/reset (Nguyên) done

**F-code:** F-007 · **Role:** \[Guest\]

**a. Overview**

Đặt lại mật khẩu bằng resetToken lấy từ link trong email (API 8). Token
hết hạn thì phải yêu cầu quên mật khẩu lại từ đầu.

**b. API Specification**

| Method | URL                  |
| ------ | -------------------- |
| POST   | /auth/password/reset |

Permission: Guest (không cần token)

**c. Request sample**

{ "resetToken": "a7f3c9e1-...", "newPassword": "N3wStr0ngPass!" }

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đặt
lại mật khẩu thành công" }

**e. Validation**

| Status code | Description                | Examples                                                                                                        |
| ----------- | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 400         | newPassword không đủ mạnh  | {"result":null,"isSuccess":false,"statusCode":400,"message":"Mật khẩu mới phải tối thiểu 8 ký tự."}             |
| 409         | resetToken hết hạn/đã dùng | {"result":null,"isSuccess":false,"statusCode":409,"message":"TOKEN_EXPIRED: link đặt lại mật khẩu đã hết hạn."} |

### API 10 — POST /auth/password/change (Nguyên)

**F-code:** F-008 · **Role:** Member / Organization / Moderator / Admin

**a. Overview**

Đổi mật khẩu khi đã đăng nhập, yêu cầu nhập đúng mật khẩu cũ để xác
thực.

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| POST   | /auth/password/change |

Permission: Member / Organization / Moderator / Admin

**c. Request sample**

{ "oldPassword": "Str0ngPass!", "newPassword": "N3wStr0ngPass!" }

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đổi
mật khẩu thành công" }

**e. Validation**

| Status code | Description                  | Examples                                                                                               |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| 400         | Sai mật khẩu cũ              | {"result":null,"isSuccess":false,"statusCode":400,"message":"WRONG_PASSWORD: mật khẩu cũ không đúng."} |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."}     |

### API 11 — GET /members/me (Tài) done

**F-code:** F-009 · **Role:** Member

**a. Overview**

Lấy thông tin hồ sơ cá nhân của Member đang đăng nhập (dùng cho màn
Trang cá nhân).

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| GET    | /members/me |

Permission: Member

**c. Request sample**

N/A (không có body/query, lấy theo account trong token)

**d. Response sample**

{  
"result": {  
"accountId": "8f1c2e40-...",  
"email": "anh.ta@gmail.com",  
"phone": "0912345678",  
"fullName": "Tạ Thị Ngọc Anh",  
"avatarUrl": "https://cdn.rehome.vn/uploads/avatar.jpg",  
"memberCode": "MB-000123",  
"emailVerified": true  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                               | Examples                                                                                                   |
| ----------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn              | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."}         |
| 403         | Token hợp lệ nhưng role không phải Member | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập tài nguyên này."} |

### API 12 — PATCH /members/me (Tài) done

**F-code:** F-010 · **Role:** Member

**a. Overview**

Cập nhật hồ sơ cá nhân (chỉ gửi field muốn đổi — fullName, avatarUrl,
phone đều optional).

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| PATCH  | /members/me |

Permission: Member

**c. Request sample**

{

"fullName": "Tạ Thị Ngọc Anh",

"phone": "0912345679",

"avatarUrl": "https://cdn.rehome.vn/uploads/avatar2.jpg"

}

**d. Response sample**

{  
"result": {  
"accountId": "8f1c2e40-...",  
"fullName": "Tạ Thị Ngọc Anh",  
"phone": "0912345679",  
"avatarUrl": "https://cdn.rehome.vn/uploads/avatar.jpg"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Cập nhật hồ sơ thành công"  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 400         | phone sai định dạng          | {"result":null,"isSuccess":false,"statusCode":400,"message":"Số điện thoại không đúng định dạng."} |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 13 — GET /members/me/code (Tài) done

**F-code:** F-011 · **Role:** Member

**a. Overview**

Lấy mã định danh (dạng chuỗi ký tự) của Member để Moderator xem/nhập tại
quầy (ký gửi/trả hàng/nhận hàng). FE chỉ cần hiển thị thẳng chuỗi
memberCode lên màn hình.

**b. API Specification**

| Method | URL              |
| ------ | ---------------- |
| GET    | /members/me/code |

Permission: Member

**c. Request sample**

N/A (không có body/query, lấy theo account trong token)

**d. Response sample**

{  
"result": { "memberCode": "MB-000123" } ,  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

## Phase 2 — Ký gửi, phía Member (L-02)

Màn hình liên quan: KG-01 → KG-16.

### API 14 — GET /warehouses/nearest (Nguyên)

**F-code:** F-015 · **Role:** Member

**a. Overview**

Tìm các kho gần vị trí hiện tại của Member, sắp xếp theo khoảng cách
tăng dần — dùng ở bước chọn kho khi tạo form ký gửi (màn KG-03).

**b. API Specification**

| Method | URL                                     |
| ------ | --------------------------------------- |
| GET    | /warehouses/nearest?lat={lat}&lng={lng} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string lat, lng)

**d. Response sample**

{  
"result": \[  
{ "id": "wh-01", "name": "Kho Quận 1", "address": "12 Nguyễn Trãi, Q.1",
"distanceKm": 1.8 },  
{ "id": "wh-02", "name": "Kho Thủ Đửc", "address": "88 Võ Văn Ngân, Thủ
Đửc", "distanceKm": 6.4 }  
\],  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 400         | Thiếu hoặc sai lat/lng       | {"result":null,"isSuccess":false,"statusCode":400,"message":"lat/lng không hợp lệ."}               |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 15 — POST /consignment-forms (Nguyên)

**F-code:** F-014 · **Role:** Member

**a. Overview**

Member tạo yêu cầu ký gửi mới (bước đầu của luồng ký gửi): chọn danh
mục/thương hiệu, mô tả sản phẩm, giá mong muốn, kho muốn mang đến và
ảnh. Form tạo xong ở trạng thái PENDING, chờ Moderator duyệt (xem Phase
2 — Moderator).

**b. API Specification**

| Method | URL                |
| ------ | ------------------ |
| POST   | /consignment-forms |

Permission: Member

**c. Request sample**

{  
"categoryId": "cat-ao-so-mi",  
"brandId": "brand-zara",  
"productName": "Áo sơ mi Zara trắng",  
"description": "Mặc 2 lần, không lệi",  
"desiredPrice": 250000,  
"warehouseId": "wh-01",  
"photoUrls": \["https://cdn.rehome.vn/uploads/ao1.jpg",
"https://cdn.rehome.vn/uploads/ao2.jpg"\]  
}

**d. Response sample**

{  
"result": { "id": "cf-001", "status": "PENDING", "bringInDeadline":
null, "createdAt": "2026-10-13T08:00:00Z" },  
"isSuccess": true,  
"statusCode": 201,  
"message": "Tạo yêu cầu ký gửi thành công"  
}

**e. Validation**

| Status code | Description                             | Examples                                                                                                                     |
| ----------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field hoặc desiredPrice ≤ 0       | {"result":null,"isSuccess":false,"statusCode":400,"message":"desiredPrice phải lớn hơn 0."}                                  |
| 401         | Chưa đăng nhập/token hết hạn            | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."}                           |
| 409         | Member đang có ≥ 5 form PENDING (F-016) | {"result":null,"isSuccess":false,"statusCode":409,"message":"TOO_MANY_PENDING_FORMS: bạn đang có quá nhiều form chờ duyệt."} |

### API 16 — GET /consignment-forms (Nguyên)

**F-code:** F-018 · **Role:** Member

**a. Overview**

Danh sách form ký gửi của Member, lọc theo status (màn theo dõi trạng
thơi ký gửi).

**b. API Specification**

| Method | URL                                                        |
| ------ | ---------------------------------------------------------- |
| GET    | /consignment-forms?status={status}&page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": {  
"content": \[ { "id": "cf-001", "status": "PENDING", "productName": "Áo
sơ mi Zara trắng", "desiredPrice": 250000 } \],  
"page": 0, "size": 20, "totalElements": 1, "totalPages": 1  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 17 — GET /consignment-forms/{id} (Nguyên)

**F-code:** F-018 · **Role:** Member

**a. Overview**

Chi tiết 1 form ký gửi, gồm lý do từ chối (rejectReason) nếu có, hạn
mang hàng đến kho (bringInDeadline) và receiptId nếu đã duyệt.

**b. API Specification**

| Method | URL                     |
| ------ | ----------------------- |
| GET    | /consignment-forms/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{  
"result": {  
"id": "cf-001", "status": "REJECTED", "productName": "Áo sơ mi Zara
trắng",  
"rejectReason": "Ảnh không rõ tình trạng sản phẩm", "bringInDeadline":
null, "receiptId": null  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                         | Examples                                                                                           |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn        | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |
| 403         | Form không thuộc về Member đang gọi | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền xem form này."}    |
| 404         | Không tìm thấy form                 | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."}         |

### API 18 — PUT /consignment-forms/{id} (Nguyên)

**F-code:** F-017 · **Role:** Member

**a. Overview**

Sửa lại thông tin form ký gửi (body giống API 15). Chỉ sửa được khi form
còn ở PENDING — nếu Moderator đã duyệt/từ chối thì không sửa được nụa.

**b. API Specification**

| Method | URL                     |
| ------ | ----------------------- |
| PUT    | /consignment-forms/{id} |

Permission: Member

**c. Request sample**

{  
"categoryId": "cat-ao-so-mi", "brandId": "brand-zara", "productName":
"Áo sơ mi Zara trắng",  
"description": "Mặc 1 lần, không lệi", "desiredPrice": 230000,
"warehouseId": "wh-01",  
"photoUrls": \["https://cdn.rehome.vn/uploads/ao1.jpg"\]  
}

**d. Response sample**

{  
"result": { "id": "cf-001", "status": "PENDING", "desiredPrice": 230000
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Cập nhật form thành công"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                             |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field hoặc desiredPrice ≤ 0 | {"result":null,"isSuccess":false,"statusCode":400,"message":"desiredPrice phải lớn hơn 0."}                          |
| 404         | Không tìm thấy form               | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."}                           |
| 409         | Form không còn ở PENDING          | {"result":null,"isSuccess":false,"statusCode":409,"message":"FORM_NOT_EDITABLE: form đã được xử lý, không thể sửa."} |

### API 19 — GET /consignment-receipts/{id} (Nguyên)

**F-code:** F-020, F-023 · **Role:** Member

**a. Overview**

Xem phiếu ký gửi (biên bản thỏa thuận) sau khi form đã được Moderator
duyệt: giá đã thỏa thuận, giá sàn, thời hạn kỳ, số lần gia hạn tối đa,
tỷ lệ hoa hồng theo kỳ... confirmedAt = null nghĩa là chưa xác nhận
(đang ở bước đọc điều khoản); đã xác nhận thì có pdfUrl để tải PDF
(F-023 — mở lại xem phiếu cũ dùng chung API này).

**b. API Specification**

| Method | URL                        |
| ------ | -------------------------- |
| GET    | /consignment-receipts/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{  
"result": {  
"id": "rc-001", "receiptNo": "RC-2026-000045", "agreedPrice": 220000,
"floorPrice": 110000,  
"termLengthDays": 30, "maxRenewals": 2, "freeWithdrawalWindowDays": 7,  
"commissionRateTerm1": 0.10, "commissionRateTerm2": 0.15,
"commissionRateTerm3": 0.20,  
"withdrawalFee": 20000, "degradedCompensationRate": 0.5,  
"confirmedAt": null, "pdfUrl": null  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                          | Examples                                                                                         |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 403         | Phiếu không thuộc về Member đang gọi | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền xem phiếu này."} |
| 404         | Không tìm thấy phiếu                 | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy phiếu ký gửi."}      |

### API 20 — POST /consignment-receipts/{id}/confirm (Nguyên)

**F-code:** F-021, F-022 · **Role:** Member

**a. Overview**

Member xác nhận đồng ý phiếu ký gửi bằng thao tác tap-to-confirm (không
cẳn chữ ký tay, có ghi audit log). Server tự sinh PDF snapshot toàn bộ
phí/tỷ lệ tại thời điểm xác nhận (F-022); sau bước này sản phẩm chính
thức lên sàn.

**b. API Specification**

| Method | URL                                |
| ------ | ---------------------------------- |
| POST   | /consignment-receipts/{id}/confirm |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{  
"result": {  
"id": "rc-001", "confirmedAt": "2026-10-13T08:10:00Z",  
"pdfUrl": "https://cdn.rehome.vn/receipts/rc-001.pdf"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Xác nhận ký gửi thành công, sản phẩm đã lên sàn"  
}

**e. Validation**

| Status code | Description                     | Examples                                                                                    |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy phiếu            | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy phiếu ký gửi."} |
| 409         | Phiếu đã được xác nhận trước đó | {"result":null,"isSuccess":false,"statusCode":409,"message":"Phiếu này đã được xác nhận."}  |

### API 21 — GET /products/mine (Nguyên)

**F-code:** F-024 · **Role:** Member

**a. Overview**

Danh sách sản phẩm ký gửi của Member, mỗi item kèm kỳ hiện tại, thời
gian bắt đầu kỳ, hạn xử lý cuối kỳ và doanh thu dự kiến. status lọc theo
nhóm: đang bán / đã có đơn / chờ xử lý cuối kỳ / đang rút / đã kết thúc.

**b. API Specification**

| Method | URL                                                    |
| ------ | ------------------------------------------------------ |
| GET    | /products/mine?status={status}&page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": {  
"content": \[{  
"id": "Q7-AK-000845", "productName": "Áo sơ mi Zara trắng", "status":
"ON_SALE",  
"currentTerm": 1, "termStartedAt": "2026-09-13T08:10:00Z",
"endOfTermDeadline": "2026-10-13T08:10:00Z",  
"commissionRateCurrentTerm": 0.10, "expectedPayout": 198000  
}\],  
"page": 0, "size": 20, "totalElements": 1, "totalPages": 1  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 22 — GET /products/{id} (Nguyên)

**F-code:** F-024 · **Role:** Member / Guest

**a. Overview**

Chi tiết 1 sản phẩm, kèm endOfTermDecision (hạn + quyết định) khi sản
phẩm đang chờ xử lý cuối kỳ, hoặc null khi không ở trạng thái đó.
Guest/Member mua hàng cũng dùng chung API này ở trang chi tiết sản phẩm
(xem Phase 3).

**b. API Specification**

| Method | URL            |
| ------ | -------------- |
| GET    | /products/{id} |

Permission: Member / Guest (không cần token)

**c. Request sample**

N/A

**d. Response sample**

{  
"result": {  
"id": "Q7-AK-000845", "productName": "Áo sơ mi Zara trắng",
"currentPrice": 220000, "status": "ON_SALE",  
"endOfTermDecision": null  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."} |

### API 23 — POST /products/{id}/price-reduction (Nguyên)

**F-code:** F-025 · **Role:** Member

**a. Overview**

Member tự giảm giá bán sản phẩm đang ký gửi để dễ bán hơn. Giá mới phải
thấp hơn giá hiện tại và không được thấp hơn giá sàn (floorPrice = 50%
giá đã thỏa thuận), và chỉ được giảm 1 lần/ngày.

**b. API Specification**

| Method | URL                            |
| ------ | ------------------------------ |
| POST   | /products/{id}/price-reduction |

Permission: Member

**c. Request sample**

{ "newPrice": 200000 }

**d. Response sample**

{ "result": { "currentPrice": 200000 }, "isSuccess": true, "statusCode":
200, "message": "Đã giảm giá sản phẩm" }

**e. Validation**

| Status code | Description                          | Examples                                                                                                                                |
| ----------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | newPrice không thấp hơn giá hiện tại | {"result":null,"isSuccess":false,"statusCode":400,"message":"Giá mới phải thấp hơn giá hiện tại."}                                      |
| 404         | Không tìm thấy sản phẩm              | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}                                                 |
| 409         | newPrice dưới giá sàn                | {"result":null,"isSuccess":false,"statusCode":409,"message":"BELOW_FLOOR_PRICE: giá mới không được thấp hơn giá sàn."}                  |
| 409         | Đã giảm giá trong ngày (F-026)       | {"result":null,"isSuccess":false,"statusCode":409,"message":"PRICE_CHANGE_LIMIT_REACHED: mỗi sản phẩm chỉ giảm giá tối đa 1 lần/ngày."} |

### API 24 — POST /end-of-term-decisions/{id}/decide (Nguyên)

**F-code:** F-029 · **Role:** Member

**a. Overview**

Khi hết kỳ ký gửi mà sản phẩm vẫn chưa bán được, Member chọn 1 trong 2:
TAKE_BACK (nhận lại hàng) hoặc RE_CONSIGN (ký gửi lại — xem F-030 ở ghi
chú cuối section). Nếu quá hạn 30 ngày mà không chọn, System tự đánh dấu
UNCLAIMED (F-031, chuyển sang quy trình xử lý hàng vô thừa nhận ở Phase
2 — Moderator).

**b. API Specification**

| Method | URL                                |
| ------ | ---------------------------------- |
| POST   | /end-of-term-decisions/{id}/decide |

Permission: Member

**c. Request sample**

{ "decision": "RE_CONSIGN" }

**d. Response sample**

{ "result": { "decision": "RE_CONSIGN", "newReceiptId": "rc-002" },
"isSuccess": true, "statusCode": 200, "message": "Đã ghi nhận quyết
định" }

**e. Validation**

| Status code | Description                                       | Examples                                                                                                                                     |
| ----------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy quyết định cuối kỳ                 | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu quyết định cuối kỳ."}                                    |
| 409         | Đã quá hạn 30 ngày (System đã đánh dấu UNCLAIMED) | {"result":null,"isSuccess":false,"statusCode":409,"message":"DECISION_EXPIRED: đã quá hạn quyết định, hàng chuyển sang xử lý vô thừa nhận."} |

**Ký gửi lại (F-030):** sau khi chọn RE_CONSIGN, Moderator thương lượng
giá mới trên web (xem Phase 2 — Moderator), tạo một ConsignmentReceipt
mới ở trạng thái chưa xác nhận; Member xem và xác nhận bằng đúng 2 API
GET/POST /consignment-receipts/{id} ở trên — không có API riêng cho
luồng này.

## Phase 2 — Ký gửi, phía Moderator tại quầy & kho

Màn hình liên quan: MA-04, HQ-01 → HQ-02, QT-01 → QT-03, KD-01 → KD-11,
TK-01 → TK-04, DM-01 → DM-03. Mọi API Moderator chỉ thao tác trong phạm
vi kho của Moderator đó (lấy từ JWT) — gọi lên sản phẩm/kho khác trả 403
OUT_OF_WAREHOUSE_SCOPE.

**Tra cứu tại quầy**

### API 25 — POST /counter/lookup (Nguyên)

**F-code:** F-108, F-110 · **Role:** Moderator

**a. Overview**

Moderator tại quầy tra Member bằng 1 trong 3 cách: mã Member, số điện
thoại, hoặc quét QR (qrPayload). Nếu tra theo số điện thoại (có thể
không duy nhất) trả về danh sách để Moderator chọn đúng người.

**b. API Specification**

| Method | URL             |
| ------ | --------------- |
| POST   | /counter/lookup |

Permission: Moderator

**c. Request sample**

{ "phone": "0912345678" }

**d. Response sample**

{  
"result": \[  
{ "accountId": "8f1c2e40-...", "fullName": "Tạ Thị Ngọc Anh",
"avatarUrl": "https://cdn.rehome.vn/uploads/avatar.jpg", "memberCode":
"MB-000123" }  
\],  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description                            | Examples                                                                                                       |
| ----------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 400         | Không gởi đúng 1 trong 3 field tra cứu | {"result":null,"isSuccess":false,"statusCode":400,"message":"Phải cung cấp memberCode, phone hoặc qrPayload."} |
| 404         | Không tìm thấy Member                  | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy Member."}                          |

### API 26 — POST /counter/members/{accountId}/confirm-identity (Nguyên)

**F-code:** F-116 · **Role:** Moderator

**a. Overview**

Moderator xác nhận đã kiểm tra danh tính Member tại quầy. Bắt buộc gọi
trước khi thực hiện bàn giao hàng cho người này (nhận hàng ký gửi, trả
hàng, rút hàng...).

**b. API Specification**

| Method | URL                                           |
| ------ | --------------------------------------------- |
| POST   | /counter/members/{accountId}/confirm-identity |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đã
xác nhận danh tính" }

**e. Validation**

| Status code | Description           | Examples                                                                              |
| ----------- | --------------------- | ------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy Member | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy Member."} |

### API 27 — GET /counter/members/{accountId}/tasks (Nguyên)

**F-code:** F-109 · **Role:** Moderator

**a. Overview**

Sau khi xác nhận danh tính, Moderator xem nhanh các việc cần xử lý của
Member đang đững tại quầy: form ký gửi chờ xử lý, yêu cầu rút hàng chờ
xử lý, quyết định cuối kỳ chờ xử lý.

**b. API Specification**

| Method | URL                                |
| ------ | ---------------------------------- |
| GET    | /counter/members/{accountId}/tasks |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{  
"result": { "pendingForms": \[\], "pendingWithdrawals": \[\],
"pendingEndOfTerm": \[\] },  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description           | Examples                                                                              |
| ----------- | --------------------- | ------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy Member | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy Member."} |

### API 28 — GET /queues (Nguyên)

**F-code:** F-111 · **Role:** Moderator

**a. Overview**

Hàng đợi việc chung của kho, lọc theo 7 loại việc (duyệt form, kiểm
định, đóng gói, trả hàng, xác minh tổ chức, thay đổi pháp lý, báo cáo vi
phạm) — màn Hàng đợi công việc (HQ-01).

**b. API Specification**

| Method | URL                 |
| ------ | ------------------- |
| GET    | /queues?type={type} |

Permission: Moderator

**c. Request sample**

N/A (truyền qua query string type: FORM_REVIEW \| INSPECTION \| PACKING
\| RETURN \| ORG_VERIFICATION \| LEGAL_CHANGE \| VIOLATION_REPORT)

**d. Response sample**

{  
"result": \[  
{ "id": "q-001", "type": "FORM_REVIEW", "refId": "cf-001", "claimedBy":
null, "claimedAt": null, "createdAt": "2026-10-13T08:00:00Z" }  
\],  
"isSuccess": true,  
"statusCode": 200,  
"message": ""  
}

**e. Validation**

| Status code | Description       | Examples                                                                          |
| ----------- | ----------------- | --------------------------------------------------------------------------------- |
| 400         | type không hợp lệ | {"result":null,"isSuccess":false,"statusCode":400,"message":"type không hợp lệ."} |

### API 29 — POST /queues/{id}/claim (Nguyên)

**F-code:** F-112 · **Role:** Moderator

**a. Overview**

Moderator nhận 1 việc trong hàng đợi để tự xử lý, tránh 2 người cùng làm
1 việc.

**b. API Specification**

| Method | URL                |
| ------ | ------------------ |
| POST   | /queues/{id}/claim |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "q-001", "claimedBy": "mod-07", "claimedAt":
"2026-10-13T08:05:00Z" }, "isSuccess": true, "statusCode": 200,
"message": "Đã nhận việc" }

**e. Validation**

| Status code | Description                        | Examples                                                                                                          |
| ----------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy việc trong hàng đợi | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy việc."}                               |
| 409         | Người khác vừa nhận trước          | {"result":null,"isSuccess":false,"statusCode":409,"message":"ALREADY_CLAIMED: việc này đã được người khác nhận."} |

### API 30 — POST /queues/{id}/release (Nguyên)

**F-code:** — · **Role:** Moderator

**a. Overview**

Moderator chủ động nhả việc đang nhận (vd bận, chuyển ca) để người khác
nhận lại. Nếu quá 48 giờ không xử lý, System tự nhả việc (F-113), không
cần FE gọi API này.

**b. API Specification**

| Method | URL                  |
| ------ | -------------------- |
| POST   | /queues/{id}/release |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đã
nhả việc" }

**e. Validation**

| Status code | Description                        | Examples                                                                                                |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy việc trong hàng đợi | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy việc."}                     |
| 403         | Việc không do Moderator này nhận   | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không phải người đang nhận việc này."} |

### API 31 — POST /consignment-forms/{id}/approve (Nguyên)

**F-code:** F-114 · **Role:** Moderator

**a. Overview**

Moderator duyệt form ký gửi. Hạn mang hàng đến kho (bringInDeadline)
được tự tính = ngày duyệt + 7 ngày (cấu hình ở mục 11 tài liệu tổng
quan).

**b. API Specification**

| Method | URL                             |
| ------ | ------------------------------- |
| POST   | /consignment-forms/{id}/approve |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{  
"result": { "id": "cf-001", "status": "APPROVED", "bringInDeadline":
"2026-10-20T08:00:00Z" },  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đã duyệt form"  
}

**e. Validation**

| Status code | Description          | Examples                                                                                          |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy form  | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."}        |
| 409         | Form không ở PENDING | {"result":null,"isSuccess":false,"statusCode":409,"message":"Form không ở trạng thái chờ duyệt."} |

### API 32 — POST /consignment-forms/{id}/reject (Nguyên)

**F-code:** F-114 · **Role:** Moderator

**a. Overview**

Moderator từ chối form ký gửi ngay từ bước duyệt hồ sơ (chưa cần Member
mang hàng đến), kèm lý do.

**b. API Specification**

| Method | URL                            |
| ------ | ------------------------------ |
| POST   | /consignment-forms/{id}/reject |

Permission: Moderator

**c. Request sample**

{ "reason": "Ảnh không rõ tình trạng sản phẩm" }

**d. Response sample**

{ "result": { "id": "cf-001", "status": "REJECTED" }, "isSuccess": true,
"statusCode": 200, "message": "Đã từ chối form" }

**e. Validation**

| Status code | Description          | Examples                                                                                          |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------------- |
| 400         | Thiếu reason         | {"result":null,"isSuccess":false,"statusCode":400,"message":"reason là bắt buộc."}                |
| 404         | Không tìm thấy form  | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."}        |
| 409         | Form không ở PENDING | {"result":null,"isSuccess":false,"statusCode":409,"message":"Form không ở trạng thái chờ duyệt."} |

### API 33 — POST /consignment-forms/{id}/inspection/start (Nguyên)

**F-code:** F-115 · **Role:** Moderator

**a. Overview**

Moderator bắt đầu kiểm định khi Member đã mang hàng đến kho (mở từ màn
QT-03).

**b. API Specification**

| Method | URL                                      |
| ------ | ---------------------------------------- |
| POST   | /consignment-forms/{id}/inspection/start |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đã
bắt đầu kiểm định" }

**e. Validation**

| Status code | Description                     | Examples                                                                                          |
| ----------- | ------------------------------- | ------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy form             | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."}        |
| 409         | Form chưa ở trạng thái APPROVED | {"result":null,"isSuccess":false,"statusCode":409,"message":"Form chưa được duyệt để kiểm định."} |

### API 34 — POST /consignment-forms/{id}/inspection/complete (Nguyên)

**F-code:** F-117 · **Role:** Moderator

**a. Overview**

Moderator hoàn tất kiểm định với kết quả đạt (PASS), chốt giá thỏa thuận
và thời hạn kỳ (nếu không truyền termLengthDays thì lấy mặc định từ cấu
hình hệ thống). Tạo ra một ConsignmentReceipt chưa xác nhận — Member xác
nhận ở API 20.

**b. API Specification**

| Method | URL                                         |
| ------ | ------------------------------------------- |
| POST   | /consignment-forms/{id}/inspection/complete |

Permission: Moderator

**c. Request sample**

{ "result": "PASS", "conditionNote": "Áo còn mới 90%, không lệi",
"agreedPrice": 220000, "termLengthDays": 30 }

**d. Response sample**

{ "result": { "receiptId": "rc-001" }, "isSuccess": true, "statusCode":
200, "message": "Đã tạo phiếu ký gửi" }

**e. Validation**

| Status code | Description                | Examples                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| 400         | Thiếu agreedPrice hoặc ≤ 0 | {"result":null,"isSuccess":false,"statusCode":400,"message":"agreedPrice phải lớn hơn 0."} |
| 404         | Không tìm thấy form        | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."} |

### API 35 — POST /consignment-forms/{id}/return-onsite (Nguyên)

**F-code:** F-118 · **Role:** Moderator

**a. Overview**

Moderator trả hàng ngay tại quầy khi hàng không đạt kiểm định (FAIL), bị
nghi là hàng giả (SUSPECTED_FAKE), nghi hàng cấm/bất hợp pháp
(SUSPECTED_ILLEGAL), hoặc Member tự từ chối giá đề xuất sau kiểm định.

**b. API Specification**

| Method | URL                                   |
| ------ | ------------------------------------- |
| POST   | /consignment-forms/{id}/return-onsite |

Permission: Moderator

**c. Request sample**

{ "result": "FAIL", "reason": "Vải bị ẹm mốc, không đạt tiêu chuẩn" }

**d. Response sample**

{ "result": { "id": "cf-001", "status": "REJECTED" }, "isSuccess": true,
"statusCode": 200, "message": "Đã trả hàng tại quầy" }

**e. Validation**

| Status code | Description         | Examples                                                                                   |
| ----------- | ------------------- | ------------------------------------------------------------------------------------------ |
| 400         | Thiếu reason        | {"result":null,"isSuccess":false,"statusCode":400,"message":"reason là bắt buộc."}         |
| 404         | Không tìm thấy form | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy form ký gửi."} |

### API 36 — POST /products/{id}/unclaimed/confirm-transfer (Nguyên)

**F-code:** F-130 · **Role:** Moderator

**a. Overview**

Xử lý hàng vô thừa nhận: sản phẩm đã bị System tự đánh dấu UNCLAIMED
(sau 30 ngày Member không quyết định cuối kỳ — F-031). Moderator xác
nhận đã chuyển giao cho tổ chức từ thiện đối tác, hệ thống ghi audit log
(màn BG-02).

**b. API Specification**

| Method | URL                                       |
| ------ | ----------------------------------------- |
| POST   | /products/{id}/unclaimed/confirm-transfer |

Permission: Moderator

**c. Request sample**

{ "partnerOrganizationName": "Quỹ Từ Thiện Ánh Dương" }

**d. Response sample**

{ "result": { "id": "Q7-AK-000845", "status": "DONATED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã xác nhận chuyển giao" }

**e. Validation**

| Status code | Description                          | Examples                                                                                                |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu partnerOrganizationName        | {"result":null,"isSuccess":false,"statusCode":400,"message":"partnerOrganizationName là bắt buộc."}     |
| 404         | Không tìm thấy sản phẩm              | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}                 |
| 409         | Sản phẩm chưa ở trạng thái UNCLAIMED | {"result":null,"isSuccess":false,"statusCode":409,"message":"Sản phẩm chưa ở trạng thái vô thừa nhận."} |

**Hàng đợi công việc**

**Duyệt form & kiểm định**

**Nhập kho**

### API 37 — POST /products (Nguyên)

**F-code:** F-119 · **Role:** Moderator

**a. Overview**

Nhập kho: tạo Product thực tế từ 1 ConsignmentReceipt đã được Member xác
nhận. Hệ thống tự sinh mã SKU (Product.id, vd Q7-AK-000845).

**b. API Specification**

| Method | URL       |
| ------ | --------- |
| POST   | /products |

Permission: Moderator

**c. Request sample**

{  
"receiptId": "rc-001", "name": "Áo sơ mi Zara trắng", "size": "M",
"shelfLocation": "A1-03",  
"photoUrls": \["https://cdn.rehome.vn/uploads/ao1.jpg",
"https://cdn.rehome.vn/uploads/ao2.jpg"\]  
}

**d. Response sample**

{ "result": { "id": "Q7-AK-000845", "name": "Áo sơ mi Zara trắng",
"status": "ON_SALE" }, "isSuccess": true, "statusCode": 201, "message":
"Đã nhập kho" }

**e. Validation**

| Status code | Description                                        | Examples                                                                                               |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 404         | Không tìm thấy phiếu ký gửi                        | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy phiếu ký gửi."}            |
| 409         | Phiếu chưa được Member xác nhận (confirmedAt rống) | {"result":null,"isSuccess":false,"statusCode":409,"message":"Phiếu ký gửi chưa được Member xác nhận."} |

### API 38 — POST /products/{id}/photos (Nguyên)

**F-code:** — · **Role:** Moderator

**a. Overview**

Thêm ảnh cho sản phẩm đã nhập kho. Tách nền chạy nền qua API bên thứ 3
(F-120) — FE poll lại GET /products/{id} hoặc chờ Notification khi
isBackgroundRemoved:true. Chỉ ảnh đã tách nền mới dùng được cho thử đồ
AI.

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| POST   | /products/{id}/photos |

Permission: Moderator

**c. Request sample**

{ "imageUrl": "https://cdn.rehome.vn/uploads/ao3.jpg" }

**d. Response sample**

{ "result": { "id": "photo-003", "imageUrl":
"https://cdn.rehome.vn/uploads/ao3.jpg", "isBackgroundRemoved": false },
"isSuccess": true, "statusCode": 201, "message": "" }

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 400         | Thiếu imageUrl          | {"result":null,"isSuccess":false,"statusCode":400,"message":"imageUrl là bắt buộc."}    |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."} |

### API 39 — GET /products/{id}/sku-label (Nguyên)

**F-code:** F-122 · **Role:** Moderator

**a. Overview**

Lấy file PDF tem SKU để in dán lên sản phẩm vật lý trong kho.

**b. API Specification**

| Method | URL                      |
| ------ | ------------------------ |
| GET    | /products/{id}/sku-label |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "labelPdfUrl":
"https://cdn.rehome.vn/labels/Q7-AK-000845.pdf" }, "isSuccess": true,
"statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."} |

### API 40 — GET /inventory (Nguyên)

**F-code:** F-123 · **Role:** Moderator

**a. Overview**

Danh sách hàng trong kho của Moderator (tự lọc theo kho mà Moderator đó
được gán), lọc thêm theo trạng thái và vị trí kệ.

**b. API Specification**

| Method | URL                                                                              |
| ------ | -------------------------------------------------------------------------------- |
| GET    | /inventory?status={status}&shelfLocation={shelfLocation}&page={page}&size={size} |

Permission: Moderator

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "Q7-AK-000845", "name": "Áo sơ mi Zara
trắng", "shelfLocation": "A1-03", "status": "ON_SALE" }\], "page": 0,
"size": 20, "totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 41 — GET /products/{sku} (Nguyên)

**F-code:** F-124 · **Role:** Moderator

**a. Overview**

Tra sản phẩm theo SKU — dùng khi quét QR tem sản phẩm tại kho. SKU thuộc
kho khác với kho của Moderator thì bị chặn.

**b. API Specification**

| Method | URL             |
| ------ | --------------- |
| GET    | /products/{sku} |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "Q7-AK-000845", "name": "Áo sơ mi Zara trắng",
"shelfLocation": "A1-03", "status": "ON_SALE" }, "isSuccess": true,
"statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description        | Examples                                                                                             |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| 403         | SKU thuộc kho khác | {"result":null,"isSuccess":false,"statusCode":403,"message":"Sản phẩm không thuộc kho bạn quản lý."} |
| 404         | Không tìm thấy SKU | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}              |

### API 42 — PATCH /products/{id}/shelf-location (Nguyên)

**F-code:** F-125 · **Role:** Moderator

**a. Overview**

Đổi vị trí kệ của sản phẩm trong kho (khi sắp xếp lại kho).

**b. API Specification**

| Method | URL                           |
| ------ | ----------------------------- |
| PATCH  | /products/{id}/shelf-location |

Permission: Moderator

**c. Request sample**

{ "shelfLocation": "B2-10" }

**d. Response sample**

{ "result": { "id": "Q7-AK-000845", "shelfLocation": "B2-10" },
"isSuccess": true, "statusCode": 200, "message": "Đã cập nhật vị trí kệ"
}

**e. Validation**

| Status code | Description             | Examples                                                                                  |
| ----------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| 400         | Thiếu shelfLocation     | {"result":null,"isSuccess":false,"statusCode":400,"message":"shelfLocation là bắt buộc."} |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}   |

### API 43 — GET /products/{id}/stock-movements (Nguyên)

**F-code:** F-126 · **Role:** Moderator

**a. Overview**

Xem lịch sử biến động kho của 1 sản phẩm (nhập kho, chuyển kệ, xuất
bán...). System tự ghi log mỗi lần biến động, API này chỉ để xem lại.

**b. API Specification**

| Method | URL                            |
| ------ | ------------------------------ |
| GET    | /products/{id}/stock-movements |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{  
"result": \[ { "id": "sm-001", "type": "INBOUND", "shelfLocation":
"A1-03", "createdAt": "2026-10-01T09:00:00Z" } \],  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."} |

**Danh mục & thương hiệu (UC-72 → UC-75)**

### API 44 — GET /categories, GET /brands (Nguyên)

**F-code:** F-142 · **Role:** Guest / Member / Moderator

**a. Overview**

Lấy danh mục hoặc thương hiệu đang hoạt động. Guest/Member cũng gọi được
để hiển thị bộ lọc trên trang sản phẩm; Moderator dùng khi tạo/sửa form
ký gửi.

**b. API Specification**

| Method | URL                         |
| ------ | --------------------------- |
| GET    | /categories?status={status} |
| GET    | /brands?status={status}     |

Permission: Guest / Member / Moderator (không cần token)

**c. Request sample**

N/A (truyền qua query string status)

**d. Response sample**

{  
"result": \[ { "id": "cat-ao-so-mi", "name": "Áo sơ mi", "tryonSlot":
"TOP", "status": "ACTIVE" } \],  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description         | Examples                                                                            |
| ----------- | ------------------- | ----------------------------------------------------------------------------------- |
| 400         | status không hợp lệ | {"result":null,"isSuccess":false,"statusCode":400,"message":"status không hợp lệ."} |

### API 45 — POST /categories

**F-code:** F-143 · **Role:** Moderator

**a. Overview**

Tạo danh mục sản phẩm mới, gắn sẵn slot thử đồ AI (TOP / BOTTOM / DRESS)
để hệ thống biết ghép combo khi thử đồ.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| POST   | /categories |

Permission: Moderator

**c. Request sample**

{ "name": "Áo sơ mi", "tryonSlot": "TOP" }

**d. Response sample**

{ "result": { "id": "cat-ao-so-mi", "name": "Áo sơ mi", "tryonSlot":
"TOP", "status": "ACTIVE" }, "isSuccess": true, "statusCode": 201,
"message": "Đã tạo danh mục" }

**e. Validation**

| Status code | Description                           | Examples                                                                                                 |
| ----------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu name hoặc tryonSlot sai giá trị | {"result":null,"isSuccess":false,"statusCode":400,"message":"tryonSlot phải là TOP, BOTTOM hoặc DRESS."} |
| 409         | Tên danh mục đã tồn tại               | {"result":null,"isSuccess":false,"statusCode":409,"message":"Tên danh mục đã tồn tại."}                  |

### API 46 — POST /brands (Nguyên)

**F-code:** F-143, F-121 · **Role:** Moderator

**a. Overview**

Tạo thương hiệu mới. Dùng chung cho cả màn quản lý danh mục và nút "thêm
nhanh thương hiệu" ngay trong màn nhập kho (KD-09) khi thương hiệu chưa
có sẵn.

**b. API Specification**

| Method | URL     |
| ------ | ------- |
| POST   | /brands |

Permission: Moderator

**c. Request sample**

{ "name": "Zara" }

**d. Response sample**

{ "result": { "id": "brand-zara", "name": "Zara", "status": "ACTIVE" },
"isSuccess": true, "statusCode": 201, "message": "Đã tạo thương hiệu" }

**e. Validation**

| Status code | Description                | Examples                                                                                   |
| ----------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| 400         | Thiếu name                 | {"result":null,"isSuccess":false,"statusCode":400,"message":"name là bắt buộc."}           |
| 409         | Tên thương hiệu đã tồn tại | {"result":null,"isSuccess":false,"statusCode":409,"message":"Tên thương hiệu đã tồn tại."} |

### API 47 — PUT /categories/{id}, PUT /brands/{id} (Nguyên)

**F-code:** F-144 · **Role:** Moderator

**a. Overview**

Sửa tên/thuộc tính danh mục hoặc thương hiệu. Body giống API tạo (API
45/46).

**b. API Specification**

| Method | URL              |
| ------ | ---------------- |
| PUT    | /categories/{id} |
| PUT    | /brands/{id}     |

Permission: Moderator

**c. Request sample**

{ "name": "Áo sơ mi nam" }

**d. Response sample**

{ "result": { "id": "cat-ao-so-mi", "name": "Áo sơ mi nam" },
"isSuccess": true, "statusCode": 200, "message": "Đã cập nhật" }

**e. Validation**

| Status code | Description                         | Examples                                                                         |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| 400         | Thiếu name                          | {"result":null,"isSuccess":false,"statusCode":400,"message":"name là bắt buộc."} |
| 404         | Không tìm thấy danh mục/thương hiệu | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy."}   |

### API 48 — PATCH /categories/{id}/hide, PATCH /brands/{id}/hide (Nguyên)

**F-code:** F-145 · **Role:** Moderator

**a. Overview**

Ẩn danh mục/thương hiệu khỏi bộ lọc hiển thị cho người dùng mới — không
xoá, các form/sản phẩm cũ đang tham chiếu vẫn giỵ nguyên.

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| PATCH  | /categories/{id}/hide |
| PATCH  | /brands/{id}/hide     |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "status": "HIDDEN" }, "isSuccess": true, "statusCode":
200, "message": "Đã ẩn" }

**e. Validation**

| Status code | Description                         | Examples                                                                       |
| ----------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| 404         | Không tìm thấy danh mục/thương hiệu | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy."} |

## Phase 3 — Mua hàng & thanh toán (L-03)

Màn hình liên quan: BR-01 → BR-09.

### API 49 — GET /products (Tài)

**F-code:** F-012, F-013 · **Role:** Guest / Member

**a. Overview**

Danh sách sản phẩm đang bán (chỉ gồm status:"ON_SALE"), lọc theo từ
khóa, danh mục, thương hiệu, khoảng giá, kho. Món đang bị mua (RESERVED
vì có người đả đặt) tự động biến mất khỏi danh sách này.

**b. API Specification**

| Method | URL                                                                                 |
| ------ | ----------------------------------------------------------------------------------- |
| GET    | /products?search=&categoryId=&brandId=&priceMin=&priceMax=&warehouseId=&page=&size= |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{ "id": "Q7-AK-000845", "name": "Áo sơ mi Zara trắng", "thumbnailUrl":
"https://cdn.rehome.vn/products/Q7-AK-000845/thumb.jpg", "brandName":
"Zara", "categoryName": "Áo sơ mi", "size": "M", "condition":
"LIKE_NEW", "originalPrice": 350000, "currentPrice": 220000 }

**e. Validation**

| Status code | Description          | Examples                                                                                             |
| ----------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
| 400         | priceMin \> priceMax | {"result":null,"isSuccess":false,"statusCode":400,"message":"priceMin không được lớn hơn priceMax."} |

### API 50 — GET /products/{id} (Tài)

**F-code:** F-012 · **Role:** Guest / Member

**a. Overview**

Trang chi tiết sản phẩm để mua hàng (cùng endpoint với API 22 ở Phase
2). Không trả về memberId/tên người ký gửi — người mua giao dịch với nền
tảng, không phải với người bán.

**b. API Specification**

| Method | URL            |
| ------ | -------------- |
| GET    | /products/{id} |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A

**d. Response sample**

{  
"result": {  
"id": "Q7-AK-000845",

"name": "Áo sơ mi Zara trắng",

> "currentPrice": 220000,

"status": "ON_SALE",  
"photos": \[ { "url": "https://cdn.rehome.vn/uploads/ao1.jpg",
"isBackgroundRemoved": true } \]  
},  
"isSuccess": true,

"statusCode": 200,

"message": ""  
}

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."} |

### API 51 — POST /cart/items (Tài) done

**F-code:** F-045 · **Role:** Member

**a. Overview**

Thêm sản phẩm vào giỏ hàng.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| POST   | /cart/items |

Permission: Member

**c. Request sample**

{ "productId": "Q7-AK-000845" }

**d. Response sample**

{ "result": { "id": "ci-001", "productId": "Q7-AK-000845", "addedAt":
"2026-10-13T09:00:00Z" }, "isSuccess": true, "statusCode": 200,
"message": "Đã thêm vào giỏ" }

**e. Validation**

| Status code | Description                | Examples                                                                                  |
| ----------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy sản phẩm    | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}   |
| 409         | Sản phẩm không còn ON_SALE | {"result":null,"isSuccess":false,"statusCode":409,"message":"Sản phẩm không còn để bán."} |

### API 52 — GET /cart (Tài) done

**F-code:** F-046 · **Role:** Member

**a. Overview**

Xem giỏ hàng, nhóm sẵn theo kho để FE biết trước sẽ tách thành mấy đơn.
Món hết khả dụng (đã bán/bị giỵ) không tự xoá khỏi giỏ — trả kèm
unavailableReason, FE làm mờ và loại khỏi tổng tiền, chặn checkout.

**b. API Specification**

| Method | URL   |
| ------ | ----- |
| GET    | /cart |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{

"result": {

"groupedByWarehouse": \[

{

"warehouseId": "wh-01",

"warehouseName": "Kho Quận 7",

"items": \[

{

"id": "ci-001",

"product": {

"id": "Q7-AK-000845",

"name": "Áo sơ mi Zara trắng",

"thumbnailUrl": "https://cdn.rehome.vn/products/Q7-AK-000845/thumb.jpg",

"size": "M",

"originalPrice": 350000,

"currentPrice": 220000

},

"addedAt": "2026-10-13T09:00:00Z",

"unavailableReason": null

}

\],

"subtotal": 220000

},

{

"warehouseId": "wh-02",

"warehouseName": "Kho Bình Thạnh",

"items": \[

{

"id": "ci-002",

"product": {

"id": "Q7-AK-000912",

"name": "Quần jean Levi's xanh",

"thumbnailUrl": "https://cdn.rehome.vn/products/Q7-AK-000912/thumb.jpg",

"size": "30",

"originalPrice": 450000,

"currentPrice": 380000

},

"addedAt": "2026-10-14T14:20:00Z",

"unavailableReason": "SOLD"

}

\],

"subtotal": 0

}

\],

"totalAmount": 220000

},

"isSuccess": true,

"statusCode": 200,

"message": ""

}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 53 — DELETE /cart/items/{id} (Tài)

**F-code:** F-047 · **Role:** Member

**a. Overview**

Xóa 1 món khỏi giỏ hàng.

**b. API Specification**

| Method | URL              |
| ------ | ---------------- |
| DELETE | /cart/items/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 200, "message": "Đã
xóa khỏi giỏ" }

**e. Validation**

| Status code | Description                 | Examples                                                                                    |
| ----------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy mục giỏ hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy mục giỏ hàng."} |

### API 54 — GET /addresses (Tài)

**F-code:** F-048 · **Role:** Member

**a. Overview**

Danh sách địa chỉ giao hàng đã lưu của Member.

**b. API Specification**

| Method | URL        |
| ------ | ---------- |
| GET    | /addresses |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{  
"result": \[ { "id": "addr-001", "recipientName": "Tạ Thị Ngọc Anh",
"phone": "0912345678", "addressDetail": "12 Nguyễn Trãi, Q.1, TP.HCM",
"isDefault": true } \],  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 55 — POST /addresses (Tài)

**F-code:** F-049 · **Role:** Member

**a. Overview**

Thêm địa chỉ giao hàng mới.

**b. API Specification**

| Method | URL        |
| ------ | ---------- |
| POST   | /addresses |

Permission: Member

**c. Request sample**

{ "recipientName": "Tạ Thị Ngọc Anh", "phone": "0912345678",
"addressDetail": "12 Nguyễn Trãi, Q.1, TP.HCM", "isDefault": true }

**d. Response sample**

{ "result": { "id": "addr-001", "recipientName": "Tạ Thị Ngọc Anh",
"isDefault": true }, "isSuccess": true, "statusCode": 200, "message":
"Đã thêm địa chỉ" }

**e. Validation**

| Status code | Description          | Examples                                                                                  |
| ----------- | -------------------- | ----------------------------------------------------------------------------------------- |
| 400         | Thiếu field bắt buộc | {"result":null,"isSuccess":false,"statusCode":400,"message":"addressDetail là bắt buộc."} |

### API 56 — PUT /addresses/{id} (Tài)

**F-code:** F-050 · **Role:** Member

**a. Overview**

Sửa địa chỉ giao hàng đã lưu (body giống API 55).

**b. API Specification**

| Method | URL             |
| ------ | --------------- |
| PUT    | /addresses/{id} |

Permission: Member

**c. Request sample**

{ "recipientName": "Tạ Thị Ngọc Anh", "phone": "0912345679",
"addressDetail": "12 Nguyễn Trãi, Q.1, TP.HCM", "isDefault": true }

**d. Response sample**

{ "result": { "id": "addr-001", "phone": "0912345679" }, "isSuccess":
true, "statusCode": 200, "message": "Đã cập nhật địa chỉ" }

**e. Validation**

| Status code | Description            | Examples                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy địa chỉ | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy địa chỉ."} |

### API 57 — DELETE /addresses/{id} (Tài)

**F-code:** F-051 · **Role:** Member

**a. Overview**

Xóa địa chỉ giao hàng.

**b. API Specification**

| Method | URL             |
| ------ | --------------- |
| DELETE | /addresses/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đã
xóa địa chỉ" }

**e. Validation**

| Status code | Description            | Examples                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy địa chỉ | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy địa chỉ."} |

### API 58 — GET /cart/checkout-preview (Tài)

**F-code:** F-054 · **Role:** Member

**a. Overview**

Xem trước giá ship và cách hệ thống sẽ tách giỏ hàng thành mấy đơn (theo
kho) trước khi Member bấm đặt hàng thật.

**b. API Specification**

| Method | URL                                           |
| ------ | --------------------------------------------- |
| GET    | /cart/checkout-preview?shippingAddressId={id} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string shippingAddressId)

**d. Response sample**

{  
"result": {  
"orders": \[ { "warehouseId": "wh-01", "items": \["Q7-AK-000845"\],
"subtotal": 220000, "shippingFee": 25000, "total": 245000 } \],  
"unavailableItems": \[\]  
},  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                      | Examples                                                                                         |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| 404         | Không tìm thấy địa chỉ giao hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy địa chỉ giao hàng."} |
| 409         | Giỏ hàng trống                   | {"result":null,"isSuccess":false,"statusCode":409,"message":"Giỏ hàng đang trống."}              |

### API 59 — POST /orders (Tài)

**F-code:** F-052, F-053, F-055 · **Role:** Member

**a. Overview**

Đặt hàng. Bỏ trống productIds = lấy cả giỏ hàng; truyền đúng 1 id = "Mua
ngay" bỏ qua giỏ. Giỏ có nhiều kho thì tự tách thành nhiều đơn (F-053,
trả về 1 mảng). Sản phẩm chuyển sang RESERVED ngay lúc đặt hàng này
(F-055), không phải từ lúc thêm giỏ.

**b. API Specification**

| Method | URL     |
| ------ | ------- |
| POST   | /orders |

Permission: Member

**c. Request sample**

{ "shippingAddressId": "addr-001", "productIds": \["Q7-AK-000845"\] }

**d. Response sample**

{  
"result": \[  
{ "id": "ord-001", "orderNo": "OD-2026-000123", "warehouseId": "wh-01",
"subtotal": 220000, "shippingFee": 25000, "totalAmount": 245000,
"status": "PENDING_PAYMENT", "paymentDeadline": "2026-10-13T09:15:00Z"
}  
\],  
"isSuccess": true, "statusCode": 201, "message": "Đặt hàng thành công,
vui lòng thanh toán"  
}

**e. Validation**

| Status code | Description                            | Examples                                                                                      |
| ----------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 400         | Thiếu shippingAddressId                | {"result":null,"isSuccess":false,"statusCode":400,"message":"shippingAddressId là bắt buộc."} |
| 409         | Sản phẩm vừa được người khác mua trước | {"result":null,"isSuccess":false,"statusCode":409,"message":"Sản phẩm không còn để bán."}     |

### API 60 — POST /orders/{id}/payment (Tài)

**F-code:** F-056 · **Role:** Member

**a. Overview**

Thanh toán đơn hàng, chọn trọn 1 trong 2 phương thờc (không trả nửa ví
nửa MoMo): WALLET trừthi thẳng tức thời nếu đủ số dư; MOMO trả về payUrl
để FE mở app/deeplink MoMo (kết quả thanh toán thật về qua webhook ở API
61).

**b. API Specification**

| Method | URL                  |
| ------ | -------------------- |
| POST   | /orders/{id}/payment |

Permission: Member

**c. Request sample**

{ "paymentMethod": "WALLET" }

**d. Response sample**

{ "result": { "id": "ord-001", "status": "PAID" }, "isSuccess": true,
"statusCode": 200, "message": "Thanh toán thành công" }

hoặc khi paymentMethod:"MOMO":

{ "result": { "payUrl":
"https://payment.momo.vn/v2/gateway/pay?token=..." }, "isSuccess": true,
"statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                               | Examples                                                                                                |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy đơn hàng                   | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."}                 |
| 409         | Ví không đủ số dư (chọn WALLET)           | {"result":null,"isSuccess":false,"statusCode":409,"message":"INSUFFICIENT_BALANCE: ví không đủ số dư."} |
| 409         | Đơn đã quá hạn thanh toán / đã thanh toán | {"result":null,"isSuccess":false,"statusCode":409,"message":"Đơn hàng không còn chờ thanh toán."}       |

### API 61 — POST /webhooks/momo (Tài)

**F-code:** F-057 · **Role:** \[MoMo gọi về — không phải API cho FE\]

**a. Overview**

MoMo gọi webhook báo kết quả thanh toán, xác thực bằng chữ ký riêng
(không qua JWT). Nhận kết quả thành công thì set Order.status = "PAID".
Nếu MoMo báo về sau khi đơn đã bị hệ thống tự hủy vì quá 15 phút không
thanh toán (F-058), hệ thống tự hoàn tiền vào ví người mua.

**b. API Specification**

| Method | URL            |
| ------ | -------------- |
| POST   | /webhooks/momo |

Permission: \[MoMo gateway, xác thực bằng chọ ký, không dùng JWT\]

**c. Request sample**

Theo chuẩn webhook MoMo (payload + chữ ký do MoMo quy định)

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                       | Examples                                                                                |
| ----------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| 400         | Chữ ký không hợp lệ               | {"result":null,"isSuccess":false,"statusCode":400,"message":"Chữ ký không hợp lệ."}     |
| 404         | Không tìm thấy đơn hàng tương ứng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."} |

## Phase 4 — Giao hàng & hoàn tất đơn (L-04)

Màn hình liên quan: BR-10 → BR-14 (Member), DG-01 → DG-04, BG-01
(Moderator).

**Phía Member**

### API 62 — GET /orders (Tài)

**F-code:** F-059 · **Role:** Member

**a. Overview**

Danh sách đơn hàng đã mua của Member, FE tự lọc theo tab trạng thái
(status).

**b. API Specification**

| Method | URL                                             |
| ------ | ----------------------------------------------- |
| GET    | /orders?status={status}&page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[ { "id": "ord-001", "orderNo":
"OD-2026-000123", "status": "SHIPPING", "totalAmount": 245000 } \],
"page": 0, "size": 20, "totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 63 — GET /orders/{id} (Tài)

**F-code:** F-059 · **Role:** Member

**a. Overview**

Chi tiết 1 đơn hàng, kèm danh sách món (items) và mã vận đơn GHN nếu đã
giao vận.

**b. API Specification**

| Method | URL          |
| ------ | ------------ |
| GET    | /orders/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{  
"result": { "id": "ord-001", "orderNo": "OD-2026-000123", "status":
"SHIPPING", "items": \[{ "productId": "Q7-AK-000845", "price": 220000
}\], "ghnTrackingCode": "GHN123456789" },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                        | Examples                                                                                       |
| ----------- | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| 403         | Đơn không thuộc về Member đang gọi | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền xem đơn này."} |
| 404         | Không tìm thấy đơn hàng            | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."}        |

### API 64 — GET /orders/{id}/tracking (Tài)

**F-code:** F-060 · **Role:** Member

**a. Overview**

Theo dõi vận chuyển đơn hàng, dự liệu đồng bộ từ GHN qua webhook
(F-128).

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| GET    | /orders/{id}/tracking |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{  
"result": { "status": "SHIPPING", "ghnTrackingCode": "GHN123456789",
"events": \[{ "status": "PICKED_UP", "timestamp": "2026-10-13T10:00:00Z"
}\] },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy đơn hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."} |

### API 65 — POST /orders/{id}/cancel (Tài)

**F-code:** F-061 · **Role:** Member

**a. Overview**

Member hủy đơn hàng. Chỉ hủy được khi đơn đang ở PAID (chưa đóng gói) —
hoàn 100% kể cả phí ship vào ví người mua.

**b. API Specification**

| Method | URL                 |
| ------ | ------------------- |
| POST   | /orders/{id}/cancel |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "ord-001", "status": "CANCELLED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã hủy đơn, hoàn tiền vào ví" }

**e. Validation**

| Status code | Description               | Examples                                                                                                                    |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy đơn hàng   | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."}                                     |
| 409         | Đơn đã đóng gói/đang giao | {"result":null,"isSuccess":false,"statusCode":409,"message":"CANNOT_CANCEL_AFTER_PACKING: đơn đã đóng gói, không thể hủy."} |

### API 66 — POST /orders/{id}/confirm-receipt (Tài)

**F-code:** F-063 · **Role:** Member

**a. Overview**

Member xác nhận đã nhận hàng để hoàn tất đơn. Nếu không bấm, System tự
hoàn tất sau hạn cấu hình (mặc định 3 ngày — F-064). Hoàn tất là lúc
tiền cộng vào ví người bán theo tỷ lệ hoa hồng của kỳ lúc đặt đơn, không
phải kỳ lúc hoàn tất (F-065, xem Phase 4 — Ví).

**b. API Specification**

| Method | URL                          |
| ------ | ---------------------------- |
| POST   | /orders/{id}/confirm-receipt |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "ord-001", "status": "COMPLETED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã xác nhận nhận hàng" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy đơn hàng         | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."}         |
| 409         | Đơn chưa ở trạng thái đang giao | {"result":null,"isSuccess":false,"statusCode":409,"message":"Đơn chưa ở trạng thái đang giao."} |

### API 67 — POST /orders/{id}/rating (Tài)

**F-code:** F-066 · **Role:** Member

**a. Overview**

Member đánh giá chất lượng dịch vụ sau khi đơn đã hoàn tất.

**b. API Specification**

| Method | URL                 |
| ------ | ------------------- |
| POST   | /orders/{id}/rating |

Permission: Member

**c. Request sample**

{ "serviceRating": 5 }

**d. Response sample**

{ "result": { "id": "ord-001", "serviceRating": 5 }, "isSuccess": true,
"statusCode": 200, "message": "Đã ghi nhận đánh giá" }

**e. Validation**

| Status code | Description                    | Examples                                                                                      |
| ----------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| 400         | serviceRating ngoài khoảng 1-5 | {"result":null,"isSuccess":false,"statusCode":400,"message":"serviceRating phải từ 1 đến 5."} |
| 409         | Đơn chưa COMPLETED             | {"result":null,"isSuccess":false,"statusCode":409,"message":"Chỉ đánh giá đơn đã hoàn tất."}  |

**Phía Moderator (kho)**

### API 68 — GET /queues?type=PACKING (Tài)

**F-code:** F-111 · **Role:** Moderator

**a. Overview**

Hàng đợi đơn cần đóng gói — dùng chung endpoint hàng đợi ở Phase 2 (API
28), chỉ lọc type=PACKING.

**b. API Specification**

| Method | URL                  |
| ------ | -------------------- |
| GET    | /queues?type=PACKING |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": \[ { "id": "q-010", "type": "PACKING", "refId": "ord-001" }
\], "isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 69 — POST /orders/{id}/pack/scan (Tài)

**F-code:** F-127 · **Role:** Moderator

**a. Overview**

Moderator quét SKU từng món trong đơn để đối chiếu trước khi tạo vận đơn
— chống gửi nhầm hàng. Gọi lần lượt cho mỗi món, scannedCount tăng dần
tới khi bằng totalCount.

**b. API Specification**

| Method | URL                    |
| ------ | ---------------------- |
| POST   | /orders/{id}/pack/scan |

Permission: Moderator

**c. Request sample**

{ "productId": "Q7-AK-000845" }

**d. Response sample**

{ "result": { "matched": true, "scannedCount": 1, "totalCount": 1 },
"isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                  | Examples                                                                                          |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| 400         | SKU quét không thuộc đơn này | {"result":null,"isSuccess":false,"statusCode":400,"message":"Sản phẩm không thuộc đơn hàng này."} |
| 404         | Không tìm thấy đơn hàng      | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."}           |

### API 70 — POST /orders/{id}/shipment (Tài)

**F-code:** F-127 · **Role:** Moderator

**a. Overview**

Tạo vận đơn GHN cho đơn hàng. Chỉ gọi được khi đã quét đủ món
(scannedCount = totalCount). Gọi GHN lỗi thì trả 502, Moderator thử lại
được.

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| POST   | /orders/{id}/shipment |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "ord-001", "status": "SHIPPING", "ghnTrackingCode":
"GHN123456789" }, "isSuccess": true, "statusCode": 200, "message": "Đã
tạo vận đơn" }

**e. Validation**

| Status code | Description          | Examples                                                                                                           |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 409         | Chưa quét đủ món     | {"result":null,"isSuccess":false,"statusCode":409,"message":"Chưa quét đủ tất cả món trong đơn."}                  |
| 502         | Gọi API GHN thất bại | {"result":null,"isSuccess":false,"statusCode":502,"message":"GHN_ERROR: không thể tạo vận đơn, vui lòng thử lại."} |

### API 71 — POST /webhooks/ghn (Tài)

**F-code:** F-128 · **Role:** \[GHN gọi về — không phải API cho FE\]

**a. Overview**

GHN gọi webhook cập nhật trạng thái vận chuyển (lấy hàng, đang giao,
giao thành công...), dùng để đổng bộ vào GET /orders/{id}/tracking (API
64).

**b. API Specification**

| Method | URL           |
| ------ | ------------- |
| POST   | /webhooks/ghn |

Permission: \[GHN gateway, không dùng JWT\]

**c. Request sample**

Theo chuẩn webhook GHN

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                      | Examples                                                                               |
| ----------- | -------------------------------- | -------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy vận đơn tương ứng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy vận đơn."} |

### API 72 — POST /counter/handover (Tài)

**F-code:** F-129 · **Role:** Moderator

**a. Overview**

Một API dùng chung cho 3 ngữ cảnh bàn giao tại quầy: trả hàng rút ký gửi
(ITEM_WITHDRAWAL), nhận lại hàng cuối kỳ (END_OF_TERM_TAKE_BACK), nhận
hàng trả bị từ chối (INVALID_RETURN_PICKUP). context quyết định bản ghi
nào được đóng. Bắt buộc đã gọi POST
/counter/members/{accountId}/confirm-identity (API 26) trước đó.

**b. API Specification**

| Method | URL               |
| ------ | ----------------- |
| POST   | /counter/handover |

Permission: Moderator

**c. Request sample**

{ "accountId": "8f1c2e40-...", "context": "ITEM_WITHDRAWAL", "refId":
"iwr-001" }

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 200, "message": "Đã
bàn giao" }

**e. Validation**

| Status code | Description                   | Examples                                                                                                          |
| ----------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 400         | context không hợp lệ          | {"result":null,"isSuccess":false,"statusCode":400,"message":"context không hợp lệ."}                              |
| 404         | Không tìm thấy bản ghi refId  | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu tương ứng."}                  |
| 409         | Chưa xác nhận danh tính trước | {"result":null,"isSuccess":false,"statusCode":409,"message":"Phải xác nhận danh tính Member trước khi bàn giao."} |

## Phase 4 — Ví (L-07)

Màn hình liên quan: VI-01 → VI-05.

### API 73 — GET /wallet (Tài)

**F-code:** F-037 · **Role:** Member

**a. Overview**

Xem số dư ví. availableBalance = balance − lockedBalance (phần đang bị
khóa do có yêu cầu rút tiền chờ xử lý).

**b. API Specification**

| Method | URL     |
| ------ | ------- |
| GET    | /wallet |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "balance": 500000, "lockedBalance": 100000,
"availableBalance": 400000 }, "isSuccess": true, "statusCode": 200,
"message": "" }

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 74 — GET /wallet/transactions (Tài)

**F-code:** F-038 · **Role:** Member

**a. Overview**

Lịch sử biến động ví. amount dương = tiền vào, âm = tiền ra.

**b. API Specification**

| Method | URL                                                      |
| ------ | -------------------------------------------------------- |
| GET    | /wallet/transactions?type={type}&page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "wt-001", "type": "ORDER_PAYOUT",
"amount": 198000, "relatedOrderId": "ord-001", "status": "SUCCESS",
"note": "Thanh toán đơn hàng OD-2026-000123", "createdAt":
"2026-10-13T11:00:00Z" }\], "page": 0, "size": 20, "totalElements": 1,
"totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 75 — GET /wallet/revenue (Tài)

**F-code:** F-040 · **Role:** Member

**a. Overview**

Báo cáo doanh thu theo đơn hàng — lọc sẵn các WalletTransaction loại
ORDER_PAYOUT, hiển thị dạng doanh thu thay vì lịch sử giao dịch thô.

**b. API Specification**

| Method | URL                                     |
| ------ | --------------------------------------- |
| GET    | /wallet/revenue?page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "orderId": "ord-001", "orderNo":
"OD-2026-000123", "salePrice": 220000, "commission": 22000, "tax": 0,
"netAmount": 198000, "completedAt": "2026-10-13T11:00:00Z" }\], "page":
0, "size": 20, "totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 76 — POST /wallet/payout-requests (Tài)

**F-code:** F-042 · **Role:** Member

**a. Overview**

Member yêu cầu rút tiền từ vố về tài khoản ngân hàng. Không có bước
duyệt — tạo là chạy ngay (chi tiền là giao dịch giả lập, xem API 77).
Validate ngay trong API này (F-043): dưới mức tối thiểu, vượt
availableBalance, hoặc quá số lần rút/ngày (cấu hình, mặc định 3 lần).
Số tiền bị khóa (lockedBalance) ngay khi tạo.

**b. API Specification**

| Method | URL                     |
| ------ | ----------------------- |
| POST   | /wallet/payout-requests |

Permission: Member

**c. Request sample**

{ "amount": 100000 }

**d. Response sample**

{ "result": { "id": "pr-001", "amount": 100000, "status": "PENDING" },
"isSuccess": true, "statusCode": 201, "message": "Đã tạo yêu cầu rút
tiền" }

**e. Validation**

| Status code | Description               | Examples                                                                                                                        |
| ----------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 409         | Dưới mức rút tối thiểu    | {"result":null,"isSuccess":false,"statusCode":409,"message":"BELOW_MIN_PAYOUT: số tiền rút dưới mức tối thiểu."}                |
| 409         | Vượt số dư khả dụng       | {"result":null,"isSuccess":false,"statusCode":409,"message":"INSUFFICIENT_BALANCE: ví không đủ số dư khả dụng."}                |
| 409         | Quá số lần rút trong ngày | {"result":null,"isSuccess":false,"statusCode":409,"message":"DAILY_PAYOUT_LIMIT_REACHED: đã đạt số lần rút tối đa trong ngày."} |

### API 77 — GET /wallet/payout-requests/{id} (Tài)

**F-code:** F-044 · **Role:** Member

**a. Overview**

Xem trạng thái 1 yêu cầu rút tiền: PENDING → PROCESSING → SUCCESS \|
FAILED. Chi tiền là giao dịch giả lập; nếu FAILED thì failureReason có
giá trị và lockedBalance được nhả lại tự động — Member tạo yêu cầu mới
nếu muốn thử lại.

**b. API Specification**

| Method | URL                          |
| ------ | ---------------------------- |
| GET    | /wallet/payout-requests/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "pr-001", "amount": 100000, "status": "SUCCESS",
"failureReason": null }, "isSuccess": true, "statusCode": 200,
"message": "" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu rút tiền | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu rút tiền."} |

### API 78 — GET /wallet/payout-requests (Tài)

**F-code:** F-044 · **Role:** Member

**a. Overview**

Danh sách các yêu cầu rút tiền để Member theo dõi nhiều yêu cầu cùng
lúc.

**b. API Specification**

| Method | URL                                             |
| ------ | ----------------------------------------------- |
| GET    | /wallet/payout-requests?page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "pr-001", "amount": 100000, "status":
"SUCCESS" }\], "page": 0, "size": 20, "totalElements": 1, "totalPages":
1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

F-039 (ghi bút toán kép ví Member + quỹ nền tảng) và F-041 (hoàn tiền
vào ví người mua) là xử lý **nội bộ**, không có API riêng — luôn chạy
kèm theo một hành động khác (đơn hoàn thành, đơn bị huỷ, trả hàng hợp
lệ...) và thể hiện ra ngay trong GET /wallet/transactions.

## Phase 5 — Trả hàng (L-05)

Màn hình liên quan: RT-01 → RT-04 (Member), TH-01 → TH-08 (Moderator).

**Phía Member**

### API 79 — POST /orders/{id}/return-requests (Tài)

**F-code:** F-067 · **Role:** Member

**a. Overview**

Member gửi yêu cầu trả hàng cho đơn đã nhận, bắt buộc kèm lý do và ảnh
minh chứng. Quá hạn gửi yêu cầu (mặc định 3 ngày sau khi nhận hàng, cấu
hình được) thì không gửi được nứa.

**b. API Specification**

| Method | URL                          |
| ------ | ---------------------------- |
| POST   | /orders/{id}/return-requests |

Permission: Member

**c. Request sample**

{ "reason": "Hàng không đúng mô tả, bị lệi chỉ", "photoUrls":
\["https://cdn.rehome.vn/uploads/loi1.jpg"\] }

**d. Response sample**

{ "result": { "id": "rr-001", "status": "PENDING", "handoverDeadline":
"2026-10-16T11:00:00Z" }, "isSuccess": true, "statusCode": 201,
"message": "Đã gởi yêu cầu trả hàng" }

**e. Validation**

| Status code | Description                      | Examples                                                                                                               |
| ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu reason hoặc photoUrls rỗng | {"result":null,"isSuccess":false,"statusCode":400,"message":"Cần lý do và ảnh minh chứng."}                            |
| 404         | Không tìm thấy đơn hàng          | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đơn hàng."}                                |
| 409         | Quá hạn gửi yêu cầu trả hàng     | {"result":null,"isSuccess":false,"statusCode":409,"message":"RETURN_WINDOW_EXPIRED: đã quá hạn gửi yêu cầu trả hàng."} |

### API 80 — GET /return-requests, GET /return-requests/{id} (Tài)

**F-code:** F-067 · **Role:** Member

**a. Overview**

Xem danh sách hoặc chi tiết yêu cầu trả hàng của Member.

**b. API Specification**

| Method | URL                                                      |
| ------ | -------------------------------------------------------- |
| GET    | /return-requests?status={status}&page={page}&size={size} |
| GET    | /return-requests/{id}                                    |

Permission: Member

**c. Request sample**

N/A (truyền qua query string/path)

**d. Response sample**

{ "result": { "id": "rr-001", "status": "PENDING", "reason": "Hàng không
đúng mô tả, bị lệi chỉ" }, "isSuccess": true, "statusCode": 200,
"message": "" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu trả hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."} |

### API 81 — POST /return-requests/{id}/handover (Tài)

**F-code:** F-068 · **Role:** Member

**a. Overview**

Member xác nhận đã bàn giao hàng trả cho đơn vị vận chuyển. Không bàn
giao đúng handoverDeadline (3 ngày) thì System tự hủy yêu cầu (F-069).

**b. API Specification**

| Method | URL                            |
| ------ | ------------------------------ |
| POST   | /return-requests/{id}/handover |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "rr-001", "status": "SHIPPED_BACK",
"ghnReturnTrackingCode": "GHNRT123456" }, "isSuccess": true,
"statusCode": 200, "message": "Đã bàn giao hàng trả" }

**e. Validation**

| Status code | Description                                | Examples                                                                                             |
| ----------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu trả hàng            | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."}      |
| 409         | Đã quá handoverDeadline, yêu cầu đã bị hủy | {"result":null,"isSuccess":false,"statusCode":409,"message":"Yêu cầu trả hàng đã quá hạn bàn giao."} |

### API 82 — POST /return-requests/{id}/invalid-choice (Tài)

**F-code:** F-070 · **Role:** Member

**a. Overview**

Khi yêu cầu trả hàng bị Moderator đánh giá không hợp lệ (INVALID — xem
API 86), Member chọn nhận lại hàng bằng tự gởi trả (SHIP_BACK, tự trả
phí vận chuyển) hoặc đến kho nhận (WAREHOUSE_PICKUP). Không chọn trong 7
ngày thì System tự đánh hết hạn (F-071).

**b. API Specification**

| Method | URL                                  |
| ------ | ------------------------------------ |
| POST   | /return-requests/{id}/invalid-choice |

Permission: Member

**c. Request sample**

{ "choice": "WAREHOUSE_PICKUP" }

**d. Response sample**

{ "result": { "pickupDeadline": "2026-10-20T11:00:00Z" }, "isSuccess":
true, "statusCode": 200, "message": "Đã ghi nhận lựa chọn" }

**e. Validation**

| Status code | Description                       | Examples                                                                                               |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 404         | Không tìm thấy yêu cầu trả hàng   | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."}        |
| 409         | Yêu cầu chưa ở trạng thái INVALID | {"result":null,"isSuccess":false,"statusCode":409,"message":"Yêu cầu chưa ở trạng thái không hợp lệ."} |

**Phía Moderator**

### API 83 — POST /return-requests/{id}/approve (Tài)

**F-code:** F-131 · **Role:** Moderator

**a. Overview**

Moderator duyệt yêu cầu trả hàng, hệ thống tự tạo vận đơn trả hàng
(ngược lại từ Member về kho).

**b. API Specification**

| Method | URL                           |
| ------ | ----------------------------- |
| POST   | /return-requests/{id}/approve |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "rr-001", "status": "APPROVED" }, "isSuccess": true,
"statusCode": 200, "message": "Đã duyệt yêu cầu trả hàng" }

**e. Validation**

| Status code | Description                     | Examples                                                                                             |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu trả hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."}      |
| 409         | Yêu cầu không ở PENDING         | {"result":null,"isSuccess":false,"statusCode":409,"message":"Yêu cầu không ở trạng thái chờ duyệt."} |

### API 84 — POST /return-requests/{id}/reject (Tài)

**F-code:** F-131 · **Role:** Moderator

**a. Overview**

Moderator từ chối yêu cầu trả hàng ngay từ bước duyệt (vd lý do không
hợp lệ), kèm lý do.

**b. API Specification**

| Method | URL                          |
| ------ | ---------------------------- |
| POST   | /return-requests/{id}/reject |

Permission: Moderator

**c. Request sample**

{ "reason": "Ưu cầu không đúng chính sách trả hàng" }

**d. Response sample**

{ "result": { "id": "rr-001", "status": "CANCELLED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã từ chối yêu cầu" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 400         | Thiếu reason                    | {"result":null,"isSuccess":false,"statusCode":400,"message":"reason là bắt buộc."}              |
| 404         | Không tìm thấy yêu cầu trả hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."} |

### API 85 — POST /return-requests/{id}/inspect (Tài)

**F-code:** F-132 · **Role:** Moderator

**a. Overview**

Moderator kiểm tra hàng trả về kho: đúng sản phẩm gốc, có xuống cấp, có
nghi hàng giả không. Kết luận ở bước này quyết định có hoàn tiền hay
không (xem API 88).

**b. API Specification**

| Method | URL                           |
| ------ | ----------------------------- |
| POST   | /return-requests/{id}/inspect |

Permission: Moderator

**c. Request sample**

{ "matchesOriginal": true, "degraded": false, "counterfeitSuspected":
false, "conditionNote": "Đúng sản phẩm, có lỗi nhỏ ở tay áo" }

**d. Response sample**

{ "result": { "id": "rr-001", "status": "INSPECTING" }, "isSuccess":
true, "statusCode": 200, "message": "Đã ghi nhận kết quả kiểm tra" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 400         | Thiếu conditionNote             | {"result":null,"isSuccess":false,"statusCode":400,"message":"conditionNote là bắt buộc."}       |
| 404         | Không tìm thấy yêu cầu trả hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."} |

### API 86 — POST /return-requests/{id}/flag-counterfeit (Tài)

**F-code:** F-134 · **Role:** Moderator

**a. Overview**

Moderator thứ nhất đánh dấu nghi hàng giả — bắt buộc một Moderator thứ
hai nhận việc từ hàng đợi (GET /queues?type=RETURN, API 28) mới được kết
luận cuối cùng (API 87) — không để một người tự quyết.

**b. API Specification**

| Method | URL                                    |
| ------ | -------------------------------------- |
| POST   | /return-requests/{id}/flag-counterfeit |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "counterfeitSuspected": true }, "isSuccess": true,
"statusCode": 200, "message": "Đã đánh dấu nghi hàng giả" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu trả hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."} |

### API 87 — POST /return-requests/{id}/counterfeit-conclusion (Tài)

**F-code:** F-135 · **Role:** Moderator (thừ hai, khác người ở API 86)

**a. Overview**

Moderator thứ hai (secondModeratorId) kết luận cuối cùng về nghi vấn
hàng giả. CONFIRMED (xác nhận hàng giả) → hoàn tiền người mua, hủy hàng,
không phạt người bán (coi như rủi ro hệ thống, không phải lỗi cố ý của
Member lúc ký gửi nếu chưa có bằng chứng khác).

**b. API Specification**

| Method | URL                                          |
| ------ | -------------------------------------------- |
| POST   | /return-requests/{id}/counterfeit-conclusion |

Permission: Moderator

**c. Request sample**

{ "conclusion": "CONFIRMED" }

**d. Response sample**

{ "result": { "id": "rr-001", "conclusion": "CONFIRMED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã ghi nhận kết luận" }

**e. Validation**

| Status code | Description                                        | Examples                                                                                                                |
| ----------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 403         | Moderator thứ hai trùng với người đã flag ở API 86 | {"result":null,"isSuccess":false,"statusCode":403,"message":"Phải là Moderator khác với người đánh dấu nghi hàng giả."} |
| 404         | Không tìm thấy yêu cầu trả hàng                    | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."}                         |

### API 88 — POST /return-requests/{id}/resolve (Tài)

**F-code:** F-133 · **Role:** Moderator

**a. Overview**

Moderator kết thúc xử lý yêu cầu trả hàng dựa trên kết quả kiểm tra (API
85): VALID (hợp lệ) → hoàn toàn bộ tiền đơn vào ví người mua; INVALID
(không hợp lệ) → không hoàn tiền, đơn vẫn tính bán thành công (không
hoàn hoa hồng ngược lại), hàng xử lý theo action (RELIST lên kệ lại,
RETURN_TO_SELLER trả về người bán, DISCARD loại bỏ).

**b. API Specification**

| Method | URL                           |
| ------ | ----------------------------- |
| POST   | /return-requests/{id}/resolve |

Permission: Moderator

**c. Request sample**

{ "resolution": "VALID", "action": "RETURN_TO_SELLER", "resolutionNote":
"Hàng đúng như phản ánh, cho hoàn tiền" }

**d. Response sample**

{ "result": { "id": "rr-001", "resolution": "VALID" }, "isSuccess":
true, "statusCode": 200, "message": "Đã xử lý yêu cầu trả hàng" }

**e. Validation**

| Status code | Description                           | Examples                                                                                         |
| ----------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 400         | Thiếu resolution/action               | {"result":null,"isSuccess":false,"statusCode":400,"message":"resolution và action là bắt buộc."} |
| 404         | Không tìm thấy yêu cầu trả hàng       | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."}  |
| 409         | Chưa có kết quả kiểm tra (INSPECTING) | {"result":null,"isSuccess":false,"statusCode":409,"message":"Chưa kiểm tra hàng trả về."}        |

### API 89 — POST /return-requests/{id}/mark-lost (Tài)

**F-code:** F-136 · **Role:** Moderator

**a. Overview**

Hàng trả bị thất lạc trên đường về kho (lỗi vận chuyển). Dù vậy hệ thống
vẫn hoàn tiền cho người mua — rủi ro thuộc về nền tảng/đại lý vận
chuyển, không phải người mua.

**b. API Specification**

| Method | URL                             |
| ------ | ------------------------------- |
| POST   | /return-requests/{id}/mark-lost |

Permission: Moderator

**c. Request sample**

{ "note": "GHN báo mất hàng trong quá trình vận chuyển" }

**d. Response sample**

{ "result": { "id": "rr-001", "status": "LOST" }, "isSuccess": true,
"statusCode": 200, "message": "Đã đánh dấu thất lạc, hoàn tiền người
mua" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 400         | Thiếu note                      | {"result":null,"isSuccess":false,"statusCode":400,"message":"note là bắt buộc."}                |
| 404         | Không tìm thấy yêu cầu trả hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu trả hàng."} |

Hàng về kho bị xuống cấp thì không khép lại ở resolve — Moderator mở một
DegradedItemCase riêng, xem Phase 5 — Rút lại hàng & hàng xuống cấp bên
dưới.

## Phase 5 — Rút lại hàng ký gửi & hàng xuống cấp (L-06)

Màn hình liên quan: KG-13 → KG-16 (Member), TH-07, BG-01 (Moderator).

### API 90 — POST /item-withdrawal-requests (Tài)

**F-code:** F-032 · **Role:** Member

**a. Overview**

Member yêu cầu rút lại 1 sản phẩm đang ký gửi (lấy về giởa kỳ). Trong 7
ngày đầu kỳ (freeWithdrawalWindowDays của phiếu ký gửi) thì miễn phí
(feeCharged = 0); sau đó tính phí rút.

**b. API Specification**

| Method | URL                       |
| ------ | ------------------------- |
| POST   | /item-withdrawal-requests |

Permission: Member

**c. Request sample**

{ "productId": "Q7-AK-000845" }

**d. Response sample**

{ "result": { "id": "iwr-001", "feeCharged": 0, "status":
"PENDING_PICKUP", "pickupDeadline": "2026-10-20T11:00:00Z" },
"isSuccess": true, "statusCode": 201, "message": "Đã tạo yêu cầu rút
hàng" }

**e. Validation**

| Status code | Description             | Examples                                                                                                                       |
| ----------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 404         | Không tìm thấy sản phẩm | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}                                        |
| 409         | Sản phẩm đã có đơn mua  | {"result":null,"isSuccess":false,"statusCode":409,"message":"PRODUCT_ALREADY_ORDERED: sản phẩm đã có đơn mua, không thể rút."} |

### API 91 — POST /item-withdrawal-requests/{id}/pay-fee (Tài)

**F-code:** F-033 · **Role:** Member

**a. Overview**

Thanh toán phí rút hàng (nếu có). Trừ ví trước, thiếu mới bù qua MoMo
(MIXED). Nếu ví/MIXED đã đủ thì thanh toán xong ngay; nếu còn thiếu thì
trả payUrl để thanh toán phần còn lại qua MoMo.

**b. API Specification**

| Method | URL                                    |
| ------ | -------------------------------------- |
| POST   | /item-withdrawal-requests/{id}/pay-fee |

Permission: Member

**c. Request sample**

{ "paymentMethod": "MIXED" }

**d. Response sample**

{ "result": { "id": "iwr-001", "feeCharged": 20000, "status":
"PENDING_PICKUP" }, "isSuccess": true, "statusCode": 200, "message": "Đã
thanh toán phí rút hàng" }

hoặc khi còn thiếu tiền phải bù qua MoMo:

{ "result": { "payUrl":
"https://payment.momo.vn/v2/gateway/pay?token=..." }, "isSuccess": true,
"statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu rút hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu rút hàng."} |

### API 92 — GET /item-withdrawal-requests/{id} (Tài)

**F-code:** — · **Role:** Member

**a. Overview**

Theo dõi đếm ngược hạn đến nhận hàng (pickupDeadline, 7 ngày). Đóng yêu
cầu khi bàn giao dùng chung POST /counter/handover với
context:"ITEM_WITHDRAWAL" (API 72, F-034) — không có API đóng riêng. Quá
pickupDeadline không đến nhận thì System tự hủy, đăng bán lại, không
hoàn phí (F-035, tự động, không có API).

**b. API Specification**

| Method | URL                            |
| ------ | ------------------------------ |
| GET    | /item-withdrawal-requests/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "iwr-001", "feeCharged": 0, "status":
"PENDING_PICKUP", "pickupDeadline": "2026-10-20T11:00:00Z" },
"isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                     | Examples                                                                                        |
| ----------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy yêu cầu rút hàng | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu rút hàng."} |

### API 93 — POST /degraded-item-cases (Tài)

**F-code:** — · **Role:** Moderator

**a. Overview**

Moderator mở ca xử lý hàng xuống cấp sau khi kiểm hàng trả về/hàng rút
về thấy hư hỏng. compensationAmount = giá bán trừ hoa hồng lẽ ra Member
nhận nếu bán được.

**b. API Specification**

| Method | URL                  |
| ------ | -------------------- |
| POST   | /degraded-item-cases |

Permission: Moderator

**c. Request sample**

{ "productId": "Q7-AK-000845", "returnRequestId": "rr-001",
"compensationAmount": 198000 }

**d. Response sample**

{ "result": { "id": "dic-001", "compensationAmount": 198000, "status":
"PENDING_DECISION" }, "isSuccess": true, "statusCode": 201, "message":
"Đã mở ca xử lý hàng xuống cấp" }

**e. Validation**

| Status code | Description                       | Examples                                                                                          |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| 400         | Thiếu compensationAmount hoặc ≤ 0 | {"result":null,"isSuccess":false,"statusCode":400,"message":"compensationAmount phải lớn hơn 0."} |
| 404         | Không tìm thấy sản phẩm           | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy sản phẩm."}           |

### API 94 — GET /degraded-item-cases/{id} (Tài)

**F-code:** — · **Role:** Member / Moderator

**a. Overview**

Xem chi tiết 1 ca xử lý hàng xuống cấp — Member xem để ra quyết định
(API 95), Moderator xem để theo dõi.

**b. API Specification**

| Method | URL                       |
| ------ | ------------------------- |
| GET    | /degraded-item-cases/{id} |

Permission: Member / Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "dic-001", "compensationAmount": 198000, "status":
"PENDING_DECISION" }, "isSuccess": true, "statusCode": 200, "message":
"" }

**e. Validation**

| Status code | Description                                                  | Examples                                                                                               |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 403         | Không phải Member sở hợu ca này và cũng không phải Moderator | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền xem ca này."}          |
| 404         | Không tìm thấy ca xử lý                                      | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy ca xử lý hàng xuống cấp."} |

### API 95 — POST /degraded-item-cases/{id}/decide (Tài)

**F-code:** F-036 · **Role:** Member

**a. Overview**

Member chọn 1 trong 2 cách giải quyết hàng xuống cấp: FULL_COMPENSATION
— nhận đủ compensationAmount, hàng trở thành tài sản nền tảng; hoặc
PARTIAL_WITH_ITEM_BACK — nhận compensationAmount ×
degradedCompensationRate (mặc định 50%, cấu hình được) và đến kho lấy
hàng về, không mất phí rút. Cả hai trường hợp đều cộng tiền vào ví người
bán ngay (F-162).

**b. API Specification**

| Method | URL                              |
| ------ | -------------------------------- |
| POST   | /degraded-item-cases/{id}/decide |

Permission: Member

**c. Request sample**

{ "choice": "PARTIAL_WITH_ITEM_BACK" }

**d. Response sample**

{ "result": { "id": "dic-001", "choice": "PARTIAL_WITH_ITEM_BACK",
"paidAmount": 99000 }, "isSuccess": true, "statusCode": 200, "message":
"Đã ghi nhận quyết định" }

**e. Validation**

| Status code | Description                    | Examples                                                                                               |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 404         | Không tìm thấy ca xử lý        | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy ca xử lý hàng xuống cấp."} |
| 409         | Ca đã được quyết định trước đó | {"result":null,"isSuccess":false,"statusCode":409,"message":"Ca này đã được quyết định."}              |

## Phase 6 — Thử đồ AI (L-08)

Màn hình liên quan: AI-01 → AI-06. Không có bảng "phiên thử đồ" riêng
trong database — FE tự giữ trạng thái chọn slot ở client (đã khoá món
đang xem, đã chọn người mẫu, đang chờ chọn món còn thiếu), chỉ gọi API
khi cần gợi ý và khi bấm sinh ảnh cuối cùng.

### API 96 — GET /tryon/suggestions (Nguyên)

**F-code:** F-075 · **Role:** Member

**a. Overview**

Gợi ý món còn thiếu để ghép đủ outfit (vd đã chọn TOP thì gợi ý BOTTOM
phù hợp), chỉ lấy sản phẩm đang ON_SALE. Nếu không có gợi ý phù hợp
(rỗng), FE tự mở GET /products (API 49) để Member tự chọn (F-076).

**b. API Specification**

| Method | URL                                                     |
| ------ | ------------------------------------------------------- |
| GET    | /tryon/suggestions?excludeProductId=&slot={TOP\|BOTTOM} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{ "result": \[ { "id": "Q7-AK-000846", "name": "Quần jean xanh",
"currentPrice": 180000 } \], "isSuccess": true, "statusCode": 200,
"message": "" }

**e. Validation**

| Status code | Description       | Examples                                                                                     |
| ----------- | ----------------- | -------------------------------------------------------------------------------------------- |
| 400         | slot không hợp lệ | {"result":null,"isSuccess":false,"statusCode":400,"message":"slot phải là TOP hoặc BOTTOM."} |

### API 97 — POST /tryon/images (Nguyên)

**F-code:** F-072, F-073, F-074, F-077, F-078, F-079 · **Role:** Member

**a. Overview**

Tạo ảnh thử đồ AI: chọn modelType và đúng 1 trong 2 bộ — {topProductId,
bottomProductId} (combo áo+quần) hoặc {dressProductId} (đầm). Cuộc gọi
đồng bộ, có thể mất vài giây vì gọi model AI tự host sinh ảnh (F-078) —
màn AI-03 tự xử lý trạng thái chờ/lỗi ở FE. Ảnh chỉ được lưu (F-079) khi
sinh thành công nên không cần API poll riêng.

**b. API Specification**

| Method | URL           |
| ------ | ------------- |
| POST   | /tryon/images |

Permission: Member

**c. Request sample**

{ "modelType": "FEMALE", "topProductId": "Q7-AK-000845",
"bottomProductId": "Q7-AK-000846" }

**d. Response sample**

{  
"result": { "id": "ty-001", "modelType": "FEMALE", "topProductId":
"Q7-AK-000845", "bottomProductId": "Q7-AK-000846", "imageUrl":
"https://cdn.rehome.vn/tryon/ty-001.jpg", "createdAt":
"2026-10-13T12:00:00Z" },  
"isSuccess": true, "statusCode": 201, "message": "Đã tạo ảnh thử đồ"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                            |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 409         | Thiếu hoặc lẫn cả hai kiểu outfit | {"result":null,"isSuccess":false,"statusCode":409,"message":"INCOMPLETE_OUTFIT: cần đúng một bộ áo+quần hoặc đầm."} |
| 502         | Model AI sinh ảnh lỗi/timeout     | {"result":null,"isSuccess":false,"statusCode":502,"message":"Không thể sinh ảnh thử đồ, vui lòng thử lại."}         |

### API 98 — GET /tryon/images (Nguyên)

**F-code:** F-080 · **Role:** Member

**a. Overview**

Bộ sưu tập ảnh thử đồ đã lưu của Member.

**b. API Specification**

| Method | URL                                   |
| ------ | ------------------------------------- |
| GET    | /tryon/images?page={page}&size={size} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "ty-001", "imageUrl":
"https://cdn.rehome.vn/tryon/ty-001.jpg" }\], "page": 0, "size": 20,
"totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 99 — DELETE /tryon/images/{id} (Nguyên)

**F-code:** F-081 · **Role:** Member

**a. Overview**

Xóa 1 ảnh thử đồ khỏi bộ sưu tập.

**b. API Specification**

| Method | URL                |
| ------ | ------------------ |
| DELETE | /tryon/images/{id} |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đã
xóa ảnh thử đồ" }

**e. Validation**

| Status code | Description        | Examples                                                                                  |
| ----------- | ------------------ | ----------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy ảnh | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy ảnh thử đồ."} |

## Phase 6 — Cộng đồng, chat & thông báo (L-09)

Màn hình liên quan: CD-01 → CD-06, CH-01 → CH-02 (Member), MC-01 → MC-02
(Moderator).

**Tổ chức, chiến dịch, bài viết (xem công khai)**

### API 100 — GET /organizations/{id} (Tài)

**F-code:** F-082 · **Role:** Guest / Member

**a. Overview**

Trang công khai của 1 tổ chức (chỉ hiển thị tổ chức đã VERIFIED). Nếu
Member đã đăng nhập, kèm isFollowing.

**b. API Specification**

| Method | URL                 |
| ------ | ------------------- |
| GET    | /organizations/{id} |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "org-001", "displayName": "Chia Sẻ Yêu Thương",
"description": "Thu gom quần áo cũ...", "isFollowing": true },
"isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                                 | Examples                                                                               |
| ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy tổ chức (hoặc chưa VERIFIED) | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tổ chức."} |

### API 101 — GET /organizations/nearby (Tài)

**F-code:** F-084 · **Role:** Member

**a. Overview**

Tìm điểm nhận đồ từ thiện gần vị trí hiện tại, kèm chiến dịch đang hoạt
động của tổ chức đó.

**b. API Specification**

| Method | URL                                       |
| ------ | ----------------------------------------- |
| GET    | /organizations/nearby?lat={lat}&lng={lng} |

Permission: Member

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": \[ { "organizationId": "org-001", "displayName": "Chia Sẻ Yêu
Thương", "donationPoint": { "address": "12 Nguyễn Trãi, Q.1" },
"distanceKm": 2.1, "activeCampaigns": \[{ "id": "cp-001", "endTime":
"2026-11-01T00:00:00Z" }\] } \],  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description            | Examples                                                                             |
| ----------- | ---------------------- | ------------------------------------------------------------------------------------ |
| 400         | Thiếu hoặc sai lat/lng | {"result":null,"isSuccess":false,"statusCode":400,"message":"lat/lng không hợp lệ."} |

### API 102 — GET /campaigns/{id} (Tài)

**F-code:** F-083 · **Role:** Guest / Member

**a. Overview**

Chi tiết 1 chiến dịch gây quỹ/thu gom đồ. Chỉ là thông tin mô tả — không
có kg mục tiêu hay tiến độ vì donation không lưu dữ liệu giao dịch.

**b. API Specification**

| Method | URL             |
| ------ | --------------- |
| GET    | /campaigns/{id} |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A

**d. Response sample**

{  
"result": { "id": "cp-001", "description": "Thu áo ấm miền núi phía
Bắc", "startTime": "2026-10-01T00:00:00Z", "endTime":
"2026-11-01T00:00:00Z", "locationName": "Điểm nhận đồ Q.1", "status":
"ACTIVE" },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description               | Examples                                                                                  |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy chiến dịch | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy chiến dịch."} |

### API 103 — POST /organizations/{id}/follow, DELETE /organizations/{id}/follow (Tài)

**F-code:** F-085 · **Role:** Member

**a. Overview**

Theo dõi / bỏ theo dõi 1 tổ chức để nhận cập nhật bài viết mới trong
newsfeed.

**b. API Specification**

| Method | URL                        |
| ------ | -------------------------- |
| POST   | /organizations/{id}/follow |
| DELETE | /organizations/{id}/follow |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "" }

**e. Validation**

| Status code | Description            | Examples                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy tổ chức | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tổ chức."} |

### API 104 — GET /posts (Tài)

**F-code:** F-086 · **Role:** Guest / Member

**a. Overview**

Danh sách bài viết (status:"VISIBLE"). Truyền organizationId → bài của 1
tổ chức; bỏ trống → newsfeed theo các tổ chức Member đang follow.

**b. API Specification**

| Method | URL                                |
| ------ | ---------------------------------- |
| GET    | /posts?organizationId=&page=&size= |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "post-001", "organizationId":
"org-001", "content": "Đã phát 200 áo ấm cho các em...", "status":
"VISIBLE" }\], "page": 0, "size": 20, "totalElements": 1, "totalPages":
1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                                              | Examples                                                                                      |
| ----------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 401         | Không truyền organizationId (newsfeed) mà chưa đăng nhập | {"result":null,"isSuccess":false,"statusCode":401,"message":"Cần đăng nhập để xem newsfeed."} |

### API 105 — GET /posts/{id} (Tài)

**F-code:** F-086 · **Role:** Guest / Member

**a. Overview**

Chi tiết 1 bài viết, kèm số lượt thích, số bình luận và Member đang đăng
nhập đã thích chưa.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| GET    | /posts/{id} |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "post-001", "content": "Đã phát 200 áo ấm...",
"likeCount": 42, "commentCount": 5, "likedByMe": false }, "isSuccess":
true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy bài viết | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy bài viết."} |

### API 106 — POST /posts/{id}/like, DELETE /posts/{id}/like (Tài)

**F-code:** F-087 · **Role:** Member

**a. Overview**

Thích / bỏ thích 1 bài viết.

**b. API Specification**

| Method | URL              |
| ------ | ---------------- |
| POST   | /posts/{id}/like |
| DELETE | /posts/{id}/like |

Permission: Member

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "" }

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy bài viết | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy bài viết."} |

### API 107 — GET /posts/{id}/comments (Tài)

**F-code:** F-087 · **Role:** Guest / Member

**a. Overview**

Danh sách bình luận còn hiển thị (status:"VISIBLE") của 1 bài viết.

**b. API Specification**

| Method | URL                                          |
| ------ | -------------------------------------------- |
| GET    | /posts/{id}/comments?page={page}&size={size} |

Permission: Guest / Member (không cần token)

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "cm-001", "content": "Ủng hộ chiến dịch
này!", "status": "VISIBLE" }\], "page": 0, "size": 20, "totalElements":
1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy bài viết | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy bài viết."} |

### API 108 — POST /posts/{id}/comments (Tài)

**F-code:** F-087 · **Role:** Member

**a. Overview**

Member bình luận vào 1 bài viết.

**b. API Specification**

| Method | URL                  |
| ------ | -------------------- |
| POST   | /posts/{id}/comments |

Permission: Member

**c. Request sample**

{ "content": "Ủng hộ chiến dịch này!" }

**d. Response sample**

{ "result": { "id": "cm-001", "content": "Ủng hộ chiến dịch này!",
"status": "VISIBLE" }, "isSuccess": true, "statusCode": 201, "message":
"Đã đăng bình luận" }

**e. Validation**

| Status code | Description             | Examples                                                                                |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------- |
| 400         | Thiếu content           | {"result":null,"isSuccess":false,"statusCode":400,"message":"content là bắt buộc."}     |
| 404         | Không tìm thấy bài viết | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy bài viết."} |

### API 109 — POST /violation-reports (Tài)

**F-code:** F-088 · **Role:** Member

**a. Overview**

Báo cáo vi phạm — dùng chung cho cả 3 loại đối tượng: bài viết, chiến
dịch, hoặc tài khoản tổ chức. Moderator xử lý qua hàng đợi
VIOLATION_REPORT (API 28).

**b. API Specification**

| Method | URL                |
| ------ | ------------------ |
| POST   | /violation-reports |

Permission: Member

**c. Request sample**

{ "targetType": "POST", "targetId": "post-001", "reason": "Nội dung sai
sự thật" }

**d. Response sample**

{ "result": { "id": "vr-001", "status": "PENDING" }, "isSuccess": true,
"statusCode": 201, "message": "Đã gởi báo cáo" }

**e. Validation**

| Status code | Description                      | Examples                                                                                                   |
| ----------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field bắt buộc             | {"result":null,"isSuccess":false,"statusCode":400,"message":"targetType, targetId và reason là bắt buộc."} |
| 404         | Không tìm thấy đối tượng báo cáo | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đối tượng để báo cáo."}        |

**Chat**

### API 110 — GET /conversations (Tài)

**F-code:** F-089, F-090, F-091 · **Role:** Member / Organization /
Moderator

**a. Overview**

Danh sách hội thoại. Moderator thấy hộp thư chung của kho mình — mọi
Moderator trong kho đều thấy cùng hội thoại (F-091, không phân theo từng
Moderator).

**b. API Specification**

| Method | URL            |
| ------ | -------------- |
| GET    | /conversations |

Permission: Member / Organization / Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": \[ { "id": "conv-001", "type": "MEMBER_ORGANIZATION",
"counterpart": { "id": "org-001", "displayName": "Chia Sẻ Yêu Thương" },
"lastMessage": "Cảm ơn bạn!", "unreadCount": 2 } \], "isSuccess": true,
"statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 111 — POST /conversations (Tài)

**F-code:** F-089, F-090 · **Role:** Member

**a. Overview**

Mở hội thoại mới với 1 tổ chức hoặc kho (vd hỏi về đơn hàng). Nếu hội
thoại với đối tượng này đã tồn tại, trả về hội thoại cũ thay vì tạo
trùng.

**b. API Specification**

| Method | URL            |
| ------ | -------------- |
| POST   | /conversations |

Permission: Member

**c. Request sample**

{ "type": "MEMBER_ORGANIZATION", "counterpartId": "org-001" }

**d. Response sample**

{ "result": { "id": "conv-001", "type": "MEMBER_ORGANIZATION" },
"isSuccess": true, "statusCode": 201, "message": "" }

**e. Validation**

| Status code | Description                      | Examples                                                                                         |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| 404         | Không tìm thấy đối tác hội thoại | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy đối tác hội thoại."} |

### API 112 — GET /conversations/{id}/messages (Tài)

**F-code:** F-089, F-090 · **Role:** Member / Organization / Moderator

**a. Overview**

Lịch sử tin nhắn trong 1 hội thoại, mới nhất trước.

**b. API Specification**

| Method | URL                                                  |
| ------ | ---------------------------------------------------- |
| GET    | /conversations/{id}/messages?page={page}&size={size} |

Permission: Member / Organization / Moderator

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "msg-001", "senderId": "org-001",
"content": "Cảm ơn bạn!", "createdAt": "2026-10-13T13:00:00Z" }\],
"page": 0, "size": 20, "totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description               | Examples                                                                                      |
| ----------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| 403         | Không thuộc hội thoại này | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không thuộc hội thoại này."} |
| 404         | Không tìm thấy hội thoại  | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy hội thoại."}      |

### API 113 — POST /conversations/{id}/messages (Tài)

**F-code:** F-089, F-090, F-091 · **Role:** Member / Organization /
Moderator

**a. Overview**

Gởi tin nhắn. Tin realtime được đẩy thêm qua WebSocket/FCM cho ngại trải
nghiệm tức thì — API này là nại lưu trự chính thức và cũng là fallback
khi kênh realtime lỗi.

**b. API Specification**

| Method | URL                          |
| ------ | ---------------------------- |
| POST   | /conversations/{id}/messages |

Permission: Member / Organization / Moderator

**c. Request sample**

{ "content": "Cho mình hỏi đơn hàng OD-2026-000123 đã giao chưa?" }

**d. Response sample**

{ "result": { "id": "msg-002", "content": "Cho mình hỏi đơn hàng
OD-2026-000123 đã giao chưa?", "createdAt": "2026-10-13T13:05:00Z" },
"isSuccess": true, "statusCode": 201, "message": "" }

**e. Validation**

| Status code | Description              | Examples                                                                                 |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| 400         | Thiếu content            | {"result":null,"isSuccess":false,"statusCode":400,"message":"content là bắt buộc."}      |
| 404         | Không tìm thấy hội thoại | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy hội thoại."} |

**Thông báo**

### API 114 — GET /notifications (Tài)

**F-code:** F-092, F-093, F-094 · **Role:** Member / Organization /
Moderator

**a. Overview**

Danh sách thông báo trong ứng dụng. Các loại: ORDER_UPDATE,
WALLET_EVENT, TERM_EXPIRY, VERIFICATION_RESULT, QUEUE_TASK.

**b. API Specification**

| Method | URL                                    |
| ------ | -------------------------------------- |
| GET    | /notifications?page={page}&size={size} |

Permission: Member / Organization / Moderator

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "ntf-001", "type": "ORDER_UPDATE",
"message": "Đơn OD-2026-000123 đang được giao", "isRead": false,
"createdAt": "2026-10-13T13:10:00Z" }\], "page": 0, "size": 20,
"totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 115 — PATCH /notifications/{id}/read (Tài)

**F-code:** — · **Role:** Member / Organization / Moderator

**a. Overview**

Đánh dấu 1 thông báo đã đọc.

**b. API Specification**

| Method | URL                      |
| ------ | ------------------------ |
| PATCH  | /notifications/{id}/read |

Permission: Member / Organization / Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "" }

**e. Validation**

| Status code | Description              | Examples                                                                                 |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy thông báo | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy thông báo."} |

### API 116 — PATCH /notifications/read-all (Tài)

**F-code:** — · **Role:** Member / Organization / Moderator

**a. Overview**

Đánh dấu tất cả thông báo đã đọc cùng lúc.

**b. API Specification**

| Method | URL                     |
| ------ | ----------------------- |
| PATCH  | /notifications/read-all |

Permission: Member / Organization / Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "" }

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

F-095 (báo Admin việc quá hạn) tự hiển thị trong GET /admin/dashboard
(Phase 7), không có API riêng.

## Phase 6 — Tổ chức & Xác minh tổ chức (L-10)

Không có trong Screen Inventory Member/Moderator đã cung cấp (thuộc app
Organization riêng + màn Moderator TC-01 → TC-06); liệt kê theo đúng
F-code để không sót API.

**Tổ chức tự quản hồ sơ, chiến dịch, bài viết**

### API 117 — PATCH /organizations/me (Tài)

**F-code:** F-096 · **Role:** Organization

**a. Overview**

Tổ chức tự cập nhật thông tin thường (logo, mô tả, số điện thoại, giờ
nhận đồ) — áp dụng ngay, không cần Moderator duyệt.

**b. API Specification**

| Method | URL               |
| ------ | ----------------- |
| PATCH  | /organizations/me |

Permission: Organization

**c. Request sample**

{ "description": "Thu gom quần áo cũ hỗ trợ trẻ em vùng cao, mở rộng
thêm khu vực miền Tây" }

**d. Response sample**

{ "result": { "id": "org-001", "description": "Thu gom quần áo cũ..." },
"isSuccess": true, "statusCode": 200, "message": "Đã cập nhật hồ sơ" }

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 118 — POST /organizations/me/legal-change-requests (Tài)

**F-code:** F-097 · **Role:** Organization

**a. Overview**

Tổ chức yêu cầu đổi thông tin pháp lý (tên, người đại diện, giấy tờ) —
khác với API 117, nhịng thay đổi này phải qua Moderator duyệt mới áp
dụng (xem API 132).

**b. API Specification**

| Method | URL                                     |
| ------ | --------------------------------------- |
| POST   | /organizations/me/legal-change-requests |

Permission: Organization

**c. Request sample**

{ "proposedChanges": { "legalName": "Quỹ Chia Sẻ Yêu Thương 2",
"documents": \[{ "docType": "OPERATING_LICENSE", "fileUrl":
"https://cdn.rehome.vn/uploads/license-new.pdf" }\] } }

**d. Response sample**

{ "result": { "id": "lcr-001", "status": "PENDING" }, "isSuccess": true,
"statusCode": 201, "message": "Đã gởi yêu cầu, chờ duyệt" }

**e. Validation**

| Status code | Description           | Examples                                                                                    |
| ----------- | --------------------- | ------------------------------------------------------------------------------------------- |
| 400         | Thiếu proposedChanges | {"result":null,"isSuccess":false,"statusCode":400,"message":"proposedChanges là bắt buộc."} |

### API 119 — POST /campaigns (Tài)

**F-code:** F-098, F-099 · **Role:** Organization

**a. Overview**

Tổ chức tạo chiến dịch gây quỹ/thu gom đồ mới. Đang chạy ≥ số chiến dịch
tối đa cùng lúc (cấu hình, mặc định 3) thì không tạo thêm được.

**b. API Specification**

| Method | URL        |
| ------ | ---------- |
| POST   | /campaigns |

Permission: Organization

**c. Request sample**

{ "description": "Thu áo ấm miền núi phía Bắc", "startTime":
"2026-10-15T00:00:00Z", "endTime": "2026-11-15T00:00:00Z",
"locationName": "Điểm nhận đồ Q.1", "latitude": 10.762, "longitude":
106.682, "preferredItemTypes": \["Áo ấm", "Chăn"\] }

**d. Response sample**

{ "result": { "id": "cp-002", "status": "OPEN" }, "isSuccess": true,
"statusCode": 201, "message": "Đã tạo chiến dịch" }

**e. Validation**

| Status code | Description                           | Examples                                                                                                                      |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 400         | Thiếu field bắt buộc                  | {"result":null,"isSuccess":false,"statusCode":400,"message":"description, startTime, endTime là bắt buộc."}                   |
| 409         | Đã đạt số chiến dịch đang chạy tối đa | {"result":null,"isSuccess":false,"statusCode":409,"message":"CAMPAIGN_LIMIT_REACHED: đã đạt số chiến dịch đang chạy tối đa."} |

### API 120 — PUT /campaigns/{id} (Tài)

**F-code:** F-100 · **Role:** Organization

**a. Overview**

Sửa chiến dịch (body giống API 119). Chỉ sửa được khi chiến dịch đang
OPEN.

**b. API Specification**

| Method | URL             |
| ------ | --------------- |
| PUT    | /campaigns/{id} |

Permission: Organization

**c. Request sample**

{ "description": "Thu áo ấm miền núi phía Bắc (mở rộng)", "endTime":
"2026-12-01T00:00:00Z" }

**d. Response sample**

{ "result": { "id": "cp-002", "endTime": "2026-12-01T00:00:00Z" },
"isSuccess": true, "statusCode": 200, "message": "Đã cập nhật chiến
dịch" }

**e. Validation**

| Status code | Description               | Examples                                                                                        |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy chiến dịch | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy chiến dịch."}       |
| 409         | Chiến dịch không ở OPEN   | {"result":null,"isSuccess":false,"statusCode":409,"message":"Chỉ sửa được chiến dịch đang mở."} |

### API 121 — POST /campaigns/{id}/close (Tài)

**F-code:** F-101 · **Role:** Organization

**a. Overview**

Tổ chức đóng chiến dịch trước hạn. Khi hết endTime mà chưa đóng, System
tự đóng (F-102).

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| POST   | /campaigns/{id}/close |

Permission: Organization

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "cp-002", "status": "CLOSED" }, "isSuccess": true,
"statusCode": 200, "message": "Đã đóng chiến dịch" }

**e. Validation**

| Status code | Description               | Examples                                                                                  |
| ----------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy chiến dịch | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy chiến dịch."} |

### API 122 — GET /organizations/me/campaigns (Tài)

**F-code:** F-103 · **Role:** Organization

**a. Overview**

Danh sách chiến dịch của chính tổ chức đang đăng nhập — tất cả trạng
thái.

**b. API Specification**

| Method | URL                                                                 |
| ------ | ------------------------------------------------------------------- |
| GET    | /organizations/me/campaigns?status={status}&page={page}&size={size} |

Permission: Organization

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "cp-002", "description": "Thu áo
ấm...", "status": "OPEN" }\], "page": 0, "size": 20, "totalElements": 1,
"totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 123 — POST /posts (Tài)

**F-code:** F-104 · **Role:** Organization

**a. Overview**

Tổ chức đăng bài viết mới (cập nhật hoạt động, cảm ơn người ầng hộ...).

**b. API Specification**

| Method | URL    |
| ------ | ------ |
| POST   | /posts |

Permission: Organization

**c. Request sample**

{ "content": "Đã phát 200 áo ấm cho các em vùng cao, cảm ơn mọi người!",
"photoUrls": \["https://cdn.rehome.vn/uploads/post1.jpg"\] }

**d. Response sample**

{ "result": { "id": "post-002", "status": "VISIBLE" }, "isSuccess":
true, "statusCode": 201, "message": "Đã đăng bài" }

**e. Validation**

| Status code | Description   | Examples                                                                            |
| ----------- | ------------- | ----------------------------------------------------------------------------------- |
| 400         | Thiếu content | {"result":null,"isSuccess":false,"statusCode":400,"message":"content là bắt buộc."} |

### API 124 — PUT /posts/{id} (Tài)

**F-code:** F-105 · **Role:** Organization

**a. Overview**

Sửa bài viết — chỉ sửa được bài của chính tổ chức.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| PUT    | /posts/{id} |

Permission: Organization

**c. Request sample**

{ "content": "Đã phát 220 áo ấm cho các em vùng cao, cảm ơn mọi người!"
}

**d. Response sample**

{ "result": { "id": "post-002", "content": "Đã phát 220 áo ấm..." },
"isSuccess": true, "statusCode": 200, "message": "Đã cập nhật bài viết"
}

**e. Validation**

| Status code | Description                    | Examples                                                                                            |
| ----------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| 403         | Không phải bài của tổ chức này | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền sửa bài viết này."} |
| 404         | Không tìm thấy bài viết        | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy bài viết."}             |

### API 125 — DELETE /posts/{id} (Tài)

**F-code:** F-106 · **Role:** Organization

**a. Overview**

Xóa bài viết của chính tổ chức.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| DELETE | /posts/{id} |

Permission: Organization

**c. Request sample**

N/A

**d. Response sample**

{ "result": null, "isSuccess": true, "statusCode": 204, "message": "Đã
xóa bài viết" }

**e. Validation**

| Status code | Description                    | Examples                                                                                            |
| ----------- | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| 403         | Không phải bài của tổ chức này | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền xóa bài viết này."} |
| 404         | Không tìm thấy bài viết        | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy bài viết."}             |

### API 126 — GET /organizations/me/posts (Tài)

**F-code:** F-107 · **Role:** Organization

**a. Overview**

Danh sách bài viết của chính tổ chức, kèm số lượt thích và bình luận —
để tự theo dõi tương tác.

**b. API Specification**

| Method | URL                                             |
| ------ | ----------------------------------------------- |
| GET    | /organizations/me/posts?page={page}&size={size} |

Permission: Organization

**c. Request sample**

N/A (truyền qua query string)

**d. Response sample**

{  
"result": { "content": \[{ "id": "post-002", "content": "Đã phát 220 áo
ấm...", "likeCount": 15, "commentCount": 3 }\], "page": 0, "size": 20,
"totalElements": 1, "totalPages": 1 },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

**Xác minh tổ chức & xử lý báo cáo (Moderator)**

### API 127 — GET /queues?type=ORG_VERIFICATION (Nguyên)

**F-code:** F-111 · **Role:** Moderator

**a. Overview**

Hàng đợi hồ sơ tổ chức chờ xác minh — dùng chung endpoint hàng đợi ở
Phase 2 (API 28), chỉ lọc type=ORG_VERIFICATION.

**b. API Specification**

| Method | URL                           |
| ------ | ----------------------------- |
| GET    | /queues?type=ORG_VERIFICATION |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": \[ { "id": "q-020", "type": "ORG_VERIFICATION", "refId":
"org-002" } \], "isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description                  | Examples                                                                                           |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập/token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn."} |

### API 128 — GET /organizations/{id}/verification (Nguyên)

**F-code:** F-137 · **Role:** Moderator

**a. Overview**

Xem hồ sơ xác minh của 1 tổ chức: loại hình, người đại diện, giấy tờ, và
checklist cần kiểm tra (checklist thay đổi theo orgType, xem mục 9 tài
liệu tổng quan). Ảnh giấy tờ chỉ Moderator xem được, Admin không xem.

**b. API Specification**

| Method | URL                              |
| ------ | -------------------------------- |
| GET    | /organizations/{id}/verification |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{  
"result": { "orgType": "CHARITY", "representative": { "fullName":
"Nguyễn Văn B" }, "documents": \[{ "docType": "OPERATING_LICENSE",
"fileUrl": "https://cdn.rehome.vn/uploads/license.pdf" }\], "checklist":
\[{ "item": "Giấy phép hoạt động hợp lệ", "required": true }\] },  
"isSuccess": true, "statusCode": 200, "message": ""  
}

**e. Validation**

| Status code | Description            | Examples                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy tổ chức | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tổ chức."} |

### API 129 — POST /organizations/{id}/verify (Nguyên)

**F-code:** F-138 · **Role:** Moderator

**a. Overview**

Moderator xác minh hợp lệ và duyệt tổ chức. Bị chặn nếu checklist ở API
128 chưa được tích đủ.

**b. API Specification**

| Method | URL                        |
| ------ | -------------------------- |
| POST   | /organizations/{id}/verify |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "org-002", "verificationStatus": "VERIFIED",
"verifiedBy": "mod-07", "verifiedAt": "2026-10-13T14:00:00Z" },
"isSuccess": true, "statusCode": 200, "message": "Đã xác minh tổ chức" }

**e. Validation**

| Status code | Description            | Examples                                                                                                               |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy tổ chức | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tổ chức."}                                 |
| 409         | Checklist chưa tích đủ | {"result":null,"isSuccess":false,"statusCode":409,"message":"CHECKLIST_INCOMPLETE: chưa hoàn tất checklist xác minh."} |

### API 130 — POST /organizations/{id}/reject (Nguyên)

**F-code:** F-138 · **Role:** Moderator

**a. Overview**

Moderator từ chối hồ sơ tổ chức, kèm lý do. Tổ chức sửa và gởi lại qua
PUT /organizations/me/registration (API 4, F-003).

**b. API Specification**

| Method | URL                        |
| ------ | -------------------------- |
| POST   | /organizations/{id}/reject |

Permission: Moderator

**c. Request sample**

{ "reason": "Giấy phép hoạt động đã hết hạn" }

**d. Response sample**

{ "result": { "id": "org-002", "verificationStatus": "REJECTED",
"rejectionReason": "Giấy phép hoạt động đã hết hạn" }, "isSuccess":
true, "statusCode": 200, "message": "Đã từ chối hồ sơ" }

**e. Validation**

| Status code | Description            | Examples                                                                               |
| ----------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 400         | Thiếu reason           | {"result":null,"isSuccess":false,"statusCode":400,"message":"reason là bắt buộc."}     |
| 404         | Không tìm thấy tổ chức | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tổ chức."} |

### API 131 — GET /queues?type=LEGAL_CHANGE (Nguyên)

### POST /organizations/legal-change-requests/{id}/approve,

### POST .../reject

**F-code:** F-140 · **Role:** Moderator

**a. Overview**

Xử lý yêu cầu đổi thông tin pháp lý của tổ chức (từ API 118): xem hàng
đợi, rối duyệt hoặc từ chối. Duyệt thì áp dụng thẳng vào
OrganizationProfile.

**b. API Specification**

| Method | URL                                               |
| ------ | ------------------------------------------------- |
| GET    | /queues?type=LEGAL_CHANGE                         |
| POST   | /organizations/legal-change-requests/{id}/approve |
| POST   | /organizations/legal-change-requests/{id}/reject  |

Permission: Moderator

**c. Request sample**

{ "reason": "Tên mới chưa khớp giấy phép đính kèm" }

(chỉ cần cho reject; approve không cần body)

**d. Response sample**

{ "result": { "id": "lcr-001", "status": "APPROVED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã duyệt yêu cầu đổi thông tin" }

**e. Validation**

| Status code | Description            | Examples                                                                                             |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------- |
| 400         | reject thiếu reason    | {"result":null,"isSuccess":false,"statusCode":400,"message":"reason là bắt buộc khi từ chối."}       |
| 404         | Không tìm thấy yêu cầu | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy yêu cầu đổi thông tin."} |

### API 132 — GET /queues?type=VIOLATION_REPORT, GET /violation-reports/{id} (Nguyên)

**F-code:** F-141 · **Role:** Moderator

**a. Overview**

Xem hàng đợi báo cáo vi phạm (từ API 109) và chi tiết 1 báo cáo để
Moderator xử lý (API 133/134).

**b. API Specification**

| Method | URL                           |
| ------ | ----------------------------- |
| GET    | /queues?type=VIOLATION_REPORT |
| GET    | /violation-reports/{id}       |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "vr-001", "targetType": "POST", "targetId":
"post-001", "reason": "Nội dung sai sự thật", "status": "PENDING" },
"isSuccess": true, "statusCode": 200, "message": "" }

**e. Validation**

| Status code | Description            | Examples                                                                                       |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy báo cáo | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy báo cáo vi phạm."} |

### API 133 — POST /violation-reports/{id}/resolve (Nguyên)

**F-code:** F-141 · **Role:** Moderator

**a. Overview**

Moderator xử lý báo cáo vi phạm: REMOVE_CONTENT/HIDE_CAMPAIGN tự chuyển
bài viết/chiến dịch liên quan sang ẩn; ESCALATE_TO_ADMIN chỉ đề xuất lên
Admin — chỉ Admin mới khóa được tài khoản (xem Phase 7).

**b. API Specification**

| Method | URL                             |
| ------ | ------------------------------- |
| POST   | /violation-reports/{id}/resolve |

Permission: Moderator

**c. Request sample**

{ "action": "REMOVE_CONTENT" }

**d. Response sample**

{ "result": { "id": "vr-001", "status": "RESOLVED" }, "isSuccess": true,
"statusCode": 200, "message": "Đã xử lý báo cáo" }

**e. Validation**

| Status code | Description            | Examples                                                                                       |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 400         | action không hợp lệ    | {"result":null,"isSuccess":false,"statusCode":400,"message":"action không hợp lệ."}            |
| 404         | Không tìm thấy báo cáo | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy báo cáo vi phạm."} |

### API 134 — POST /violation-reports/{id}/dismiss (Nguyên)

**F-code:** F-141 · **Role:** Moderator

**a. Overview**

Moderator bác báo cáo vi phạm (không có vi phạm thật).

**b. API Specification**

| Method | URL                             |
| ------ | ------------------------------- |
| POST   | /violation-reports/{id}/dismiss |

Permission: Moderator

**c. Request sample**

N/A

**d. Response sample**

{ "result": { "id": "vr-001", "status": "DISMISSED" }, "isSuccess":
true, "statusCode": 200, "message": "Đã bác báo cáo" }

**e. Validation**

| Status code | Description            | Examples                                                                                       |
| ----------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 404         | Không tìm thấy báo cáo | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy báo cáo vi phạm."} |

F-139 (hạn chế xem + tự xoá ảnh giấy tờ sau cấu hình, mặc định 30 ngày)
là quy tắc nội bộ của API xem giấy tờ và một job nền, không có API
riêng.

## Phase 7 — Admin (L-11)

Không có trong Screen Inventory đã cung cấp (web Admin riêng); liệt kê
theo đúng F-code.

### API 135 — GET /admin/accounts (Nguyên)

**F-code:** F-146 · **Role:** Admin

**a. Overview**

Admin tra cứu/tìm kiếm toàn bộ tài khoản trong hệ thống (Member,
Organization, Moderator, Admin) theo từ khóa, role, status — phục vụ
quản lý và hỗ trợ xử lý vi phạm.

**b. API Specification**

| Method | URL                                                                                  |
| ------ | ------------------------------------------------------------------------------------ |
| GET    | /admin/accounts?search={keyword}&role={role}&status={status}&page={page}&size={size} |

**Permission:** Admin

**c. Request sample**

N/A — chỉ dùng query string, không có body.

**d. Response sample**

{  
"result": {  
"content": \[  
{  
"id": "8f1c2e40-1111-4a11-9c01-100000000001",  
"email": "member01@gmail.com",  
"fullName": "Nguyễn Văn A",  
"role": "MEMBER",  
"status": "ACTIVE",  
"createdAt": "2026-01-10T08:00:00Z"  
}  
\],  
"page": 0,  
"size": 20,  
"totalElements": 358,  
"totalPages": 18  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                           | Examples                                                                                                 |
| ----------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn     | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Tài khoản gọi API không có role Admin | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |

### API 136 — POST /admin/accounts/{id}/ban (Nguyên)

**F-code:** F-147 · **Role:** Admin

**a. Overview**

Admin khóa (ban) một tài khoản vi phạm — chặn đăng nhập ngay, nhưng
không huỷ các đơn hàng/yêu cầu ký gửi/trả hàng đang xử lý của tài khoản
đó, các luồng này vẫn tiếp tục cho tới khi hoàn tất.

**b. API Specification**

| Method | URL                      |
| ------ | ------------------------ |
| POST   | /admin/accounts/{id}/ban |

**Permission:** Admin

**c. Request sample**

{  
"reason": "Vi phạm điều khoản sử dụng — gian lận giao dịch"  
}

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-1111-4a11-9c01-100000000001",  
"status": "BANNED"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đã khóa tài khoản"  
}

**e. Validation**

| Status code | Description                               | Examples                                                                                                 |
| ----------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn         | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                          | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |
| 404         | Không tìm thấy tài khoản                  | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tài khoản"}                  |
| 409         | Tài khoản đã ở trạng thái BANNED từ trước | {"result":null,"isSuccess":false,"statusCode":409,"message":"Tài khoản đã bị khóa"}                      |

### API 137 — POST /admin/accounts/{id}/unban (Nguyên)

**F-code:** F-148 · **Role:** Admin

**a. Overview**

Admin mở khóa một tài khoản đã bị ban trước đó, trả lại quyền đăng nhập
bình thường.

**b. API Specification**

| Method | URL                        |
| ------ | -------------------------- |
| POST   | /admin/accounts/{id}/unban |

**Permission:** Admin

**c. Request sample**

N/A — không có body.

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-1111-4a11-9c01-100000000001",  
"status": "ACTIVE"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đã mở khóa tài khoản"  
}

**e. Validation**

| Status code | Description                         | Examples                                                                                                 |
| ----------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn   | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                    | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |
| 404         | Không tìm thấy tài khoản            | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tài khoản"}                  |
| 409         | Tài khoản không ở trạng thái BANNED | {"result":null,"isSuccess":false,"statusCode":409,"message":"Tài khoản không ở trạng thái bị khóa"}      |

### API 138 — POST /admin/moderators (Nguyên)

**F-code:** F-149 · **Role:** Admin

**a. Overview**

Admin tạo tài khoản Moderator mới — Moderator không tự đăng ký được,
Admin tạo thay và gán kho ngay lúc tạo; hệ thống sinh mật khẩu tạm và
gửi qua email cho Moderator.

**b. API Specification**

| Method | URL               |
| ------ | ----------------- |
| POST   | /admin/moderators |

**Permission:** Admin

**c. Request sample**

{  
"email": "mod01@rehome.vn",  
"fullName": "Trần Thị B",  
"warehouseId": "8f1c2e40-2222-4a11-9c01-200000000001"  
}

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-3333-4a11-9c01-300000000001",  
"email": "mod01@rehome.vn",  
"fullName": "Trần Thị B",  
"role": "MODERATOR",  
"warehouseId": "8f1c2e40-2222-4a11-9c01-200000000001",  
"status": "ACTIVE",  
"createdAt": "2026-10-13T09:00:00Z"  
},  
"isSuccess": true,  
"statusCode": 201,  
"message": "Đã tạo Moderator, mật khẩu tạm đã gửi qua email"  
}

**e. Validation**

| Status code | Description                           | Examples                                                                                                        |
| ----------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn     | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}               |
| 403         | Không phải Admin                      | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"}        |
| 404         | warehouseId không tồn tại             | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy kho"}                               |
| 409         | Email đã được dùng cho tài khoản khác | {"result":null,"isSuccess":false,"statusCode":409,"message":"Email đã được sử dụng"}                            |
| 422         | Thiếu hoặc sai định dạng field        | {"result":null,"isSuccess":false,"statusCode":422,"message":"Dữ liệu không hợp lệ: email không đúng định dạng"} |

### API 139 — PUT /admin/moderators/{id} (Nguyên)

**F-code:** F-150 · **Role:** Admin

**a. Overview**

Admin sửa thông tin Moderator (hiện chỉ hỗ trợ sửa họ tên) — Moderator
không tự sửa được thông tin của chính mình.

**b. API Specification**

| Method | URL                    |
| ------ | ---------------------- |
| PUT    | /admin/moderators/{id} |

**Permission:** Admin

**c. Request sample**

{  
"fullName": "Trần Thị B (đã đổi tên)"  
}

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-3333-4a11-9c01-300000000001",  
"fullName": "Trần Thị B (đã đổi tên)"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                 |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |
| 404         | Không tìm thấy Moderator          | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy Moderator"}                  |

### API 140 — PATCH /admin/moderators/{id}/warehouse (Nguyên)

**F-code:** F-151 · **Role:** Admin

**a. Overview**

Admin gán hoặc chuyển một Moderator sang kho khác.

**b. API Specification**

| Method | URL                              |
| ------ | -------------------------------- |
| PATCH  | /admin/moderators/{id}/warehouse |

**Permission:** Admin

**c. Request sample**

{  
"warehouseId": "8f1c2e40-2222-4a11-9c01-200000000002"  
}

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-3333-4a11-9c01-300000000001",  
"warehouseId": "8f1c2e40-2222-4a11-9c01-200000000002"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                 |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |
| 404         | Không tìm thấy Moderator hoặc kho | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy Moderator hoặc kho"}         |

### API 141 — GET /warehouses (Nguyên)

**F-code:** F-152 · **Role:** Member / Moderator / Admin

**a. Overview**

Lấy danh sách kho — dùng chung cho nhiều actor: Member dùng để chọn kho
ký gửi, Moderator xem kho mình phụ trách, Admin xem toàn bộ kho kể cả
kho đã ẩn (status HIDDEN).

**b. API Specification**

| Method | URL                         |
| ------ | --------------------------- |
| GET    | /warehouses?status={status} |

**Permission:** Member, Moderator, Admin (Admin thấy thêm kho HIDDEN)

**c. Request sample**

N/A — chỉ dùng query string, không có body.

**d. Response sample**

{  
"result": \[  
{  
"id": "8f1c2e40-2222-4a11-9c01-200000000001",  
"name": "Kho ReHome Quận 7",  
"address": "123 Nguyễn Văn Linh, Quận 7, TP.HCM",  
"latitude": 10.729,  
"longitude": 106.721,  
"openingHours": "08:00-20:00",  
"status": "ACTIVE"  
}  
\],  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                          |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"} |

### API 142 — POST /warehouses (Nguyên)

**F-code:** F-153 · **Role:** Admin

**a. Overview**

Admin tạo kho mới.

**b. API Specification**

| Method | URL         |
| ------ | ----------- |
| POST   | /warehouses |

**Permission:** Admin

**c. Request sample**

{  
"name": "Kho ReHome Quận 7",  
"address": "123 Nguyễn Văn Linh, Quận 7, TP.HCM",  
"latitude": 10.729,  
"longitude": 106.721,  
"openingHours": "08:00-20:00"  
}

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-2222-4a11-9c01-200000000001",  
"name": "Kho ReHome Quận 7",  
"address": "123 Nguyễn Văn Linh, Quận 7, TP.HCM",  
"latitude": 10.729,  
"longitude": 106.721,  
"openingHours": "08:00-20:00",  
"status": "ACTIVE"  
},  
"isSuccess": true,  
"statusCode": 201,  
"message": "Đã tạo kho"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                         |
| ----------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}                |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"}         |
| 422         | Thiếu hoặc sai định dạng field    | {"result":null,"isSuccess":false,"statusCode":422,"message":"Dữ liệu không hợp lệ: latitude/longitude bắt buộc"} |

### API 143 — PUT /warehouses/{id} (Nguyên)

**F-code:** F-154 · **Role:** Admin

**a. Overview**

Admin sửa thông tin kho (cùng các field như khi tạo).

**b. API Specification**

| Method | URL              |
| ------ | ---------------- |
| PUT    | /warehouses/{id} |

**Permission:** Admin

**c. Request sample**

{  
"name": "Kho ReHome Quận 7 (đã đổi tên)",  
"address": "123 Nguyễn Văn Linh, Quận 7, TP.HCM",  
"latitude": 10.729,  
"longitude": 106.721,  
"openingHours": "08:00-21:00"  
}

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-2222-4a11-9c01-200000000001",  
"name": "Kho ReHome Quận 7 (đã đổi tên)",  
"openingHours": "08:00-21:00"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                 |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |
| 404         | Không tìm thấy kho                | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy kho"}                        |

### API 144 — PATCH /warehouses/{id}/hide (Nguyên)

**F-code:** F-155 · **Role:** Admin

**a. Overview**

Admin ẩn một kho khỏi danh sách cho Member chọn ký gửi (ngừng hoạt động
kho); chỉ thực hiện được khi kho không còn tồn kho (sản phẩm/lô hàng
đang lưu tại kho).

**b. API Specification**

| Method | URL                   |
| ------ | --------------------- |
| PATCH  | /warehouses/{id}/hide |

**Permission:** Admin

**c. Request sample**

N/A — không có body.

**d. Response sample**

{  
"result": {  
"id": "8f1c2e40-2222-4a11-9c01-200000000001",  
"status": "HIDDEN"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "Đã ẩn kho"  
}

**e. Validation**

| Status code | Description                                      | Examples                                                                                                               |
| ----------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn                | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}                      |
| 403         | Không phải Admin                                 | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"}               |
| 404         | Không tìm thấy kho                               | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy kho"}                                      |
| 409         | Kho vẫn còn tồn kho, phải xử lý tồn trước khi ẩn | {"result":null,"isSuccess":false,"statusCode":409,"message":"WAREHOUSE_HAS_STOCK: kho vẫn còn hàng tồn, không thể ẩn"} |

### API 145 — GET /admin/config (Nguyên)

**F-code:** F-156 · **Role:** Admin

**a. Overview**

Admin xem toàn bộ bảng tham số hệ thống: kỳ ký gửi, hoa hồng theo kỳ,
giá sàn, phí rút, tham số ví, tham số đơn hàng/trả hàng, tham số vận
hành (theo mục 11 tài liệu tổng quan hệ thống).

**b. API Specification**

| Method | URL           |
| ------ | ------------- |
| GET    | /admin/config |

**Permission:** Admin

**c. Request sample**

N/A — không có body.

**d. Response sample**

{  
"result": \[  
{  
"key": "CONSIGNMENT_PERIOD_DAYS",  
"value": "30",  
"updatedBy": "admin01@rehome.vn",  
"updatedAt": "2026-09-01T10:00:00Z"  
},  
{  
"key": "COMMISSION_RATE_PERIOD_1",  
"value": "0.2",  
"updatedBy": "admin01@rehome.vn",  
"updatedAt": "2026-09-01T10:00:00Z"  
}  
\],  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                 |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |

### API 146 — PUT /admin/config/{key} (Nguyên)

**F-code:** F-157 · **Role:** Admin

**a. Overview**

Admin sửa một tham số hệ thống theo key. Thay đổi chỉ áp dụng cho giao
dịch phát sinh sau khi sửa — hợp đồng ký gửi cũ đã snapshot số liệu tại
thời điểm ký nên không bị ảnh hưởng ngược. Mỗi lần sửa tự ghi audit log
(F-161, xem API 149 và mục Ghi chú cuối Phase 7).

**b. API Specification**

| Method | URL                 |
| ------ | ------------------- |
| PUT    | /admin/config/{key} |

**Permission:** Admin

**c. Request sample**

{  
"value": "15"  
}

**d. Response sample**

{  
"result": {  
"key": "COMMISSION_RATE_PERIOD_1",  
"value": "15",  
"updatedBy": "admin01@rehome.vn",  
"updatedAt": "2026-10-13T09:30:00Z"  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                                 | Examples                                                                                                 |
| ----------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn           | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                            | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |
| 404         | key không tồn tại trong bảng tham số        | {"result":null,"isSuccess":false,"statusCode":404,"message":"Không tìm thấy tham số"}                    |
| 422         | value không hợp lệ với kiểu dữ liệu của key | {"result":null,"isSuccess":false,"statusCode":422,"message":"Giá trị không hợp lệ cho tham số này"}      |

### API 147 — GET /admin/dashboard (Nguyên)

**F-code:** F-158 · **Role:** Admin

**a. Overview**

Admin xem dashboard tổng quan vận hành: doanh thu, số đơn, số lượng tồn
kho, điểm đánh giá dịch vụ trung bình, số dư ví đang giữ, doanh thu nền
tảng, số dư quỹ nền tảng (3 chỉ số quỹ theo mục 7 tài liệu tổng quan),
và số việc quá hạn — đây cũng là cách Admin nhận biết việc quá hạn
(F-095), không có API thông báo riêng.

**b. API Specification**

| Method | URL              |
| ------ | ---------------- |
| GET    | /admin/dashboard |

**Permission:** Admin

**c. Request sample**

N/A — không có body.

**d. Response sample**

{  
"result": {  
"revenue": 1250000000,  
"ordersCount": 4210,  
"inventoryCount": 1830,  
"avgServiceRating": 4.6,  
"walletBalanceHeld": 320000000,  
"platformRevenue": 410000000,  
"fundBalance": 95000000,  
"overdueTaskCount": 7  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                 |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |

### API 148 — GET /admin/dashboard/export (Nguyên)

**F-code:** F-159 · **Role:** Admin

**a. Overview**

Admin xuất báo cáo dashboard theo khoảng thời gian ra file Excel để lưu
trữ/báo cáo ngoài hệ thống.

**b. API Specification**

| Method | URL                                           |
| ------ | --------------------------------------------- |
| GET    | /admin/dashboard/export?from={date}&to={date} |

**Permission:** Admin

**c. Request sample**

N/A — chỉ dùng query string, không có body.

**d. Response sample**

Trả về file nhị phân (.xlsx), không phải JSON — header Content-Type:
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet và
Content-Disposition: attachment;
filename="dashboard_report_2026-10.xlsx". Trường hợp lỗi vẫn trả JSON
theo khung chuẩn (xem mục e).

**e. Validation**

| Status code | Description                                                    | Examples                                                                                                 |
| ----------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 400         | Khoảng thời gian from/to không hợp lệ (from \> to, sai format) | {"result":null,"isSuccess":false,"statusCode":400,"message":"Khoảng thời gian không hợp lệ"}             |
| 401         | Chưa đăng nhập hoặc token hết hạn                              | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                                               | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |

### API 149 — GET /admin/audit-logs (Nguyên)

**F-code:** F-160 · **Role:** Admin

**a. Overview**

Admin tra cứu audit log — ai (actorAccountId) đã làm gì (actionType),
trên đối tượng nào (targetType/targetId), khi nào — phục vụ truy vết.
Mọi API nghiệp vụ ảnh hưởng dữ liệu nhạy cảm ở các phase trước tự ghi
log nền vào đây (F-161), không cần API riêng để ghi — chỉ có API này để
đọc lại.

**b. API Specification**

| Method | URL                                                                                               |
| ------ | ------------------------------------------------------------------------------------------------- |
| GET    | /admin/audit-logs?actorAccountId={id}&actionType={type}&targetType={type}&page={page}&size={size} |

**Permission:** Admin

**c. Request sample**

N/A — chỉ dùng query string, không có body.

**d. Response sample**

{  
"result": {  
"content": \[  
{  
"actorAccountId": "8f1c2e40-9999-4a11-9c01-900000000001",  
"actionType": "UPDATE_CONFIG",  
"targetType": "SystemConfig",  
"targetId": "COMMISSION_RATE_PERIOD_1",  
"detail": "value: 20 -\> 15",  
"createdAt": "2026-10-13T09:30:00Z"  
}  
\],  
"page": 0,  
"size": 20,  
"totalElements": 1024,  
"totalPages": 52  
},  
"isSuccess": true,  
"statusCode": 200,  
"message": "OK"  
}

**e. Validation**

| Status code | Description                       | Examples                                                                                                 |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 401         | Chưa đăng nhập hoặc token hết hạn | {"result":null,"isSuccess":false,"statusCode":401,"message":"Token không hợp lệ hoặc đã hết hạn"}        |
| 403         | Không phải Admin                  | {"result":null,"isSuccess":false,"statusCode":403,"message":"Bạn không có quyền truy cập chức năng này"} |

F-161 (ghi audit log) chạy nền tự động sau **mọi** API có ảnh hưởng dữ
liệu nhạy cảm ở các phase trước (duyệt, khoá, đổi cấu hình, giao dịch
tiền...) — không phải API riêng, chỉ đọc lại qua GET /admin/audit-logs.

## Mục lục tra cứu nhanh theo F-code

Toàn bộ 162 function, theo thứ tự tăng dần. "— nội bộ/System" nghĩa là
không có endpoint riêng, đã giải thích ở ghi chú của API liên quan trong
phase tương ứng.

| F-code    | API                                                               | API \#                                                                     | Phase |
| --------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ----- |
| F-001     | POST /auth/register/member                                        | API 1, API 2                                                               | 1     |
| F-002     | POST /auth/register/organization                                  | API 3                                                                      | 1     |
| F-003     | PUT /organizations/me/registration                                | API 4                                                                      | 1     |
| F-004     | POST /auth/login, POST /auth/login/google                         | API 5, API 6                                                               | 1     |
| F-005     | — nội bộ (FE tự điều hướng theo verificationStatus)               | — nội bộ (FE tự điều hướng theo verificationStatus trả về từ API 5/6)      | 1     |
| F-006     | POST /auth/logout                                                 | API 7                                                                      | 1     |
| F-007     | POST /auth/password/forgot, POST /auth/password/reset             | API 8, API 9                                                               | 1     |
| F-008     | POST /auth/password/change                                        | API 10                                                                     | 1     |
| F-009     | GET /members/me                                                   | API 11                                                                     | 1     |
| F-010     | PATCH /members/me                                                 | API 12                                                                     | 1     |
| F-011     | GET /members/me/qr                                                | API 13                                                                     | 1     |
| F-012     | GET /products, GET /products/{id}                                 | API 49, API 50                                                             | 3     |
| F-013     | GET /products (query tìm/lọc)                                     | API 49                                                                     | 3     |
| F-014     | POST /consignment-forms                                           | API 15                                                                     | 2     |
| F-015     | GET /warehouses/nearest                                           | API 14                                                                     | 2     |
| F-016     | — nội bộ (validate trong POST /consignment-forms)                 | — nội bộ                                                                   | 2     |
| F-017     | PUT /consignment-forms/{id}                                       | API 18                                                                     | 2     |
| F-018     | GET /consignment-forms, GET /consignment-forms/{id}               | API 16, API 17                                                             | 2     |
| F-019     | — System tự hết hạn                                               | — System tự hết hạn                                                        | 2     |
| F-020     | GET /consignment-receipts/{id}                                    | API 19                                                                     | 2     |
| F-021     | POST /consignment-receipts/{id}/confirm                           | API 20                                                                     | 2     |
| F-022     | — nội bộ (tự sinh PDF khi confirm)                                | API 20                                                                     | 2     |
| F-023     | GET /consignment-receipts/{id} (dùng chung)                       | API 19                                                                     | 2     |
| F-024     | GET /products/mine, GET /products/{id}                            | API 21, API 22                                                             | 2     |
| F-025     | POST /products/{id}/price-reduction                               | API 23                                                                     | 2     |
| F-026     | — nội bộ (validate trong price-reduction)                         | — nội bộ                                                                   | 2     |
| F-027     | — System tự gia hạn kỳ                                            | — System tự gia hạn kỳ                                                     | 2     |
| F-028     | — System tự kết thúc kỳ                                           | — System tự kết thúc kỳ                                                    | 2     |
| F-029     | POST /end-of-term-decisions/{id}/decide                           | API 24                                                                     | 2     |
| F-030     | GET/POST /consignment-receipts/{id} (dùng chung)                  | dùng chung API 19 (GET) / API 20 (POST confirm)                            | 2     |
| F-031     | — System tự đánh dấu vô thừa nhận                                 | — System tự đánh dấu vô thừa nhận                                          | 2     |
| F-032     | POST /item-withdrawal-requests                                    | API 90                                                                     | 5     |
| F-033     | POST /item-withdrawal-requests/{id}/pay-fee                       | API 91                                                                     | 5     |
| F-034     | POST /counter/handover (context ITEM_WITHDRAWAL)                  | — không có endpoint riêng; xử lý trong API 72 (POST /counter/handover)     | 4/5   |
| F-035     | — System tự hết hạn                                               | — System tự huỷ khi quá hạn, không có API riêng                            | 5     |
| F-036     | POST /degraded-item-cases/{id}/decide                             | API 95                                                                     | 5     |
| F-037     | GET /wallet                                                       | API 73                                                                     | 4     |
| F-038     | GET /wallet/transactions                                          | API 74                                                                     | 4     |
| F-039     | — nội bộ (bút toán kép, kèm hành động khác)                       | — nội bộ (bút toán kép, kèm hành động khác)                                | 4     |
| F-040     | GET /wallet/revenue                                               | API 75                                                                     | 4     |
| F-041     | — nội bộ (hoàn tiền, kèm hành động khác)                          | — nội bộ (hoàn tiền, kèm hành động khác)                                   | 4/5   |
| F-042     | POST /wallet/payout-requests                                      | API 76                                                                     | 4     |
| F-043     | — nội bộ (validate trong tạo yêu cầu rút)                         | — nội bộ                                                                   | 4     |
| F-044     | GET /wallet/payout-requests/{id}                                  | API 77, API 78                                                             | 4     |
| F-045     | POST /cart/items                                                  | API 51                                                                     | 3     |
| F-046     | GET /cart                                                         | API 52                                                                     | 3     |
| F-047     | DELETE /cart/items/{id}                                           | API 53                                                                     | 3     |
| F-048     | GET /addresses                                                    | API 54                                                                     | 3     |
| F-049     | POST /addresses                                                   | API 55                                                                     | 3     |
| F-050     | PUT /addresses/{id}                                               | API 56                                                                     | 3     |
| F-051     | DELETE /addresses/{id}                                            | API 57                                                                     | 3     |
| F-052     | POST /orders                                                      | API 59                                                                     | 3     |
| F-053     | — nội bộ (trả mảng đơn trong POST /orders)                        | API 59                                                                     | 3     |
| F-054     | GET /cart/checkout-preview                                        | API 58                                                                     | 3     |
| F-055     | — nội bộ (giự hàng khi tạo đơn)                                   | API 59                                                                     | 3     |
| F-056     | POST /orders/{id}/payment/momo                                    | API 60                                                                     | 3     |
| F-057     | POST /webhooks/momo                                               | API 61                                                                     | 3     |
| F-058     | — System tự huỷ đơn quá hạn thanh toán                            | — System tự huỷ đơn quá hạn thanh toán                                     | 3     |
| F-059     | GET /orders, GET /orders/{id}                                     | API 62, API 63                                                             | 4     |
| F-060     | GET /orders/{id}/tracking                                         | API 64                                                                     | 4     |
| F-061     | POST /orders/{id}/cancel                                          | API 65                                                                     | 4     |
| F-062     | — System tự huỷ khi GHN lỗi                                       | — System tự huỷ khi GHN lỗi                                                | 4     |
| F-063     | POST /orders/{id}/confirm-receipt                                 | API 66                                                                     | 4     |
| F-064     | — System tự hoàn thành đơn                                        | — System tự hoàn thành đơn                                                 | 4     |
| F-065     | — nội bộ (tính tiền + cộng ví, kèm hoàn tất đơn)                  | — nội bộ (tính tiền + cộng ví, kèm hoàn tất đơn)                           | 4     |
| F-066     | POST /orders/{id}/rating                                          | API 67                                                                     | 4     |
| F-067     | POST /orders/{id}/return-requests                                 | API 79, API 80                                                             | 5     |
| F-068     | POST /return-requests/{id}/handover                               | API 81                                                                     | 5     |
| F-069     | — System tự huỷ                                                   | — System tự huỷ                                                            | 5     |
| F-070     | POST /return-requests/{id}/invalid-choice                         | API 82                                                                     | 5     |
| F-071     | — System tự hết hạn                                               | — System tự hết hạn                                                        | 5     |
| F-072–074 | POST /tryon/images                                                | API 97                                                                     | 6     |
| F-075     | GET /tryon/suggestions                                            | API 96                                                                     | 6     |
| F-076     | GET /products (Member tự chọn món)                                | dùng chung API 49 (GET /products)                                          | 6     |
| F-077     | — nội bộ (validate đủ áo+quần trong POST /tryon/images)           | API 97                                                                     | 6     |
| F-078     | POST /tryon/images                                                | API 97                                                                     | 6     |
| F-079     | — nội bộ (tự lưu khi sinh ảnh thành công)                         | API 97                                                                     | 6     |
| F-080     | GET /tryon/images                                                 | API 98                                                                     | 6     |
| F-081     | DELETE /tryon/images/{id}                                         | API 99                                                                     | 6     |
| F-082     | GET /organizations/{id}                                           | API 100                                                                    | 6     |
| F-083     | GET /campaigns/{id}                                               | API 102                                                                    | 6     |
| F-084     | GET /organizations/nearby                                         | API 101                                                                    | 6     |
| F-085     | POST/DELETE /organizations/{id}/follow                            | API 103                                                                    | 6     |
| F-086     | GET /posts, GET /posts/{id}                                       | API 104, API 105                                                           | 6     |
| F-087     | POST /posts/{id}/like, GET/POST /posts/{id}/comments              | API 106, API 107, API 108                                                  | 6     |
| F-088     | POST /violation-reports                                           | API 109                                                                    | 6     |
| F-089     | GET/POST /conversations, GET/POST /conversations/{id}/messages    | API 110, API 111, API 112, API 113                                         | 6     |
| F-090     | như F-089 (context MEMBER_WAREHOUSE)                              | API 110, API 111, API 112, API 113                                         | 6     |
| F-091     | GET /conversations, POST /conversations/{id}/messages (Moderator) | API 110, API 113                                                           | 6     |
| F-092     | GET /notifications (Member)                                       | API 114                                                                    | 6     |
| F-093     | GET /notifications (Organization)                                 | API 114                                                                    | 6     |
| F-094     | GET /notifications (Moderator)                                    | API 114                                                                    | 6     |
| F-095     | — thể hiện trong GET /admin/dashboard                             | thể hiện trong API 147 (GET /admin/dashboard)                              | 7     |
| F-096     | PATCH /organizations/me                                           | API 117                                                                    | 6     |
| F-097     | POST /organizations/me/legal-change-requests                      | API 118                                                                    | 6     |
| F-098     | POST /campaigns                                                   | API 119                                                                    | 6     |
| F-099     | — nội bộ (validate trong POST /campaigns)                         | API 119                                                                    | 6     |
| F-100     | PUT /campaigns/{id}                                               | API 120                                                                    | 6     |
| F-101     | POST /campaigns/{id}/close                                        | API 121                                                                    | 6     |
| F-102     | — System tự đóng chiến dịch                                       | — System tự đóng chiến dịch                                                | 6     |
| F-103     | GET /organizations/me/campaigns                                   | API 122                                                                    | 6     |
| F-104     | POST /posts                                                       | API 123                                                                    | 6     |
| F-105     | PUT /posts/{id}                                                   | API 124                                                                    | 6     |
| F-106     | DELETE /posts/{id}                                                | API 125                                                                    | 6     |
| F-107     | GET /organizations/me/posts                                       | API 126                                                                    | 6     |
| F-108     | POST /counter/lookup                                              | API 25                                                                     | 2     |
| F-109     | GET /counter/members/{accountId}/tasks                            | API 27                                                                     | 2     |
| F-110     | — nội bộ (trong response của /counter/lookup)                     | API 25                                                                     | 2     |
| F-111     | GET /queues?type=                                                 | API 28, API 68, API 127                                                    | 2     |
| F-112     | POST /queues/{id}/claim                                           | API 29                                                                     | 2     |
| F-113     | — System tự nhả việc sau 48h                                      | — System tự nhả việc sau 48h                                               | 2     |
| F-114     | POST /consignment-forms/{id}/approve, /reject                     | API 31, API 32                                                             | 2     |
| F-115     | POST /consignment-forms/{id}/inspection/start                     | API 33                                                                     | 2     |
| F-116     | POST /counter/members/{accountId}/confirm-identity                | API 26                                                                     | 2     |
| F-117     | POST /consignment-forms/{id}/inspection/complete                  | API 34                                                                     | 2     |
| F-118     | POST /consignment-forms/{id}/return-onsite                        | API 35                                                                     | 2     |
| F-119     | POST /products                                                    | API 37                                                                     | 2     |
| F-120     | POST /products/{id}/photos                                        | API 38 (POST /products/{id}/photos)                                        | 2     |
| F-121     | POST /brands (dùng chung)                                         | API 46                                                                     | 2     |
| F-122     | GET /products/{id}/sku-label                                      | API 39                                                                     | 2     |
| F-123     | GET /inventory                                                    | API 40                                                                     | 2     |
| F-124     | GET /products/{sku}                                               | API 41                                                                     | 2     |
| F-125     | PATCH /products/{id}/shelf-location                               | API 42                                                                     | 2     |
| F-126     | GET /products/{id}/stock-movements                                | API 43                                                                     | 2     |
| F-127     | POST /orders/{id}/pack/scan, POST /orders/{id}/shipment           | API 69, API 70                                                             | 4     |
| F-128     | POST /webhooks/ghn                                                | API 71                                                                     | 4     |
| F-129     | POST /counter/handover                                            | API 72                                                                     | 4     |
| F-130     | POST /products/{id}/unclaimed/confirm-transfer                    | API 36                                                                     | 2     |
| F-131     | POST /return-requests/{id}/approve, /reject                       | API 83, API 84                                                             | 5     |
| F-132     | POST /return-requests/{id}/inspect                                | API 85                                                                     | 5     |
| F-133     | POST /return-requests/{id}/resolve                                | API 88                                                                     | 5     |
| F-134     | POST /return-requests/{id}/flag-counterfeit                       | API 86                                                                     | 5     |
| F-135     | POST /return-requests/{id}/counterfeit-conclusion                 | API 87                                                                     | 5     |
| F-136     | POST /return-requests/{id}/mark-lost                              | API 89                                                                     | 5     |
| F-137     | GET /organizations/{id}/verification                              | API 128                                                                    | 6     |
| F-138     | POST /organizations/{id}/verify, /reject                          | API 129, API 130                                                           | 6     |
| F-139     | — nội bộ + System tự xoá ảnh                                      | — nội bộ + System tự xoá ảnh (xem ghi chú cuối Phase 6 — Xác minh tổ chức) | 6     |
| F-140     | POST /organizations/legal-change-requests/{id}/approve, /reject   | API 131                                                                    | 6     |
| F-141     | POST /violation-reports/{id}/resolve, /dismiss                    | API 132, API 133, API 134                                                  | 6     |
| F-142     | GET /categories, GET /brands                                      | API 44                                                                     | 2     |
| F-143     | POST /categories, POST /brands                                    | API 45, API 46                                                             | 2     |
| F-144     | PUT /categories/{id}, PUT /brands/{id}                            | API 47                                                                     | 2     |
| F-145     | PATCH /categories/{id}/hide, PATCH /brands/{id}/hide              | API 48                                                                     | 2     |
| F-146     | GET /admin/accounts                                               | API 135                                                                    | 7     |
| F-147     | POST /admin/accounts/{id}/ban                                     | API 136                                                                    | 7     |
| F-148     | POST /admin/accounts/{id}/unban                                   | API 137                                                                    | 7     |
| F-149     | POST /admin/moderators                                            | API 138                                                                    | 7     |
| F-150     | PUT /admin/moderators/{id}                                        | API 139                                                                    | 7     |
| F-151     | PATCH /admin/moderators/{id}/warehouse                            | API 140                                                                    | 7     |
| F-152     | GET /warehouses                                                   | API 141                                                                    | 7     |
| F-153     | POST /warehouses                                                  | API 142                                                                    | 7     |
| F-154     | PUT /warehouses/{id}                                              | API 143                                                                    | 7     |
| F-155     | PATCH /warehouses/{id}/hide                                       | API 144                                                                    | 7     |
| F-156     | GET /admin/config                                                 | API 145                                                                    | 7     |
| F-157     | PUT /admin/config/{key}                                           | API 146                                                                    | 7     |
| F-158     | GET /admin/dashboard                                              | API 147                                                                    | 7     |
| F-159     | GET /admin/dashboard/export                                       | API 148                                                                    | 7     |
| F-160     | GET /admin/audit-logs                                             | API 149                                                                    | 7     |
| F-161     | — nội bộ, tự ghi sau mọi hành động liên quan                      | — nội bộ, System tự ghi; xem API 149 để đọc lại log                        | 7     |
| F-162     | — nội bộ (kèm POST /degraded-item-cases/{id}/decide)              | — nội bộ (kèm API 95 — POST /degraded-item-cases/{id}/decide)              | 5     |

**Việc còn để ngỏ, cần hai backend + 2 FE chốt thêm trước khi code Phase
1:** tên field chính xác có thể lệch đôi chút so với convention thật của
team (tài liệu này suy ra trực tiếp từ thiết kế DB và tài liệu tổng
quan, chưa qua review); mã lỗi (error.code) ở đây là đề xuất, nên thống
nhất một bảng mã lỗi dùng chung thay vì mỗi API tự đặt tên; chưa có
endpoint xác thực refresh token (POST /auth/refresh) — nên bổ sung nếu
dùng access token ngắn hạn.

**Upload ảnh/tệp:** mọi API nghiệp vụ (ký gửi, đăng ký tổ chức, trả
hàng, bài viết...) chỉ nhận **URL** ảnh đã upload sẵn, không nhận file
trực tiếp trong body JSON. Upload trước qua POST /uploads
(multipart/form-data, field file) → 201 { "url": "https://..." }, rồi
gắn url đó vào API nghiệp vụ tương ứng.
