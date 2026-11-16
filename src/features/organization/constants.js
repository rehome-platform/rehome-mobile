// Loại hình + phạm vi hoạt động: lấy từ BE (GET /api/organizations/options → useOrgOptions), không viết cứng —
// BE đổi bộ mã thì app tự theo. Gợi ý giấy tờ ở bước 3 theo đúng checklist web Moderator dùng để duyệt
// (BE OrganizationVerificationResponse.documentItemsFor, 25d8c85 → 65d8475). Chỉ là gợi ý, không khoá nút.
export const DOC_SUGGESTIONS = {
  CHARITY_FUND: ["Giấy phép thành lập và công nhận điều lệ quỹ"],
  NGO: ["Quyết định cho phép thành lập hội kèm điều lệ được phê duyệt"],
  SCHOOL_CLUB: [
    "Giấy tờ pháp nhân của tổ chức chủ quản",
    "Quyết định thành lập câu lạc bộ",
    "Văn bản cử người phụ trách",
  ],
  VOLUNTEER_GROUP: [
    "Giấy tờ pháp nhân đứng tên chịu trách nhiệm",
    "Giấy tờ thành lập do cơ quan có thẩm quyền cấp",
  ],
  SOCIAL_PROTECTION_CENTER: [
    "Giấy chứng nhận đăng ký thành lập",
    "Giấy phép hoạt động",
  ],
};
// Loại hình khác (RELIGIOUS, OTHER, mã mới BE thêm sau)
export const DEFAULT_DOC_SUGGESTIONS = [
  "Giấy tờ thành lập do cơ quan có thẩm quyền cấp",
];

// Tên 4 bước — dùng cho Stepper
export const ORG_REGISTER_STEPS = ["Tổ chức", "Đại diện", "Giấy tờ", "Nhận đồ"];

// OA-03: ràng buộc tệp. Tối đa 10 tệp = 2 ảnh CCCD + 8 giấy tờ pháp lý; tối thiểu 3 (2 CCCD + 1 giấy tờ)
export const FILE_RULES = {
  maxSizeMB: 5,
  maxLegalDocs: 8,
  mimeTypes: ["image/jpeg", "image/png", "application/pdf"],
};

// OA-04: ngày nhận đồ. value gửi BE [GIẢ ĐỊNH] — BE lưu receivingHours dạng chuỗi
export const WEEKDAYS = [
  { value: "MON", label: "T2" },
  { value: "TUE", label: "T3" },
  { value: "WED", label: "T4" },
  { value: "THU", label: "T5" },
  { value: "FRI", label: "T6" },
  { value: "SAT", label: "T7" },
  { value: "SUN", label: "CN" },
];
