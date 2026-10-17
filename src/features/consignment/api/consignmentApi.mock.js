// Mock nhóm ký gửi (API 14–24) [CHỜ BE]. Cùng tên hàm + hình dạng dữ liệu với bản thật sau này.
// Dữ liệu "sống" trong RAM: tạo/sửa thấy ngay; reload app thì về dữ liệu mẫu.
import { ApiError } from "@/lib/api/errors";
import { seedForms } from "./mockData";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
let forms = seedForms();

// API 16 trả 1 dòng tóm tắt. Ngoài {id, status, productName, desiredPrice} của API_CONTRACT,
// các field còn lại là bản mobile xin thêm [CHỜ BE] — FormCard phải chịu được khi thiếu
const toListItem = (f) => ({
  id: f.id,
  status: f.status,
  productName: f.productName,
  desiredPrice: f.desiredPrice,
  thumbnailUrl: f.photoUrls[0] ?? null,
  warehouseName: f.warehouse?.name ?? null,
  bringInDeadline: f.bringInDeadline,
  rejectReason: f.rejectReason,
  createdAt: f.createdAt,
});

// Giống PageResponse của BE: page bắt đầu từ 0
const paginate = (items, page, size) => ({
  content: items.slice(page * size, (page + 1) * size),
  page,
  size,
  totalElements: items.length,
  totalPages: Math.ceil(items.length / size),
});

// API 16 — GET /consignment-forms?status&page&size (mới nhất lên đầu)
export async function getMyForms({ status, page = 0, size = 20 } = {}) {
  await delay();
  const items = forms
    .filter((f) => !status || f.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toListItem);
  return paginate(items, page, size);
}

// API 17 — GET /consignment-forms/{id}
export async function getForm(id) {
  await delay();
  const form = forms.find((f) => f.id === id);
  if (!form) {
    throw new ApiError({
      status: 404,
      code: "HTTP_404",
      message: "Không tìm thấy form ký gửi.",
    });
  }
  return { ...form };
}
