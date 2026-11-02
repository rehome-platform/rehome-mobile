import { z } from "zod";
import { FILE_RULES } from "@/features/organization/constants";
import { ORG_LIMITS } from "@/constants/community";
import { PHONE_REGEX } from "@/utils/validators";

const CONTACT_PHONE_REGEX = /^0\d{9,10}$/; // di động 10 số hoặc số bàn 11 số (02x xxxx xxxx)
const TAX_CODE_REGEX = /^\d{10}(-\d{3})?$/; // 10 số, hoặc 10 số - 3 số (chi nhánh)

const required = (message) => z.string().trim().min(1, message);

// OA-01: thông tin tổ chức
export const orgInfoSchema = z.object({
  legalName: required("Vui lòng nhập tên đầy đủ theo giấy tờ"),
  displayName: required("Vui lòng nhập tên hiển thị"),
  // Mã lấy từ BE (useOrgOptions) → chỉ kiểm đã chọn; mã cũ không còn trong danh sách bị màn hình xoá trước
  orgType: required("Vui lòng chọn loại hình tổ chức"),
  taxCode: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || TAX_CODE_REGEX.test(v),
      "Mã số thuế gồm 10 số (hoặc 10 số - 3 số)",
    ),
  operationScope: required("Vui lòng chọn phạm vi hoạt động"),
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
// OA-02: người đại diện. Mật khẩu đã đặt lúc tạo tài khoản tổ chức (AU-03)
// [GIẢ ĐỊNH] BE chưa lưu phone / email người đại diện (gửi lên bị bỏ qua) [CHỜ BE]
export const orgRepresentativeSchema = z.object({
  fullName: required("Vui lòng nhập họ và tên người đại diện"),
  position: required("Vui lòng nhập chức vụ"),
  phone: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(
      z
        .string()
        .min(1, "Vui lòng nhập số điện thoại")
        .regex(PHONE_REGEX, "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0"),
    ),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .pipe(z.email("Email không hợp lệ")),
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

// OP-02 · Sửa thông tin thường (PATCH /api/organizations/me — áp dụng ngay, không cần duyệt).
// Mô tả tối đa ORG_LIMITS.DESCRIPTION_MAX; giờ nhận đồ = ngày + khung giờ (gửi BE một chuỗi như lúc đăng ký)
export const orgProfileEditSchema = z
  .object({
    logoUri: z.string().nullable(),
    // Báo cả số ký tự đang dư (wireframe OP-02)
    description: required("Vui lòng nhập mô tả").superRefine((v, ctx) => {
      if (v.length > ORG_LIMITS.DESCRIPTION_MAX)
        ctx.addIssue({
          code: "custom",
          message: `Mô tả tối đa ${ORG_LIMITS.DESCRIPTION_MAX} ký tự (đang dư ${v.length - ORG_LIMITS.DESCRIPTION_MAX} ký tự)`,
        });
    }),
    contactPhone: z
      .string()
      .transform((v) => v.replace(/\s/g, ""))
      .pipe(
        z
          .string()
          .min(1, "Vui lòng nhập số điện thoại")
          .regex(CONTACT_PHONE_REGEX, "Số điện thoại không hợp lệ"),
      ),
    days: z.array(z.string()).min(1, "Chọn ít nhất 1 ngày nhận đồ"),
    openTime: z.string().min(1, "Chọn giờ bắt đầu"),
    closeTime: z.string().min(1, "Chọn giờ kết thúc"),
  })
  .refine((d) => d.closeTime > d.openTime, {
    path: ["closeTime"],
    error: "Giờ kết thúc phải sau giờ bắt đầu",
  });

// OP-04 · Đổi thông tin pháp lý: tích mục nào thì khai đủ mục đó (như lúc đăng ký), mục không tích bỏ qua.
// Gửi xong chờ Moderator duyệt; hồ sơ công khai giữ thông tin cũ tới lúc duyệt
const legalDocSchema = z.object({
  file: fileSchema,
  docType: required("Vui lòng nhập loại giấy tờ"),
  docNumber: z.string().trim(),
  issueDate: z.string().nullable(),
  issuer: z.string().trim(),
});

export const makeLegalChangeSchema = (current) =>
  z
    .object({
      changeRep: z.boolean(),
      changeLegalName: z.boolean(),
      changeOrgType: z.boolean(),
      rep: z.object({
        fullName: z.string().trim(),
        position: z.string().trim(),
        phone: z.string().transform((v) => v.replace(/\s/g, "")),
        email: z.string().trim(),
        cccdFront: fileSchema.nullable(),
        cccdBack: fileSchema.nullable(),
        cccdName: z.string().trim(),
        cccdNumber: z.string().trim(),
        cccdIssueDate: z.string(),
        cccdIssuePlace: z.string().trim(),
      }),
      legalName: z.string().trim(),
      legalNameDocs: z.array(legalDocSchema),
      orgType: z.string(),
      orgTypeDocs: z.array(legalDocSchema),
    })
    .superRefine((d, ctx) => {
      const need = (cond, path, message) => {
        if (cond) ctx.addIssue({ code: "custom", path, message });
      };
      need(
        !d.changeRep && !d.changeLegalName && !d.changeOrgType,
        ["changeRep"],
        "Chọn ít nhất 1 thông tin muốn đổi",
      );
      if (d.changeRep) {
        const r = d.rep;
        need(!r.fullName, ["rep", "fullName"], "Vui lòng nhập họ và tên");
        need(!r.position, ["rep", "position"], "Vui lòng nhập chức vụ");
        need(
          !PHONE_REGEX.test(r.phone),
          ["rep", "phone"],
          "Số điện thoại phải có 10 chữ số, bắt đầu bằng 0",
        );
        need(
          !z.email().safeParse(r.email).success,
          ["rep", "email"],
          "Email không hợp lệ",
        );
        need(
          !r.cccdFront,
          ["rep", "cccdFront"],
          "Vui lòng thêm ảnh mặt trước CCCD",
        );
        need(
          !r.cccdBack,
          ["rep", "cccdBack"],
          "Vui lòng thêm ảnh mặt sau CCCD",
        );
        need(!r.cccdName, ["rep", "cccdName"], "Vui lòng nhập họ tên trên thẻ");
        need(
          !CCCD_REGEX.test(r.cccdNumber),
          ["rep", "cccdNumber"],
          "Số CCCD gồm 12 chữ số",
        );
        need(
          !r.cccdIssueDate,
          ["rep", "cccdIssueDate"],
          "Vui lòng chọn ngày cấp",
        );
        need(
          !r.cccdIssuePlace,
          ["rep", "cccdIssuePlace"],
          "Vui lòng nhập nơi cấp",
        );
      }
      if (d.changeLegalName) {
        need(!d.legalName, ["legalName"], "Vui lòng nhập tên pháp lý mới");
        need(
          d.legalName && d.legalName === current?.legalName,
          ["legalName"],
          "Tên mới đang trùng tên hiện tại",
        );
        need(
          !d.legalNameDocs.length,
          ["legalNameDocs"],
          "Thêm ít nhất 1 giấy tờ cho tên pháp lý mới",
        );
      }
      if (d.changeOrgType) {
        need(!d.orgType, ["orgType"], "Vui lòng chọn loại hình mới");
        need(
          d.orgType && d.orgType === current?.orgType,
          ["orgType"],
          "Loại hình mới đang trùng loại hình hiện tại",
        );
        need(
          !d.orgTypeDocs.length,
          ["orgTypeDocs"],
          "Thêm ít nhất 1 giấy tờ của loại hình mới",
        );
      }
    });
