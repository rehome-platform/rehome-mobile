// Mã gửi lên BE: [GIẢ ĐỊNH] — BE chưa có danh sách mã cho orgType / operationScope [CHỜ BE]
// Gợi ý giấy tờ: [GIẢ ĐỊNH] dựa trên wireframe OA-03 — đối chiếu mục 9 Tài liệu tổng quan. Chỉ là gợi ý, không khoá nút.
export const ORG_TYPES = [
  {
    value: "SOCIAL_FUND",
    label: "Quỹ xã hội, quỹ từ thiện",
    suggestedDocs: [
      "Giấy phép thành lập và công nhận điều lệ quỹ",
      "Điều lệ quỹ đã được công nhận",
    ],
  },
  {
    value: "ASSOCIATION",
    label: "Hội, hiệp hội, câu lạc bộ có pháp nhân",
    suggestedDocs: [
      "Quyết định cho phép thành lập hội",
      "Quyết định phê duyệt điều lệ hội",
    ],
  },
  {
    value: "AFFILIATED_CLUB",
    label: "Câu lạc bộ trực thuộc một pháp nhân",
    suggestedDocs: [
      "Quyết định thành lập của đơn vị chủ quản",
      "Văn bản xác nhận của đơn vị chủ quản",
    ],
  },
  {
    value: "SOCIAL_SUPPORT_FACILITY",
    label: "Cơ sở trợ giúp xã hội ngoài công lập",
    suggestedDocs: [
      "Giấy chứng nhận đăng ký thành lập cơ sở trợ giúp xã hội",
      "Giấy phép hoạt động",
    ],
  },
  {
    value: "SOCIAL_ENTERPRISE",
    label: "Doanh nghiệp xã hội",
    suggestedDocs: [
      "Giấy chứng nhận đăng ký doanh nghiệp",
      "Thông báo cam kết thực hiện mục tiêu xã hội, môi trường",
    ],
  },
];

export const OPERATION_SCOPES = [
  { value: "NATIONAL", label: "Toàn quốc" },
  { value: "PROVINCE", label: "Tỉnh / thành" },
  { value: "DISTRICT", label: "Quận / huyện" },
  { value: "WARD", label: "Phường / xã" },
];

// Tên 4 bước — dùng cho Stepper
export const ORG_REGISTER_STEPS = ["Tổ chức", "Đại diện", "Giấy tờ", "Nhận đồ"];
