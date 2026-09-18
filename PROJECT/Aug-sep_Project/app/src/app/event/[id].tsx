import { router, useLocalSearchParams } from 'expo-router';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { useUserRole } from '@/hooks/use-user-role';
import { auth, db } from '@/lib/firebase';

type EventDetail = {
  title: string;
  date: Date | null;
  place: string;
  content: string;
  participantCount: number;
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const uid = auth.currentUser?.uid;
  const role = useUserRole();
  const isAdmin = role === '운영자';

  const [eventDetail, setEventDetail] = useState<EventDetail | null>(null);
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribeEvent = onSnapshot(doc(db, 'events', id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const timestamp = data['날짜'] as Timestamp | undefined;
      setEventDetail({
        title: (data['제목'] as string) ?? '',
        date: timestamp ? timestamp.toDate() : null,
        place: (data['장소'] as string) ?? '',
        content: (data['내용'] as string) ?? '',
        participantCount: (data['참가자 수'] as number) ?? 0,
      });
    });

    return unsubscribeEvent;
  }, [id]);

  useEffect(() => {
    if (!id || !uid) return;

    const participationRef = doc(db, 'participations', `${uid}_${id}`);
    const unsubscribeParticipation = onSnapshot(participationRef, (snap) => {
      setParticipationStatus(snap.exists() ? (snap.data()['신청 상태'] as string) : null);
    });

    return unsubscribeParticipation;
  }, [id, uid]);

  const isApplied = participationStatus === '신청함';

  const handleToggleParticipation = async () => {
    if (!id || !uid) return;

    setIsUpdating(true);
    try {
      await setDoc(
        doc(db, 'participations', `${uid}_${id}`),
        {
          '회원': doc(db, 'users', uid),
          '일정': doc(db, 'events', id),
          '신청 상태': isApplied ? '취소함' : '신청함',
        },
        { merge: true },
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (!id || !eventDetail) return;
    Alert.alert(
      '일정 삭제',
      `"${eventDetail.title}" 일정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const relatedParticipations = await getDocs(
                query(
                  collection(db, 'participations'),
                  where('일정', '==', doc(db, 'events', id)),
                ),
              );
              await Promise.all(
                relatedParticipations.docs.map((p) => deleteDoc(doc(db, 'participations', p.id))),
              );
              await deleteDoc(doc(db, 'events', id));
              router.back();
            } catch {
              setIsDeleting(false);
              Alert.alert('삭제 실패', '잠시 후 다시 시도해주세요.');
            }
          },
        },
      ],
    );
  };

  if (!eventDetail) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={styles.container} edges={['top']}>
          <ActivityIndicator color={AppColors.primary} style={styles.loading} />
        </SafeAreaView>
      </View>
    );
  }

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLabel = eventDetail.date
    ? `${eventDetail.date.getFullYear()}.${eventDetail.date.getMonth() + 1}.${eventDetail.date.getDate()}(${days[eventDetail.date.getDay()]}) ${String(eventDetail.date.getHours()).padStart(2, '0')}:${String(eventDetail.date.getMinutes()).padStart(2, '0')}`
    : '';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>{eventDetail.title}</Text>

        <GlassSurface>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>날짜</Text>
            <Text style={styles.infoValue}>{dateLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>장소</Text>
            <Text style={styles.infoValue}>{eventDetail.place}</Text>
          </View>
          {eventDetail.content ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>내용</Text>
              <Text style={styles.infoValue}>{eventDetail.content}</Text>
            </View>
          ) : null}
          <View style={[styles.infoRow, styles.infoRowLast]}>
            <Text style={styles.infoLabel}>참가 인원</Text>
            <Text style={styles.infoValue}>{eventDetail.participantCount}명</Text>
          </View>
        </GlassSurface>

        <Pressable
          style={[
            styles.button,
            isApplied ? styles.buttonCancel : styles.buttonPrimary,
            isUpdating && styles.buttonDisabled,
          ]}
          onPress={handleToggleParticipation}
          disabled={isUpdating}>
          {isUpdating ? (
            <ActivityIndicator color={isApplied ? AppColors.danger : AppColors.canvas} />
          ) : (
            <Text style={[styles.buttonText, isApplied && styles.buttonTextCancel]}>
              {isApplied ? '신청 취소' : '참가 신청'}
            </Text>
          )}
        </Pressable>

        {isAdmin ? (
          <Pressable
            style={[styles.deleteButton, isDeleting && styles.buttonDisabled]}
            onPress={handleDelete}
            disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator color={AppColors.danger} />
            ) : (
              <Text style={styles.deleteButtonText}>일정 삭제 (관리자)</Text>
            )}
          </Pressable>
        ) : null}
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
    paddingTop: 16,
  },
  loading: {
    marginTop: 32,
  },
  title: {
    ...AppTypography.title,
    color: AppColors.ink,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoRowLast: {
    marginBottom: 0,
  },
  infoLabel: {
    ...AppTypography.caption,
    color: AppColors.muted,
    width: 80,
  },
  infoValue: {
    ...AppTypography.body,
    color: AppColors.ink,
    flex: 1,
  },
  button: {
    height: AppSpacing.buttonHeight,
    borderRadius: AppSpacing.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonPrimary: {
    backgroundColor: AppColors.primary,
  },
  buttonCancel: {
    backgroundColor: AppColors.canvas,
    borderWidth: 1,
    borderColor: AppColors.danger,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...AppTypography.button,
    color: AppColors.canvas,
  },
  buttonTextCancel: {
    color: AppColors.danger,
  },
  deleteButton: {
    height: AppSpacing.buttonHeight,
    borderRadius: AppSpacing.radiusPill,
    borderWidth: 1,
    borderColor: AppColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    ...AppTypography.button,
    color: AppColors.danger,
  },
});
