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

// Yêu cầu → tab. Đã xác nhận biên nhận thì món đã thành SẢN PHẨM → không hiện yêu cầu nữa (tránh trùng)
function stageOfForm(form) {
  if (form.status === F.PENDING) return G.PENDING;
  if (form.status === F.APPROVED || form.status === F.INSPECTING)
    return form.receiptConfirmed ? null : G.BRING;
  return G.ENDED; // REJECTED, EXPIRED, CANCELLED
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

    for (const f of forms.data?.content ?? []) {
      const g = stageOfForm(f);
      if (g)
        out[g].push({
          kind: "form",
          key: `form-${f.id}`,
          data: f,
          needsAction: f.status === F.APPROVED, // mang đồ tới / xác nhận biên nhận
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
