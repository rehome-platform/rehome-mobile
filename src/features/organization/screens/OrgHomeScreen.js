import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";

const CHECKLIST = [
  "Giấy phép / quyết định thành lập (ảnh hoặc PDF)",
  "CCCD hai mặt của người đại diện",
  "Địa chỉ và giờ nhận đồ quyên góp",
];

// Màn đầu của tài khoản Tổ chức. [CHỜ BE] GET /api/organizations/me → hiện đúng trạng thái
// (chưa nộp / chờ duyệt / bị từ chối / đã xác minh). Tạm thời luôn mời nộp hồ sơ
export default function OrgHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  return (
    <Screen
      scroll
      header={<AppHeader title="Tổ chức" />}
      contentStyle={styles.content}
      footer={
        <Button
          title="Đăng xuất"
          variant="secondary"
          onPress={confirmSignOut}
        />
      }
    >
      <Text style={styles.hello}>Đăng nhập với {user?.email}</Text>

      <View style={styles.card}>
        <Ionicons
          name="document-text-outline"
          size={32}
          color={colors.primary}
        />
        <Text style={styles.title}>Nộp hồ sơ xác minh tổ chức</Text>
        <Text style={styles.text}>
          ReHome cần xác minh giấy tờ pháp lý trước khi tổ chức nhận đồ quyên
          góp và mở chiến dịch. Chuẩn bị sẵn:
        </Text>
        {CHECKLIST.map((item) => (
          <View key={item} style={styles.row}>
            <Ionicons
              name="checkmark-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
        <Button
          title="Bắt đầu nộp hồ sơ"
          // [TẠM] bước 3 nối vào 4 bước nộp hồ sơ
          onPress={() =>
            Alert.alert("Sắp có", "Bước nộp hồ sơ đang được nối API.")
          }
          style={styles.cta}
        />
      </View>

      <NoteBox>
        Hồ sơ được duyệt trong 1–3 ngày làm việc. Kết quả gửi về email đăng
        nhập.
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  hello: { ...textStyles.body, color: colors.textSecondary },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  title: {
    ...textStyles.heading,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  text: { flex: 1, ...textStyles.body, color: colors.textSecondary },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  cta: { marginTop: spacing.sm },
});
