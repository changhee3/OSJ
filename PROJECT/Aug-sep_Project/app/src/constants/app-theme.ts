// 디자인 가이드(노션)에 정의된 Liquid Glass 스타일 값을 코드에서 쓰기 위한 상수 모음.
export const AppColors = {
  primary: '#0052FF',
  primaryActive: '#003ECC',
  primaryDisabled: '#A8B8CC',
  ink: '#0A0B0D',
  body: '#5B616E',
  muted: '#7C828A',
  canvas: '#FFFFFF',
  surfaceStrong: '#EEF0F3',
  hairline: '#DEE1E6',
  danger: '#CF202F',
  success: '#05B169',

  // 배경에 은은한 색 그라데이션을 깔아, 그 위에 얹는 유리 패널이
  // 뭔가를 "굴절"시키는 것처럼 보이게 한다.
  gradientStart: '#E9F1FF',
  gradientEnd: '#FBFCFF',

  // 유리 패널(GlassSurface)에 쓰는 반투명 톤/테두리
  glassOverlay: 'rgba(255,255,255,0.45)',
  glassBorder: 'rgba(255,255,255,0.65)',
  glassOverlayDark: 'rgba(10,11,13,0.35)',
};

export const AppTypography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  cardTitle: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  button: { fontSize: 17, fontWeight: '600' as const },
  caption: { fontSize: 14, fontWeight: '400' as const },
};

export const AppSpacing = {
  buttonHeight: 52,
  inputHeight: 52,
  radiusPill: 999,
  radiusInput: 16,
  radiusCard: 28,
  screenPadding: 20,
};
