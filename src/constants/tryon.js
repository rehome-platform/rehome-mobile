// Slot thử đồ của danh mục (enum TryOnSlot của BE — khớp code a0c6abe: Category.tryonSlot)
export const TRYON_SLOT = { TOP: "TOP", BOTTOM: "BOTTOM", DRESS: "DRESS" };
export const TRYON_SLOT_LABEL = { TOP: "Áo", BOTTOM: "Quần", DRESS: "Đầm" };

// Người mẫu (enum TryOnModelType của BE). Thứ tự hiển thị: Nữ trước [GIẢ ĐỊNH]
export const MODEL_TYPE = { FEMALE: "FEMALE", MALE: "MALE" };
export const MODEL_TYPE_LABEL = { FEMALE: "Nữ", MALE: "Nam" };

// Đề tài: ảnh trả về < 120 giây → app chờ tối đa 150 giây cho riêng request tạo ảnh.
// Thời gian tạo ảnh KHÔNG cố định (tuỳ máy chủ AI đông / vắng) → thanh % ước lượng theo thời gian THẬT của các lần
// tạo gần đây trên máy này (tryonJobStore.recentDurations). DEFAULT_EXPECTED_MS chỉ dùng cho lần đầu, chưa có số đo
export const TRYON_LIMITS = {
  REQUEST_TIMEOUT_MS: 150000,
  DEFAULT_EXPECTED_MS: 60000,
  RECENT_SAMPLES: 5, // lấy trung bình 5 lần thành công gần nhất
};

// Trạng thái việc tạo ảnh trong app (tryonJobStore) — không phải của BE
export const TRYON_JOB_STATUS = {
  RUNNING: "RUNNING",
  DONE: "DONE",
  ERROR: "ERROR",
};
