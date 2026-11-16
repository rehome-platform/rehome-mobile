import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "@/features/catalog/api/catalogApi";

// Danh mục / thương hiệu ít đổi → giữ cache 1 giờ, đổi sang dạng { value, label } cho SelectField
const toOptions = (items) => items.map((i) => ({ value: i.id, label: i.name }));
const HOUR = 60 * 60 * 1000;
// Danh sách RỖNG không giữ: BE đang dựng lại dữ liệu (reset DB) thì lần sau mở màn hỏi lại ngay
const keepIfNotEmpty = (q) => (q.state.data?.length ? HOUR : 0);

export const useCategoryOptions = () =>
  useQuery({
    queryKey: ["catalog", "categories"],
    queryFn: catalogApi.getCategories,
    select: toOptions,
    staleTime: keepIfNotEmpty,
  });

export const useBrandOptions = () =>
  useQuery({
    queryKey: ["catalog", "brands"],
    queryFn: catalogApi.getBrands,
    select: toOptions,
    staleTime: keepIfNotEmpty,
  });
