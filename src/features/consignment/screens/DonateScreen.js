import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { colors, fonts, radius, spacing, textStyles, tones } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { RadioCard } from "@/components/ui/RadioCard";
import { Checkbox } from "@/components/ui/Checkbox";
import { NoteBox } from "@/components/ui/NoteBox";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import { formatVnd } from "@/utils/money";
import { ERROR_CODES } from "@/constants/errorCodes";
import { DONATE_CASE, donateCaseOf } from "@/utils/consignment";
import { consignmentApi } from "../api/consignmentApi";
import { consignKeys } from "../api/queryKeys";
import { DONATE_ENABLED, donateApi } from "../api/donateApi";

// Câu riêng theo trường hợp (đặc tả 11/11): phí rút hàng đã trả KHÔNG hoàn [CHỜ LEAD chốt], tiền đền giữ nguyên
const CASE_NOTE = {
  [DONATE_CASE.ON_SALE]: "Món được gỡ khỏi sàn ngay, không ai mua được nữa.",
  [DONATE_CASE.END_OF_TERM]:
    "Thay cho việc chọn Nhận lại / Ký gửi lại ở cuối kỳ. Bạn không phải đến lấy hàng.",
  [DONATE_CASE.WITHDRAWAL]:
    "Yêu cầu rút hàng được đóng lại, bạn không phải đến lấy. Phí rút hàng đã trả (nếu có) không được hoàn.",
  [DONATE_CASE.TAKE_BACK]:
    "Thay cho việc đến địa điểm ký gửi nhận lại hàng. Bạn không phải đi lại.",
  [DONATE_CASE.DEGRADED]:
    "Tiền đền đã cộng vào ví vẫn giữ nguyên, chỉ món hàng được chuyển sang quyên góp.",
};

// Lỗi BE (409) → câu dễ hiểu; còn lại hiện message của BE
const FRIENDLY_ERROR = {
  [ERROR_CODES.PRODUCT_NOT_DONATABLE]:
    "Món này hiện không quyên góp được (có thể vừa có người đặt mua hoặc đã đổi trạng thái). Tải lại để xem tình trạng mới.",
  [ERROR_CODES.WITHDRAWAL_PENDING_APPROVAL]:
    "Yêu cầu rút hàng của món này còn chờ địa điểm ký gửi duyệt. Chờ có kết quả rồi mới quyên góp được.",
  [ERROR_CODES.CAMPAIGN_NOT_ACCEPTING]:
    "Chiến dịch vừa đóng hoặc hết hạn nhận đồ. Chọn chiến dịch khác.",
  [ERROR_CODES.CAMPAIGN_HIDDEN]:
    "Chiến dịch này hiện không còn nhận đồ. Chọn chiến dịch khác.",
  [ERROR_CODES.CAMPAIGN_NOT_AT_WAREHOUSE]:
    "Chiến dịch này không nhận đồ tại địa điểm đang giữ món. Chọn chiến dịch khác.",
};

const goBackTo = (id) => () =>
  router.canGoBack() ? router.back() : router.replace(`/my-products/${id}`);

