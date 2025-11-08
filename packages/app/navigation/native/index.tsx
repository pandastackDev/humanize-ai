import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "app/features/home/screen";
import { UserDetailScreen } from "app/features/user/detail-screen";

const Stack = createNativeStackNavigator<{
  home: undefined;
  "user-detail": {
    id: string;
  };
}>();

export function NativeNavigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        component={HomeScreen}
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Stack.Screen
        component={UserDetailScreen}
        name="user-detail"
        options={{
          title: "User",
        }}
      />
    </Stack.Navigator>
  );
}
