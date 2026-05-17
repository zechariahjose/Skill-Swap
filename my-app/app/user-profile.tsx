import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './components/Avatar';
import EmptyState from './components/EmptyState';
import SkillCard from './components/SkillCard';
import { Theme } from '../src/constants/Theme';
import { useAuthContext } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import {
  getUserById,
  getSkillsByUser,
  createConnection,
  getConnectionBetweenUsers,
  getUserConnections
} from '../src/firebase/firestore';
import { Skill, User, AvailabilityStatus } from '../src/types';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { userProfile: currentUser } = useAuthContext();
  const { colors } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = getStyles(colors);

  useEffect(() => {
    if (!userId) {
      router.back();
      return;
    }

    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Check if viewing own profile
      const isOwnProfile = userId === currentUser?.uid;
      setIsCurrentUser(isOwnProfile);

      // Load user data
      const userData = await getUserById(userId);
      if (!userData) {
        Alert.alert('User not found');
        router.back();
        return;
      }
      setUser(userData);

      // Load user's skills
      const userSkills = await getSkillsByUser(userId);
      setSkills(userSkills);

      // Check connection status (if not own profile)
      if (!isOwnProfile && currentUser) {
        const connection = await getConnectionBetweenUsers(currentUser.uid, userId);
        if (connection) {
          if (connection.status === 'accepted') {
            setConnectionStatus('connected');
          } else if (connection.status === 'pending') {
            setConnectionStatus('pending');
          }
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUser || !user) return;

    try {
      await createConnection(currentUser.uid, user.uid);
      setConnectionStatus('pending');
      Alert.alert('Connection Request Sent', `You've sent a connection request to ${user.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send connection request');
    }
  };

  const getAvailabilityColor = (status?: AvailabilityStatus) => {
    switch (status) {
      case 'available': return '#3F5A48'; // green
      case 'busy': return '#8A857C'; // yellow/gray
      case 'learning_only': return '#6A4040'; // red
      default: return colors.muted;
    }
  };

  const getAvailabilityText = (status?: AvailabilityStatus) => {
    switch (status) {
      case 'available': return 'Available to Swap';
      case 'busy': return 'Busy';
      case 'learning_only': return 'Learning Only';
      default: return 'Status Unknown';
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <EmptyState emoji="⏳" title="Loading..." subtitle="Fetching user profile" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <EmptyState emoji="❌" title="User not found" subtitle="This user may have been removed" />
      </View>
    );
  }

  const offersCount = skills.filter(s => s.type === 'offer').length;
  const needsCount = skills.filter(s => s.type === 'need').length;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); loadUserProfile(); }}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        {/* Avatar */}
        <Avatar initials={user.initials} imageUri={user.avatar} size={80} />

        {/* Name and Bio */}
        <View style={styles.nameBlock}>
          <Text style={styles.profileName}>{user.name}</Text>
          {user.bio ? (
            <Text style={styles.profileBio}>{user.bio}</Text>
          ) : (
            <Text style={styles.profileBioEmpty}>No bio yet.</Text>
          )}
        </View>

        {/* Availability Status */}
        <View style={[styles.availabilityBadge, { backgroundColor: getAvailabilityColor(user.availabilityStatus) }]}>
          <Text style={styles.availabilityText}>{getAvailabilityText(user.availabilityStatus)}</Text>
        </View>

        {/* Connect Button (if not own profile and not connected) */}
        {!isCurrentUser && connectionStatus === 'none' && (
          <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
            <Ionicons name="person-add" size={20} color={colors.white} />
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        )}

        {connectionStatus === 'pending' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Connection Pending</Text>
          </View>
        )}

        {connectionStatus === 'connected' && (
          <View style={styles.connectedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#3F5A48" />
            <Text style={styles.connectedText}>Connected</Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{offersCount}</Text>
            <Text style={styles.statLabel}>offering</Text>
          </View>
          <View style={styles.statSep} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{needsCount}</Text>
            <Text style={styles.statLabel}>looking for</Text>
          </View>
          {memberSince && (
            <>
              <View style={styles.statSep} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{user.totalSwaps || 0}</Text>
                <Text style={styles.statLabel}>swaps</Text>
              </View>
            </>
          )}
        </View>

        {/* Rating */}
        {user.rating && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{user.rating.toFixed(1)} rating</Text>
          </View>
        )}
      </View>

      {/* Skills Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills</Text>
        {skills.length === 0 ? (
          <EmptyState emoji="🎯" title="No skills yet" subtitle="This user hasn't added any skills" />
        ) : (
          <FlatList
            data={skills}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SkillCard
                skill={item}
                showConnectButton={false}
              />
            )}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.skillSeparator} />}
          />
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: Theme.spacing.xxl,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: Theme.spacing.xl,
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
  headerSpacer: {
    width: 40,
  },
  profileCard: {
    backgroundColor: colors.surface,
    marginHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  nameBlock: {
    alignItems: 'center',
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  profileName: {
    fontSize: Theme.fontSize.h1,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: Theme.spacing.xs,
  },
  profileBio: {
    fontSize: Theme.fontSize.body,
    color: colors.body,
    textAlign: 'center',
  },
  profileBioEmpty: {
    fontSize: Theme.fontSize.body,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  availabilityBadge: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.full,
    marginBottom: Theme.spacing.md,
  },
  availabilityText: {
    color: 'white',
    fontSize: Theme.fontSize.small,
    fontWeight: '600',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  connectButtonText: {
    color: colors.white,
    fontSize: Theme.fontSize.body,
    fontWeight: '600',
    marginLeft: Theme.spacing.sm,
  },
  pendingBadge: {
    backgroundColor: colors.accentSurface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  pendingText: {
    color: colors.accent,
    fontSize: Theme.fontSize.small,
    fontWeight: '600',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  connectedText: {
    color: '#3F5A48',
    fontSize: Theme.fontSize.small,
    fontWeight: '600',
    marginLeft: Theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: Theme.fontSize.h2,
    fontWeight: '700',
    color: colors.ink,
  },
  statLabel: {
    fontSize: Theme.fontSize.small,
    color: colors.muted,
    marginTop: 2,
  },
  statSep: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
    marginHorizontal: Theme.spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
  },
  ratingText: {
    fontSize: Theme.fontSize.body,
    color: colors.body,
    marginLeft: Theme.spacing.xs,
  },
  section: {
    marginHorizontal: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.h2,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: Theme.spacing.md,
  },
  skillSeparator: {
    height: Theme.spacing.md,
  },
});