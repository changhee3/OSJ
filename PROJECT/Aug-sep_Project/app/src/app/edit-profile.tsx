import { updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { auth, db } from '@/lib/firebase';

export default function EditProfileScreen() {
  const uid = auth.currentUser?.uid;

  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) setName((snap.data()['이름'] as string) ?? '');
      setIsLoading(false);
    });
  }, [uid]);

  const handleSave = async () => {
    if (!uid) return;

    if (!name.trim()) {
      setMessageType('error');
      setMessage('이름을 입력해주세요.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMessageType('error');
      setMessage('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setMessageType('error');
      setMessage('새 비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setMessage('');
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', uid), { '이름': name.trim() }, { merge: true });

      if (newPassword && auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setNewPassword('');
      setConfirmPassword('');
      setMessageType('success');
      setMessage('저장되었습니다.');
    } catch (error) {
      const code = (error as { code?: string }).code;
      setMessageType('error');
      if (code === 'auth/requires-recent-login') {
        setMessage('보안을 위해 비밀번호 변경 전 재로그인이 필요합니다. 로그아웃 후 다시 로그인해주세요.');
      } else {
        setMessage('저장에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={styles.container} edges={['top']}>
          <ActivityIndicator color={AppColors.primary} style={styles.loading} />
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <GlassSurface>
              <Text style={styles.label}>이름</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} />

              <Text style={styles.label}>새 비밀번호 (변경 시에만 입력)</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="6자 이상"
                secureTextEntry
              />

              <Text style={styles.label}>새 비밀번호 확인</Text>
              <TextInput
                style={[styles.input, styles.inputLast]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="다시 입력"
                secureTextEntry
              />
            </GlassSurface>

            {message ? (
              <View
                style={[
                  styles.messageBox,
                  messageType === 'error' ? styles.messageBoxError : styles.messageBoxSuccess,
                ]}>
                <Text
                  style={messageType === 'error' ? styles.messageTextError : styles.messageText}>
                  {message}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={[styles.button, isSaving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator color={AppColors.canvas} />
              ) : (
                <Text style={styles.buttonText}>저장하기</Text>
              )}
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loading: {
    marginTop: 32,
  },
  scrollContent: {
    paddingHorizontal: AppSpacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 40,
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
  inputLast: {
    marginBottom: 0,
  },
  messageBox: {
    borderRadius: AppSpacing.radiusInput,
    borderWidth: 1,
    padding: 12,
    marginTop: 16,
  },
  messageBoxError: {
    backgroundColor: 'rgba(207,32,47,0.1)',
    borderColor: AppColors.danger,
  },
  messageBoxSuccess: {
    backgroundColor: 'rgba(5,177,105,0.1)',
    borderColor: AppColors.success,
  },
  messageText: {
    ...AppTypography.caption,
    color: AppColors.body,
  },
  messageTextError: {
    ...AppTypography.caption,
    color: AppColors.danger,
    fontWeight: '600',
  },
  button: {
    height: AppSpacing.buttonHeight,
    borderRadius: AppSpacing.radiusPill,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: AppColors.primaryDisabled,
  },
  buttonText: {
    ...AppTypography.button,
    color: AppColors.canvas,
  },
});
