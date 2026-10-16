import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListItem } from "@/components/ui/ListItem";
import { useAuthStore } from "@/stores/authStore";

// Mục của phase sau: hiện mờ + nhãn "Sắp có". Phase nào xong thì bật onPress + thay nhãn bằng số đếm thật.
// Ví (Phase 4) ẩn hẳn ở Phase 1 — số tiền giả dễ gây hiểu nhầm.
const COMING_SOON = [
  { icon: "receipt-outline", title: "Đơn hàng của tôi" },
  { icon: "cube-outline", title: "Hàng ký gửi" },
  { icon: "return-down-back-outline", title: "Yêu cầu trả hàng" },
  { icon: "location-outline", title: "Địa chỉ giao hàng" },
  { icon: "images-outline", title: "Ảnh thử đồ đã lưu" },
  { icon: "heart-outline", title: "Tổ chức đang theo dõi" },
  { icon: "chatbubbles-outline", title: "Tin nhắn" },
];
// Bấm mục chưa làm → thông báo ngắn. Android: Toast (tự tắt, không chặn); iOS không có Toast → dùng Alert
const showComingSoon = (title) => {
  const message = `${title} sẽ có ở phiên bản sau.`;
  if (Platform.OS === "android") ToastAndroid.show(message, ToastAndroid.SHORT);
  else Alert.alert("Sắp có", message);
};

export default function AccountScreen() {
  const status = useAuthStore((s) => s.status);
  return status === "authenticated" ? <MemberAccount /> : <GuestAccount />;
}

function GuestAccount() {
  return (
    <Screen
      scroll
      edges={["top"]}
      header={<AppHeader title="Cá nhân" />}
      contentStyle={styles.content}
    >
      <View style={styles.guestCard}>
        <Ionicons
          name="person-circle-outline"
          size={64}
          color={colors.primary}
        />
        <Text style={styles.guestTitle}>Bạn đang xem với tư cách khách</Text>
        <Text style={styles.guestDesc}>
          Đăng nhập để mua đồ, ký gửi và quyên góp cho tổ chức từ thiện.
        </Text>
        <Button
          title="Đăng nhập"
          onPress={() => router.push("/login")}
          style={styles.fullWidth}
        />
        <Button
          title="Tạo tài khoản"
          variant="secondary"
          onPress={() => router.push("/register")}
          style={styles.fullWidth}
        />
      </View>
    </Screen>
  );
}

function MemberAccount() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  // Hỏi xác nhận trước khi đăng xuất (nút đỏ "destructive" như mọi app)
  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  return (
    <Screen
      scroll
      edges={["top"]}
      header={<AppHeader title="Cá nhân" right={<SettingsButton />} />}
      contentStyle={styles.content}
    >
      {/* Thẻ đầu trang → PR-02. BE chưa có createdAt nên chưa hiện "tham gia MM/YYYY" [CHỜ BE] */}
      <Pressable
        onPress={() => router.push("/profile")}
        accessibilityRole="button"
        accessibilityLabel="Xem hồ sơ cá nhân"
        style={({ pressed }) => [styles.profileCard, pressed && styles.pressed]}
      >
        <Avatar uri={user?.avatarUrl} name={user?.fullName} size={56} />
        <View style={styles.profileTexts}>
          <Text style={styles.name} numberOfLines={1}>
            {user?.fullName}
          </Text>
          <Text style={styles.code}>{user?.memberCode}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      <ListGroup>
        <ListItem
          icon="id-card-outline"
          title="Mã Member của tôi"
          description="Đọc cho nhân viên khi tới kho"
          onPress={() => router.push("/profile/member-code")}
        />
      </ListGroup>

      <ListGroup title="Sắp có">
        {COMING_SOON.map((item) => (
          <ListItem
            key={item.title}
            icon={item.icon}
            title={item.title}
            badge="Sắp có"
            muted
            onPress={() => showComingSoon(item.title)}
          />
        ))}
      </ListGroup>

      <ListGroup>
        <ListItem
          icon="log-out-outline"
          title="Đăng xuất"
          danger
          showChevron={false}
          onPress={confirmSignOut}
        />
      </ListGroup>
    </Screen>
  );
}

function SettingsButton() {
  return (
    <Pressable
      onPress={() => router.push("/settings")}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Cài đặt"
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Ionicons name="settings-outline" size={22} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  pressed: { opacity: 0.85 },
  guestCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  guestTitle: {
    ...textStyles.heading,
    color: colors.text,
    textAlign: "center",
  },
  guestDesc: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  fullWidth: { alignSelf: "stretch" },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  profileTexts: { flex: 1, gap: 2 },
  name: { ...textStyles.heading, color: colors.text },
  code: { ...textStyles.body, color: colors.textSecondary },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
  },
});
