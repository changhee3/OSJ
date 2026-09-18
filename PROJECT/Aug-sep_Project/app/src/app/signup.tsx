import { Link, router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
import { auth, db } from '@/lib/firebase';

function phoneToFakeEmail(phone: string) {
  return `${phone.replace(/[^0-9]/g, '')}@clubapp.local`;
}

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async () => {
    if (!name || !phone || !password) {
      setErrorMessage('이름, 전화번호, 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        phoneToFakeEmail(phone),
        password,
      );

      // Firestore 데이터 모델 설계서의 users 시트 구조를 그대로 따른다.
      await setDoc(doc(db, 'users', credential.user.uid), {
        '이름': name,
        '전화번호': phone,
        '알림 여부': true,
        '일정 알림 분전': 30,
        '역할': isAdmin ? '운영자' : '일반회원',
      });

      router.replace('/(tabs)/home');
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setErrorMessage('이미 가입된 전화번호입니다.');
      } else {
        setErrorMessage('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <View style={styles.container}>
      <GlassSurface intensity={55} contentStyle={styles.card}>
      <Text style={styles.title}>회원가입</Text>

      <Text style={styles.label}>이름</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="이름"
      />

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
        placeholder="6자 이상 입력"
        secureTextEntry
      />

      <Pressable
        style={styles.checkboxRow}
        onPress={() => setIsAdmin((current) => !current)}>
        <View style={[styles.checkboxBox, isAdmin && styles.checkboxBoxChecked]}>
          {isAdmin ? <Text style={styles.checkboxMark}>✓</Text> : null}
        </View>
        <Text style={styles.checkboxLabel}>관리자 권한으로 가입 (임시 옵션)</Text>
      </Pressable>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={AppColors.canvas} />
        ) : (
          <Text style={styles.buttonText}>가입하기</Text>
        )}
      </Pressable>

      <Link href="/login" style={styles.linkText}>
        이미 계정이 있으신가요? 로그인
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxBoxChecked: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  checkboxMark: {
    color: AppColors.canvas,
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    ...AppTypography.caption,
    color: AppColors.body,
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
