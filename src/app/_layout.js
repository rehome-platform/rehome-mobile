import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
} from "@expo-google-fonts/be-vietnam-pro";
import { queryClient } from "@/lib/query/queryClient";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/constants/roles";
import { BootSplash } from "@/components/ui/BootSplash";

// Mở app không kèm đường dẫn → mặc định vào nhóm (member) (tab Mua sắm).
// Không khai báo thì Expo Router lấy nhóm đứng đầu theo bảng chữ cái là "(auth)" → khách bị đưa vào màn Đăng nhập.
export const unstable_settings = {
  anchor: "(member)",
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    useAuthStore.getState().bootstrap(); // khôi phục phiên khi mở app
  }, []);

  // Font xong là ẩn splash native ngay; phần khôi phục phiên (có thể lâu) hiện bằng BootSplash
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null; // splash native vẫn đang hiện (thường < 1 giây)
  if (status === "loading") return <BootSplash />; // AU-01: đang kiểm tra đăng nhập

  const isAuthed = status === "authenticated";
  const isOrg = isAuthed && user?.role === ROLES.ORGANIZATION;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Guest + Member */}
        <Stack.Protected guard={!isOrg}>
          <Stack.Screen name="(member)" />
        </Stack.Protected>
        {/* Chỉ khi CHƯA đăng nhập */}
        <Stack.Protected guard={!isAuthed}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        {/* Chỉ tài khoản Tổ chức */}
        <Stack.Protected guard={isOrg}>
          <Stack.Screen name="(org)" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
