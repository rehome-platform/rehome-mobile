import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

export function Screen({
  children,
  header, // thường là <AppHeader />; đứng yên ở trên, không cuộn
  footer, // nút chính cố định ở đáy; bàn phím mở thì nằm ngay trên bàn phím
  scroll = false, // true: nội dung cuộn được (form dài)
  scrollRef, // ref của ScrollView (cuộn lên đầu khi có lỗi…)
  padded = true, // true: nội dung cách mép 16
  edges = ["top", "bottom"], // cạnh nào cần tránh tai thỏ / thanh điều hướng
  style,
  contentStyle,
}) {
  const content = scroll ? (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={[
        styles.grow,
        padded && styles.padded,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled" // bấm nút khi bàn phím đang mở vẫn ăn ngay
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, padded && styles.padded, contentStyle]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={edges} style={[styles.fill, styles.bg, style]}>
      {header}
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {content}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  grow: { flexGrow: 1 },
  bg: { backgroundColor: colors.background },
  padded: { padding: spacing.lg },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.neutral,
  },
});
