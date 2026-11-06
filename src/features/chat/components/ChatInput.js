import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { colors, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { CHAT_LIMITS } from "@/constants/chat";

const MAX_IMAGES = 4; // ảnh mỗi tin (3.13.2: ảnh đính kèm tuỳ chọn)

// Ô nhập cố định đáy: nút ảnh · ô chữ · Gửi. Ảnh đã chọn hiện hàng nhỏ phía trên, bấm ✕ để bỏ.
// images = mảng uri ảnh trong máy. Gửi được khi có chữ HOẶC có ảnh
export function ChatInput({ value, onChange, onSend, images = [], onImages }) {
  const pickImages = async () => {
    const room = MAX_IMAGES - images.length;
    if (room <= 0)
      return Alert.alert("Đủ ảnh rồi", `Mỗi tin gửi tối đa ${MAX_IMAGES} ảnh.`);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 0.7,
    });
    if (!res.canceled)
      onImages?.(
        [...images, ...res.assets.map((a) => a.uri)].slice(0, MAX_IMAGES),
      );
  };
  const removeImage = (uri) => onImages?.(images.filter((u) => u !== uri));

  return (
    <View style={styles.wrap}>
      {images.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.previews}
          keyboardShouldPersistTaps="handled"
        >
          {images.map((uri) => (
            <View key={uri}>
              <Image source={{ uri }} style={styles.preview} />
              <Pressable
                onPress={() => removeImage(uri)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Bỏ ảnh này"
                style={styles.remove}
              >
                <Ionicons name="close" size={14} color={colors.onPrimary} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.row}>
        {onImages ? (
          <Pressable
            onPress={pickImages}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Gửi ảnh"
            style={({ pressed }) => [
              styles.imageBtn,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="image-outline" size={24} color={colors.primary} />
          </Pressable>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Nhập tin nhắn…"
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={CHAT_LIMITS.MAX_CHARS}
          style={styles.input}
        />
        <Button
          title="Gửi"
          disabled={!value.trim() && !images.length}
          onPress={onSend}
          style={styles.send}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  previews: { gap: spacing.sm, paddingTop: 6, paddingRight: 6 },
  preview: { width: 64, height: 64, borderRadius: radius.input },
  remove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.text,
  },
  row: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  imageBtn: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.6 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110, // ~4 dòng
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    ...textStyles.body,
    color: colors.text,
  },
  send: { minHeight: 44, paddingHorizontal: spacing.lg },
});
