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

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface ConnectionItem {
  connection: UserConnection;
  user: User;
}

interface ConnectionCardProps {
  item: ConnectionItem;
  currentUserId: string;
  colors: any;
  styles: ReturnType<typeof getStyles>;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────────────────────

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
    try {
      setBusy(true);
      await fn(connection.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Top Section */}
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>

        <View style={styles.userContent}>
          <View style={styles.userRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>

            <View
              style={[
                styles.badge,
                isAccepted ? styles.badgeSuccess : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isAccepted
                      ? '#2D6A4F'
                      : colors.muted,
                  },
                ]}
              >
                {isAccepted ? 'Connected' : 'Pending'}
              </Text>
            </View>
          </View>

          {user.bio ? (
            <Text style={styles.userBio} numberOfLines={2}>
              {user.bio}
            </Text>
          ) : (
            <Text style={styles.placeholderBio}>
              No bio added yet
            </Text>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {isPending && isIncoming ? (
          <>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                busy && styles.buttonDisabled,
              ]}
              onPress={wrap(onAccept)}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="white"
              />

              <Text style={styles.primaryButtonText}>
                Accept
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                busy && styles.buttonDisabled,
              ]}
              onPress={wrap(onDecline)}
              disabled={busy}
              activeOpacity={0.85}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color="#B6465F"
              />

              <Text style={styles.secondaryButtonText}>
                Decline
              </Text>
            </TouchableOpacity>
          </>
        ) : isPending ? (
          <View style={styles.pendingContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.muted}
            />

            <Text style={styles.pendingText}>
              Waiting for response
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              router.push({
                pathname: '/user-profile',
                params: { userId: user.uid },
              })
            }
            activeOpacity={0.85}
          >
            <Text style={styles.profileButtonText}>
              View Profile
            </Text>

            <Ionicons
              name="arrow-forward"
              size={16}
              color={colors.accent}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────

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
              conn.fromUserId === userProfile.uid
                ? conn.toUserId
                : conn.fromUserId;

            const user = await getUserById(otherUserId);

            return user
              ? { connection: conn, user }
              : null;
          })
        );

        return results.filter(Boolean) as ConnectionItem[];
      };

      const [resolvedConnections, resolvedPending] =
        await Promise.all([
          resolveUsers(connData),
          resolveUsers(pendingData),
        ]);

      setConnections(resolvedConnections);
      setPendingRequests(resolvedPending);
    } catch (error) {
      console.error(error);

      Alert.alert(
        'Error',
        'Failed to load connections.'
      );
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

      Alert.alert(
        'Connection Accepted',
        'You are now connected.'
      );
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
    [
      userProfile?.uid,
      colors,
      styles,
      handleAcceptConnection,
      handleDeclineConnection,
    ]
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator
          size="large"
          color={colors.accent}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Your Network
        </Text>

        <Text style={styles.subtitle}>
          {isEmpty
            ? 'Start building meaningful connections'
            : `${connections.length} connected • ${pendingRequests.length} pending`}
        </Text>
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.connection.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          isEmpty
            ? styles.emptyContainer
            : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ItemSeparatorComponent={() => (
          <View style={{ height: 18 }} />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🤝"
            title="No connections yet"
            subtitle="Connect with people to start exchanging skills and opportunities."
          />
        }
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const getStyles = (colors: any) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },

    header: {
      paddingTop: 90,
      paddingBottom: 24,
      paddingHorizontal: 24,
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: colors.ink,
      letterSpacing: -1,
    },

    subtitle: {
      marginTop: 6,
      fontSize: 15,
      color: colors.muted,
      lineHeight: 22,
    },

    listContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 26,
      padding: 20,

      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: {
        width: 0,
        height: 6,
      },

      elevation: 4,

      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.04)',
    },

    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,

      alignItems: 'center',
      justifyContent: 'center',

      marginRight: 14,
    },

    avatarText: {
      color: 'white',
      fontSize: 22,
      fontWeight: '700',
    },

    userContent: {
      flex: 1,
    },

    userRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
      gap: 10,
    },

    userName: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: colors.ink,
    },

    userBio: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.body,
    },

    placeholderBio: {
      fontSize: 14,
      color: colors.muted,
      fontStyle: 'italic',
    },

    badge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },

    badgeSuccess: {
      backgroundColor: 'rgba(45,106,79,0.12)',
    },

    badgePending: {
      backgroundColor: colors.softSurface,
    },

    badgeText: {
      fontSize: 12,
      fontWeight: '700',
    },

    actions: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    primaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 16,

      backgroundColor: colors.accent,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      gap: 8,
    },

    primaryButtonText: {
      color: 'white',
      fontSize: 15,
      fontWeight: '700',
    },

    secondaryButton: {
      flex: 1,
      height: 48,
      borderRadius: 16,

      backgroundColor: '#FFF1F4',

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',

      gap: 8,
    },

    secondaryButtonText: {
      color: '#B6465F',
      fontSize: 15,
      fontWeight: '700',
    },

    buttonDisabled: {
      opacity: 0.6,
    },

    pendingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    pendingText: {
      fontSize: 14,
      color: colors.muted,
      fontWeight: '500',
    },

    profileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    profileButtonText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 15,
    },
  });