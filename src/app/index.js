import { useState } from "react";
import { View } from "react-native";
import { colors, spacing } from "@/theme";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const onSubmit = () => {
    const next = {};
    if (!email.trim()) next.email = "Vui lòng nhập email";
    if (!password) next.password = "Vui lòng nhập mật khẩu";
    setErrors(next);
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: spacing.lg,
        gap: spacing.lg,
        backgroundColor: colors.background,
      }}
    >
      <TextField
        label="Email"
        required
        placeholder="ban@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        label="Mật khẩu"
        required
        secure
        helper="Ít nhất 8 ký tự, có chữ và số"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <Button title="Đăng nhập" onPress={onSubmit} />
    </View>
  );
}
