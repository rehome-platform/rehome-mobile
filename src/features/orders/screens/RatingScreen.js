import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, radius, spacing, textStyles } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { NoteBox } from "@/components/ui/NoteBox";
import { TextField } from "@/components/ui/TextField";
import { useAuthStore } from "@/stores/authStore";
import { showToast } from "@/utils/toast";
import {
  ORDER_STATUS as S,
  RATING_LABEL,
  RATING_LIMITS,
} from "@/constants/order";
import { UPLOAD_FOLDER } from "@/constants/upload";
import { PhotoPicker } from "@/features/consignment/components/PhotoPicker";
import { uploadPhotos } from "@/features/consignment/utils/photos";
import { ordersApi } from "../api/ordersApi";
import { useOrder, useOrderMutation } from "../hooks/useOrders";
import { toDate } from "../utils/time";
import { StarRating } from "../components/StarRating";

const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/orders");

// Gợi ý ngắn theo số sao — bấm để chèn vào ô nhận xét (giống Shopee), giúp người dùng viết nhanh
const QUICK_TAGS = {
  low: ["Đóng gói sơ sài", "Giao chậm", "Hàng không giống mô tả"],
  high: ["Đóng gói cẩn thận", "Giao nhanh", "Hàng đúng mô tả"],
};

