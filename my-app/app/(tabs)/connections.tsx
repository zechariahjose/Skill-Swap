import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  getUserConnections,
  updateConnectionStatus,
  getUserById,
} from '../../src/firebase/firestore';
import { UserConnection, User } from '../../src/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectionItem {
  connection: UserConnection;
  user: User;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ConnectionCardProps {
  item: ConnectionItem;
  currentUserId: string;
  colors: any;
  styles: ReturnType<typeof getStyles>;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

function ConnectionCard({
  item,
  currentUserId,
  colors,
  styles,
  onAccept,
  onDecline,
}: ConnectionCardProps) {
  const [busy, setBusy] = useState(false);
  const { connection, user } = item;
  const isIncoming = connection.toUserId === currentUserId;
  const isPending = connection.status === 'pending';
  const isAccepted = connection.status === 'accepted';

  const wrap = (fn: (id: string) => Promise<void>) => async () => {
    setBusy(true);
    try {
      await fn(connection.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.connectionCard}>
      {/* Header row */}
      <View style={styles.connectionHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          {user.bio ? (
            <Text style={styles.userBio} numberOfLines={2}>
              {user.bio}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.statusBadge,
            isAccepted ? styles.statusBadgeAccepted : styles.statusBadgePending,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: isAccepted ? '#3F5A48' : colors.muted },
            ]}
          >
            {isAccepted ? 'Connected' : 'Pending'}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.connectionActions}>
        {isPending && isIncoming ? (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.acceptButton,
                busy && styles.buttonDisabled,
              ]}
              onPress={wrap(onAccept)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Accept connection"
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.declineButton,
                busy && styles.buttonDisabled,
              ]}
              onPress={wrap(onDecline)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Decline connection"
            >
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.actionButtonText}>Decline</Text>
            </TouchableOpacity>
          </>
        ) : isPending ? (
          <View style={styles.sentRow}>
            <Ionicons name="time-outline" size={14} color={colors.muted} />
            <Text style={styles.pendingText}>Request sent</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() => router.push(`/user-profile?userId=${user.uid}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${user.name}'s profile`}
          >
            <Text style={[styles.viewProfileText, { color: colors.accent }]}>
              View Profile
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ConnectionsScreen() {
  const { userProfile } = useAuthContext();
  const { colors } = useTheme();
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => getStyles(colors), [colors]);

  const loadConnections = useCallback(async () => {
    if (!userProfile?.uid) return;

    try {
      const { connections: connData, pendingRequests: pendingData } =
        await getUserConnections(userProfile.uid);

      const resolveUsers = async (list: UserConnection[]) => {
        const results = await Promise.all(
          list.map(async (conn) => {
            const otherUserId =
              conn.fromUserId === userProfile.uid ? conn.toUserId : conn.fromUserId;
            const user = await getUserById(otherUserId);
            return user ? { connection: conn, user } : null;
          })
        );
        return results.filter(Boolean) as ConnectionItem[];
      };

      const [resolvedConnections, resolvedPending] = await Promise.all([
        resolveUsers(connData),
        resolveUsers(pendingData),
      ]);

      setConnections(resolvedConnections);
      setPendingRequests(resolvedPending);
    } catch (error) {
      console.error('Error loading connections:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleAcceptConnection = useCallback(
    async (connectionId: string) => {
      await updateConnectionStatus(connectionId, 'accepted');
      await loadConnections();
      Alert.alert('Success', 'Connection accepted!');
    },
    [loadConnections]
  );

  const handleDeclineConnection = useCallback(
    async (connectionId: string) => {
      await updateConnectionStatus(connectionId, 'declined');
      await loadConnections();
      Alert.alert('Connection declined');
    },
    [loadConnections]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConnections();
  }, [loadConnections]);

  const listData = useMemo(
    () => [...pendingRequests, ...connections],
    [pendingRequests, connections]
  );

  const isEmpty = listData.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: ConnectionItem }) => (
      <ConnectionCard
        item={item}
        currentUserId={userProfile?.uid ?? ''}
        colors={colors}
        styles={styles}
        onAccept={handleAcceptConnection}
        onDecline={handleDeclineConnection}
      />
    ),
    [userProfile?.uid, colors, styles, handleAcceptConnection, handleDeclineConnection]
  );

  const keyExtractor = useCallback(
    (item: ConnectionItem) => item.connection.id,
    []
  );

  const Separator = useCallback(
    () => <View style={styles.separator} />,
    [styles]
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connections</Text>
        <Text style={styles.headerSubtitle}>
          {isEmpty
            ? 'Start building your network'
            : `${connections.length} connected · ${pendingRequests.length} pending`}
        </Text>
      </View>

      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🤝"
            title="No connections yet"
            subtitle="Connect with people to start swapping skills"
          />
        }
        contentContainerStyle={isEmpty ? styles.emptyList : styles.listContent}
        ItemSeparatorComponent={Separator}
        removeClippedSubviews
        windowSize={10}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      paddingHorizontal: Theme.spacing.lg,
      paddingTop: Theme.spacing.xl * 2,
      paddingBottom: Theme.spacing.md,
    },
    headerTitle: {
      fontSize: Theme.fontSize.h1,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: Theme.spacing.xs,
    },
    headerSubtitle: {
      fontSize: Theme.fontSize.body,
      color: colors.muted,
    },
    listContent: {
      paddingVertical: Theme.spacing.sm,
    },
    connectionCard: {
      backgroundColor: colors.surface,
      marginHorizontal: Theme.spacing.lg,
      padding: Theme.spacing.lg,
      borderRadius: Theme.borderRadius.lg,
      ...Theme.shadow.card,
    },
    connectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Theme.spacing.md,
      gap: Theme.spacing.sm,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: Theme.fontSize.h2,
      fontWeight: '600',
      color: colors.ink,
      marginBottom: 2,
    },
    userBio: {
      fontSize: Theme.fontSize.body,
      color: colors.body,
      lineHeight: 20,
    },
    statusBadge: {
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: 3,
      borderRadius: Theme.borderRadius.sm,
      flexShrink: 0,
    },
    statusBadgeAccepted: {
      backgroundColor: '#3F5A4820',
    },
    statusBadgePending: {
      backgroundColor: colors.softSurface,
    },
    statusBadgeText: {
      fontSize: Theme.fontSize.small,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    connectionActions: {
      flexDirection: 'row',
      gap: Theme.spacing.sm,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Theme.spacing.sm,
      paddingHorizontal: Theme.spacing.md,
      borderRadius: Theme.borderRadius.md,
      gap: Theme.spacing.xs,
    },
    acceptButton: {
      backgroundColor: '#3F5A48',
    },
    declineButton: {
      backgroundColor: '#6A4040',
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      color: 'white',
      fontSize: Theme.fontSize.small,
      fontWeight: '600',
    },
    sentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.xs,
      flex: 1,
    },
    pendingText: {
      fontSize: Theme.fontSize.body,
      color: colors.muted,
      fontStyle: 'italic',
    },
    viewProfileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Theme.spacing.sm,
      gap: Theme.spacing.xs,
    },
    viewProfileText: {
      fontSize: Theme.fontSize.body,
      fontWeight: '600',
    },
    separator: {
      height: Theme.spacing.md,
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
    },
  });