// Mock API 49 (GET /products) + API 50 (GET /products/{id}, BE chưa có).
// Lọc + phân trang trong RAM giống BE để thử cuộn vô hạn và bộ lọc. Reload app → về dữ liệu mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { BRANDS, CATEGORIES } from "@/features/catalog/api/catalogApi.mock";
import { WAREHOUSES } from "@/features/consignment/api/mockData";

const delay = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const photo = (seed) => `https://picsum.photos/seed/${seed}/600/800`; // ảnh minh hoạ công khai, tỉ lệ 3:4

// [tên, danh mục, thương hiệu, size, tình trạng (chữ tự do như conditionNote của BE), giá chốt, giá đang bán]
const SAMPLES = [
  [
    "Áo khoác dạ nữ",
    "cat-ao-khoac",
    "br-uniqlo",
    "M",
    "Như mới, không lỗi",
    1000000,
    1000000,
  ],
  [
    "Quần jeans ống rộng",
    "cat-quan",
    "br-levis",
    "29",
    "Tốt, bạc màu nhẹ",
    450000,
    420000,
  ],
  ["Váy hoa nhí", "cat-vay", "br-zara", "S", "Như mới", 680000, 680000],
  ["Áo len cổ lọ", "cat-ao", "br-uniqlo", "L", "Tốt", 550000, 550000],
  ["Áo khoác bomber", "cat-ao-khoac", "br-hm", "M", "Tốt", 850000, 780000],
  [
    "Áo khoác jean",
    "cat-ao-khoac",
    "br-levis",
    "M",
    "Tốt, sờn nhẹ cổ tay",
    520000,
    520000,
  ],
  [
    "Giày chạy bộ",
    "cat-giay",
    "br-nike",
    "42",
    "Như mới, đế còn 95%",
    1200000,
    990000,
  ],
  [
    "Sneaker cổ thấp",
    "cat-giay",
    "br-converse",
    "39",
    "Khá, có vết ố nhỏ",
    400000,
    350000,
  ],
  ["Túi tote canvas", "cat-tui", "br-local", "Free", "Như mới", 250000, 250000],
  ["Áo sơ mi linen", "cat-ao", "br-zara", "M", "Tốt", 380000, 380000],
  ["Quần tây ống đứng", "cat-quan", "br-hm", "30", "Như mới", 320000, 290000],
  ["Đầm suông công sở", "cat-vay", "br-local", "M", "Tốt", 600000, 600000],
  ["Áo thun basic", "cat-ao", "br-uniqlo", "L", "Khá", 120000, 120000],
  ["Áo hoodie nỉ", "cat-ao", "br-adidas", "XL", "Tốt", 480000, 450000],
  [
    "Kính râm gọng tròn",
    "cat-phu-kien",
    "br-none",
    "Free",
    "Như mới",
    200000,
    200000,
  ],
  [
    "Túi đeo chéo da",
    "cat-tui",
    "br-gucci",
    "Free",
    "Tốt, còn hộp",
    9500000,
    8900000,
  ],
];

// 2 vòng mẫu = 32 món ON_SALE (2 trang × 20) + 2 món đã rời sàn để thử BR-04 (chỉ mở được bằng id)
function seedProducts() {
  const onSale = [...SAMPLES, ...SAMPLES].map(
    (
      [name, categoryId, brandId, size, condition, originalPrice, currentPrice],
      i,
    ) => ({
      id: `sp-${String(i + 1).padStart(3, "0")}`,
      name: i < SAMPLES.length ? name : `${name} (mẫu 2)`,
      categoryId,
      brandId,
      size,
      condition,
      originalPrice,
      currentPrice,
      warehouseId: WAREHOUSES[i % WAREHOUSES.length].id,
      status: PRODUCT_STATUS.ON_SALE,
      photos: [1, 2, 3].map((n) => ({ url: photo(`rehome-${i}-${n}`) })),
      description: `${name} đã được kho ReHome kiểm tra đường may, khoá kéo, vết bẩn. Tình trạng: ${condition.toLowerCase()}. Ảnh chụp thật tại kho.`,
      inspectedAt: dayjs()
        .subtract(i + 2, "day")
        .toISOString(),
      createdAt: dayjs()
        .subtract(i * 3, "hour")
        .toISOString(),
    }),
  );
  return [
    ...onSale,
    {
      ...onSale[0],
      id: "sp-reserved",
      name: "Áo khoác dạ nữ (đang có người thanh toán)",
      status: PRODUCT_STATUS.RESERVED,
    },
    {
      ...onSale[1],
      id: "sp-sold",
      name: "Quần jeans ống rộng (đã bán)",
      status: PRODUCT_STATUS.SOLD,
    },
  ];
}

let products = seedProducts();

const nameOf = (list, id) => list.find((x) => x.id === id)?.name ?? null;

// Đúng hình dạng ProductSummaryResponse của BE
const toSummary = (p) => ({
  id: p.id,
  name: p.name,
  thumbnailUrl: p.photos[0]?.url ?? null,
  brandName: nameOf(BRANDS, p.brandId),
  categoryName: nameOf(CATEGORIES, p.categoryId),
  size: p.size,
  condition: p.condition,
  originalPrice: p.originalPrice,
  currentPrice: p.currentPrice,
});

export async function getProducts({
  search,
  categoryId,
  brandId,
  priceMin,
  priceMax,
  warehouseId,
  page = 0,
  size = 20,
} = {}) {
  await delay();
  if (priceMin != null && priceMax != null && priceMin > priceMax) {
    throw new ApiError({
      status: 400,
      code: "HTTP_400",
      message: "Giá tối thiểu không được lớn hơn giá tối đa.",
    });
  }
  const q = search?.trim().toLowerCase();
  const items = products
    .filter((p) => p.status === PRODUCT_STATUS.ON_SALE)
    .filter((p) => !q || p.name.toLowerCase().includes(q)) // BE: name LIKE %q% không phân biệt hoa thường
    .filter((p) => !categoryId || p.categoryId === categoryId)
    .filter((p) => !brandId || p.brandId === brandId)
    .filter((p) => !warehouseId || p.warehouseId === warehouseId)
    .filter((p) => priceMin == null || p.currentPrice >= priceMin)
    .filter((p) => priceMax == null || p.currentPrice <= priceMax)
    .sort((a, b) => dayjs(b.createdAt).diff(a.createdAt)); // mới lên sàn trước, như BE

  return {
    content: items.slice(page * size, (page + 1) * size).map(toSummary),
    page,
    size,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
  };
}

// Ngoài {id, name, currentPrice, status, photos} của contract, các field còn lại là mobile xin thêm (câu hỏi BE 18b)
export async function getProduct(id) {
  await delay();
  const p = products.find((x) => x.id === id);
  if (!p) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy sản phẩm.",
    });
  }
  return {
    ...toSummary(p),
    status: p.status,
    categoryId: p.categoryId,
    photos: p.photos,
    description: p.description,
    warehouseName: nameOf(WAREHOUSES, p.warehouseId),
    inspectedAt: p.inspectedAt,
  };
}
