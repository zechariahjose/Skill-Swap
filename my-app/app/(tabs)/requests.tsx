import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import SwapRequestCard from '../components/SwapRequestCard';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useAuthContext } from '../context/AuthContext';
import { subscribeToSwapRequests, updateSwapStatus } from '../firebase/firestore';
import { SwapRequest } from '../types';

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
    <View style={styles.container}>
      <Text style={styles.heading}>Swap requests</Text>
      <View style={styles.switchRow}>
        <Pressable
          onPress={() => setMode('incoming')}
          style={[styles.switchButton, mode === 'incoming' && styles.switchButtonActive]}
        >
          <Text style={[styles.switchText, mode === 'incoming' && styles.switchTextActive]}>Incoming</Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('outgoing')}
          style={[styles.switchButton, mode === 'outgoing' && styles.switchButtonActive]}
        >
          <Text style={[styles.switchText, mode === 'outgoing' && styles.switchTextActive]}>Outgoing</Text>
        </Pressable>
      </View>

      {data.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No requests yet"
          subtitle={mode === 'incoming' ? 'Incoming swaps will appear here.' : 'Sent swaps will appear here.'}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SwapRequestCard
              request={item}
              mode={mode}
              onAccept={(id) => updateSwapStatus(id, 'accepted')}
              onReject={(id) => updateSwapStatus(id, 'rejected')}
              onComplete={(id) => updateSwapStatus(id, 'completed')}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
  },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    color: Colors.charcoal,
    marginBottom: Theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  switchButton: {
    flex: 1,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchButtonActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  switchText: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.charcoal,
  },
  switchTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingBottom: Theme.spacing.xxl,
  },
});
