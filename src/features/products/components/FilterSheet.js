import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Button } from "@/components/ui/Button";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { MoneyField } from "@/components/ui/MoneyField";

const EMPTY = {
  categoryId: undefined,
  brandId: undefined,
  priceMin: undefined,
  priceMax: undefined,
};

// BR-03 · Bộ lọc. Sửa trên bản nháp; chỉ "Áp dụng" mới đổi bộ lọc thật.
// Màn cha chỉ render khi mở → mỗi lần mở, bản nháp lấy lại từ bộ lọc đang dùng.
// Ẩn Size, Tình trạng, Sắp xếp, Kho: API 49 chưa hỗ trợ / chưa có danh sách kho (PHASE3_GUIDE 0.4 #1)
export function FilterSheet({
  initial,
  categories = [],
  brands = [],
  onApply,
  onClose,
}) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initial);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  // Bấm lại chip đang chọn → bỏ chọn
  const toggle = (key) => (v) =>
    set({ [key]: draft[key] === v ? undefined : v });

  const priceError =
    draft.priceMin != null &&
    draft.priceMax != null &&
    draft.priceMin > draft.priceMax
      ? "Giá “Đến” phải lớn hơn hoặc bằng giá “Từ”."
      : null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fill} behavior="padding">
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Đóng"
        />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Bộ lọc</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <Section title="Danh mục">
              <ChipGroup
                options={categories}
                value={draft.categoryId}
                onChange={toggle("categoryId")}
              />
            </Section>
            <Section title="Thương hiệu">
              <ChipGroup
                options={brands}
                value={draft.brandId}
                onChange={toggle("brandId")}
              />
            </Section>
            <Section title="Khoảng giá">
              <View style={styles.priceRow}>
                <MoneyField
                  placeholder="Từ"
                  value={draft.priceMin}
                  onChange={(v) => set({ priceMin: v })}
                  style={styles.flex}
                />
                <Text style={styles.dash}>—</Text>
                <MoneyField
                  placeholder="Đến"
                  value={draft.priceMax}
                  onChange={(v) => set({ priceMax: v })}
                  style={styles.flex}
                />
              </View>
              {priceError ? (
                <Text style={styles.error}>{priceError}</Text>
              ) : null}
            </Section>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Đặt lại"
              variant="secondary"
              onPress={() => setDraft(EMPTY)}
              style={styles.flex}
            />
            <Button
              title="Áp dụng"
              onPress={() => onApply(draft)}
              disabled={!!priceError}
              style={styles.flex}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral,
  },
  title: { flex: 1, ...textStyles.heading, color: colors.text },
  body: { padding: spacing.lg, gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dash: { ...textStyles.body, color: colors.textSecondary },
  error: {
    ...textStyles.caption,
    fontFamily: fonts.medium,
    color: colors.error,
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
});
