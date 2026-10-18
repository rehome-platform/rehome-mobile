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
