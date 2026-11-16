import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/theme";

// [GIẢ ĐỊNH] 4 tab theo BR-01 — chờ lead chốt (PR-01 vẽ 5 tab). Đổi tab chỉ cần sửa mảng này
const TABS = [
  { name: "index", title: "Mua sắm", icon: "bag-handle" },
  { name: "community", title: "Cộng đồng", icon: "people" },
  { name: "consign", title: "Ký gửi", icon: "cube" },
  { name: "account", title: "Cá nhân", icon: "person-circle" },
];

export default function MemberTabs() {
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
