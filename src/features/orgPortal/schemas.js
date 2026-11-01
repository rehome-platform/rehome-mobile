import { z } from "zod";
import dayjs from "dayjs";
import { CAMPAIGN_LIMITS, DONATION_NOTE_LIMITS } from "@/constants/donation";
import { hasReceivingPlace } from "@/features/orgPortal/utils/campaignRules";

const required = (message) => z.string().trim().min(1, message);

// OC-02 / OC-04. requireFutureStart: tạo mới → ngày bắt đầu không ở quá khứ
// (sửa chiến dịch đang chạy thì ngày bắt đầu bị khoá nên bỏ kiểm này)
export const makeCampaignSchema = ({ requireFutureStart = true } = {}) =>
  z
    .object({
      title: required("Vui lòng nhập tên chiến dịch").max(
        CAMPAIGN_LIMITS.TITLE_MAX,
        `Tên tối đa ${CAMPAIGN_LIMITS.TITLE_MAX} ký tự`,
      ),
      coverUri: z.string().nullable(), // ảnh trong máy (chưa upload) hoặc URL cũ khi sửa
      description: z
        .string()
        .trim()
        .min(
          CAMPAIGN_LIMITS.DESCRIPTION_MIN,
          `Mô tả ít nhất ${CAMPAIGN_LIMITS.DESCRIPTION_MIN} ký tự`,
        )
        .max(
          CAMPAIGN_LIMITS.DESCRIPTION_MAX,
          `Mô tả tối đa ${CAMPAIGN_LIMITS.DESCRIPTION_MAX} ký tự`,
        ),
      startDate: z.string().min(1, "Chọn ngày bắt đầu nhận đồ"), // "YYYY-MM-DD"
      endDate: z.string().min(1, "Chọn ngày kết thúc"),
      preferredItemTypes: z
        .array(z.string())
        .min(1, "Chọn ít nhất 1 loại đồ đang cần"),
      receiveAtOwnAddress: z.boolean(),
      warehouseIds: z.array(z.string()),
    })
    .refine(
      (d) =>
        !requireFutureStart ||
        !d.startDate ||
        !dayjs(d.startDate).isBefore(dayjs(), "day"),
      { path: ["startDate"], error: "Ngày bắt đầu không được ở quá khứ" },
    )
    .refine(
      (d) =>
        !d.startDate ||
        !d.endDate ||
        dayjs(d.endDate).isAfter(dayjs(d.startDate), "day"),
      { path: ["endDate"], error: "Ngày kết thúc phải sau ngày bắt đầu" },
    )
    .refine((d) => !d.endDate || !dayjs(d.endDate).isBefore(dayjs(), "day"), {
      path: ["endDate"],
      error: "Ngày kết thúc không được ở quá khứ",
    })
    .refine(hasReceivingPlace, {
      path: ["receiveAtOwnAddress"],
      error: "Chọn ít nhất 1 cách nhận đồ",
    });

// OC-08: tên hoặc Ẩn danh (khớp lỗi 400 của API 154)
export const donationNoteSchema = z
  .object({
    donorName: z
      .string()
      .trim()
      .max(
        DONATION_NOTE_LIMITS.DONOR_NAME_MAX,
        `Tên tối đa ${DONATION_NOTE_LIMITS.DONOR_NAME_MAX} ký tự`,
      ),
    isAnonymous: z.boolean(),
    note: z
      .string()
      .trim()
      .max(
        DONATION_NOTE_LIMITS.NOTE_MAX,
        `Note tối đa ${DONATION_NOTE_LIMITS.NOTE_MAX} ký tự`,
      ),
  })
  .refine((d) => d.isAnonymous || d.donorName.length > 0, {
    path: ["donorName"],
    error: "Nhập tên người quyên góp hoặc chọn Ẩn danh",
  });
