import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/app-theme';

// 모든 화면 배경에 공통으로 까는 은은한 그라데이션.
// 순백색 배경보다 유리 패널의 반사/굴절이 눈에 띄게 해준다.
export function ScreenBackground() {
  return (
    <LinearGradient
      colors={[AppColors.gradientStart, AppColors.gradientEnd]}
      style={StyleSheet.absoluteFill}
    />
  );
}
