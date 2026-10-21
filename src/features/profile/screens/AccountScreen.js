import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ListGroup, ListItem } from "@/components/ui/ListItem";
import { useAuthStore } from "@/stores/authStore";
import { ORDER_TABS } from "@/constants/order";
import { useOrderCount } from "@/features/orders/hooks/useOrders";
import { WalletCard } from "@/features/wallet/components/WalletCard";
import { RETURN_TABS } from "@/constants/returns";
import { useReturnCount } from "@/features/returns/hooks/useReturns";
import { useTryonJobStore } from "@/stores/tryonJobStore";
import { useConversations } from "@/features/chat/hooks/useChat";
import { unreadTotal } from "@/features/chat/utils/chatRules";
import { BellButton } from "@/features/notifications/components/BellButton";

// Thẻ ví (Phase 4) hiện số dư khả dụng — WalletCard.
const SHIPPING_TAB = ORDER_TABS.find((t) => t.key === "SHIPPING");
const RETURN_ACTION_TAB = RETURN_TABS.find((t) => t.key === "ACTION");

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
  const shippingCount = useOrderCount(SHIPPING_TAB);
  const returnActionCount = useReturnCount(RETURN_ACTION_TAB);
  const hasNewTryon = useTryonJobStore((s) => s.hasNew);
  const chats = useConversations({ poll: true }); // badge "n chưa đọc" — hỏi lại 30 giây/lần
  const unread = unreadTotal(chats.data);

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
      header={
        <AppHeader
          title="Cá nhân"
          right={
            <View style={styles.headerActions}>
              <BellButton />
              <SettingsButton />
            </View>
          }
        />
      }
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
      <WalletCard />

      <ListGroup>
        <ListItem
          icon="id-card-outline"
          title="Mã Member của tôi"
          description="Đọc cho nhân viên khi tới kho"
          onPress={() => router.push("/profile/member-code")}
        />
        <ListItem
          icon="receipt-outline"
          title="Đơn hàng của tôi"
          badge={
            shippingCount.data ? `${shippingCount.data} đang giao` : undefined
          }
          onPress={() => router.push("/orders")}
        />
        <ListItem
          icon="return-down-back-outline"
          title="Yêu cầu trả hàng"
          badge={
            returnActionCount.data
              ? `${returnActionCount.data} cần bạn làm`
              : undefined
          }
          onPress={() => router.push("/returns")}
        />
        <ListItem
          icon="images-outline"
          title="Ảnh thử đồ đã lưu"
          badge={hasNewTryon ? "Mới" : undefined}
          onPress={() => router.push("/tryon/collection")}
        />
        <ListItem
          icon="heart-outline"
          title="Tổ chức đang theo dõi"
          onPress={() => router.push("/organizations/following")}
        />
        <ListItem
          icon="chatbubbles-outline"
          title="Tin nhắn"
          badge={unread ? `${unread} chưa đọc` : undefined}
          onPress={() => router.push("/messages")}
        />
        <ListItem
          icon="cube-outline"
          title="Hàng ký gửi"
          onPress={() => router.push("/consign")}
        />

        <ListItem
          icon="location-outline"
          title="Địa chỉ giao hàng"
          description="Nơi nhận hàng khi mua đồ"
          onPress={() => router.push("/addresses")}
        />
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
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
