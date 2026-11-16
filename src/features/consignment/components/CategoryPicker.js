import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { Button } from "@/components/ui/Button";
import { CATEGORY_GROUPS, groupOfCategory } from "@/constants/consignItem";
import { useCategoryOptions } from "@/features/catalog/hooks/useCatalogOptions";

// Bước "Danh mục": chọn NHÓM (ô to có biểu tượng) → chọn loại cụ thể (chip).
// value = categoryId; onChange({ categoryId, categoryName, group })
export function CategoryPicker({ value, onChange }) {
  const categories = useCategoryOptions();
  const list = categories.data ?? [];
  const current = list.find((c) => c.value === value);
  const [group, setGroup] = useState(
    current ? groupOfCategory(current.label) : null,
  );

  // Gom theo nhóm; bỏ tên trùng (dữ liệu BE đang seed trùng) để không hiện 2 chip giống nhau
  const byGroup = useMemo(() => {
    const map = {};
    const seen = new Set();
    for (const c of list) {
      const name = c.label.trim().toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);
      const g = groupOfCategory(c.label);
      (map[g] ??= []).push(c);
    }
    return map;
  }, [list]);

  if (categories.isPending) {
    return <ActivityIndicator color={colors.primary} style={styles.loading} />;
  }
  if (categories.isError) {
    return (
      <ErrorBox message={categories.error.message}>
        <Button
          title="Thử lại"
          variant="secondary"
          onPress={() => categories.refetch()}
        />
      </ErrorBox>
    );
  }

  const groups = CATEGORY_GROUPS.filter((g) => byGroup[g.key]?.length);
  const pick = (id) => {
    const c = list.find((x) => x.value === id);
    onChange({ categoryId: id, categoryName: c?.label ?? "", group });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Món của bạn thuộc loại nào?</Text>
      <View style={styles.grid}>
        {groups.map((g) => {
          const selected = g.key === group;
          return (
            <Pressable
              key={g.key}
              onPress={() => setGroup(g.key)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={({ pressed }) => [
                styles.tile,
                selected && styles.tileSelected,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name={g.icon}
                size={28}
                color={selected ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[styles.tileText, selected && styles.tileTextSelected]}
              >
                {g.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {group ? (
        <View style={styles.section}>
          <Text style={styles.sub}>Chọn loại cụ thể</Text>
          <ChipGroup
            options={byGroup[group] ?? []}
            value={value}
            onChange={pick}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  wrap: { gap: spacing.lg },
  title: { ...textStyles.heading, color: colors.text },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    width: "31.5%",
    aspectRatio: 1.1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
  },
  tileSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.highlight,
  },
  pressed: { opacity: 0.8 },
  tileText: { ...textStyles.body, color: colors.textSecondary },
  tileTextSelected: { fontFamily: fonts.semibold, color: colors.primary },
  section: { gap: spacing.sm },
  sub: { ...textStyles.label, color: colors.textSecondary },
});
