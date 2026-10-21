// invalidate ["tryon"] → làm mới tất cả
export const tryonKeys = {
  images: ["tryon", "images"],
  image: (id) => ["tryon", "image", id],
  suggestions: (slot, excludeId) => ["tryon", "suggest", slot, excludeId],
  slotProducts: (slot, excludeId) => ["tryon", "slot", slot, excludeId],
};
