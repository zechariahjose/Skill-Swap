import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import EmptyState from '../components/EmptyState';
import SwapRequestCard from '../components/SwapRequestCard';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { subscribeToSwapRequests, updateSwapStatus } from '../../src/firebase/firestore';
import { SwapRequest } from '../../src/types';

type ViewMode = 'incoming' | 'outgoing';

export default function RequestsScreen() {
  const { userProfile } = useAuthContext();
  const { colors } = useTheme();
  const [incoming, setIncoming] = useState<SwapRequest[]>([]);
  const [outgoing, setOutgoing] = useState<SwapRequest[]>([]);
  const [mode, setMode] = useState<ViewMode>('incoming');
  const [refreshing, setRefreshing] = useState(false);

  const styles = getStyles(colors);

  useEffect(() => {
    if (!userProfile) return;
    const unsubscribe = subscribeToSwapRequests(userProfile.uid, (newIncoming, newOutgoing) => {
      setIncoming(newIncoming);
      setOutgoing(newOutgoing);
      setRefreshing(false);
    });
    return unsubscribe;
  }, [userProfile]);

  const handleRefresh = () => {
    setRefreshing(true);
    // subscribeToSwapRequests will call back and set refreshing false
    // but as a safety net, reset after 2s
    setTimeout(() => setRefreshing(false), 2000);
  };

  const data = mode === 'incoming' ? incoming : outgoing;

  return (
    <View style={styles.screen}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>
          Your Swaps <Text style={styles.pageCount}>({data.length})</Text>
        </Text>

        <View style={[styles.segmentTrack, { backgroundColor: colors.softSurface, borderColor: colors.border }]}> 
          <Pressable
            onPress={() => setMode('incoming')}
            style={[styles.segment, mode === 'incoming' && styles.segmentActive, { backgroundColor: mode === 'incoming' ? colors.surface : 'transparent' }]}
          >
            <Text style={[styles.segmentText, mode === 'incoming' && styles.segmentTextActive]}>
              Incoming
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('outgoing')}
            style={[styles.segment, mode === 'outgoing' && styles.segmentActive, { backgroundColor: mode === 'outgoing' ? colors.surface : 'transparent' }]}
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
          subtitle={
            mode === 'incoming'
              ? 'When someone wants your skill, it shows up here.'
              : 'Browse the Skill Board and send your first request.'
          }
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
                currentUserId={userProfile?.uid}
                onAccept={(id) => updateSwapStatus(id, 'accepted')}
                onReject={(id) => updateSwapStatus(id, 'rejected')}
                onComplete={(id) => updateSwapStatus(id, 'completed')}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: typeof import('../../src/constants/Colors').Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    pageHeader: {
      paddingTop: 60,
      paddingHorizontal: Theme.spacing.lg,
      paddingBottom: 16,
      gap: 14,
    },
    pageTitle: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 28,
      color: colors.ink,
      letterSpacing: -0.5,
    },
    pageCount: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 13,
      color: colors.muted,
    },
    segmentTrack: {
      flexDirection: 'row',
      borderRadius: Theme.borderRadius.full,
      borderWidth: 1,
      padding: 4,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      height: 34,
      borderRadius: Theme.borderRadius.full,
    },
    segmentActive: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 13,
      color: colors.muted,
    },
    segmentTextActive: {
      color: colors.ink,
    },
    cardPad: { paddingHorizontal: Theme.spacing.lg },
    listContent: { paddingTop: 4, paddingBottom: 90 },
  });
