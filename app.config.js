// Cấu hình chính nằm ở app.json; file này chỉ thêm phần phụ thuộc file có hay không.
// google-services.json (Firebase của BE) cần để nhận thông báo đẩy. File này KHÔNG đưa lên git (.gitignore):
// - Build trên EAS: lấy từ biến môi trường dạng file GOOGLE_SERVICES_JSON (eas env:create … --type file)
// - Build / chạy trên máy: lấy file ./google-services.json nếu có
// Không có cả hai → build vẫn chạy, app chỉ không nhận push (WebSocket vẫn chạy khi app mở).
const fs = require("fs");
const path = require("path");

const LOCAL_FILE = "./google-services.json";
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ??
  (fs.existsSync(path.join(__dirname, LOCAL_FILE)) ? LOCAL_FILE : undefined);

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
});
