import { useLocalSearchParams } from 'expo-router';
import {
  DocumentReference,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, AppSpacing, AppTypography } from '@/constants/app-theme';
import { GlassSurface } from '@/components/glass-surface';
import { ScreenBackground } from '@/components/screen-background';
import { db } from '@/lib/firebase';

type ParticipantItem = {
  id: string;
  name: string;
};

export default function ParticipantListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [eventTitle, setEventTitle] = useState('');
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'events', id)).then((snap) => {
      if (snap.exists()) setEventTitle((snap.data()['제목'] as string) ?? '');
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const participationsQuery = query(
      collection(db, 'participations'),
      where('일정', '==', doc(db, 'events', id)),
      where('신청 상태', '==', '신청함'),
    );

    const unsubscribe = onSnapshot(participationsQuery, async (snapshot) => {
      const userDocs = await Promise.all(
        snapshot.docs.map((participationDoc) => {
          const userRef = participationDoc.data()['회원'] as DocumentReference;
          return getDoc(userRef);
        }),
      );

      setParticipants(
        userDocs
          .filter((userSnap) => userSnap.exists())
          .map((userSnap) => ({
            id: userSnap.id,
            name: (userSnap.data()!['이름'] as string) ?? '이름 없음',
          })),
      );
      setIsLoading(false);
    });

    return unsubscribe;
  }, [id]);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>
          {eventTitle} 참가자 ({participants.length}명)
        </Text>

        <GlassSurface contentStyle={styles.glassContent}>
          {isLoading ? (
            <ActivityIndicator color={AppColors.primary} style={styles.loading} />
          ) : (
            <FlatList
              data={participants}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>아직 참가 신청한 회원이 없습니다.</Text>
              }
              renderItem={({ item, index }) => (
                <Text style={styles.participantRow}>
                  {index + 1}. {item.name}
                </Text>
              )}
            />
          )}
        </GlassSurface>
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
  glassContent: {
    padding: 8,
  },
  title: {
    ...AppTypography.title,
    fontSize: 20,
    color: AppColors.ink,
    marginBottom: 20,
  },
  loading: {
    marginTop: 32,
  },
  participantRow: {
    ...AppTypography.body,
    color: AppColors.ink,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.hairline,
  },
  emptyText: {
    ...AppTypography.body,
    color: AppColors.muted,
    textAlign: 'center',
    marginTop: 32,
  },
});
