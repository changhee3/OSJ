import { router } from 'expo-router';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { auth, db } from '@/lib/firebase';

type EventItem = {
  id: string;
  title: string;
  date: Date | null;
  place: string;
};

function formatDate(date: Date | null) {
  if (!date) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${date.getMonth() + 1}/${date.getDate()}(${days[date.getDay()]}) ${hour}:${minute}`;
}

export default function HomeScreen() {
  const [userName, setUserName] = useState('');
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    getDoc(doc(db, 'users', uid)).then((snap) => {
      if (snap.exists()) {
        setUserName((snap.data()['이름'] as string) ?? '');
      }
    });

    const upcomingEventsQuery = query(
      collection(db, 'events'),
      where('날짜', '>=', Timestamp.now()),
      orderBy('날짜', 'asc'),
    );

    const unsubscribe = onSnapshot(upcomingEventsQuery, (snapshot) => {
      const items: EventItem[] = snapshot.docs.map((eventDoc) => {
        const data = eventDoc.data();
        const timestamp = data['날짜'] as Timestamp | undefined;
        return {
          id: eventDoc.id,
          title: (data['제목'] as string) ?? '',
          date: timestamp ? timestamp.toDate() : null,
          place: (data['장소'] as string) ?? '',
        };
      });
      setEvents(items);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {userName ? `${userName}님, 안녕하세요` : '안녕하세요'}
          </Text>
        </View>

        <Pressable onPress={() => router.push('/my-events')}>
          <GlassSurface radius={AppSpacing.radiusPill} contentStyle={styles.chipContent}>
            <Text style={styles.myEventsLink}>내 참가 일정 보기</Text>
          </GlassSurface>
        </Pressable>

        <Text style={styles.sectionTitle}>곧 다가오는 일정</Text>

        {isLoading ? (
          <ActivityIndicator color={AppColors.primary} style={styles.loading} />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              events.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={
              <Text style={styles.emptyText}>다가오는 일정이 없습니다.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/event/[id]', params: { id: item.id } })
                }>
                <GlassSurface>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardMeta}>
                    {formatDate(item.date)} · {item.place}
                  </Text>
                </GlassSurface>
              </Pressable>
            )}
          />
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  greeting: {
    ...AppTypography.title,
    fontSize: 20,
    color: AppColors.ink,
  },
  chipContent: {
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  myEventsLink: {
    ...AppTypography.body,
    fontSize: 15,
    color: AppColors.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    ...AppTypography.cardTitle,
    color: AppColors.ink,
    marginTop: 20,
    marginBottom: 12,
  },
  loading: {
    marginTop: 32,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    ...AppTypography.cardTitle,
    color: AppColors.ink,
    marginBottom: 4,
  },
  cardMeta: {
    ...AppTypography.caption,
    color: AppColors.muted,
  },
  emptyText: {
    ...AppTypography.body,
    color: AppColors.muted,
    textAlign: 'center',
  },
});
