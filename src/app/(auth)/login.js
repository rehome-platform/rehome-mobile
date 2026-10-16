import { useState } from "react";
import { spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { authApi } from "@/features/auth/api/authApi";
import { tokenStorage } from "@/lib/storage/tokenStorage";
import { useAuthStore } from "@/stores/authStore";
import { router } from "expo-router";
import { AppHeader } from "@/components/ui/AppHeader";

export default function LoginTemp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const tokens = await authApi.login({ email: email.trim(), password });
      await tokenStorage.save(tokens); // lưu trước để getMe() đọc được token
      const user = await authApi.getMe();
      await useAuthStore.getState().signIn({ ...tokens, user }); // → (auth) bị khoá, tự sang (member)
    } catch (e) {
      setError(`${e.status} · ${e.code} · ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      header={
        <AppHeader
          title="Đăng nhập (tạm)"
          onBack={() =>
            router.canGoBack() ? router.back() : router.replace("/")
          }
        />
      }
      footer={<Button title="Đăng nhập" onPress={onSubmit} loading={loading} />}
      contentStyle={{ gap: spacing.lg }}
    >
      <TextField
        label="Email"
        required
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Mật khẩu"
        required
        secure
        value={password}
        onChangeText={setPassword}
        error={error}
      />
    </Screen>
  );
}
