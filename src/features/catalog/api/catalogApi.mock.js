// Mock API 44 — GET /categories, GET /brands (chỉ trả mục đang hoạt động) [CHỜ BE]
const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const CATEGORIES = [
  { id: "cat-ao", name: "Áo" },
  { id: "cat-ao-khoac", name: "Áo khoác" },
  { id: "cat-quan", name: "Quần" },
  { id: "cat-vay", name: "Váy đầm" },
  { id: "cat-giay", name: "Giày dép" },
  { id: "cat-tui", name: "Túi xách" },
  { id: "cat-phu-kien", name: "Phụ kiện" },
];

const BRANDS = [
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
