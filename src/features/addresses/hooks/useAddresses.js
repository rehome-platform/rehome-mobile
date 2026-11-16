import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import { addressApi } from "../api/addressApi";

export const addressKeys = { all: ["addresses"] };

// Danh sách địa chỉ, địa chỉ mặc định lên đầu
export function useAddresses() {
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: addressKeys.all,
    queryFn: addressApi.getAddresses,
    enabled: isAuthed,
    select: (list) =>
      [...list].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
  });
}

// Thêm (không có id) hoặc sửa (có id). Lưu xong luôn tải lại danh sách (response BE thiếu trường)
export function useSaveAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }) =>
      id
        ? addressApi.updateAddress(id, values)
        : addressApi.createAddress(values),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => addressApi.deleteAddress(id),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  });
}
// Tỉnh/phường GHN gần như không đổi → giữ cache 1 ngày. Khoá riêng "address-units" để lưu địa chỉ
// (invalidate ["addresses"]) không tải lại danh mục. value = tên (BE nhận tên), code dùng để lấy phường
const DAY = 24 * 60 * 60 * 1000;
const toUnitOptions = (list) =>
  list.map((u) => ({ value: u.name, label: u.name, code: u.code }));

export function useProvinces() {
  return useQuery({
    queryKey: ["address-units", "provinces"],
    queryFn: addressApi.getProvinces,
    select: toUnitOptions,
    staleTime: DAY,
  });
}

export function useWards(provinceId) {
  return useQuery({
    queryKey: ["address-units", "wards", provinceId],
    queryFn: () => addressApi.getWards(provinceId),
    enabled: !!provinceId,
    select: toUnitOptions,
    staleTime: DAY,
  });
}
