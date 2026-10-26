import { useEffect } from "react";
import {
  router,
  Stack,
  useRootNavigationState,
  useSegments,
} from "expo-router";
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
  const isAuthed = status === "authenticated";
  const isOrg = isAuthed && user?.role === ROLES.ORGANIZATION;
  const segments = useSegments();
  const navReady = !!useRootNavigationState()?.key; // Stack đã dựng xong mới điều hướng được

  useEffect(() => {
    useAuthStore.getState().bootstrap(); // khôi phục phiên khi mở app
  }, []);

  // Tổ chức đăng nhập / mở lại app khi đã đăng nhập: Stack.Protected khoá (member) + (auth) và đưa về
  // anchor "/" — nhóm (org) không có màn "/" → "Unmatched route". Chủ động đưa về màn đầu /org
  useEffect(() => {
    if (navReady && isOrg && segments[0] !== "(org)") router.replace("/org");
  }, [navReady, isOrg, segments]);

  // Font xong là ẩn splash native ngay; phần khôi phục phiên (có thể lâu) hiện bằng BootSplash
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);
  if (!fontsLoaded) return null; // splash native vẫn đang hiện (thường < 1 giây)
  if (status === "loading") return <BootSplash />; // AU-01: đang kiểm tra đăng nhập

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
