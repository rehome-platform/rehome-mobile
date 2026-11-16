// invalidate ["tryon"] → làm mới tất cả
export const tryonKeys = {
  quota: ["tryon", "quota"],
  images: ["tryon", "images"],
  image: (id) => ["tryon", "image", id],
  suggestions: (slot, excludeId) => ["tryon", "suggest", slot, excludeId],
  slotProducts: (slot, excludeId) => ["tryon", "slot", slot, excludeId],
  outfitSuggestions: (productId) => ["tryon", "outfit", productId],
};
