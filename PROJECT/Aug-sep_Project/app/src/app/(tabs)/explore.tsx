import { router } from 'expo-router';
import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
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
import { GlassDateTimePicker } from '@/components/glass-date-time-picker';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { db } from '@/lib/firebase';
import { useUserRole } from '@/hooks/use-user-role';

type EventListItem = {
  id: string;
  title: string;
  date: Date | null;
  participantCount: number;
};

type AdminSection = 'register' | 'participants';

function formatDateTime(date: Date | null) {
  if (!date) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]}) ${hour}:${minute}`;
}

export default function AdminScreen() {
  const role = useUserRole();
  const [section, setSection] = useState<AdminSection>('register');

  const [title, setTitle] = useState('');
  const [place, setPlace] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [eventList, setEventList] = useState<EventListItem[]>([]);

  useEffect(() => {
    const allEventsQuery = query(collection(db, 'events'), orderBy('날짜', 'desc'));
    return onSnapshot(allEventsQuery, (snapshot) => {
      setEventList(
        snapshot.docs.map((eventDoc) => {
          const data = eventDoc.data();
          const timestamp = data['날짜'] as Timestamp | undefined;
          return {
            id: eventDoc.id,
            title: (data['제목'] as string) ?? '',
            date: timestamp ? timestamp.toDate() : null,
            participantCount: (data['참가자 수'] as number) ?? 0,
          };
        }),
      );
    });
  }, []);

  const handleSubmit = async () => {
    if (!title || !place) {
      setMessageType('error');
      setMessage('제목과 장소는 필수입니다.');
      return;
    }
    if (date.getTime() <= Date.now()) {
      setMessageType('error');
      setMessage('지난 시간은 설정할 수 없습니다.');
      return;
    }

    setMessage('');
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'events'), {
        '제목': title,
        '날짜': Timestamp.fromDate(date),
        '장소': place,
        '내용': content,
      });
      setTitle('');
      setPlace('');
      setContent('');
      setDate(new Date());
      setMessageType('success');
      setMessage('일정이 등록되었습니다.');
    } catch {
      setMessageType('error');
      setMessage('일정 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 탭 바에서는 관리자에게만 이 화면이 보이지만, 딥링크 등으로 직접 들어오는
  // 경우를 대비해 화면 자체에서도 한 번 더 권한을 확인한다.
  if (role !== null && role !== '운영자') {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={styles.container} edges={['top']}>
          <Text style={styles.title}>관리자</Text>
          <Text style={styles.messageText}>관리자만 사용할 수 있는 화면입니다.</Text>
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
          <View style={styles.segmentTrack}>
            <Pressable
              style={[styles.segmentItem, section === 'register' && styles.segmentItemActive]}
              onPress={() => setSection('register')}>
              <Text
                style={[
                  styles.segmentText,
                  section === 'register' && styles.segmentTextActive,
                ]}>
                일정 등록
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentItem,
                section === 'participants' && styles.segmentItemActive,
              ]}
              onPress={() => setSection('participants')}>
              <Text
                style={[
                  styles.segmentText,
                  section === 'participants' && styles.segmentTextActive,
                ]}>
                참가자 명단
              </Text>
            </Pressable>
          </View>

          {section === 'register' ? (
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>제목</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="예: 9월 월례대회"
              />

              <Text style={styles.label}>날짜/시간</Text>
              <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateText}>{formatDateTime(date)}</Text>
              </Pressable>

              <Text style={styles.label}>장소</Text>
              <TextInput
                style={styles.input}
                value={place}
                onChangeText={setPlace}
                placeholder="예: OO체육관"
              />

              <Text style={styles.label}>내용</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={content}
                onChangeText={setContent}
                placeholder="일정에 대한 설명"
                multiline
              />

              {message ? (
                <View
                  style={[
                    styles.messageBox,
                    messageType === 'error' ? styles.messageBoxError : styles.messageBoxSuccess,
                  ]}>
                  <Text
                    style={
                      messageType === 'error' ? styles.messageTextError : styles.messageText
                    }>
                    {message}
                  </Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color={AppColors.canvas} />
                ) : (
                  <Text style={styles.buttonText}>등록하기</Text>
                )}
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.scrollContent}>
              {eventList.length === 0 ? (
                <Text style={styles.messageText}>등록된 일정이 없습니다.</Text>
              ) : (
                eventList.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.eventRowWrap}
                    onPress={() =>
                      router.push({
                        pathname: '/admin/participants/[id]',
                        params: { id: item.id },
                      })
                    }>
                    <GlassSurface>
                      <Text style={styles.eventRowTitle}>{item.title}</Text>
                      <Text style={styles.eventRowMeta}>
                        {formatDateTime(item.date)} · 참가 {item.participantCount}명
                      </Text>
                    </GlassSurface>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </KeyboardAvoidingView>

      <GlassDateTimePicker
        visible={showDatePicker}
        value={date}
        onClose={() => setShowDatePicker(false)}
        onConfirm={(selectedDate) => {
          setDate(selectedDate);
          setShowDatePicker(false);
        }}
      />
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
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    borderRadius: AppSpacing.radiusPill,
    marginHorizontal: AppSpacing.screenPadding,
    marginTop: 12,
    marginBottom: 16,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    height: 40,
    borderRadius: AppSpacing.radiusPill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: AppColors.primary,
  },
  segmentText: {
    ...AppTypography.body,
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.body,
  },
  segmentTextActive: {
    color: AppColors.canvas,
  },
  scrollContent: {
    paddingHorizontal: AppSpacing.screenPadding,
    paddingBottom: 40,
  },
  title: {
    ...AppTypography.title,
    color: AppColors.ink,
    marginVertical: 16,
  },
  label: {
    ...AppTypography.caption,
    color: AppColors.muted,
    marginBottom: 6,
  },
  input: {
    ...AppTypography.body,
    minHeight: AppSpacing.inputHeight,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: AppColors.glassBorder,
    borderRadius: AppSpacing.radiusInput,
    paddingHorizontal: 16,
    marginBottom: 16,
    color: AppColors.ink,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  dateText: {
    ...AppTypography.body,
    color: AppColors.ink,
  },
  messageText: {
    ...AppTypography.caption,
    color: AppColors.body,
    marginBottom: 12,
  },
  messageBox: {
    borderRadius: AppSpacing.radiusInput,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  messageBoxError: {
    backgroundColor: 'rgba(207,32,47,0.1)',
    borderColor: AppColors.danger,
  },
  messageBoxSuccess: {
    backgroundColor: 'rgba(5,177,105,0.1)',
    borderColor: AppColors.success,
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
  },
  buttonDisabled: {
    backgroundColor: AppColors.primaryDisabled,
  },
  buttonText: {
    ...AppTypography.button,
    color: AppColors.canvas,
  },
  eventRowWrap: {
    marginBottom: 12,
  },
  eventRowTitle: {
    ...AppTypography.cardTitle,
    color: AppColors.ink,
    marginBottom: 4,
  },
  eventRowMeta: {
    ...AppTypography.caption,
    color: AppColors.muted,
  },
});
