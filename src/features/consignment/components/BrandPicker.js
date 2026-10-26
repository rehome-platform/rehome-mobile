import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { SelectField } from "@/components/ui/SelectField";
import { useBrandOptions } from "@/features/catalog/hooks/useCatalogOptions";

// Hãng hay gặp — hiện sẵn thành chip (chỉ hiện hãng có trong dữ liệu BE)
const POPULAR = [
  "Uniqlo",
  "Zara",
  "H&M",
  "Levi's",
  "Nike",
  "Adidas",
  "Mango",
  "Coolmate",
  "Canifa",
  "IVY moda",
];

// Bước "Thương hiệu": chip hãng phổ biến + "Thương hiệu khác" (danh sách có ô tìm).
// value = brandId; onChange({ brandId, brandName })
export function BrandPicker({ value, onChange }) {
  const brands = useBrandOptions();

  // Bỏ tên trùng (BE seed trùng) cho cả chip lẫn danh sách
  const list = useMemo(() => {
    const seen = new Set();
    return (brands.data ?? []).filter((b) => {
      const name = b.label.trim().toLowerCase();
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [brands.data]);

  const popular = useMemo(
    () =>
      POPULAR.map((name) =>
        list.find((b) => b.label.toLowerCase() === name.toLowerCase()),
      ).filter(Boolean),
    [list],
  );

  const pick = (id) => {
    const b = (brands.data ?? []).find((x) => x.value === id);
    onChange({ brandId: id, brandName: b?.label ?? "" });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Thương hiệu của món này?</Text>
      {popular.length ? (
        <ChipGroup options={popular} value={value} onChange={pick} />
      ) : null}
      <SelectField
        label="Thương hiệu khác"
        placeholder="Tìm thương hiệu"
        searchable
        options={list}
        loading={brands.isPending}
        value={value}
        onChange={pick}
      />
      <Text style={styles.hint}>
        Không rõ hoặc không có trong danh sách? Chọn "Khác".
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  title: { ...textStyles.heading, color: colors.text },
  hint: { ...textStyles.caption, color: colors.textSecondary },
});