// BR-14 · Đánh giá dịch vụ kho: sao (bắt buộc) + nhận xét + ảnh (không bắt buộc). Đã đánh giá → chỉ đọc
export default function RatingScreen() {
  const { id } = useLocalSearchParams();
  const isAuthed = useAuthStore((s) => s.status === "authenticated");
  const query = useOrder(id);
  const rate = useOrderMutation(async ({ serviceRating, comment, photos }) => {
    const imageUrls = photos.length
      ? await uploadPhotos(photos, UPLOAD_FOLDER.ORDER_RATINGS)
      : [];
    return ordersApi.rateOrder(id, { serviceRating, comment, imageUrls });
  });
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState([]);
  const [viewing, setViewing] = useState(null); // ảnh đang xem to (chế độ chỉ đọc)

  if (!isAuthed) return <Redirect href="/login" />;

  const header = <AppHeader title="Đánh giá dịch vụ" onBack={goBack} />;
  if (query.isPending) {
    return (
      <Screen header={header}>
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen header={header}>
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      </Screen>
    );
  }

  const order = query.data;
  if (order.status !== S.COMPLETED) {
    return (
      <Screen header={header}>
        <EmptyState
          icon="star-outline"
          title="Chưa đánh giá được"
          description="Bạn đánh giá được sau khi đơn hoàn thành (xác nhận đã nhận hàng, hoặc hệ thống tự hoàn thành)."
        >
          <Button title="Về chi tiết đơn" onPress={goBack} />
        </EmptyState>
      </Screen>
    );
  }

  const rated = order.serviceRating != null;
  const shown = rated ? order.serviceRating : stars;
  const first = order.items[0];
  const ratedImages = order.ratingImageUrls ?? [];
  const tags = stars && stars <= 3 ? QUICK_TAGS.low : QUICK_TAGS.high;

  // Chèn gợi ý vào cuối nhận xét (bỏ qua nếu đã có, không vượt giới hạn ký tự)
  const addTag = (tag) => {
    if (comment.includes(tag)) return;
    const next = comment.trim() ? `${comment.trim()}. ${tag}` : tag;
    if (next.length <= RATING_LIMITS.MAX_COMMENT) setComment(next);
  };

  const submit = () =>
    rate.mutate(
      { serviceRating: stars, comment, photos },
      {
        onSuccess: () => {
          showToast("Cảm ơn bạn đã đánh giá");
          goBack();
        },
        onError: (e) => showToast(e.message), // 409 chưa hoàn thành / đã đánh giá → màn tự tải lại
      },
    );

  return (
    <Screen
      scroll
      header={header}
      contentStyle={styles.content}
      footer={
        rated ? (
          <Button
            title="Về chi tiết đơn"
            variant="secondary"
            onPress={goBack}
          />
        ) : (
          <Button
            title="Gửi đánh giá"
            disabled={!stars}
            loading={rate.isPending}
            onPress={submit}
          />
        )
      }
    >
      <NoteBox>
        <Text style={styles.noteText}>
          Bạn đang chấm{" "}
          <Text style={styles.strong}>dịch vụ của {order.warehouseName}</Text> —
          đóng gói và giao hàng. Không phải chấm người ký gửi.
        </Text>
      </NoteBox>

      <View style={styles.itemCard}>
        <Text style={styles.strong} numberOfLines={2}>
          {first?.name}
          {order.items.length > 1
            ? ` và ${order.items.length - 1} món khác`
            : ""}
        </Text>
        <Text style={styles.muted}>
          {order.orderNo}
          {order.completedAt
            ? ` · hoàn thành ${toDate(order.completedAt).format("DD/MM/YYYY")}`
            : ""}
        </Text>
      </View>

      <View style={styles.starsBlock}>
        <StarRating
          value={shown}
          onChange={rated ? undefined : setStars}
          size={44}
        />
        <Text style={styles.starsText}>
          {shown
            ? `${shown} / 5 · ${RATING_LABEL[shown]}`
            : "Chạm vào sao để chấm"}
        </Text>
        {rated && order.ratedAt ? (
          <Text style={styles.muted}>
            Đánh giá lúc {toDate(order.ratedAt).format("HH:mm DD/MM/YYYY")}
          </Text>
        ) : null}
      </View>

      {rated ? (
        // Chỉ đọc: nhận xét + ảnh đã gửi
        order.ratingComment || ratedImages.length ? (
          <View style={styles.readBlock}>
            <Text style={styles.label}>Nhận xét của bạn</Text>
            {order.ratingComment ? (
              <Text style={styles.body}>{order.ratingComment}</Text>
            ) : null}
            {ratedImages.length ? (
              <View style={styles.thumbs}>
                {ratedImages.map((uri) => (
                  <Pressable
                    key={uri}
                    onPress={() => setViewing(uri)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel="Xem ảnh"
                  >
                    <Image source={{ uri }} style={styles.thumb} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        ) : null
      ) : stars ? (
        // Chọn sao xong mới mở phần viết thêm — màn gọn lúc đầu, người chỉ muốn chấm sao bấm Gửi luôn
        <>
          <View style={styles.tags}>
            {tags.map((t) => {
              const on = comment.includes(t);
              return (
                <Pressable
                  key={t}
                  onPress={() => addTag(t)}
                  disabled={on}
                  accessibilityRole="button"
                  style={[styles.tag, on && styles.tagOn]}
                >
                  <Text style={[styles.tagText, on && styles.tagTextOn]}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextField
            label="Nhận xét (không bắt buộc)"
            multiline
            value={comment}
            onChangeText={setComment}
            maxLength={RATING_LIMITS.MAX_COMMENT}
            placeholder="Đóng gói, thời gian giao, tình trạng hàng khi nhận…"
            helper={`${comment.length} / ${RATING_LIMITS.MAX_COMMENT} ký tự`}
          />

          {RATING_LIMITS.IMAGES_READY ? (
            <PhotoPicker
              value={photos}
              onChange={setPhotos}
              max={RATING_LIMITS.MAX_IMAGES}
              required={false}
              label="Ảnh (không bắt buộc)"
              helper="Ảnh hộp hàng, cách đóng gói hoặc món đồ khi nhận."
              pickTitle="Thêm ảnh đánh giá"
              pickMessage="Chụp rõ hộp hàng hoặc món đồ khi nhận."
            />
          ) : null}
        </>
      ) : null}

      <Modal
        visible={!!viewing}
        transparent
        animationType="fade"
        onRequestClose={() => setViewing(null)}
      >
        <Pressable style={styles.viewer} onPress={() => setViewing(null)}>
          {viewing ? (
            <Image
              source={{ uri: viewing }}
              style={styles.full}
              resizeMode="contain"
            />
          ) : null}
          <View style={styles.close}>
            <Ionicons name="close" size={28} color={colors.onPrimary} />
          </View>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { marginTop: spacing.xxl },
  content: { gap: spacing.xl },
  noteText: { ...textStyles.body, color: colors.textSecondary },
  strong: {
    ...textStyles.body,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  body: { ...textStyles.body, color: colors.text },
  label: { ...textStyles.label, fontSize: 14, color: colors.text },
  muted: { ...textStyles.caption, color: colors.textSecondary },
  itemCard: {
    gap: 2,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  starsBlock: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  starsText: { ...textStyles.heading, color: colors.text },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  tagOn: { borderColor: colors.primary },
  tagText: { ...textStyles.caption, color: colors.text },
  tagTextOn: { color: colors.primary, fontFamily: fonts.semibold },
  readBlock: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
  },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.input,
    backgroundColor: colors.neutral,
  },
  viewer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.92)",
  },
  full: { width: "100%", height: "80%" },
  close: { position: "absolute", top: 48, right: 20 },
});
