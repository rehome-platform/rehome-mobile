import { Alert } from "react-native";
import { HeaderIconButton } from "./HeaderIconButton";

// Nút ⋯ trên header → bảng chọn (như Facebook / Shopee). Gom hành động ít dùng / dễ bấm nhầm (Báo cáo…)
// actions = [{ text, onPress, destructive }]
export function MoreMenuButton({ title, actions }) {
  const open = () =>
    Alert.alert(title, undefined, [
      ...actions.map((a) => ({
        text: a.text,
        onPress: a.onPress,
        style: a.destructive ? "destructive" : "default",
      })),
      { text: "Đóng", style: "cancel" },
    ]);
  return (
    <HeaderIconButton
      icon="ellipsis-horizontal"
      label="Tuỳ chọn khác"
      onPress={open}
    />
  );
}
