import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useUserRole } from '@/hooks/use-user-role';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const role = useUserRole();
  const isAdmin = role === '운영자';

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      {isAdmin && (
        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>관리자</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver" md="build" />
        </NativeTabs.Trigger>
      )}

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>설정</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
