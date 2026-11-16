import { Alert } from "react-native";
import { router } from "expo-router";
import { setPendingRedirect } from "@/stores/pendingRedirect";

// Guest bấm thao tác cần tài khoản → hỏi đăng nhập; xong mở lại đúng màn (href)
export const askLogin = (
  href,
  title = "Cần đăng nhập",
  message = "Đăng nhập để tiếp tục.",
) =>
  Alert.alert(title, message, [
    { text: "Để sau", style: "cancel" },
    {
      text: "Đăng nhập",
      onPress: () => {
        setPendingRedirect(href);
        router.push("/login");
      },
    },
  ]);
