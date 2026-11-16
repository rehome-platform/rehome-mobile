import QRCode from "react-native-qrcode-svg";
import { colors } from "@/theme";

// QR của Member để Moderator quét tại quầy (API 25 /counter/lookup, field qrPayload).
// [CHỜ BE] chưa chốt nội dung qrPayload → tạm mã hoá đúng memberCode. Lead bỏ QR thì xoá component này.
export function MemberQr({ code, size = 180 }) {
  if (!code) return null;
  return (
    <QRCode
      value={code}
      size={size}
      color={colors.text}
      backgroundColor={colors.surface}
      ecl="M"
    />
  );
}
