// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./consignmentApi.real";
import * as mock from "./consignmentApi.mock";

const impl = MOCK.consignment ? mock : real;

export const consignmentApi = {
  getNearestWarehouses: impl.getNearestWarehouses,
  getMyForms: impl.getMyForms,
  getForm: impl.getForm,
  createForm: impl.createForm,
  updateForm: impl.updateForm,
  getReceipt: impl.getReceipt,
  confirmReceipt: impl.confirmReceipt,
  getMyProducts: impl.getMyProducts,
  getProduct: impl.getProduct,
  reducePrice: impl.reducePrice,
  decideEndOfTerm: impl.decideEndOfTerm,
  // [DEV] chỉ có ở mock: giả lập Moderator đề xuất giá mới (ReconsignScreen)
  mockProposeNewPrice: mock.mockProposeNewPrice,
};
