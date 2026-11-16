import { StyleSheet } from "react-native";
import { router } from "expo-router";
import Constants from "expo-constants";
import { spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { ListGroup, ListItem } from "@/components/ui/ListItem";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

export default function SettingsScreen() {
  return (
    <Screen
      scroll
      header={<AppHeader title="Cài đặt" onBack={goBack} />}
      contentStyle={styles.content}
    >
      <ListGroup title="Tài khoản">
        <ListItem
          icon="person-outline"
          title="Hồ sơ cá nhân"
          onPress={() => router.push("/profile")}
        />
        <ListItem
          icon="lock-closed-outline"
          title="Đổi mật khẩu"
          onPress={() => router.push("/profile/change-password")}
        />
      </ListGroup>

      <ListGroup title="Khác">
        {/* Phiên bản lấy từ app.json ("version") */}
        <ListItem
          icon="information-circle-outline"
          title="Phiên bản ứng dụng"
          badge={Constants.expoConfig?.version ?? "—"}
        />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
});
