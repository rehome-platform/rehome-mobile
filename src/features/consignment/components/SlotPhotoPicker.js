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
import { photoSlotsOf } from "@/constants/consignItem";

const OPTIONS = { mediaTypes: ["images"], quality: 0.7 };

// Hỏi chụp / chọn thư viện → mảng uri (huỷ → [])
async function pickPhotos({ multiple = false, limit = 1, title, message }) {
  const choice = await new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "Huỷ", style: "cancel", onPress: () => resolve(null) },
      { text: "Chọn từ thư viện", onPress: () => resolve("library") },
      { text: "Chụp ảnh", onPress: () => resolve("camera") },
    ]),
  );
  if (!choice) return [];
  if (choice === "camera") {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert(
        "Chưa có quyền camera",
        "Bật quyền camera cho ReHome trong Cài đặt để chụp ảnh.",
      );
      return [];
    }
    const res = await ImagePicker.launchCameraAsync(OPTIONS);
    return res.canceled ? [] : [res.assets[0].uri];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    ...OPTIONS,
    allowsMultipleSelection: multiple,
    selectionLimit: limit,
  });
  return res.canceled ? [] : res.assets.map((a) => a.uri);
}

function Tile({ uri, size, onRemove, children, onPress, error }) {
  if (uri) {
    return (
      <View>
        <Image source={{ uri }} style={[styles.tile, size]} />
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          style={styles.remove}
          accessibilityRole="button"
          accessibilityLabel="Xoá ảnh"
        >
          <Ionicons name="close" size={14} color={colors.onPrimary} />
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tile,
        styles.empty,
        size,
        error && styles.emptyError,
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

// Bước "Ảnh": mỗi khung một ảnh (Mặt trước, Mặt sau, Tem mác…) + "Ảnh khác" cho đủ max.
// value = { front, back, tag, defect, extra: [] }; showErrors = tô đỏ khung bắt buộc còn trống
export function SlotPhotoPicker({ group, value, onChange, max, showErrors }) {
  const { width } = useWindowDimensions();
  const slots = photoSlotsOf(group);
  const w = (width - spacing.lg * 2 - spacing.sm) / 2; // 2 cột
  const slotSize = { width: w, height: w * 0.85 };
  const extraW = (width - spacing.lg * 2 - spacing.sm * 3) / 4; // 4 cột
  const extraSize = { width: extraW, height: extraW };

  const photos = value ?? {};
  const extra = photos.extra ?? [];
  const used = slots.filter((s) => photos[s.key]).length + extra.length;
  const room = max - used;

  const setSlot = (key, uri) => onChange({ ...photos, extra, [key]: uri });
  const pickSlot = async (slot) => {
    const [uri] = await pickPhotos({
      title: slot.label,
      message: slot.hint,
    });
    if (uri) setSlot(slot.key, uri);
  };
  const pickExtra = async () => {
    const uris = await pickPhotos({
      multiple: true,
      limit: room,
      title: "Thêm ảnh khác",
      message: "Góc khác, chi tiết đẹp / lỗi của món.",
    });
    if (uris.length)
      onChange({
        ...photos,
        extra: [...extra, ...uris].slice(0, room + extra.length),
      });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Chụp ảnh theo khung</Text>
      <Text style={styles.desc}>
        Ảnh đúng món giúp ReHome duyệt nhanh. Khung có dấu * là bắt buộc.
      </Text>

      <View style={styles.grid}>
        {slots.map((slot) => (
          <View key={slot.key} style={[styles.slot, { width: w }]}>
            <Tile
              uri={photos[slot.key]}
              size={slotSize}
              onPress={() => pickSlot(slot)}
              onRemove={() => setSlot(slot.key, null)}
              error={showErrors && slot.required && !photos[slot.key]}
            >
              <Ionicons
                name="camera-outline"
                size={26}
                color={colors.primary}
              />
              <Text style={styles.slotHint} numberOfLines={2}>
                {slot.hint}
              </Text>
            </Tile>
            <Text style={styles.slotLabel}>
              {slot.label}
              {slot.required ? <Text style={styles.required}> *</Text> : null}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.sub}>
        Ảnh khác{" "}
        <Text style={styles.count}>
          ({used} / {max})
        </Text>
      </Text>
      <View style={styles.grid}>
        {extra.map((uri) => (
          <Tile
            key={uri}
            uri={uri}
            size={extraSize}
            onRemove={() =>
              onChange({ ...photos, extra: extra.filter((u) => u !== uri) })
            }
          />
        ))}
        {room > 0 ? (
          <Tile size={extraSize} onPress={pickExtra}>
            <Ionicons name="add" size={26} color={colors.primary} />
          </Tile>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...textStyles.heading, color: colors.text },
  desc: { ...textStyles.body, color: colors.textSecondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: { gap: spacing.xs },
  tile: { borderRadius: radius.input, backgroundColor: colors.neutral },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  emptyError: { borderColor: colors.error },
  pressed: { opacity: 0.7 },
  slotHint: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
  slotLabel: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  required: { color: colors.error },
  sub: { ...textStyles.label, color: colors.textSecondary },
  count: { color: colors.textSecondary },
  remove: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },
});
