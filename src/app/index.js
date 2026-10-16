import { useState } from "react";
import { Text } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { api, unwrap } from "@/lib/api/client";

export default function Index() {
  const [result, setResult] = useState("Chưa gọi");
  const [loading, setLoading] = useState(false);

  const run = async (name, fn) => {
    setLoading(true);
    setResult(`${name}: đang gọi… (server Render có thể ngủ, chờ tới 30 giây)`);
    try {
      const data = await fn();
      setResult(`${name}: OK\n${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      // e là ApiError do client.js chuẩn hoá
      setResult(
        `${name}: LỖI\nstatus: ${e.status}\ncode: ${e.code}\nmessage: ${e.message}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll contentStyle={{ gap: spacing.md }}>
      <Text style={[textStyles.title, { color: colors.primary }]}>
        Thử lớp API
      </Text>
      <Button
        title="1. Login sai mật khẩu"
        loading={loading}
        onPress={() =>
          run("login sai", async () =>
            unwrap(
              await api.post("/api/auth/login", {
                email: "khongtontai@rehome.vn",
                password: "sai123456",
              }),
            ),
          )
        }
      />
      <Button
        title="2. GET /members/me (chưa đăng nhập)"
        variant="secondary"
        loading={loading}
        onPress={() =>
          run("members/me", async () => unwrap(await api.get("/members/me")))
        }
      />
      <Text style={[textStyles.body, { color: colors.text }]}>{result}</Text>
    </Screen>
  );
}
