import { z } from "zod";
import {
  FILE_RULES,
  OPERATION_SCOPES,
  ORG_TYPES,
} from "@/features/organization/constants";
import { PASSWORD_REGEX, PHONE_REGEX } from "@/utils/validators";

const CONTACT_PHONE_REGEX = /^0\d{9,10}$/; // di động 10 số hoặc số bàn 11 số (02x xxxx xxxx)
const TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/; // 10 số, hoặc 10 số - 3 số (chi nhánh)

const required = (message) => z.string().trim().min(1, message);

// OA-01: thông tin tổ chức
export const orgInfoSchema = z.object({
  legalName: required("Vui lòng nhập tên đầy đủ theo giấy tờ"),
  displayName: required("Vui lòng nhập tên hiển thị"),
  orgType: z.enum(
    ORG_TYPES.map((t) => t.value),
    { error: "Vui lòng chọn loại hình tổ chức" },
  ),
  taxCode: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || TAX_CODE_REGEX.test(v),
      "Mã số thuế gồm 10 số (hoặc 10 số - 3 số)",
    ),
  operationScope: z.enum(
    OPERATION_SCOPES.map((s) => s.value),
    { error: "Vui lòng chọn phạm vi hoạt động" },
  ),
  address: required("Vui lòng nhập địa chỉ trụ sở"),
  contactPhone: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .min(1, "Vui lòng nhập số điện thoại liên hệ")
        .regex(
          CONTACT_PHONE_REGEX,
          "Số điện thoại gồm 10–11 chữ số, bắt đầu bằng 0",
        ),
    ),
  contactEmail: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email liên hệ")
    .pipe(z.email("Email không hợp lệ")),
  website: z.string().trim(),
  description: required("Vui lòng mô tả hoạt động của tổ chức").max(
    1000,
    "Tối đa 1000 ký tự",
  ),
  logoUri: z.string().nullable(), // ảnh trong máy; upload khi gửi hồ sơ [CHỜ BE /uploads]
});
// OA-02: người đại diện + mật khẩu tài khoản tổ chức
// [GIẢ ĐỊNH] BE chưa nhận password / phone / email người đại diện — gửi mock [CHỜ BE]
export const orgRepresentativeSchema = z
  .object({
    fullName: required("Vui lòng nhập họ và tên người đại diện"),
    position: required("Vui lòng nhập chức vụ"),
    phone: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .pipe(
        z
          .string()
          .min(1, "Vui lòng nhập số điện thoại")
          .regex(
            PHONE_REGEX,
            "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0",
          ),
      ),
    email: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập email")
      .pipe(z.email("Email không hợp lệ")),
    password: z
      .string()
      .min(1, "Vui lòng nhập mật khẩu")
      .regex(PASSWORD_REGEX, "Mật khẩu ít nhất 8 ký tự, có cả chữ và số"),
    confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    error: "Hai mật khẩu chưa khớp",
  });

// OA-03: giấy tờ. Tệp chỉ nằm trong máy (uri); upload khi gửi hồ sơ [CHỜ BE /uploads]
const CCCD_REGEX = /^\d{12}$/;

const fileSchema = z.object({
  uri: z.string(),
  name: z.string(),
  mimeType: z.string(),
  size: z.number().nullable(),
});
const requiredFile = (message) =>
  fileSchema.nullable().refine((f) => f !== null, message);

export const orgDocumentsSchema = z.object({
  cccdFront: requiredFile("Vui lòng thêm ảnh mặt trước CCCD"),
  cccdBack: requiredFile("Vui lòng thêm ảnh mặt sau CCCD"),
  cccdName: required("Vui lòng nhập họ tên trên thẻ"),
  cccdNumber: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập số CCCD")
    .regex(CCCD_REGEX, "Số CCCD gồm 12 chữ số"),
  cccdIssueDate: z.string().min(1, "Vui lòng chọn ngày cấp"), // "YYYY-MM-DD"
  cccdIssuePlace: required("Vui lòng nhập nơi cấp"),
  legalDocs: z
    .array(
      z.object({
        file: fileSchema,
        docType: required("Vui lòng nhập loại giấy tờ"),
        docNumber: z.string().trim(),
        issueDate: z.string().nullable(),
        issuer: z.string().trim(),
      }),
    )
    .min(1, "Vui lòng thêm ít nhất 1 giấy tờ pháp lý")
    .max(
      FILE_RULES.maxLegalDocs,
      `Tối đa ${FILE_RULES.maxLegalDocs} giấy tờ pháp lý`,
    ),
});

// OA-04: địa điểm nhận đồ. Toạ độ để sau (bản đồ ghim) [GIẢ ĐỊNH]
export const orgLocationSchema = z
  .object({
    useOfficeAddress: z.boolean(),
    address: z.string().trim(), // chỉ bắt buộc khi bỏ tích "dùng địa chỉ trụ sở"
    name: required("Vui lòng nhập tên điểm nhận"),
    days: z.array(z.string()).min(1, "Chọn ít nhất 1 ngày nhận đồ"),
    openTime: z.string().min(1, "Chọn giờ bắt đầu"), // "HH:mm"
    closeTime: z.string().min(1, "Chọn giờ kết thúc"),
    contactPhone: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .refine(
        (v) => v === "" || CONTACT_PHONE_REGEX.test(v),
        "Số điện thoại gồm 10–11 chữ số, bắt đầu bằng 0",
      ),
  })
  .refine((d) => d.useOfficeAddress || d.address.length > 0, {
    path: ["address"],
    error: "Vui lòng nhập địa chỉ nhận đồ",
  })
  // "HH:mm" so sánh chuỗi được luôn: "17:00" > "08:00"
  .refine((d) => d.closeTime > d.openTime, {
    path: ["closeTime"],
    error: "Giờ kết thúc phải sau giờ bắt đầu",
  });
