import { useState } from "react";
import { View } from "react-native";
import { colors, spacing } from "@/theme";
import { Button } from "@/components/ui/Button";

export default function Index() {
  const [loading, setLoading] = useState(false);

  const fakeSubmit = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000); // giả lập gọi API 2 giây
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: spacing.lg,
        gap: spacing.md,
        backgroundColor: colors.background,
      }}
    >
      <Button title="Đăng nhập" onPress={fakeSubmit} loading={loading} />
      <Button title="Tạo tài khoản" variant="secondary" onPress={() => {}} />
      <Button title="Quên mật khẩu?" variant="text" onPress={() => {}} />
      <Button title="Đang khoá" disabled onPress={() => {}} />
    </View>
  );
}
