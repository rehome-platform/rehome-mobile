export const colors = {
  primary: "#006B2C",
  secondary: "#FEA619",
  accent: "#00685F",
  neutral: "#DDE5D9",
  background: "#F6F9F4",
  surface: "#FFFFFF",
  text: "#1F2A37",
  textSecondary: "#5B6776",
  onPrimary: "#FFFFFF",
  error: "#D92D20",
  success: "#006B2C",
  disabled: "#C4CBC1", // [GIẢ ĐỊNH] chưa có trong design-tokens.md
  highlight: "#EAF4EC", // nền khung nhấn mạnh (thay viền đen 2px)
  overlay: "rgba(0,0,0,0.55)", // nhãn đè lên ảnh (1/5, AI…)
};

// Nhãn trạng thái (StatusChip): nền nhạt + chữ đậm cùng tông. [GIẢ ĐỊNH] chưa có trong design-tokens.md
// success: xong / đang bán / đã hoàn tiền · info: ReHome đang xử lý, đang giao
// warning: CẦN BẠN LÀM (trả tiền, mang đồ tới, chọn cuối kỳ…) · danger: từ chối / lỗi · neutral: huỷ / kết thúc
export const tones = {
  success: { bg: "#E3F1E7", fg: "#006B2C" },
  info: { bg: "#DFF0EE", fg: "#00685F" },
  warning: { bg: "#FFF1D6", fg: "#8A5300" },
  danger: { bg: "#FDE7E5", fg: "#B42318" },
  neutral: { bg: "#ECEFEA", fg: "#5B6776" },
};
