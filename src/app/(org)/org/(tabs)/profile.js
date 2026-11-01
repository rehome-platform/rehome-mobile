import { Alert } from "react-native";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { OrgTabPlaceholder } from "@/features/organization/components/OrgTabPlaceholder";

// [TẠM] N10 thay bằng OP-01. Giữ nút Đăng xuất — tổ chức đã xác minh không còn quay về /org
export default function OrgProfileTab() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const confirmSignOut = () =>
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
      { text: "Huỷ", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);

  return (
    <OrgTabPlaceholder
      title="Hồ sơ"
      icon="business-outline"
      description={`${user?.displayName ?? "Tổ chức"} · ${user?.email ?? ""}`}
      footer={
        <Button
          title="Đăng xuất"
          variant="secondary"
          onPress={confirmSignOut}
        />
      }
    />
  );
}
