import { router } from 'expo-router';
import {
  DocumentReference,
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { auth, db } from '@/lib/firebase';

type MyEventItem = {
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

export default function MyEventsScreen() {
  const [items, setItems] = useState<MyEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const myParticipationsQuery = query(
      collection(db, 'participations'),
      where('회원', '==', doc(db, 'users', uid)),
      where('신청 상태', '==', '신청함'),
    );

    const unsubscribe = onSnapshot(myParticipationsQuery, async (snapshot) => {
      const eventDocs = await Promise.all(
        snapshot.docs.map((participationDoc) => {
          const eventRef = participationDoc.data()['일정'] as DocumentReference;
          return getDoc(eventRef);
        }),
      );

      const eventItems = eventDocs
        .filter((eventSnap) => eventSnap.exists())
        .map((eventSnap) => {
          const data = eventSnap.data()!;
          const timestamp = data['날짜'] as Timestamp | undefined;
          return {
            id: eventSnap.id,
            title: (data['제목'] as string) ?? '',
            date: timestamp ? timestamp.toDate() : null,
            place: (data['장소'] as string) ?? '',
          };
        })
        .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));

      setItems(eventItems);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        {isLoading ? (
          <ActivityIndicator color={AppColors.primary} style={styles.loading} />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>신청한 일정이 없습니다.</Text>
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
    paddingTop: 16,
  },
  loading: {
    marginTop: 32,
  },
  listContent: {
    gap: 12,
    paddingBottom: 32,
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
    marginTop: 32,
  },
});
