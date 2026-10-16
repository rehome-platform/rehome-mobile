import { Text } from "react-native";
import { router } from "expo-router";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

// [TẠM] thay bằng PR-01 ở bước B1b
export default function AccountTab() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <Screen
      edges={["top"]}
      contentStyle={{ justifyContent: "center", gap: spacing.md }}
    >
      {status === "authenticated" ? (
        <>
          <Text style={[textStyles.title, { color: colors.primary }]}>
            Xin chào {user?.fullName}
          </Text>
          <Button
            title="Đổi mật khẩu"
            variant="secondary"
            onPress={() => router.push("/profile/change-password")}
          />
          <Button
            title="Đăng xuất"
            variant="secondary"
            onPress={() => signOut()}
          />
        </>
      ) : (
        <>
          <Text style={[textStyles.title, { color: colors.primary }]}>
            Bạn đang xem với tư cách khách
          </Text>
          <Button title="Đăng nhập" onPress={() => router.push("/login")} />
        </>
      )}
    </Screen>
  );
}
