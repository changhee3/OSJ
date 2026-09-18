import { BlurView } from 'expo-blur';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppColors, AppSpacing } from '@/constants/app-theme';

type GlassSurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  radius?: number;
  /** 유리 위에 덧씌우는 반투명 흰색 정도. 뒤 배경을 더 가리고 싶으면 값을 올린다. */
  overlayColor?: string;
};

// 애플 Liquid Glass 스타일을 흉내낸 반투명 유리 패널.
// iOS/Android 둘 다 expo-blur의 실제 블러를 쓰고, 그 위에 살짝 흰색을 얹고
// 테두리에 하이라이트를 둘러서 "유리 표면" 느낌을 낸다.
export function GlassSurface({
  children,
  style,
  contentStyle,
  intensity = 40,
  radius = AppSpacing.radiusCard,
  overlayColor = AppColors.glassOverlay,
}: GlassSurfaceProps) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden' }, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View
        pointerEvents="none"
        style={[styles.overlay, { borderRadius: radius, backgroundColor: overlayColor }]}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AppColors.glassOverlay,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
  },
  content: {
    padding: 20,
  },
});
