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

SplashScreen.preventAutoHideAsync(); // giữ splash native cho tới khi sẵn sàng

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

  const ready = fontsLoaded && status !== "loading";
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null; // AU-01: splash native vẫn đang hiện

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
        {/* (org-status), (org): thêm khi làm phần tổ chức */}
      </Stack>
    </QueryClientProvider>
  );
}
