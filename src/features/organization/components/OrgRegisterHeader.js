import { View } from "react-native";
import { router } from "expo-router";
import { AppHeader } from "@/components/ui/AppHeader";
import { Stepper } from "@/components/ui/Stepper";
import { ORG_REGISTER_STEPS } from "@/features/organization/constants";

const defaultBack = () =>
  router.canGoBack() ? router.back() : router.replace("/register");

// Header chung của 4 bước đăng ký tổ chức: AppHeader + Stepper. step: 0..3
export function OrgRegisterHeader({ step, onBack = defaultBack }) {
  return (
    <View>
      <AppHeader title="Đăng ký tổ chức" onBack={onBack} />
      <Stepper steps={ORG_REGISTER_STEPS} current={step} />
    </View>
  );
}
