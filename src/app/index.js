import { useState } from "react";
import { Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export default function Index() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Screen
      scroll
      contentStyle={{ justifyContent: "flex-end", gap: spacing.lg }}
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        <Text style={[textStyles.title, { color: colors.primary }]}>
          Thử Screen
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>
          Form nằm ở đáy để kiểm tra bàn phím
        </Text>
      </View>
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
      />
      <Button title="Đăng nhập" onPress={() => {}} />
    </Screen>
  );
}
