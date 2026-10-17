import { useCallback, useEffect } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { colors, fonts, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { useOrgRegisterStore } from "@/features/organization/store/orgRegisterStore";

// Về tab Mua sắm, đóng hết các màn đăng ký phía trên
const goHome = () => router.dismissTo("/");

// OA-06 (bản Chờ xác minh). Bản Bị từ chối + làm mới trạng thái: cần tổ chức đăng nhập được [CHỜ BE]
export default function OrgSubmittedScreen() {
  const { displayName, email, submittedAt } = useLocalSearchParams();
  const reset = useOrgRegisterStore((s) => s.reset);

  // Hồ sơ đã gửi → xoá dữ liệu tạm khỏi bộ nhớ (kể cả mật khẩu)
  useEffect(() => {
    reset();
  }, [reset]);

  // Nút Back Android → về trang chủ, không quay lại form đã gửi
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goHome();
        return true; // true = đã tự xử lý, hệ thống không lùi màn nữa
      });
      return () => sub.remove();
    }, []),
  );

  const sentAt = submittedAt
    ? dayjs(submittedAt).format("HH:mm, DD/MM/YYYY")
    : "";

  return (
    <Screen
      scroll
      footer={<Button title="Về trang chủ" onPress={goHome} />}
      contentStyle={styles.content}
    >
      <Stack.Screen options={{ gestureEnabled: false }} />

      <View style={styles.hero}>
        <View style={styles.icon}>
          <Ionicons name="hourglass-outline" size={36} color={colors.primary} />
        </View>
        <Text style={styles.title}>Hồ sơ đang được xác minh</Text>
        <Text style={styles.desc}>
          Cảm ơn <Text style={styles.bold}>{displayName}</Text> đã đăng ký. Hồ
          sơ gửi lúc {sentAt}.
        </Text>
      </View>

      <StatusTimeline
        steps={[
          { title: "Đã gửi hồ sơ", desc: sentAt, state: "done" },
          {
            title: "Moderator đang xác minh",
            desc: "Phản hồi trong 5 ngày làm việc. Có thể gọi SĐT liên hệ để xác minh.",
            state: "active",
          },
          {
            title: "Có kết quả",
            desc: `Thông báo qua email ${email}`,
            state: "todo",
          },
        ]}
      />

      <NoteBox>
        <Text style={styles.noteText}>
          Khi hồ sơ được duyệt, đăng nhập bằng{" "}
          <Text style={styles.bold}>{email}</Text> và mật khẩu đã đặt. Trong lúc
          chờ, tài khoản tổ chức chưa dùng được các chức năng chính.
        </Text>
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  hero: { alignItems: "center", gap: spacing.sm, paddingTop: spacing.xl },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral,
  },
  title: { ...textStyles.title, color: colors.text, textAlign: "center" },
  desc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  bold: { fontFamily: fonts.semibold, color: colors.text },
  noteText: { ...textStyles.body, color: colors.textSecondary },
});
