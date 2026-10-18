import { create } from "zustand";

// Chỉ RAM: tắt app là mất (đơn vẫn tự huỷ sau 15 phút, hàng tự mở bán lại).
// Phase 4 có GET /orders?status=PENDING_PAYMENT thì lấy từ BE thay cho store này
export const useCheckoutStore = create((set) => ({
  addressId: null, // địa chỉ đang chọn ở checkout (null = dùng địa chỉ mặc định)
  // Đơn vừa tạo, chờ thanh toán: [{id, orderNo, warehouseId, warehouseName, subtotal, shippingFee, totalAmount, status, paymentDeadline}]
  pendingOrders: [],

  setAddressId: (addressId) => set({ addressId }),
  setPendingOrders: (pendingOrders) => set({ pendingOrders }),
  updateOrder: (id, patch) =>
    set((s) => ({
      pendingOrders: s.pendingOrders.map((o) =>
        o.id === id ? { ...o, ...patch } : o,
      ),
    })),
  clear: () => set({ addressId: null, pendingOrders: [] }),
}));
