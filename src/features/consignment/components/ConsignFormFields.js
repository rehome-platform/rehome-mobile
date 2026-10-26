import { StyleSheet, View } from "react-native";
import { Controller } from "react-hook-form";
import { spacing } from "@/theme";
import { TextField } from "@/components/ui/TextField";
import { MoneyField } from "@/components/ui/MoneyField";
import { SelectField } from "@/components/ui/SelectField";
import { NoteBox } from "@/components/ui/NoteBox";
import { CONSIGN_LIMITS } from "@/constants/consignment";
import {
  useBrandOptions,
  useCategoryOptions,
} from "@/features/catalog/hooks/useCatalogOptions";
import { PhotoPicker } from "./PhotoPicker";

// Các ô thông tin sản phẩm — dùng chung cho Tạo form (KG-02 bước 1) và Sửa form (KG-05)
export function ConsignFormFields({ control, errors }) {
  const categories = useCategoryOptions();
  const brands = useBrandOptions();

  return (
    <>
      <Controller
        control={control}
        name="photos"
        render={({ field }) => (
          <PhotoPicker
            value={field.value}
            onChange={field.onChange}
            max={CONSIGN_LIMITS.MAX_PHOTOS}
            error={errors.photos?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="productName"
        render={({ field }) => (
          <TextField
            label="Tên sản phẩm"
            required
            placeholder="VD: Áo khoác dạ nữ"
            maxLength={100}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.productName?.message}
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <SelectField
              label="Danh mục"
              required
              options={categories.data ?? []}
              loading={categories.isPending}
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryId?.message}
              style={styles.half}
            />
          )}
        />
        <Controller
          control={control}
          name="brandId"
          render={({ field }) => (
            <SelectField
              label="Thương hiệu"
              required
              searchable
              options={brands.data ?? []}
              loading={brands.isPending}
              value={field.value}
              onChange={field.onChange}
              error={errors.brandId?.message}
              style={styles.half}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="desiredPrice"
        render={({ field }) => (
          <MoneyField
            label="Giá mong muốn"
            required
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.desiredPrice?.message}
          />
        )}
      />
      <NoteBox>
        Đây chỉ là giá bạn đề xuất. Moderator sẽ kiểm định và chốt giá bán cuối
        cùng với bạn tại địa điểm ký gửi. Bạn có quyền từ chối nếu không đồng ý.
      </NoteBox>

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField
            label="Mô tả"
            required
            multiline
            maxLength={1000}
            placeholder="Size, tình trạng, lỗi nếu có (VD: size M, mặc 2 lần, không lỗi)"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.description?.message}
          />
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
});
