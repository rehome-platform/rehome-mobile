import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

const OPTIONS = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [16, 9], // khung ảnh bìa ở OC-03 / CD-04
  quality: 0.8,
};

// Ảnh bìa chiến dịch (OC-02 / OC-04, không bắt buộc): ô viền đứt "Chụp hoặc chọn ảnh"; có ảnh → xem trước + Đổi / Xoá.
// value = đường dẫn ảnh trong máy hoặc URL cũ; onChange(uri | null)
export function CoverPicker({ value, onChange }) {
  const pick = async (fromCamera) => {
    if (fromCamera) {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted)
        return Alert.alert(
          "Chưa có quyền máy ảnh",
          "Bật quyền máy ảnh cho ReHome trong Cài đặt, hoặc chọn ảnh có sẵn.",
        );
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(OPTIONS)
      : await ImagePicker.launchImageLibraryAsync(OPTIONS);
    if (!result.canceled) onChange(result.assets[0].uri);
  };

  const choose = () =>
    Alert.alert("Ảnh bìa", undefined, [
      { text: "Chụp ảnh", onPress: () => pick(true) },
      { text: "Chọn từ thư viện", onPress: () => pick(false) },
      { text: "Huỷ", style: "cancel" },
    ]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Ảnh bìa</Text>
      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={StyleSheet.absoluteFill} />
          <View style={styles.actions}>
            <Pressable onPress={choose} style={styles.action} hitSlop={8}>
              <Text style={styles.actionText}>Đổi ảnh</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(null)}
              style={styles.action}
              hitSlop={8}
            >
              <Text style={styles.actionText}>Xoá</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={choose}
          accessibilityRole="button"
          style={({ pressed }) => [styles.empty, pressed && styles.pressed]}
        >
          <Ionicons name="add" size={28} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Chụp hoặc chọn ảnh</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  empty: {
    aspectRatio: 16 / 9,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.textSecondary,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  emptyText: { ...textStyles.caption, color: colors.textSecondary },
  preview: {
    aspectRatio: 16 / 9,
    overflow: "hidden",
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  actions: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.sm,
  },
  action: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  actionText: {
    ...textStyles.caption,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
