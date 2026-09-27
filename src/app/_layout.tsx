import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router/tabs';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { GameTabBar, type TabMeta } from '@/components/game-tab-bar';
import { accents, colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

const TAB_META: Record<string, TabMeta> = {
  index: { emoji: '💪', label: 'Fitness', color: accents.fitness.base },
  diet: { emoji: '🥗', label: 'Diet', color: accents.diet.base },
  finances: { emoji: '💰', label: 'Money', color: accents.finances.base },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ LilitaOne_400Regular, Nunito_800ExtraBold, Nunito_900Black });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        tabBar={(props) => <GameTabBar {...props} meta={TAB_META} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bgTop } }}>
        <Tabs.Screen name="index" options={{ title: 'Fitness' }} />
        <Tabs.Screen name="diet" options={{ title: 'Diet' }} />
        <Tabs.Screen name="finances" options={{ title: 'Money' }} />
      </Tabs>
    </>
  );
}
