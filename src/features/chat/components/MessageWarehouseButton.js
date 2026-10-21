import { ListGroup, ListItem } from "@/components/ui/ListItem";
import { CONVERSATION_TYPE } from "@/constants/chat";
import { useOpenConversation } from "../hooks/useChat";

// "Nhắn cho kho" — mở hộp thư của đúng kho (0.5 A21) với câu soạn sẵn. Không có warehouseId → ẩn
export function MessageWarehouseButton({
  warehouseId,
  warehouseName,
  draft,
  from,
  title = "Nhắn cho kho",
}) {
  const { open, isOpening } = useOpenConversation();
  if (!warehouseId) return null;
  return (
    <ListGroup>
      <ListItem
        icon="chatbubbles-outline"
        title={isOpening ? "Đang mở hộp thư…" : title}
        description={warehouseName ? `Hộp thư ${warehouseName}` : undefined}
        onPress={() =>
          open({
            type: CONVERSATION_TYPE.MEMBER_WAREHOUSE,
            counterpartId: warehouseId,
            draft,
            from,
          })
        }
      />
    </ListGroup>
  );
}
