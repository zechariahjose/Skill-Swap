import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import SwapRequestCard from '../components/SwapRequestCard';
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { subscribeToSwapRequests, updateSwapStatus } from '../../src/firebase/firestore';
import { SwapRequest } from '../../src/types';

type ViewMode = 'incoming' | 'outgoing';

export default function RequestsScreen() {
  const { userProfile } = useAuthContext();
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);
  const [mode, setMode] = useState<ViewMode>('incoming');

  useEffect(() => {
    if (!userProfile) return;
    const unsubscribe = subscribeToSwapRequests(userProfile.uid, (newIncoming, newOutgoing) => {
      setIncoming(newIncoming);
      setOutgoing(newOutgoing);
    });
    return unsubscribe;
  }, [userProfile]);

  const data = mode === 'incoming' ? incoming : outgoing;

  return (
    <View style={styles.screen}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          Your Swaps <Text style={styles.pageCount}>({data.length})</Text>
        </Text>

        <View style={styles.segmentTrack}>
          <Pressable
            onPress={() => setMode('incoming')}
            style={[styles.segment, mode === 'incoming' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, mode === 'incoming' && styles.segmentTextActive]}>
              Incoming
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('outgoing')}
            style={[styles.segment, mode === 'outgoing' && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, mode === 'outgoing' && styles.segmentTextActive]}>
              Outgoing
            </Text>
          </Pressable>
        </View>
      </View>

      {data.length === 0 ? (
        <EmptyState
          emoji="↔"
          title={mode === 'incoming' ? 'No requests yet' : 'Nothing sent yet'}
          subtitle={mode === 'incoming'
            ? 'When someone wants your skill, it shows up here.'
            : 'Browse the Skill Board and send your first request.'}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardPad}>
              <SwapRequestCard
                request={item}
                mode={mode}
                onAccept={(id) => updateSwapStatus(id, 'accepted')}
                onReject={(id) => updateSwapStatus(id, 'rejected')}
                onComplete={(id) => updateSwapStatus(id, 'completed')}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  pageHeader: {
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 16,
    gap: 14,
  },
  pageTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  pageCount: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.muted,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: Colors.softSurface,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    borderRadius: Theme.borderRadius.full,
  },
  segmentActive: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: Colors.muted,
  },
  segmentTextActive: {
    color: Colors.ink,
  },
  cardPad: { paddingHorizontal: Theme.spacing.lg },
  listContent: { paddingTop: 4, paddingBottom: 90 },
});
