import { Text } from "react-native";
import { router } from "expo-router";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

export default function MemberHome() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <Screen contentStyle={{ justifyContent: "center", gap: spacing.md }}>
      {status === "authenticated" ? (
        <>
          <Text style={[textStyles.title, { color: colors.primary }]}>
            Xin chào {user?.fullName}
          </Text>
          <Text style={[textStyles.body, { color: colors.textSecondary }]}>
            {user?.email} · {user?.role} · {user?.memberCode}
          </Text>
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
