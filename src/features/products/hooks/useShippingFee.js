import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/productsApi";
import { shopKeys } from "../api/queryKeys";

// Phí ship GHN tới một địa chỉ cho kho của món productId. Chưa có địa chỉ / thiếu phường, tỉnh → không gọi
export const shippingFeeQuery = (productId, address) => ({
  queryKey: shopKeys.shippingFee(
    productId,
    address?.wardName,
    address?.provinceName,
  ),
  queryFn: () => productsApi.getShippingFee(productId, address),
  enabled: !!productId && !!address?.wardName && !!address?.provinceName,
  staleTime: 5 * 60 * 1000, // phí ít đổi trong vài phút đặt hàng
});

export const useShippingFee = (productId, address) =>
  useQuery(shippingFeeQuery(productId, address));
