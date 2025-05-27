import { useFonts } from 'expo-font';
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MenuProvider } from "react-native-popup-menu";
import { RootSiblingParent } from 'react-native-root-siblings';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableFreeze } from "react-native-screens";
import Toast from "react-native-toast-message";
import { Provider } from "react-redux";
import { store } from "./context/store";
import DrawerStack from "./navigation/AppNavigator";

// Import TanStack Query components
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Enable screen freezing
enableFreeze(true);

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
  },
});

export default function App() {
  // const [expoPushToken, setExpoPushToken] = useState(null);
  
  // useEffect(() => {
  //   // Register for push notifications when the component mounts
  //   // registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
  // }, []);
  
  const [fontsLoaded, fontError] = useFonts({
    'raleway': require('./assets/fonts/Raleway-Regular.ttf'),
    'raleway-italic': require('./assets/fonts/Raleway-Italic.ttf'),
    'raleway-semibold': require('./assets/fonts/Raleway-SemiBold.ttf'),
    'raleway-bold': require('./assets/fonts/Raleway-Bold.ttf'),
    'raleway-boldItalic': require('./assets/fonts/Raleway-BoldItalic.ttf'),
    'raleway-extra': require('./assets/fonts/Raleway-ExtraBold.ttf'),
    'poppins-extra': require('./assets/fonts/PermanentMarker-Regular.ttf'),
  });
  
  if (!fontsLoaded && !fontError) {
    return null;
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Provider store={store}>
            <MenuProvider>
              <RootSiblingParent>
                <DrawerStack />
                <Toast />
              </RootSiblingParent>
            </MenuProvider>
          </Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}