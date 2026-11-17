import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CONSIGN_STAGE as G,
  FORM_STATUS as F,
  PRODUCT_STATUS,
  PRODUCT_VIEW as V,
} from "@/constants/consignment";
import { getProductView, PRODUCT_VIEW_ORDER } from "@/utils/consignment";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";

// Sản phẩm đang chờ CHÍNH Member làm gì đó → chấm đỏ trên tab
const NEEDS_ACTION_VIEWS = [
  V.AWAITING_DECISION,
  V.PICKUP,
  V.WITHDRAWING,
  V.DEGRADED_DECISION,
];

// Yêu cầu → tab.
// Đã xác nhận biên nhận: BE giữ form ở INSPECTING mãi; SẢN PHẨM chỉ có sau khi Moderator nhập kho.
// - đã có sản phẩm → ẩn form (sản phẩm hiện thay, tránh trùng)
// - CHƯA có sản phẩm → "Chờ lên sàn" ở tab Đang bán (trước đây ẩn luôn → món "biến mất" tới lúc nhập kho)
function stageOfForm(form, listed) {
  if (form.status === F.PENDING) return G.PENDING;
  if (form.status === F.APPROVED || form.status === F.INSPECTING) {
    if (!form.receiptConfirmed) return G.BRING;
    return listed(form) ? null : G.SELLING;
  }
  return G.ENDED; // REJECTED, EXPIRED, CANCELLED
}

const nameKey = (name, warehouse) =>
  `${(name ?? "").trim().toLowerCase()}|${(warehouse ?? "").trim().toLowerCase()}`;

// Form này đã thành sản phẩm chưa. Nối form ↔ sản phẩm:
// 1. form.productId — [CHỜ BE] đã xin thêm vào danh sách form (null tới khi nhập kho); có thì dùng thẳng
// 2. sản phẩm có receiptId = biên nhận của form (đúng cho mọi sản phẩm CHƯA ký gửi lại)
// 3. sản phẩm đã KÝ GỬI LẠI: receiptId đổi sang biên nhận mới, mất dấu biên nhận gốc → nối theo tên + địa điểm,
//    CHỈ với các sản phẩm này (tránh nhận nhầm 2 món trùng tên ở cùng địa điểm khi món thứ hai chưa nhập kho)
function makeListed(products) {
  const receiptIds = new Set(products.map((p) => p.receiptId).filter(Boolean));
  const reconsignedKeys = new Set(
    products
      .filter(
        (p) =>
          p.endOfTermDecision?.newReceiptId &&
          p.endOfTermDecision.newReceiptId === p.receiptId,
      )
      .map((p) => nameKey(p.name, p.warehouseName)),
  );
  return (form) =>
    !!form.productId ||
    receiptIds.has(form.receiptId) ||
    reconsignedKeys.has(nameKey(form.productName, form.warehouseName));
}

function stageOfProduct(product, view) {
  if (view !== V.ENDED) return G.SELLING;
  return product.status === PRODUCT_STATUS.SOLD ? G.SOLD : G.ENDED;
}

// "Đồ ký gửi của tôi": gộp yêu cầu ký gửi (API 16) + sản phẩm của tôi (API 21) thành 5 tab theo hành trình.
// Mỗi phần tử: { kind: "form" | "product", key, data, needsAction }. [CHỜ BE] tạm lấy 1 trang 50 mỗi loại
export function useMyConsignItems() {
  const forms = useQuery({
    queryKey: consignKeys.forms(),
    queryFn: () => consignmentApi.getMyForms({ page: 0, size: 50 }),
  });
  const products = useQuery({
    queryKey: consignKeys.products(),
    queryFn: () => consignmentApi.getMyProducts({ page: 0, size: 50 }),
  });

  const stages = useMemo(() => {
    const out = Object.fromEntries(Object.values(G).map((g) => [g, []]));
    const listed = makeListed(products.data?.content ?? []);

    for (const f of forms.data?.content ?? []) {
      const g = stageOfForm(f, listed);
      if (g)
        out[g].push({
          kind: "form",
          key: `form-${f.id}`,
          // Đã xác nhận biên nhận, chờ nhập kho → thẻ hiện "Chờ lên sàn"
          data:
            g === G.SELLING ? { ...f, awaitingListing: true } : f,
          // mang đồ tới / xác nhận biên nhận. BE giữ INSPECTING cả khi đã có biên nhận →
          // dựa vào receiptId (danh sách chưa trả receiptId / receiptConfirmed — đã xin BE)
          needsAction:
            f.status === F.APPROVED || (!!f.receiptId && !f.receiptConfirmed),
        });
    }

    // Việc cần làm lên đầu (hàng hỏng chờ chọn → chờ cuối kỳ → … → đã kết thúc)
    const sorted = (products.data?.content ?? [])
      .map((p) => ({ p, view: getProductView(p) }))
      .sort(
        (a, b) =>
          PRODUCT_VIEW_ORDER.indexOf(a.view) -
          PRODUCT_VIEW_ORDER.indexOf(b.view),
      );
    for (const { p, view } of sorted) {
      out[stageOfProduct(p, view)].push({
        kind: "product",
        key: `product-${p.id}`,
        data: p,
        needsAction: NEEDS_ACTION_VIEWS.includes(view),
      });
    }
    return out;
  }, [forms.data, products.data]);

  return {
    stages, // { PENDING: [...], BRING: [...], SELLING: [...], SOLD: [...], ENDED: [...] }
    isPending: forms.isPending || products.isPending,
    isError: forms.isError || products.isError,
    error: forms.error ?? products.error,
    isRefetching: forms.isRefetching || products.isRefetching,
    refetch: () => Promise.all([forms.refetch(), products.refetch()]),
  };
}
