import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";

const COLUMNS = 4;

// Lưới ảnh sản phẩm. value: mảng uri (ảnh mới trong máy) hoặc url (ảnh đã upload). Hết chỗ thì ẩn ô "+"
export function PhotoPicker({ value = [], onChange, max, error }) {
  const { width } = useWindowDimensions();
  const size = (width - spacing.lg * 2 - spacing.sm * (COLUMNS - 1)) / COLUMNS; // trừ lề màn + khoảng cách
  const remaining = max - value.length;

  // Bỏ ảnh trùng (chọn lại đúng ảnh đã có) rồi cắt về tối đa max
  const add = (uris) =>
    onChange([...new Set([...value, ...uris])].slice(0, max));

  const remove = (uri) => onChange(value.filter((u) => u !== uri));

  const fromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.7,
    });
    if (!res.canceled) add(res.assets.map((a) => a.uri));
  };

  const fromCamera = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted)
      return Alert.alert(
        "Chưa có quyền camera",
        "Bật quyền camera cho ReHome trong Cài đặt để chụp ảnh.",
      );
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!res.canceled) add([res.assets[0].uri]);
  };

  const choose = () =>
    Alert.alert(
      "Thêm ảnh sản phẩm",
      "Chụp rõ, đủ sáng, thấy được nhãn mác và tem thương hiệu.",
      [
        { text: "Huỷ", style: "cancel" },
        { text: "Chọn từ thư viện", onPress: fromLibrary },
        { text: "Chụp ảnh", onPress: fromCamera },
      ],
    );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Ảnh sản phẩm{" "}
        <Text style={styles.count}>
          ({value.length} / {max})
        </Text>
        <Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.grid}>
        {value.map((uri) => (
          <View key={uri}>
            <Image
              source={{ uri }}
              style={[styles.tile, { width: size, height: size }]}
            />
            <Pressable
              onPress={() => remove(uri)}
              hitSlop={8}
              style={styles.remove}
              accessibilityRole="button"
              accessibilityLabel="Xoá ảnh"
            >
              <Ionicons name="close" size={14} color={colors.onPrimary} />
            </Pressable>
          </View>
        ))}
        {remaining > 0 ? (
          <Pressable
            onPress={choose}
            accessibilityRole="button"
            accessibilityLabel="Thêm ảnh"
            style={({ pressed }) => [
              styles.tile,
              styles.add,
              { width: size, height: size },
              error && styles.addError,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="add" size={28} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <Text style={styles.helper}>
          Cần ảnh mặt trước, mặt sau, nhãn mác và tem thương hiệu. Ảnh càng rõ,
          kho duyệt càng nhanh.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  count: { color: colors.textSecondary },
  required: { color: colors.error },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: { borderRadius: radius.input, backgroundColor: colors.neutral },
  add: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  addError: { borderColor: colors.error },
  pressed: { opacity: 0.7 },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  helper: { ...textStyles.caption, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
});
