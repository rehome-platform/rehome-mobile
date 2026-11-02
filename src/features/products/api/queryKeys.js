// Khoá cache sàn mua. invalidate ["products"] → làm mới mọi danh sách + chi tiết (vd sau khi đặt hàng)
export const shopKeys = {
  products: (filters) => ["products", "list", filters],
  product: (id) => ["products", "detail", id],
  shippingFee: (productId, wardName, provinceName) => [
    "products",
    "shippingFee",
    productId,
    wardName,
    provinceName,
  ],
  similar: (categoryId, excludeId) => [
    "products",
    "similar",
    categoryId,
    excludeId,
  ],
};
