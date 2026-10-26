import { useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Brightness from "expo-brightness";
import * as Clipboard from "expo-clipboard";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { MemberQr } from "@/features/profile/components/MemberQr";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/account");

// Mở màn → tăng độ sáng tối đa để nhân viên kho dễ đọc; rời màn → trả lại như cũ
function useMaxBrightness() {
  useFocusEffect(
    useCallback(() => {
      let previous;
      (async () => {
        try {
          previous = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1);
        } catch {} // máy không cho chỉnh thì bỏ qua, màn hình vẫn dùng được
      })();

      return () => {
        // Android: trả độ sáng của app về theo cài đặt hệ thống. iOS: đặt lại giá trị cũ
        if (Platform.OS === "android")
          Brightness.restoreSystemBrightnessAsync().catch(() => {});
        else if (previous !== undefined)
          Brightness.setBrightnessAsync(previous).catch(() => {});
      };
    }, []),
  );
}

export default function MemberCodeScreen() {
  const user = useAuthStore((s) => s.user);
  const code = user?.memberCode ?? "";
  useMaxBrightness();

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    showToast("Đã sao chép mã");
  };

  return (
    <Screen
      scroll
      header={<AppHeader title="Mã Member của tôi" onBack={goBack} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Sao chép mã"
            variant="secondary"
            onPress={copy}
            disabled={!code}
          />
          <Text style={styles.footerNote}>
            Màn này tự tăng độ sáng để dễ đọc tại quầy.
          </Text>
        </View>
      }
      contentStyle={styles.content}
    >
      <Text style={styles.guide}>
        Đưa mã QR cho nhân viên quét, hoặc đọc mã bên dưới khi tới địa điểm ký gửi,
        rút hàng, nhận hàng.
      </Text>

      <View style={styles.card} accessibilityLabel={`Mã Member ${code}`}>
        <MemberQr code={code} />
        <Text style={styles.cardLabel}>Mã Member</Text>
        <Text
          style={styles.code}
          selectable
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {code || "—"}
        </Text>
        <Text style={styles.name}>{user?.fullName}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingTop: spacing.lg },
  guide: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  card: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  cardLabel: {
    ...textStyles.label,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.sm,
  },

  code: {
    fontFamily: fonts.bold,
    fontSize: 44,
    lineHeight: 56,
    letterSpacing: 4,
    color: colors.text,
  },
  name: { ...textStyles.heading, color: colors.text },
  footer: { gap: spacing.sm },
  footerNote: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
