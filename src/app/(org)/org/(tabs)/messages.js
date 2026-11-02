import ConversationListScreen from "@/features/chat/screens/ConversationListScreen";

// OM-01 · Tin nhắn với Member (dùng chung màn CH-01)
export default function OrgMessagesTab() {
  return <ConversationListScreen viewer="org" />;
}
