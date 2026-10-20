import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, textStyles } from "@/theme";
import { MOCK } from "@/config/env";
import { Button } from "@/components/ui/Button";
import { NoteBox } from "@/components/ui/NoteBox";
import { showToast } from "@/utils/toast";
import { returnsApi } from "../api/returnsApi";
import { useReturnMutation } from "../hooks/useReturns";

// [DEV] chỉ hiện ở bản dev + khi trả hàng còn mock: giả lập việc kho / GHN làm (web Moderator)
export function ReturnMockPanel({ item: r }) {
  const act = useReturnMutation(({ id, key }) =>
    returnsApi.mockReturnAction(id, key),
  );
  const actions = returnsApi.MOCK_RETURN_ACTIONS.filter((a) =>
    a.from.includes(r.status),
  );
  if (!__DEV__ || !MOCK.returns || !actions.length) return null;
  return (
    <NoteBox>
      <View style={styles.wrap}>
        <Text style={styles.title}>Mock (chỉ bản dev): việc của kho / GHN</Text>
        {actions.map((a) => (
          <Button
            key={a.key}
            title={a.label}
            variant="text"
            disabled={act.isPending}
            onPress={() =>
              act.mutate(
                { id: r.id, key: a.key },
                { onError: (e) => showToast(e.message) },
              )
            }
          />
        ))}
      </View>
    </NoteBox>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, alignItems: "flex-start" },
  title: { ...textStyles.label, color: colors.textSecondary },
});
