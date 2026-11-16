// Mock API 44 — GET /categories, GET /brands (chỉ trả mục đang hoạt động) [CHỜ BE]
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// tryonSlot theo Category.tryonSlot của BE (a0c6abe); null = không thử đồ được [CHỜ BE] slot từng danh mục
export const CATEGORIES = [
  { id: "cat-ao", name: "Áo", tryonSlot: "TOP" },
  { id: "cat-ao-khoac", name: "Áo khoác", tryonSlot: "TOP" },
  { id: "cat-quan", name: "Quần", tryonSlot: "BOTTOM" },
  { id: "cat-vay", name: "Váy đầm", tryonSlot: "DRESS" },
  { id: "cat-giay", name: "Giày dép", tryonSlot: null },
  { id: "cat-tui", name: "Túi xách", tryonSlot: null },
  { id: "cat-phu-kien", name: "Phụ kiện", tryonSlot: null },
];

export const BRANDS = [
  { id: "br-uniqlo", name: "Uniqlo" },
  { id: "br-zara", name: "Zara" },
  { id: "br-hm", name: "H&M" },
  { id: "br-levis", name: "Levi's" },
  { id: "br-nike", name: "Nike" },
  { id: "br-adidas", name: "Adidas" },
  { id: "br-converse", name: "Converse" },
  { id: "br-gucci", name: "Gucci" },
  { id: "br-local", name: "Thương hiệu Việt (local brand)" },
  { id: "br-none", name: "Không rõ thương hiệu" },
];

export async function getCategories() {
  await delay();
  return CATEGORIES.map((c) => ({ ...c, status: "ACTIVE" }));
}

export async function getBrands() {
  await delay();
  return BRANDS.map((b) => ({ ...b, status: "ACTIVE" }));
}
