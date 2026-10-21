import { PRODUCT_STATUS } from "@/constants/consignment";
import { TRYON_SLOT as S } from "@/constants/tryon";

// MỌI quy tắc thử đồ đặt ở đây. Màn hình chỉ gọi hàm.

// Slot lấy từ danh mục — [CHỜ BE PHASE6_GUIDE câu 5] API 50 trả kèm tryonSlot
export const slotOf = (p) => p?.tryonSlot ?? null;

// BR-04: chỉ món có slot + đang bán mới thử được
export const canTryOn = (p) =>
  !!slotOf(p) && p.status === PRODUCT_STATUS.ON_SALE;

export const otherSlot = (slot) =>
  slot === S.TOP ? S.BOTTOM : slot === S.BOTTOM ? S.TOP : null;

// Tên ô trong bộ đồ: { top, bottom, dress }
const KEY = { TOP: "top", BOTTOM: "bottom", DRESS: "dress" };
export const slotKey = (slot) => KEY[slot];

// Đủ bộ: Áo + Quần, hoặc Đầm (F-077)
export const isOutfitComplete = ({ top, bottom, dress }) =>
  !!dress || (!!top && !!bottom);

// Các món của bộ đồ theo thứ tự hiển thị
export const outfitItems = ({ top, bottom, dress }) =>
  [dress, top, bottom].filter(Boolean);

// "Áo khoác dạ nữ + Quần jeans ống rộng"
export const outfitTitle = (items) => items.map((i) => i.name).join(" + ");

// Body API 97
export const buildTryonPayload = ({ modelType, top, bottom, dress }) =>
  dress
    ? { modelType, dressProductId: dress.id }
    : { modelType, topProductId: top.id, bottomProductId: bottom.id };
// ---------- Bộ sưu tập (AI-05/06) ----------
// Số món trong ảnh đã không còn bán (nhãn "1 MÓN ĐÃ BÁN")
export const soldCount = (img) =>
  (img.items ?? []).filter((i) => i.status !== PRODUCT_STATUS.ON_SALE).length;

// Nhãn MỚI: ảnh tạo trong 24 giờ [GIẢ ĐỊNH]
export const isNewImage = (img) =>
  Date.now() - new Date(img.createdAt).getTime() < 24 * 3600 * 1000;

// "Áo khoác dạ + Quần jeans" — lấy 2 chữ đầu tên mỗi món cho gọn
export const shortTitle = (items = []) =>
  items.map((i) => i.name.split(" ").slice(0, 2).join(" ")).join(" + ");
