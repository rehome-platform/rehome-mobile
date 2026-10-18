// Mock API 51–53, cùng hình dạng dữ liệu BE (CartServiceImpl). Giỏ chung trong RAM, reload app → về mẫu
import dayjs from "dayjs";
import { ApiError } from "@/lib/api/errors";
import { PRODUCT_STATUS } from "@/constants/consignment";
import { WAREHOUSES } from "@/features/consignment/api/mockData";
import { mockFindProduct } from "@/features/products/api/productsApi.mock";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const conflict = (message) =>
  new ApiError({ status: 409, code: "HTTP_409", message });

let seq = 0;
const newItem = (productId, minutesAgo = 0) => ({
  id: `ci-${++seq}`,
  productId,
  addedAt: dayjs().subtract(minutesAgo, "minute").toISOString(),
});

// Mẫu: hàng ở 2 kho (sp-001, sp-004 ở Kho Quận 1; sp-002 ở Kho Bình Thạnh) + 1 món đã bán
let items = [
  newItem("sp-001", 60),
  newItem("sp-004", 50),
  newItem("sp-002", 40),
  newItem("sp-sold", 30),
];

export async function getCart() {
  await delay();
  const groups = new Map();
  for (const ci of items) {
    const p = mockFindProduct(ci.productId);
    if (!p) continue;
    const reason = p.status === PRODUCT_STATUS.ON_SALE ? null : p.status;
    const group = groups.get(p.warehouseId) ?? {
      warehouseId: p.warehouseId,
      warehouseName:
        WAREHOUSES.find((w) => w.id === p.warehouseId)?.name ?? "Kho",
      items: [],
      subtotal: 0,
    };
    group.items.push({
      id: ci.id,
      product: {
        id: p.id,
        name: p.name,
        thumbnailUrl: p.photos[0]?.url ?? null,
        size: p.size,
        originalPrice: p.originalPrice,
        currentPrice: p.currentPrice,
      },
      addedAt: ci.addedAt,
      unavailableReason: reason,
    });
    if (!reason) group.subtotal += p.currentPrice; // như BE: món không khả dụng không tính tiền
    groups.set(p.warehouseId, group);
  }
  const groupedByWarehouse = [...groups.values()];
  return {
    groupedByWarehouse,
    totalAmount: groupedByWarehouse.reduce((sum, g) => sum + g.subtotal, 0),
  };
}

export async function addToCart(productId) {
  await delay();
  const p = mockFindProduct(productId);
  if (!p) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy sản phẩm.",
    });
  }
  if (p.status !== PRODUCT_STATUS.ON_SALE)
    throw conflict("Sản phẩm không còn để bán.");
  if (items.some((ci) => ci.productId === productId)) {
    throw conflict("Sản phẩm đã có trong giỏ hàng.");
  }
  const item = newItem(productId);
  items.push(item);
  return { id: item.id, productId, addedAt: item.addedAt };
}

export async function removeCartItem(cartItemId) {
  await delay();
  const before = items.length;
  items = items.filter((ci) => ci.id !== cartItemId);
  if (items.length === before) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy mục giỏ hàng.",
    });
  }
  return null;
}
