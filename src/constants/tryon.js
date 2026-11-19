// Slot thử đồ của danh mục (enum TryOnSlot của BE — khớp code a0c6abe: Category.tryonSlot)
export const TRYON_SLOT = { TOP: "TOP", BOTTOM: "BOTTOM", DRESS: "DRESS" };
export const TRYON_SLOT_LABEL = { TOP: "Áo", BOTTOM: "Quần", DRESS: "Đầm" };

// Người mẫu (enum TryOnModelType của BE). Thứ tự hiển thị: Nữ trước [GIẢ ĐỊNH]
export const MODEL_TYPE = { FEMALE: "FEMALE", MALE: "MALE" };
export const MODEL_TYPE_LABEL = { FEMALE: "Nữ", MALE: "Nam" };

// App chờ tối đa 300 giây (5 phút) cho riêng request tạo ảnh (17/11: máy chủ AI có lúc chậm hơn 150 giây — BE vẫn
// tạo xong nhưng app đã báo lỗi). Quá mốc này app báo "chờ quá lâu", ảnh vẫn có thể xuất hiện trong Bộ sưu tập sau.
// Thời gian tạo ảnh KHÔNG cố định (tuỳ máy chủ AI đông / vắng) → thanh % ước lượng theo thời gian THẬT của các lần
// tạo gần đây trên máy này (tryonJobStore.recentDurations). DEFAULT_EXPECTED_MS chỉ dùng cho lần đầu, chưa có số đo
export const TRYON_LIMITS = {
  // BE chờ AI tối đa 300 giây (tryon.ai.read-timeout-seconds) RỒI còn tải ảnh lên kho + lưu → app phải chờ LÂU HƠN BE.
  // Trước để bằng 300 giây: AI chậm thì app hết giờ trước, báo lỗi trong khi máy chủ vẫn tạo xong ảnh
  REQUEST_TIMEOUT_MS: 360000,
  // Mất kết nối / hết giờ chờ / BE báo đang tạo (409): máy chủ có thể vẫn tạo xong → hỏi bộ sưu tập mỗi 5 giây.
  // Hỏi tới mốc (lúc bấm + REQUEST_TIMEOUT_MS) — lượt đang chạy chưa thể quá mốc này; rớt sát/sau mốc thì vẫn hỏi thêm 2 phút
  RECOVER_POLL_MS: 5000,
  RECOVER_MAX_MS: 120000,
  // Lệch giờ điện thoại ↔ máy chủ: ảnh tạo sau (lúc bấm − 60 giây) vẫn coi là của lượt này
  RECOVER_CLOCK_SKEW_MS: 60000,
  DEFAULT_EXPECTED_MS: 60000,
  RECENT_SAMPLES: 5, // lấy trung bình 5 lần thành công gần nhất
};

// Trạng thái việc tạo ảnh trong app (tryonJobStore) — không phải của BE
export const TRYON_JOB_STATUS = {
  RUNNING: "RUNNING",
  // Người dùng bấm Huỷ: app bỏ kết quả nhưng máy chủ vẫn đang tạo (không dừng được model) →
  // VẪN KHOÁ tạo ảnh mới tới khi lượt này xong / lỗi, tránh 2 lượt chạy song song (tốn 2 lượt)
  CANCELLING: "CANCELLING",
  DONE: "DONE",
  ERROR: "ERROR",
};

// Đang có lượt chiếm máy chủ (đang tạo hoặc đang dừng) → khoá mọi nút tạo ảnh
export const isTryonBusy = (job) =>
  job?.status === TRYON_JOB_STATUS.RUNNING ||
  job?.status === TRYON_JOB_STATUS.CANCELLING;
