import { z } from "zod";
import { OPERATION_SCOPES, ORG_TYPES } from "@/features/organization/constants";
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