// Quyên góp món ký gửi (/my-products/[id]/donate): chọn chiến dịch đang nhận đồ TẠI địa điểm đang giữ món →
// tên / ẩn danh → xác nhận. Không hoàn tác: món thuộc về tổ chức, ReHome chỉ bàn giao (không bán)
export default function DonateScreen() {
  const { id } = useLocalSearchParams();
  const status = useAuthStore((s) => s.status);
  const queryClient = useQueryClient();
  const goBack = goBackTo(id);
  const [campaignId, setCampaignId] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  const [formError, setFormError] = useState(null);

  const product = useQuery({
    queryKey: consignKeys.product(id),
    queryFn: () => consignmentApi.getProduct(id),
    enabled: status === "authenticated" && !!id,
  });
  const warehouseId = product.data?.warehouseId;
  const campaigns = useQuery({
    queryKey: consignKeys.donateCampaigns(warehouseId),
    queryFn: () => donateApi.getCampaignsAtWarehouse(warehouseId),
    enabled: !!warehouseId,
  });

  const donate = useMutation({
    mutationFn: (campaign) =>
      donateApi.donateProduct(id, { campaign, isAnonymous: anonymous }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["consign"] });
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
    },
  });

  if (status !== "authenticated") return <Redirect href="/login" />;

  const header = <AppHeader title="Quyên góp món ký gửi" onBack={goBack} />;
  if (!DONATE_ENABLED) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="gift-outline"
          title="Sắp có"
          description="Tính năng quyên góp món ký gửi đang được hoàn thiện."
        >
          <Button title="Quay lại" variant="secondary" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }
  if (product.isPending || (warehouseId && campaigns.isPending)) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  const loadError = product.error ?? campaigns.error;
  if (loadError) {
    return (
      <Screen header={header}>
        <ErrorBox message={loadError.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => {
              product.refetch();
              campaigns.refetch();
            }}
          />
        </ErrorBox>
      </Screen>
    );
  }

  const p = product.data;
  const donateCase = donateCaseOf(p);
  if (!donateCase) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="gift-outline"
          title="Món này hiện không quyên góp được"
          description="Chỉ quyên góp được khi món đang bán chưa có đơn, đang chờ bạn quyết định cuối kỳ, hoặc đang chờ bạn đến lấy."
        >
          <Button title="Quay lại" variant="secondary" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  const list = campaigns.data ?? [];
  const selected = list.find((c) => c.id === campaignId) ?? null;

  const submit = () => {
    if (!selected) return setFormError("Chọn một chiến dịch nhận đồ");
    setFormError(null);
    Alert.alert(
      "Quyên góp món này?",
      `"${p.name}" sẽ được giao cho ${selected.organization?.displayName ?? "tổ chức"} qua chiến dịch "${selected.title}".\n\nBạn từ bỏ quyền sở hữu, không nhận tiền và không đổi lại được.`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Quyên góp",
          style: "destructive",
          onPress: () =>
            donate.mutate(selected, {
              onSuccess: () => {
                showToast(`Đã quyên góp cho ${selected.title}`);
                router.replace(`/my-products/${id}`);
              },
              onError: (e) => setFormError(FRIENDLY_ERROR[e.code] ?? e.message),
            }),
        },
      ],
    );
  };

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        list.length ? (
          <Button
            title="Quyên góp"
            loading={donate.isPending}
            onPress={submit}
          />
        ) : null
      }
    >
      <View style={styles.productRow}>
        {p.photoUrl ? (
          <Image source={{ uri: p.photoUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumb} />
        )}
        <View style={styles.flex}>
          <Text style={styles.strong}>{p.name}</Text>
          <Text style={styles.caption}>
            {[
              p.brandName,
              p.size && `Size ${p.size}`,
              formatVnd(p.currentPrice),
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text style={styles.caption}>Đang ở {p.warehouseName}</Text>
        </View>
      </View>

      <View style={styles.warn}>
        <Text style={styles.warnTitle}>Trước khi quyên góp</Text>
        <Text style={styles.text}>
          • Bạn <Text style={styles.strong}>từ bỏ quyền sở hữu</Text> và{" "}
          <Text style={styles.strong}>không nhận tiền</Text>.{"\n"}• Món đi tới
          đúng tổ chức của chiến dịch bạn chọn, ReHome không bán món này.{"\n"}•{" "}
          <Text style={styles.strong}>Không đổi lại được</Text> sau khi xác
          nhận.
          {"\n"}• {CASE_NOTE[donateCase]}
        </Text>
      </View>

      <View style={styles.gapSm}>
        <Text style={styles.sectionTitle}>
          CHIẾN DỊCH NHẬN ĐỒ TẠI {p.warehouseName?.toUpperCase()}
        </Text>
        {list.length ? (
          list.map((c) => (
            <RadioCard
              key={c.id}
              title={c.title}
              description={[
                c.organization?.displayName,
                `nhận tới ${dayjs(c.endTime).format("DD/MM")}`,
                c.preferredItemTypes?.length
                  ? `cần: ${c.preferredItemTypes.slice(0, 3).join(", ")}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              selected={campaignId === c.id}
              onPress={() => {
                setCampaignId(c.id);
                setFormError(null);
              }}
              style={styles.radio}
            />
          ))
        ) : (
          <EmptyState
            icon="megaphone-outline"
            title="Chưa có chiến dịch nhận đồ tại địa điểm này"
            description="Hiện chưa có tổ chức nào nhận đồ quyên góp tại đây. Bạn quay lại sau, hoặc chọn cách xử lý khác cho món hàng."
          />
        )}
      </View>

      {list.length ? (
        <Checkbox checked={anonymous} onChange={setAnonymous}>
          <Text style={styles.text}>
            Quyên góp ẩn danh (tổ chức không thấy tên bạn)
          </Text>
        </Checkbox>
      ) : null}

      {formError ? <ErrorBox message={formError} /> : null}

      <NoteBox>
        Sau khi quyên góp, ReHome giữ món tại địa điểm ký gửi và bàn giao khi tổ
        chức đến nhận. Bạn theo dõi kết quả ngay trong chi tiết món.
      </NoteBox>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.lg },
  flex: { flex: 1 },
  gapSm: { gap: spacing.sm },
  radio: { flex: 0 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  text: { ...textStyles.body, color: colors.text },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  caption: { ...textStyles.caption, color: colors.textSecondary },
  sectionTitle: { ...textStyles.label, color: colors.textSecondary },
  warn: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.input,
    backgroundColor: tones.warning.bg,
  },
  warnTitle: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: tones.warning.fg,
  },
});
