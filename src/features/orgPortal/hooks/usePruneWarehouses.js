import { useQueryClient } from "@tanstack/react-query";
import { warehouseApi } from "@/features/warehouses/api/warehouseApi";
import { warehouseKeys } from "@/features/warehouses/hooks/useWarehouses";

// Bỏ khỏi form chiến dịch các kho không còn trong GET /warehouses (kho ngừng hoạt động, hoặc mã kho cũ
// trong bản nháp / bộ nhớ đệm sau khi BE dựng lại dữ liệu). Tải lại danh sách kho mới nhất rồi lọc.
// → số kho đã bỏ
export function usePruneWarehouses({ getValues, setValue }) {
  const queryClient = useQueryClient();
  return async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: warehouseKeys.all,
      queryFn: warehouseApi.getWarehouses,
      staleTime: 0,
    });
    const alive = new Set(fresh.map((w) => w.id));
    const ids = getValues("warehouseIds") ?? [];
    const kept = ids.filter((id) => alive.has(id));
    if (kept.length !== ids.length)
      setValue("warehouseIds", kept, { shouldDirty: true });
    return ids.length - kept.length;
  };
}
