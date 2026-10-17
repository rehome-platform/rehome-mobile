import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { CONSIGN_LIMITS } from "@/constants/consignment";
import { FormListSection } from "@/features/consignment/components/FormListSection";
import { ProductListSection } from "@/features/consignment/components/ProductListSection";
import { usePendingFormCount } from "@/features/consignment/hooks/usePendingFormCount";

const SECTIONS = [
  { value: "forms", label: "Form ký gửi" },
  { value: "products", label: "Sản phẩm ký gửi" },
];

export default function ConsignTabScreen() {
  const status = useAuthStore((s) => s.status);
  return status === "authenticated" ? <MemberConsign /> : <GuestConsign />;
}

function GuestConsign() {
  return (
    <Screen edges={["top"]} header={<AppHeader title="Ký gửi" />}>
      <EmptyState
        icon="cube-outline"
        title="Đăng nhập để ký gửi"
        description="Gửi đồ cũ tới kho ReHome: kho kiểm định, chụp ảnh và bán hộ bạn. Tiền về ví khi đơn hoàn thành."
      >
        <Button title="Đăng nhập" onPress={() => router.push("/login")} />
        <Button
          title="Tạo tài khoản"
          variant="secondary"
          onPress={() => router.push("/register")}
        />
      </EmptyState>
    </Screen>
  );
}

function MemberConsign() {
  const [section, setSection] = useState("forms"); // nhớ mục đang chọn trong lúc màn còn mở
  return (
    <Screen
      edges={["top"]}
      padded={false}
      header={
        <AppHeader
          title="Ký gửi"
          right={section === "forms" ? <CreateFormButton /> : null}
        />
      }
    >
      <View style={styles.segment}>
        <ChipGroup options={SECTIONS} value={section} onChange={setSection} />
      </View>
      {section === "forms" ? <FormListSection /> : <ProductListSection />}
    </Screen>
  );
}

// "+ Tạo form". Đủ 5 form chờ → giải thích lý do thay vì mở form (BE vẫn chặn 409 nếu lọt)
function CreateFormButton() {
  const pending = usePendingFormCount();
  const onPress = () => {
    if (pending.data >= CONSIGN_LIMITS.MAX_PENDING_FORMS) {
      return Alert.alert(
        "Chưa tạo thêm được",
        `Bạn đang có ${pending.data} form chờ duyệt (tối đa ${CONSIGN_LIMITS.MAX_PENDING_FORMS}). Chờ kho xử lý bớt rồi tạo tiếp nhé.`,
      );
    }
    router.push("/consign-forms/new");
  };
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      style={({ pressed }) => [styles.create, pressed && styles.pressed]}
    >
      <Text style={styles.createText}>+ Tạo form</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  create: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  createText: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.onPrimary,
  },
  pressed: { opacity: 0.8 },
});
