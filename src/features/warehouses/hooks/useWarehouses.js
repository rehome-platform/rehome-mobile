import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCoords } from "@/utils/location";
import { consignmentApi } from "@/features/consignment/api/consignmentApi";
import { consignKeys } from "@/features/consignment/api/queryKeys";
import { warehouseApi } from "@/features/warehouses/api/warehouseApi";

export const warehouseKeys = { all: ["warehouses"] };

// Danh sách kho cho WarehousePicker.
// nearest (Member, KG-03): xin vị trí → GET /warehouses/nearest, xếp gần nhất trước; từ chối / lỗi GPS → GET /warehouses
// không nearest (Tổ chức, OC-02): GET /warehouses, không xin vị trí
// coords: undefined = đang lấy vị trí · null = không có · { lat, lng }
export function useWarehouses({ nearest = false } = {}) {
  const [coords, setCoords] = useState(nearest ? undefined : null);
  useEffect(() => {
    if (!nearest) return;
    let alive = true; // rời màn trước khi có vị trí → không set state nữa
    getCoords()
      .catch(() => null)
      .then((c) => alive && setCoords(c?.lat != null ? c : null));
    return () => {
      alive = false;
    };
  }, [nearest]);

  const query = useQuery({
    queryKey: nearest
      ? consignKeys.warehouses(coords?.lat, coords?.lng)
      : warehouseKeys.all,
    queryFn: () =>
      nearest
        ? consignmentApi.getNearestWarehouses(coords ?? {})
        : warehouseApi.getWarehouses(),
    enabled: coords !== undefined, // chờ có kết quả vị trí (kể cả null) rồi mới gọi
  });

  return { query, coords };
}
