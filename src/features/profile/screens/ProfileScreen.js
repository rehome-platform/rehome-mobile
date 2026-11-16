import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { ListGroup } from "@/components/ui/ListItem";
import { authApi } from "@/features/auth/api/authApi";
import { useAuthStore } from "@/stores/authStore";
import { formatPhone } from "@/utils/format";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

export default function ProfileScreen() {
  const storeUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  // Hiện ngay dữ liệu trong store, đồng thời tải lại /members/me để có bản mới nhất
  const {
    data: user,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const me = await authApi.getMe();
      setUser(me); // đồng bộ store (PR-01 cũng dùng)
      return me;
    },
    initialData: storeUser,
    initialDataUpdatedAt: 0, // coi dữ liệu ban đầu là "cũ" → vẫn gọi API khi mở màn
  });

  return (
    <Screen
      scroll
      header={
        <AppHeader
          title="Hồ sơ cá nhân"
          onBack={goBack}
          right={<EditButton />}
        />
      }
      contentStyle={styles.content}
    >
      <View style={styles.top}>
        <Avatar uri={user?.avatarUrl} name={user?.fullName} size={80} />
        <Text style={styles.name}>{user?.fullName}</Text>
        <Text style={styles.code}>{user?.memberCode}</Text>
      </View>

      {/* Ngày sinh / Giới tính: DB chưa có cột → ẩn [CHỜ BE]. "Hoạt động trên ReHome": phase sau → ẩn */}
      <ListGroup>
        <InfoRow label="Họ và tên" value={user?.fullName} />
        <InfoRow
          label="Email"
          value={user?.email}
          badge={user?.emailVerified ? <VerifiedBadge /> : null}
        />
        <InfoRow
          label="Số điện thoại"
          value={user?.phone ? formatPhone(user.phone) : "Chưa cập nhật"}
        />
      </ListGroup>

      {error ? (
        <ErrorBox message="Không tải được thông tin mới nhất. Đang hiện dữ liệu đã lưu.">
          <Button
            title="Thử lại"
            variant="text"
            onPress={() => refetch()}
            loading={isFetching}
          />
        </ErrorBox>
      ) : null}
    </Screen>
  );
}

function InfoRow({ label, value, badge }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueWrap}>
        <Text style={styles.value}>{value || "—"}</Text>
        {badge}
      </View>
    </View>
  );
}

function VerifiedBadge() {
  return (
    <View style={styles.verified}>
      <Ionicons name="checkmark-circle" size={14} color={colors.success} />
      <Text style={styles.verifiedText}>Đã xác minh</Text>
    </View>
  );
}

function EditButton() {
  return (
    <Pressable
      onPress={() => router.push("/profile/edit")}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
    >
      <Text style={styles.editText}>Sửa</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  pressed: { opacity: 0.6 },
  top: { alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  name: { ...textStyles.title, color: colors.text, marginTop: spacing.sm },
  code: { ...textStyles.body, color: colors.textSecondary },
  row: { gap: 2, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  label: { ...textStyles.caption, color: colors.textSecondary },
  valueWrap: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  value: { ...textStyles.body, fontSize: 15, color: colors.text },
  verified: { flexDirection: "row", alignItems: "center", gap: 4 },
  verifiedText: { ...textStyles.label, color: colors.success },
  editButton: {
    height: 40,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
  editText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.accent,
  },
});
