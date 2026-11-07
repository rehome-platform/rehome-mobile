// Thư mục upload — enum UploadFolder của BE (7572732). Client chỉ gửi TÊN, BE tự đặt đường dẫn
// Tối đa 10MB/tệp; jpg/png/webp; PDF chỉ nhận ở ORGANIZATION_DOCUMENTS
export const UPLOAD_FOLDER = {
  PRODUCTS: "PRODUCTS",
  CONSIGNMENT_FORMS: "CONSIGNMENT_FORMS",
  RETURN_REQUESTS: "RETURN_REQUESTS",
  COMMUNITY_POSTS: "COMMUNITY_POSTS",
  TRY_ON: "TRY_ON",
  AVATARS: "AVATARS",
  ORGANIZATION_DOCUMENTS: "ORGANIZATION_DOCUMENTS",
  ORGANIZATION_LOGOS: "ORGANIZATION_LOGOS",
  CAMPAIGN_COVERS: "CAMPAIGN_COVERS",
  // Ảnh đính kèm tin nhắn (3.13.2). BE chỉ nhận imageUrls là ảnh đã upload lên Cloudinary của hệ thống
  CHAT_IMAGES: "CHAT_IMAGES",
  // [CHỜ BE] ảnh kèm đánh giá đơn (BR-14) — BE chưa có thư mục này, chỉ dùng khi RATING_LIMITS.IMAGES_READY = true
  ORDER_RATINGS: "ORDER_RATINGS",
};
