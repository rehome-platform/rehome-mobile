import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { colors, spacing } from "@/theme";
import { Screen } from "@/components/ui/Screen";
import { AppHeader } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { ErrorBox } from "@/components/ui/ErrorBox";
import { showToast } from "@/utils/toast";
import { postSchema } from "@/features/orgPortal/schemas";
import {
  useCreatePost,
  useMyPost,
  useUpdatePost,
} from "@/features/orgPortal/hooks/usePosts";
import { PostForm } from "@/features/orgPortal/components/PostForm";

const leave = () =>
  router.canGoBack() ? router.back() : router.replace("/org/posts");

const EMPTY = { content: "", photoUris: [], campaignId: null };
const toForm = (p) => ({
  content: p.content,
  photoUris: [...p.photoUrls],
  campaignId: p.campaignId ?? null,
});

// Khung chung OB-02 / OB-03: footer [Huỷ] [Đăng bài | Lưu thay đổi]; thoát khi đã nhập / đã sửa → hỏi trước
function PostEditor({ title, submitTitle, defaultValues, mutation, done }) {
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(postSchema), defaultValues });
  const content = useWatch({ control, name: "content" });

  const onCancel = () => {
    if (!isDirty) return leave();
    Alert.alert(
      "Bỏ bài đang soạn?",
      "Những gì bạn vừa nhập sẽ không được lưu.",
      [
        { text: "Soạn tiếp", style: "cancel" },
        { text: "Bỏ", style: "destructive", onPress: leave },
      ],
    );
  };

  const onSubmit = handleSubmit((values) =>
    mutation.mutate(values, {
      onSuccess: () => {
        showToast(done);
        leave();
      },
    }),
  );

  return (
    <Screen
      scroll
      header={<AppHeader title={title} onBack={onCancel} />}
      footer={
        <View style={styles.footer}>
          <Button
            title="Huỷ"
            variant="secondary"
            onPress={onCancel}
            disabled={mutation.isPending}
            style={styles.footerButton}
          />
          <Button
            title={submitTitle}
            onPress={onSubmit}
            loading={mutation.isPending}
            // Đăng: mờ khi chưa có nội dung · Sửa: mờ khi chưa sửa gì (wireframe)
            disabled={!content?.trim() || !isDirty}
            style={styles.footerButton}
          />
        </View>
      }
      contentStyle={styles.content}
    >
      {mutation.isError ? <ErrorBox message={mutation.error.message} /> : null}
      <PostForm control={control} errors={errors} />
    </Screen>
  );
}

// OB-02 · Đăng bài viết
export function CreatePostScreen() {
  const create = useCreatePost();
  return (
    <PostEditor
      title="Đăng bài viết"
      submitTitle="Đăng bài"
      defaultValues={EMPTY}
      mutation={create}
      done="Đã đăng bài"
    />
  );
}

function EditLoaded({ post }) {
  const update = useUpdatePost(post.id);
  return (
    <PostEditor
      title="Sửa bài viết"
      submitTitle="Lưu thay đổi"
      defaultValues={toForm(post)}
      mutation={update}
      done="Đã lưu thay đổi"
    />
  );
}

// OB-03 · Sửa bài viết — dùng lại form OB-02, điền sẵn (form chỉ dựng khi đã có bài)
export function EditPostScreen() {
  const { id } = useLocalSearchParams();
  const query = useMyPost(id);
  if (query.isSuccess) return <EditLoaded post={query.data} />;
  return (
    <Screen header={<AppHeader title="Sửa bài viết" onBack={leave} />}>
      {query.isError ? (
        <ErrorBox message={query.error.message}>
          <Button
            title="Thử lại"
            variant="secondary"
            onPress={() => query.refetch()}
          />
        </ErrorBox>
      ) : (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  footer: { flexDirection: "row", gap: spacing.md },
  footerButton: { flex: 1 },
  loading: { marginTop: spacing.xxl },
});
