// Màn hình CHỈ import file này
import { MOCK } from "@/config/env";
import * as real from "./consignmentApi.real";
import * as mock from "./consignmentApi.mock";
import { applyMockDonation } from "./donateApi";

const impl = MOCK.consignment ? mock : real;

// Quyên góp món ký gửi còn mock (MOCK.donateConsigned) → đè trạng thái "đã quyên góp" lên sản phẩm đọc về
const getMyProducts = async (args) => {
  const page = await impl.getMyProducts(args);
  return { ...page, content: page.content.map(applyMockDonation) };
};
const getProduct = async (id) => applyMockDonation(await impl.getProduct(id));

export const consignmentApi = {
  getNearestWarehouses: impl.getNearestWarehouses,
  getMyForms: impl.getMyForms,
  getForm: impl.getForm,
  createForm: impl.createForm,
  updateForm: impl.updateForm,
  createDraft: impl.createDraft,
  updateDraft: impl.updateDraft,
  deleteDraft: impl.deleteDraft,
  getDrafts: impl.getDrafts,
  submitDrafts: impl.submitDrafts,
  getReceipt: impl.getReceipt,
  confirmReceipt: impl.confirmReceipt,
  downloadReceiptPdf: impl.downloadReceiptPdf,
  getMyProducts,
  getProduct,
  reducePrice: impl.reducePrice,
  decideEndOfTerm: impl.decideEndOfTerm,
  // [DEV] chỉ có ở mock: giả lập Moderator đề xuất giá mới (ReconsignScreen)
  mockProposeNewPrice: mock.mockProposeNewPrice,
};
