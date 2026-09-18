import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="event/[id]" options={{ headerShown: true, title: '일정 상세' }} />
        <Stack.Screen name="my-events" options={{ headerShown: true, title: '참가 일정' }} />
        <Stack.Screen
          name="admin/participants/[id]"
          options={{ headerShown: true, title: '참가자 명단' }}
        />
        <Stack.Screen
          name="edit-profile"
          options={{ headerShown: true, title: '회원 정보 수정' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
