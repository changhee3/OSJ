import { Link, router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { auth } from '@/lib/firebase';

// 전화번호를 Firebase Auth가 요구하는 이메일 형식으로 바꾼다.
// (Firebase Auth는 "전화번호+비밀번호" 로그인을 기본 지원하지 않아서,
//  이메일/비밀번호 방식을 그대로 쓰되 아이디만 전화번호로 보이게 한다.)
function phoneToFakeEmail(phone: string) {
  return `${phone.replace(/[^0-9]/g, '')}@clubapp.local`;
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      setErrorMessage('전화번호와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, phoneToFakeEmail(phone), password);
      router.replace('/(tabs)/home');
    } catch {
      setErrorMessage('전화번호 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.container}>
        <GlassSurface intensity={55} contentStyle={styles.card}>
          <Text style={styles.title}>로그인</Text>

          <Text style={styles.label}>전화번호</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="01012345678"
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="비밀번호"
            secureTextEntry
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={AppColors.canvas} />
            ) : (
              <Text style={styles.buttonText}>로그인</Text>
            )}
          </Pressable>

          <Link href="/signup" style={styles.linkText}>
            회원가입하기
          </Link>
        </GlassSurface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: AppSpacing.screenPadding,
    justifyContent: 'center',
  },
  card: {
    padding: 24,
  },
  title: {
    ...AppTypography.title,
    color: AppColors.ink,
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    ...AppTypography.caption,
    color: AppColors.muted,
    marginBottom: 6,
  },
  input: {
    ...AppTypography.body,
    height: AppSpacing.inputHeight,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    borderRadius: AppSpacing.radiusInput,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: AppColors.ink,
  },
  errorText: {
    ...AppTypography.caption,
    color: AppColors.danger,
    marginBottom: 12,
  },
  button: {
    height: AppSpacing.buttonHeight,
    borderRadius: AppSpacing.radiusPill,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: AppColors.primaryDisabled,
  },
  buttonText: {
    ...AppTypography.button,
    color: AppColors.canvas,
  },
  linkText: {
    ...AppTypography.body,
    color: AppColors.primary,
    textAlign: 'center',
    marginTop: 20,
  },
});
