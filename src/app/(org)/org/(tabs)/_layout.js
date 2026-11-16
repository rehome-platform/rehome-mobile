import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/theme";
import { useConversations } from "@/features/chat/hooks/useChat";
import { unreadTotal } from "@/features/chat/utils/chatRules";

// Số đỏ trên tab: quá 99 thì "99+"; 0 thì ẩn
const badgeOf = (n) => (n > 99 ? "99+" : n > 0 ? n : undefined);

// Khung 4 tab của tổ chức đã xác minh (VERIFIED). Đổi tab chỉ cần sửa mảng này
const TABS = [
  { name: "campaigns", title: "Chiến dịch", icon: "megaphone" },
  { name: "posts", title: "Bài viết", icon: "newspaper" },
  { name: "messages", title: "Tin nhắn", icon: "chatbubbles" },
  { name: "profile", title: "Hồ sơ", icon: "business" },
];

export default function OrgTabs() {
  // Tin nhắn chưa đọc → số trên tab Tin nhắn (hỏi lại 30 giây/lần, chưa có realtime)
  const chats = useConversations({ poll: true });
  const badges = { messages: badgeOf(unreadTotal(chats.data)) };
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.neutral,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: badges[tab.name],
            // Đang chọn: icon đặc; chưa chọn: icon rỗng ("-outline")
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? tab.icon : `${tab.icon}-outline`}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
