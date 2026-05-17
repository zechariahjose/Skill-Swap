import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import SkillCard from '../components/SkillCard';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { changePassword, deleteCurrentAccount, signOut } from '../../src/firebase/auth';
import {
  deleteSkill,
  getSkillsByUser,
  getUserConnections,
  subscribeToSwapRequests,
  updateUserProfile,
} from '../../src/firebase/firestore';
import { PortfolioItem, PortfolioLink, Skill, SwapRequest } from '../../src/types';
import { AvailabilityStatus } from '../../src/types';
import ProfileDrawer from './ProfileDrawer';

export default function ProfileScreen() {
  const { userProfile, refreshProfile } = useAuthContext();
  const { colors } = useTheme();
  const [name, setName]           = useState(userProfile?.name ?? '');
  const [bio, setBio]             = useState(userProfile?.bio  ?? '');
  const [location, setLocation] = useState(userProfile?.location ?? '');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(userProfile?.portfolioItems ?? []);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(userProfile?.portfolioLinks ?? []);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(userProfile?.availabilityStatus ?? 'available');
  const [skills, setSkills]       = useState<Skill[]>([]);
  const [networkStats, setNetworkStats] = useState({
    connections: 0,
    pending: 0,
    completedSwaps: 0,
  });
  const [saving, setSaving]       = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const styles = getStyles(colors);

  const loadMySkills = async () => {
    if (!userProfile) return;
    const data = await getSkillsByUser(userProfile.uid);
    setSkills(data);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await loadMySkills();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setName(userProfile?.name ?? '');
    setBio(userProfile?.bio  ?? '');
    setLocation(userProfile?.location ?? '');
    setPortfolioItems(userProfile?.portfolioItems ?? []);
    setPortfolioLinks(userProfile?.portfolioLinks ?? []);
    setAvailabilityStatus(userProfile?.availabilityStatus ?? 'available');
    loadMySkills();
  }, [userProfile?.uid, userProfile?.name, userProfile?.bio, userProfile?.location, userProfile?.availabilityStatus]);

  useFocusEffect(
    useCallback(() => { loadMySkills(); }, [userProfile?.uid])
  );

  useEffect(() => {
    if (!userProfile) return;

    let unsubscribeSwaps: (() => void) | undefined;

    const loadNetworkStats = async () => {
      try {
        const { connections, pendingRequests } = await getUserConnections(userProfile.uid);
        setNetworkStats((prev) => ({
          ...prev,
          connections: connections.length,
          pending: pendingRequests.length,
        }));
      } catch (error) {
        console.error('Error loading network stats:', error);
      }
    };

    const countCompleted = (incoming: SwapRequest[], outgoing: SwapRequest[]) => {
      const completed = [...incoming, ...outgoing].filter((request) => request.status === 'completed').length;
      setNetworkStats((prev) => ({ ...prev, completedSwaps: completed }));
    };

    loadNetworkStats();
    unsubscribeSwaps = subscribeToSwapRequests(userProfile.uid, countCompleted);

    return () => {
      if (unsubscribeSwaps) unsubscribeSwaps();
    };
  }, [userProfile?.uid]);

  const onSave = async () => {
    if (!userProfile) return;
    try {
      setSaving(true);
      await updateUserProfile(userProfile.uid, {
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        portfolioItems,
        portfolioLinks,
        availabilityStatus
      });
      await refreshProfile();
      setDrawerOpen(false);
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSkill = async (id: string) => {
    try {
      await deleteSkill(id);
      await loadMySkills();
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Try again.');
    }
  };

  const handleChangePassword = async (value: string) => {
    if (!value.trim()) return;
    try {
      await changePassword(value.trim());
      Alert.alert('Password updated', 'Your password has been updated.');
    } catch (error) {
      Alert.alert('Password update failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handlePickAvatar = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission needed', 'Please allow gallery access to upload a profile photo.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri && userProfile) {
        await updateUserProfile(userProfile.uid, { avatar: result.assets[0].uri });
        await refreshProfile();
      }
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Could not pick image.');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert('Delete account?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setDrawerOpen(false);
            await deleteCurrentAccount();
            Alert.alert('Account deleted');
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Please try again.');
          }
        },
      },
    ]);
  };

  if (!userProfile) {
    return (
      <View style={[styles.screen, styles.emptyScreen]}>
        <EmptyState emoji="👤" title="Profile unavailable" subtitle="Please sign in again." />
      </View>
    );
  }

  const memberSince = userProfile.createdAt
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  const offersCount = skills.filter((s) => s.type === 'offer').length;
  const needsCount  = skills.filter((s) => s.type === 'need').length;
  const rating = userProfile.rating ?? 0;
  const totalSwaps = userProfile.totalSwaps ?? networkStats.completedSwaps;

  const availabilityMeta = (() => {
    switch (userProfile.availabilityStatus) {
      case 'available':
        return { emoji: '🟢', label: 'Available to Swap', color: '#3F5A48' };
      case 'busy':
        return { emoji: '🟡', label: 'Busy', color: '#8A857C' };
      case 'learning_only':
        return { emoji: '🔴', label: 'Learning Only', color: '#6A4040' };
      default:
        return { emoji: '🟢', label: 'Available to Swap', color: '#3F5A48' };
    }
  })();

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={skills}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }

        ListHeaderComponent={
          <View>

            {/* ── Top row ─────────────────────────────────────────────── */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Profile</Text>
              <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                style={styles.settingsBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="menu" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {/* ── Hero card ───────────────────────────────────────────── */}
            <View style={styles.heroCard}>

              {/* Avatar */}
              <Avatar initials={userProfile.initials} imageUri={userProfile.avatar} size={76} />

              {/* Name + bio */}
              <View style={styles.nameBlock}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                {userProfile.bio ? (
                  <Text style={styles.profileBio}>{userProfile.bio}</Text>
                ) : (
                  <Text style={styles.profileBioEmpty}>No bio yet.</Text>
                )}
              </View>

              <View style={[styles.availabilityBadge, { backgroundColor: availabilityMeta.color }]}>
                <Text style={styles.availabilityText}>
                  {availabilityMeta.emoji} {availabilityMeta.label}
                </Text>
              </View>

              {/* Divider */}
              <View style={styles.statsDivider} />

              {/* Stats row — 3 columns with vertical separators */}
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
                      <Text style={styles.statNumber}>{memberSince.split(' ')[1]}</Text>
                      <Text style={styles.statLabel}>since {memberSince.split(' ')[0]}</Text>
                    </View>
                  </>
                )}
              </View>

            </View>

            <View style={styles.upgradeGrid}>
              <View style={styles.upgradeCard}>
                <View style={styles.upgradeLabelRow}>
                  <Ionicons name="people" size={16} color={colors.accent} />
                  <Text style={styles.upgradeLabel}>Connections</Text>
                </View>
                <Text style={styles.upgradeValue}>{networkStats.connections}</Text>
              </View>

              <View style={styles.upgradeCard}>
                <View style={styles.upgradeLabelRow}>
                  <Ionicons name="person-add" size={16} color={colors.accent} />
                  <Text style={styles.upgradeLabel}>Pending Requests</Text>
                </View>
                <Text style={styles.upgradeValue}>{networkStats.pending}</Text>
              </View>
            </View>

            <View style={styles.upgradeGrid}>
              <View style={styles.upgradeCard}>
                <View style={styles.upgradeLabelRow}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.upgradeLabel}>Rating</Text>
                </View>
                <Text style={styles.upgradeValue}>{rating > 0 ? rating.toFixed(1) : 'N/A'}</Text>
              </View>

              <View style={styles.upgradeCard}>
                <View style={styles.upgradeLabelRow}>
                  <Ionicons name="repeat" size={16} color={colors.accent} />
                  <Text style={styles.upgradeLabel}>Completed Swaps</Text>
                </View>
                <Text style={styles.upgradeValue}>{totalSwaps}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>ABOUT</Text>
            </View>
            <View style={styles.cardPad}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardText}>
                  {userProfile.bio?.trim() ? userProfile.bio : 'Tell others what you are passionate about and what you enjoy teaching.'}
                </Text>
                <Text style={[styles.infoCardText, { marginTop: 8 }]}>📍 {userProfile.location?.trim() || 'Location not set'}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>PORTFOLIO</Text>
            </View>
            {portfolioItems.length > 0 ? (
              <FlatList
                horizontal
                data={portfolioItems}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.portfolioRow}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.portfolioCard}
                    onPress={() => {
                      const target = item.externalLink || item.mediaUrl;
                      if (target) Linking.openURL(target);
                    }}
                  >
                    <View style={styles.portfolioBadge}>
                      <Text style={styles.portfolioBadgeText}>{item.mediaType.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.portfolioTitle}>{item.title}</Text>
                    <Text style={styles.portfolioMeta}>{item.skillUsed || 'General skill'}</Text>
                    <Text style={styles.portfolioDescription} numberOfLines={2}>
                      {item.description || item.mediaUrl}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.cardPad}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardText}>Add portfolio items from Settings to showcase your work.</Text>
                </View>
              </View>
            )}

            {portfolioLinks.length > 0 && (
              <View style={styles.cardPad}>
                <View style={styles.infoCard}>
                  {portfolioLinks.map((link) => (
                    <TouchableOpacity key={link.id} onPress={() => Linking.openURL(link.url)} style={styles.linkRow}>
                      <Text style={styles.linkEmoji}>🔗</Text>
                      <Text style={styles.linkText}>{link.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>REVIEWS</Text>
            </View>
            <View style={styles.cardPad}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardText}>Rating: {rating > 0 ? rating.toFixed(1) : 'N/A'} · Completed swaps: {totalSwaps}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>AVAILABILITY</Text>
            </View>
            <View style={styles.cardPad}>
              <View style={styles.infoCard}>
                <Text style={styles.infoCardText}>{availabilityMeta.emoji} {availabilityMeta.label}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>YOUR SKILLS</Text>
              <Text style={styles.sectionCount}>{skills.length}</Text>
            </View>

          </View>
        }

        ListEmptyComponent={
          <View style={styles.cardPad}>
            <EmptyState
              emoji="✦"
              title="No skills posted yet"
              subtitle="Tap the + button to share your first skill with the community."
            />
          </View>
        }

        renderItem={({ item }) => (
          <View style={styles.cardPad}>
            <SkillCard skill={item} isOwn onDeletePress={onDeleteSkill} />
          </View>
        )}

        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}

        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.85}
            >
              <Text style={styles.addBtnText}>＋ Add a skill</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        name={name}
        bio={bio}
        location={location}
        portfolioItems={portfolioItems}
        portfolioLinks={portfolioLinks}
        availabilityStatus={availabilityStatus}
        onNameChange={setName}
        onBioChange={setBio}
        onLocationChange={setLocation}
        onPickAvatar={handlePickAvatar}
        onPortfolioItemsChange={setPortfolioItems}
        onPortfolioLinksChange={setPortfolioLinks}
        onAvailabilityChange={setAvailabilityStatus}
        onSave={onSave}
        saving={saving}
        onChangePassword={handleChangePassword}
        onDeleteAccount={handleDeleteAccount}
        onSignOut={() => { setDrawerOpen(false); signOut(); }}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors: typeof import('../../src/constants/Colors').Colors) =>
  StyleSheet.create({

    screen: {
      flex: 1,
      backgroundColor: colors.background ?? '#111010',
    },

    emptyScreen: {
      justifyContent: 'center',
      alignItems:     'center',
    },

    content: {
      paddingBottom: 120,
    },

    // ── Header row ──────────────────────────────────────────────────────────

    headerRow: {
      paddingHorizontal: Theme.spacing.lg,
      paddingTop:        60,
      paddingBottom:     16,
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
    },

    headerTitle: {
      fontFamily:    'DMSerifDisplay_400Regular',
      fontSize:      30,
      color:         colors.ink ?? '#F0EBE3',
      letterSpacing: -0.5,
    },

    settingsBtn: {
      width:           44,
      height:          44,
      borderRadius:    22,
      backgroundColor: colors.surface ?? '#1C1B1A',
      borderWidth:     1,
      borderColor:     colors.border  ?? '#2E2C2A',
      alignItems:      'center',
      justifyContent:  'center',
    },

    // ── Hero card ────────────────────────────────────────────────────────────

    heroCard: {
      marginHorizontal:  Theme.spacing.lg,
      backgroundColor:   colors.surface ?? '#1C1B1A',
      borderRadius:      24,
      borderWidth:       1,
      borderColor:       colors.border  ?? '#2E2C2A',
      paddingTop:        32,
      paddingBottom:     0,
      paddingHorizontal: Theme.spacing.lg,
      alignItems:        'center',
      overflow:          'hidden',
      gap:               10,
      shadowColor:       '#000',
      shadowOffset:      { width: 0, height: 8 },
      shadowOpacity:     0.35,
      shadowRadius:      20,
      elevation:         10,
    },

    nameBlock: {
      alignItems: 'center',
      gap:        4,
    },

    profileName: {
      fontFamily:    'DMSerifDisplay_400Regular',
      fontSize:      26,
      color:         colors.ink    ?? '#F0EBE3',
      letterSpacing: -0.5,
      textAlign:     'center',
    },

    profileBio: {
      fontFamily: 'Nunito_400Regular',
      fontSize:   14,
      color:      colors.muted   ?? '#6B6760',
      fontStyle:  'italic',
      textAlign:  'center',
      maxWidth:   240,
      lineHeight: 20,
    },

    profileBioEmpty: {
      fontFamily: 'Nunito_400Regular',
      fontSize:   14,
      color:      colors.border  ?? '#2E2C2A',
      fontStyle:  'italic',
    },
    availabilityBadge: {
      marginTop: 4,
      marginBottom: Theme.spacing.sm,
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: Theme.spacing.xs,
      borderRadius: Theme.borderRadius.full,
    },
    availabilityText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: Theme.fontSize.small,
      color: 'white',
    },

    // Full-width divider inside the card
    statsDivider: {
      width:           '100%',
      height:          1,
      backgroundColor: colors.border ?? '#2E2C2A',
      marginTop:       4,
    },

    // ── Stats row ────────────────────────────────────────────────────────────

    statsRow: {
      flexDirection:   'row',
      width:           '100%',
      paddingVertical: 20,
    },

    statItem: {
      flex:       1,
      alignItems: 'center',
      gap:        3,
    },

    statNumber: {
      fontFamily:    'DMSerifDisplay_400Regular',
      fontSize:      20,
      color:         colors.ink   ?? '#F0EBE3',
      letterSpacing: -0.3,
    },

    statLabel: {
      fontFamily:    'Nunito_400Regular',
      fontSize:      11,
      color:         colors.muted ?? '#6B6760',
      letterSpacing: 0.3,
    },

    // Thin vertical separator between stats
    statSep: {
      width:           1,
      height:          36,
      backgroundColor: colors.border ?? '#2E2C2A',
      alignSelf:       'center',
    },

    // ── Section header ───────────────────────────────────────────────────────

    sectionHeader: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: Theme.spacing.lg,
      paddingTop:        28,
      paddingBottom:     12,
    },

    sectionLabel: {
      fontFamily:    'Nunito_700Bold',
      fontSize:      10,
      color:         colors.muted ?? '#6B6760',
      letterSpacing: 1.6,
      textTransform: 'uppercase',
    },

    sectionCount: {
      fontFamily: 'Nunito_700Bold',
      fontSize:   12,
      color:      colors.muted ?? '#6B6760',
    },
    upgradeGrid: {
      paddingHorizontal: Theme.spacing.lg,
      marginTop: Theme.spacing.md,
      flexDirection: 'row',
      gap: Theme.spacing.md,
    },
    upgradeCard: {
      flex: 1,
      borderRadius: Theme.borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: Theme.spacing.md,
      ...Theme.shadow.card,
    },
    upgradeLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.xs,
      marginBottom: Theme.spacing.xs,
    },
    upgradeLabel: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: colors.muted,
    },
    upgradeValue: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 24,
      color: colors.ink,
    },

    // ── Cards ────────────────────────────────────────────────────────────────

    cardPad: {
      paddingHorizontal: Theme.spacing.lg,
    },
    infoCard: {
      borderRadius: Theme.borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Theme.spacing.md,
      ...Theme.shadow.card,
    },
    infoCardText: {
      fontFamily: 'Nunito_400Regular',
      fontSize: Theme.fontSize.small,
      color: colors.body,
      lineHeight: 20,
    },
    portfolioRow: {
      paddingHorizontal: Theme.spacing.lg,
      gap: Theme.spacing.md,
      paddingBottom: Theme.spacing.xs,
    },
    portfolioCard: {
      width: 230,
      borderRadius: Theme.borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Theme.spacing.md,
      ...Theme.shadow.card,
    },
    portfolioBadge: {
      alignSelf: 'flex-start',
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.softSurface,
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: 4,
      marginBottom: Theme.spacing.xs,
    },
    portfolioBadgeText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 10,
      color: colors.muted,
    },
    portfolioTitle: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 20,
      color: colors.ink,
    },
    portfolioMeta: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 11,
      color: colors.muted,
      marginTop: 2,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    portfolioDescription: {
      fontFamily: 'Nunito_400Regular',
      fontSize: Theme.fontSize.small,
      color: colors.body,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.sm,
      paddingVertical: 4,
    },
    linkEmoji: {
      fontSize: 14,
    },
    linkText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: Theme.fontSize.small,
      color: colors.accent,
    },

    // ── Footer ───────────────────────────────────────────────────────────────

    footer: {
      paddingHorizontal: Theme.spacing.lg,
      paddingTop:        16,
      paddingBottom:     12,
    },

    addBtn: {
      backgroundColor: colors.ink ?? '#F0EBE3',
      borderRadius:    Theme.borderRadius.full ?? 999,
      paddingVertical: 18,
      alignItems:      'center',
      shadowColor:     colors.ink ?? '#F0EBE3',
      shadowOffset:    { width: 0, height: 4 },
      shadowOpacity:   0.12,
      shadowRadius:    16,
      elevation:       6,
    },

    addBtnText: {
      fontFamily:    'Nunito_700Bold',
      fontSize:      Theme.fontSize.body ?? 15,
      color:         colors.background   ?? '#111010',
      letterSpacing: 0.3,
    },
  });