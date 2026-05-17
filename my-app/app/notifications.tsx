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
import EmptyState from './components/EmptyState';
import { Theme } from '../src/constants/Theme';
import { useAuthContext } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import {
  getNotificationsForUser,
  clearNotificationsForUser,
  updateConnectionStatus,
  updateSwapStatus,
} from '../src/firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'connection_declined'
  | 'swap_request'
  | 'swap_accepted'
  | 'swap_declined'
  | 'swap_pending'
  | 'swap_completed';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: Date | string | null;
  read: boolean;
  fromUserId?: string;
  connectionId?: string;
  swapRequestId?: string;
}

// ─── Constants (outside component — no recreation on render) ──────────────────

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  connection_request: 'person-add',
  connection_accepted: 'people',
  connection_declined: 'people',
  swap_request: 'swap-horizontal',
  swap_accepted: 'checkmark-circle',
  swap_declined: 'close-circle',
  swap_pending: 'time',
  swap_completed: 'star',
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  connection_request: '#4A4641',
  swap_request: '#4A4641',
  connection_accepted: '#3F5A48',
  swap_accepted: '#3F5A48',
  connection_declined: '#6A4040',
  swap_declined: '#6A4040',
  swap_pending: '#7A6A3A',
  swap_completed: '#8A7830',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return '';

  const diffMs = Date.now() - parsed.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ActionButtonsProps {
  item: Notification;
  colors: any;
  styles: ReturnType<typeof getStyles>;
  disabled: boolean;
  onAcceptConnection: (id: string) => void;
  onDeclineConnection: (id: string) => void;
  onAcceptSwap: (id: string) => void;
  onDeclineSwap: (id: string) => void;
  onViewProfile: (id: string) => void;
}

function ActionButtons({
  item,
  colors,
  styles,
  disabled,
  onAcceptConnection,
  onDeclineConnection,
  onAcceptSwap,
  onDeclineSwap,
  onViewProfile,
}: ActionButtonsProps) {
  const isRequest =
    item.type === 'connection_request' || item.type === 'swap_request';
  const isConnectionResponse =
    item.type === 'connection_accepted' || item.type === 'connection_declined';
  const isSwapResponse =
    item.type === 'swap_accepted' ||
    item.type === 'swap_declined' ||
    item.type === 'swap_pending' ||
    item.type === 'swap_completed';

  if (isRequest) {
    const onAccept =
      item.type === 'connection_request' && item.connectionId
        ? () => onAcceptConnection(item.connectionId!)
        : item.type === 'swap_request' && item.swapRequestId
        ? () => onAcceptSwap(item.swapRequestId!)
        : null;

    const onDecline =
      item.type === 'connection_request' && item.connectionId
        ? () => onDeclineConnection(item.connectionId!)
        : item.type === 'swap_request' && item.swapRequestId
        ? () => onDeclineSwap(item.swapRequestId!)
        : null;

    if (!onAccept || !onDecline) return null;

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton, disabled && styles.buttonDisabled]}
          onPress={onAccept}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Accept"
        >
          <Ionicons name="checkmark" size={16} color="white" />
          <Text style={styles.actionButtonText}>Accept</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton, disabled && styles.buttonDisabled]}
          onPress={onDecline}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Decline"
        >
          <Ionicons name="close" size={16} color="white" />
          <Text style={styles.actionButtonText}>Decline</Text>
        </TouchableOpacity>

        {item.fromUserId && (
          <TouchableOpacity
            style={[styles.actionButton, styles.profileButton]}
            onPress={() => onViewProfile(item.fromUserId!)}
            accessibilityRole="button"
            accessibilityLabel="View profile"
          >
            <Ionicons name="person" size={16} color={colors.accent} />
            <Text style={[styles.actionButtonText, { color: colors.accent }]}>Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isConnectionResponse && item.fromUserId) {
    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.profileButton]}
          onPress={() => onViewProfile(item.fromUserId!)}
          accessibilityRole="button"
          accessibilityLabel="View profile"
        >
          <Ionicons name="person" size={16} color={colors.accent} />
          <Text style={[styles.actionButtonText, { color: colors.accent }]}>View Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isSwapResponse) {
    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.profileButton]}
          onPress={() => router.push('/(tabs)/requests')}
          accessibilityRole="button"
          accessibilityLabel="View swap"
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.accent} />
          <Text style={[styles.actionButtonText, { color: colors.accent }]}>View Swap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

