import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/theme";

// Khung 4 tab của tổ chức đã xác minh (VERIFIED). Đổi tab chỉ cần sửa mảng này
const TABS = [
  { name: "campaigns", title: "Chiến dịch", icon: "megaphone" },
  { name: "posts", title: "Bài viết", icon: "newspaper" },
  { name: "messages", title: "Tin nhắn", icon: "chatbubbles" },
  { name: "profile", title: "Hồ sơ", icon: "business" },
];

export default function OrgTabs() {
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
