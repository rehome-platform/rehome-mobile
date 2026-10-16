import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, textStyles } from "@/theme";

// Ô ảnh CCCD (mặt trước / sau). Trống: viền đứt + icon camera. Có ảnh: xem trước + nút ✕
export function CccdSlot({ label, file, error = false, onPress, onRemove }) {
  return (
    <View style={styles.wrapper}>
      <View>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={file ? `Đổi ảnh ${label}` : `Thêm ảnh ${label}`}
          style={({ pressed }) => [
            styles.box,
            !file && styles.empty,
            error && styles.boxError,
            pressed && styles.pressed,
          ]}
        >
          {file ? (
            <Image source={{ uri: file.uri }} style={styles.image} />
          ) : (
            <>
              <Ionicons
                name="camera-outline"
                size={28}
                color={colors.primary}
              />
              <Text style={styles.hint}>Thêm ảnh</Text>
            </>
          )}
        </Pressable>
        {file ? (
          <Pressable
            onPress={onRemove}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Xoá ảnh ${label}`}
            style={styles.remove}
          >
            <Ionicons name="close" size={16} color={colors.onPrimary} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, gap: spacing.xs },
  box: {
    aspectRatio: 1.58, // tỉ lệ thẻ CCCD (85,6 × 54 mm)
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  empty: { borderStyle: "dashed", borderColor: colors.primary },
  boxError: { borderColor: colors.error },
  pressed: { opacity: 0.8 },
  image: { width: "100%", height: "100%" },
  hint: { ...textStyles.label, color: colors.primary },
  remove: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  label: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
