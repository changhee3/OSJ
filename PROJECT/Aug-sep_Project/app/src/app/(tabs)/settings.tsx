import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { auth, db } from '@/lib/firebase';
import { useUserRole } from '@/hooks/use-user-role';

const REMINDER_MINUTE_OPTIONS = [10, 30, 60];

export default function SettingsScreen() {
  const role = useUserRole();
  const uid = auth.currentUser?.uid;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState(30);

  useEffect(() => {
    if (!uid) return;
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setNotificationsEnabled((data['알림 여부'] as boolean) ?? true);
      setReminderMinutes((data['일정 알림 분전'] as number) ?? 30);
    });
  }, [uid]);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  const updateNotificationsEnabled = async (value: boolean) => {
    if (!uid) return;
    setNotificationsEnabled(value);
    await setDoc(doc(db, 'users', uid), { '알림 여부': value }, { merge: true });
  };

  const updateReminderMinutes = async (value: number) => {
    if (!uid) return;
    setReminderMinutes(value);
    await setDoc(doc(db, 'users', uid), { '일정 알림 분전': value }, { merge: true });
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>설정</Text>

        <Pressable onPress={() => router.push('/edit-profile')}>
          <GlassSurface style={styles.sectionWrap}>
            <View style={styles.roleRow}>
              <Text style={styles.switchLabel}>회원 정보 수정</Text>
              <Text style={styles.linkArrow}>›</Text>
            </View>
          </GlassSurface>
        </Pressable>

        {role ? (
          <GlassSurface style={styles.sectionWrap}>
            <View style={styles.roleRow}>
              <Text style={styles.roleLabel}>계정 유형</Text>
              <Text style={styles.roleValue}>{role}</Text>
            </View>
          </GlassSurface>
        ) : null}

        <GlassSurface style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>일정 알림 설정</Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>일정 시작 전 알림 받기</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={updateNotificationsEnabled}
              trackColor={{ true: AppColors.primary }}
            />
          </View>

          {notificationsEnabled ? (
            <View style={styles.reminderSection}>
              <Text style={styles.reminderLabel}>일정 알림 시간 설정</Text>
              <Text style={styles.reminderHint}>일정 시작 몇 분 전에 알림을 받을지 선택하세요.</Text>
              <View style={styles.chipRow}>
                {REMINDER_MINUTE_OPTIONS.map((minutes) => {
                  const isSelected = reminderMinutes === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => updateReminderMinutes(minutes)}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {minutes}분 전
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </GlassSurface>

        <Pressable style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>로그아웃</Text>
        </Pressable>
      </SafeAreaView>
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
  },
  title: {
    ...AppTypography.title,
    color: AppColors.ink,
    marginVertical: 16,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...AppTypography.cardTitle,
    color: AppColors.ink,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleLabel: {
    ...AppTypography.body,
    color: AppColors.muted,
  },
  roleValue: {
    ...AppTypography.body,
    color: AppColors.ink,
    fontWeight: '600',
  },
  linkArrow: {
    ...AppTypography.cardTitle,
    color: AppColors.muted,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    ...AppTypography.body,
    color: AppColors.ink,
  },
  reminderSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: AppColors.glassBorder,
  },
  reminderLabel: {
    ...AppTypography.body,
    color: AppColors.ink,
    fontWeight: '600',
    marginBottom: 4,
  },
  reminderHint: {
    ...AppTypography.caption,
    color: AppColors.muted,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: AppSpacing.radiusPill,
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  chipText: {
    ...AppTypography.body,
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.body,
  },
  chipTextSelected: {
    color: AppColors.canvas,
  },
  button: {
    height: AppSpacing.buttonHeight,
    borderRadius: AppSpacing.radiusPill,
    borderWidth: 1,
    borderColor: AppColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...AppTypography.button,
    color: AppColors.danger,
  },
});