interface NotificationItemProps {
  item: Notification;
  colors: any;
  styles: ReturnType<typeof getStyles>;
  onAcceptConnection: (id: string) => void;
  onDeclineConnection: (id: string) => void;
  onAcceptSwap: (id: string) => void;
  onDeclineSwap: (id: string) => void;
  onViewProfile: (id: string) => void;
}

function NotificationItem({
  item,
  colors,
  styles,
  onAcceptConnection,
  onDeclineConnection,
  onAcceptSwap,
  onDeclineSwap,
  onViewProfile,
}: NotificationItemProps) {
  const [busy, setBusy] = useState(false);

  const wrap =
    (fn: (id: string) => Promise<void>, id: string) => async () => {
      setBusy(true);
      try {
        await fn(id);
      } finally {
        setBusy(false);
      }
    };

  const iconName = NOTIFICATION_ICONS[item.type] ?? 'notifications';
  const iconColor = NOTIFICATION_COLORS[item.type] ?? colors.accent;
  const cardBg = item.read ? colors.background : colors.softSurface;

  return (
    <View
      style={[
        styles.notificationCard,
        { backgroundColor: cardBg },
        !item.read && { borderLeftWidth: 3, borderLeftColor: colors.accent },
      ]}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName as any} size={20} color="white" />
        </View>

        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, { color: colors.ink }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: colors.body }]} numberOfLines={3}>
            {item.message}
          </Text>
          <Text style={[styles.notificationTime, { color: colors.muted }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />
        )}
      </View>

      <ActionButtons
        item={item}
        colors={colors}
        styles={styles}
        disabled={busy}
        onAcceptConnection={wrap(
          async (id) => { await onAcceptConnection(id); },
          item.connectionId ?? ''
        )}
        onDeclineConnection={wrap(
          async (id) => { await onDeclineConnection(id); },
          item.connectionId ?? ''
        )}
        onAcceptSwap={wrap(
          async (id) => { await onAcceptSwap(id); },
          item.swapRequestId ?? ''
        )}
        onDeclineSwap={wrap(
          async (id) => { await onDeclineSwap(id); },
          item.swapRequestId ?? ''
        )}
        onViewProfile={onViewProfile}
      />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { userProfile } = useAuthContext();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useMemo(() => getStyles(colors), [colors]);

  const loadNotifications = useCallback(async () => {
    if (!userProfile?.uid) return;
    try {
      const notifs = await getNotificationsForUser(userProfile.uid);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error loading notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userProfile?.uid]);

  // Load on mount and when uid changes
  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleAcceptConnection = useCallback(async (connectionId: string) => {
    await updateConnectionStatus(connectionId, 'accepted');
    await loadNotifications();
    Alert.alert('Success', 'Connection accepted!');
  }, [loadNotifications]);

  const handleDeclineConnection = useCallback(async (connectionId: string) => {
    await updateConnectionStatus(connectionId, 'declined');
    await loadNotifications();
    Alert.alert('Connection declined');
  }, [loadNotifications]);

  const handleAcceptSwap = useCallback(async (swapRequestId: string) => {
    await updateSwapStatus(swapRequestId, 'accepted');
    await loadNotifications();
    Alert.alert('Success', 'Swap request accepted!');
  }, [loadNotifications]);

  const handleDeclineSwap = useCallback(async (swapRequestId: string) => {
    await updateSwapStatus(swapRequestId, 'rejected');
    await loadNotifications();
    Alert.alert('Swap request declined');
  }, [loadNotifications]);

  const handleViewProfile = useCallback((userId: string) => {
    router.push(`/user-profile?userId=${userId}`);
  }, []);

  const handleClearNotifications = useCallback(() => {
    if (!userProfile) return;
    Alert.alert(
      'Clear notifications?',
      'This will remove all current notifications from this tab.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearNotificationsForUser(userProfile.uid);
              await loadNotifications();
            } catch {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          },
        },
      ]
    );
  }, [userProfile, loadNotifications]);

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <NotificationItem
        item={item}
        colors={colors}
        styles={styles}
        onAcceptConnection={handleAcceptConnection}
        onDeclineConnection={handleDeclineConnection}
        onAcceptSwap={handleAcceptSwap}
        onDeclineSwap={handleDeclineSwap}
        onViewProfile={handleViewProfile}
      />
    ),
    [
      colors,
      styles,
      handleAcceptConnection,
      handleDeclineConnection,
      handleAcceptSwap,
      handleDeclineSwap,
      handleViewProfile,
    ]
  );

  const keyExtractor = useCallback((item: Notification) => item.id, []);

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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <TouchableOpacity
          onPress={handleClearNotifications}
          style={styles.clearButton}
          disabled={notifications.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Clear all notifications"
        >
          <Text
            style={[
              styles.clearButtonText,
              { color: notifications.length === 0 ? colors.muted : colors.accent },
            ]}
          >
            Clear
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={notifications.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🔔"
            title="No notifications yet"
            subtitle="You'll see updates about connections and swaps here"
          />
        }
        ItemSeparatorComponent={Separator}
        // Performance
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
      alignItems: 'center',
      justifyContent: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.lg,
      paddingTop: Theme.spacing.xl * 2,
      paddingBottom: Theme.spacing.md,
    },
    backButton: {
      padding: Theme.spacing.sm,
      marginRight: Theme.spacing.md,
    },
    headerTitle: {
      fontSize: Theme.fontSize.h1,
      fontWeight: '600',
      color: colors.ink,
      flex: 1,
    },
    clearButton: {
      minWidth: 48,
      alignItems: 'flex-end',
      paddingVertical: Theme.spacing.xs,
      paddingHorizontal: Theme.spacing.xs,
    },
    clearButtonText: {
      fontSize: Theme.fontSize.small,
      fontWeight: '600',
    },
    listContent: {
      paddingVertical: Theme.spacing.sm,
    },
    notificationCard: {
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: Theme.spacing.md,
      marginHorizontal: Theme.spacing.md,
      marginBottom: Theme.spacing.sm,
      borderRadius: Theme.borderRadius.lg,
      overflow: 'hidden',
    },
    notificationHeader: {
      flexDirection: 'row',
      gap: Theme.spacing.md,
      marginBottom: Theme.spacing.sm,
    },
    notificationIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    notificationContent: {
      flex: 1,
    },
    notificationTitle: {
      fontSize: Theme.fontSize.body,
      fontWeight: '600',
      marginBottom: 2,
    },
    notificationMessage: {
      fontSize: Theme.fontSize.small,
      marginBottom: 4,
      lineHeight: 18,
    },
    notificationTime: {
      fontSize: Theme.fontSize.small,
      fontStyle: 'italic',
    },
    unreadDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      flexShrink: 0,
      marginTop: 4,
    },
    actionContainer: {
      flexDirection: 'row',
      gap: Theme.spacing.sm,
      marginTop: Theme.spacing.sm,
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
    profileButton: {
      backgroundColor: colors.softSurface,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    actionButtonText: {
      color: 'white',
      fontSize: Theme.fontSize.small,
      fontWeight: '600',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginHorizontal: Theme.spacing.md,
    },
    emptyList: {
      flex: 1,
      justifyContent: 'center',
    },
  });