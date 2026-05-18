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
  const [name, setName] = useState(userProfile?.name ?? '');
  const [bio, setBio] = useState(userProfile?.bio ?? '');
  const [location, setLocation] = useState(userProfile?.location ?? '');
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(userProfile?.portfolioItems ?? []);
  const [portfolioLinks, setPortfolioLinks] = useState<PortfolioLink[]>(userProfile?.portfolioLinks ?? []);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(userProfile?.availabilityStatus ?? 'available');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [networkStats, setNetworkStats] = useState({ connections: 0, pending: 0, completedSwaps: 0 });
  const [saving, setSaving] = useState(false);
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
    setBio(userProfile?.bio ?? '');
    setLocation(userProfile?.location ?? '');
    setPortfolioItems(userProfile?.portfolioItems ?? []);
    setPortfolioLinks(userProfile?.portfolioLinks ?? []);
    setAvailabilityStatus(userProfile?.availabilityStatus ?? 'available');
    loadMySkills();
  }, [userProfile?.uid, userProfile?.name, userProfile?.bio, userProfile?.location, userProfile?.availabilityStatus]);

  useFocusEffect(useCallback(() => { loadMySkills(); }, [userProfile?.uid]));

  useEffect(() => {
    if (!userProfile) return;
    let unsubscribeSwaps: (() => void) | undefined;
    const loadNetworkStats = async () => {
      try {
        const { connections, pendingRequests } = await getUserConnections(userProfile.uid);
        setNetworkStats(prev => ({ ...prev, connections: connections.length, pending: pendingRequests.length }));
      } catch {}
    };
    const countCompleted = (incoming: SwapRequest[], outgoing: SwapRequest[]) => {
      const completed = [...incoming, ...outgoing].filter(r => r.status === 'completed').length;
      setNetworkStats(prev => ({ ...prev, completedSwaps: completed }));
    };
    loadNetworkStats();
    unsubscribeSwaps = subscribeToSwapRequests(userProfile.uid, countCompleted);
    return () => { if (unsubscribeSwaps) unsubscribeSwaps(); };
  }, [userProfile?.uid]);

  const onSave = async () => {
    if (!userProfile) return;
    try {
      setSaving(true);
      await updateUserProfile(userProfile.uid, {
        name: name.trim(), bio: bio.trim(), location: location.trim(),
        portfolioItems, portfolioLinks, availabilityStatus,
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
        mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8,
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
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            setDrawerOpen(false);
            await deleteCurrentAccount();
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

  // Fix: parse createdAt properly whether it's a Date, Firestore Timestamp, or string
  const createdAtRaw = userProfile.createdAt as any;
  const createdAtDate = createdAtRaw instanceof Date
    ? createdAtRaw
    : createdAtRaw?.toDate?.()
    ? createdAtRaw.toDate()
    : createdAtRaw
    ? new Date(createdAtRaw)
    : null;

  const memberSince = createdAtDate && !isNaN(createdAtDate.getTime())
    ? createdAtDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : null;

  const offersCount = skills.filter(s => s.type === 'offer').length;
  const needsCount = skills.filter(s => s.type === 'need').length;
  const rating = userProfile.rating ?? 0;
  const totalSwaps = userProfile.totalSwaps ?? networkStats.completedSwaps;

  const availMeta = (() => {
    switch (userProfile.availabilityStatus) {
      case 'available':     return { label: 'Available to Swap', color: '#3F5A48' };
      case 'busy':          return { label: 'Busy',              color: '#8A857C' };
      case 'learning_only': return { label: 'Learning Only',     color: '#6A4040' };
      default:              return { label: 'Available to Swap', color: '#3F5A48' };
    }
  })();

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={skills}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
        ListHeaderComponent={
          <View>
            {/* Top bar */}
            <View style={styles.topBar}>
              <Text style={styles.pageTitle}>Profile</Text>
              <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.menuBtn} activeOpacity={0.8}>
                <Ionicons name="menu" size={20} color={colors.ink} />
              </TouchableOpacity>
            </View>

            {/* Hero card */}
            <View style={styles.heroCard}>
              <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.85} style={styles.avatarWrap}>
                <Avatar initials={userProfile.initials} imageUri={userProfile.avatar} size={80} />
                <View style={[styles.avatarEditBadge, { backgroundColor: colors.ink, borderColor: colors.surface }]}>
                  <Ionicons name="camera" size={10} color={colors.background} />
                </View>
              </TouchableOpacity>

              <View style={styles.nameBlock}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                {userProfile.bio ? (
                  <Text style={styles.profileBio}>{userProfile.bio}</Text>
                ) : (
                  <Text style={styles.profileBioEmpty}>Tap the menu to add a bio</Text>
                )}
              </View>

              {/* Meta row: location + member since */}
              <View style={styles.metaRow}>
                {userProfile.location ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={12} color={colors.muted} />
                    <Text style={styles.metaText}>{userProfile.location}</Text>
                  </View>
                ) : null}
                {memberSince ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={colors.muted} />
                    <Text style={styles.metaText}>Since {memberSince}</Text>
                  </View>
                ) : null}
              </View>

              {/* Availability badge */}
              <View style={[styles.availBadge, { backgroundColor: availMeta.color }]}>
                <Text style={styles.availText}>{availMeta.label}</Text>
              </View>

              <View style={styles.statsDivider} />

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
                <View style={styles.statSep} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{networkStats.connections}</Text>
                  <Text style={styles.statLabel}>connections</Text>
                </View>
              </View>
            </View>

            {/* Activity cards */}
            <View style={styles.cardGrid}>
              <View style={[styles.activityCard, { flex: 1 }]}>
                <View style={styles.activityIconRow}>
                  <Ionicons name="star" size={14} color="#F5C842" />
                  <Text style={styles.activityLabel}>Rating</Text>
                </View>
                <Text style={styles.activityValue}>{rating > 0 ? rating.toFixed(1) : '—'}</Text>
                {rating > 0 ? (
                  <View style={styles.starsRow}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= Math.round(rating) ? 'star' : 'star-outline'} size={10} color="#F5C842" />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.activitySub}>No ratings yet</Text>
                )}
              </View>

              <View style={[styles.activityCard, { flex: 1 }]}>
                <View style={styles.activityIconRow}>
                  <Ionicons name="repeat" size={14} color={colors.accent} />
                  <Text style={styles.activityLabel}>Swaps</Text>
                </View>
                <Text style={styles.activityValue}>{totalSwaps}</Text>
                <Text style={styles.activitySub}>completed</Text>
              </View>

              <View style={[styles.activityCard, { flex: 1 }]}>
                <View style={styles.activityIconRow}>
                  <Ionicons name="person-add" size={14} color={colors.accent} />
                  <Text style={styles.activityLabel}>Pending</Text>
                </View>
                <Text style={styles.activityValue}>{networkStats.pending}</Text>
                <Text style={styles.activitySub}>requests</Text>
              </View>
            </View>

            {/* Portfolio */}
            {(portfolioItems.length > 0 || portfolioLinks.length > 0) && (
              <View>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionDot} />
                  <Text style={styles.sectionLabel}>PORTFOLIO</Text>
                </View>

                {portfolioItems.length > 0 && (
                  <FlatList
                    horizontal
                    data={portfolioItems}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.portfolioRow}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        style={styles.portfolioCard}
                        onPress={() => {
                          const target = item.externalLink || item.mediaUrl;
                          if (target) Linking.openURL(target).catch(() => {});
                        }}
                      >
                        <View style={styles.portfolioBadge}>
                          <Text style={styles.portfolioBadgeText}>{item.mediaType.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.portfolioTitle} numberOfLines={2}>{item.title}</Text>
                        {item.skillUsed ? <Text style={styles.portfolioMeta}>{item.skillUsed}</Text> : null}
                        {item.description ? <Text style={styles.portfolioDesc} numberOfLines={2}>{item.description}</Text> : null}
                        <View style={styles.portfolioLinkRow}>
                          <Ionicons name="open-outline" size={11} color={colors.muted} />
                          <Text style={styles.portfolioLinkText}>View work</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                )}

                {portfolioLinks.length > 0 && (
                  <View style={styles.cardPad}>
                    <View style={styles.linksCard}>
                      {portfolioLinks.map((link, i) => (
                        <TouchableOpacity
                          key={link.id}
                          onPress={() => Linking.openURL(link.url).catch(() => {})}
                          style={[styles.linkRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }]}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="link-outline" size={14} color={colors.accent} />
                          <Text style={styles.linkText}>{link.label}</Text>
                          <Ionicons name="chevron-forward" size={13} color={colors.muted} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Skills header */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
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
              subtitle="Tap + Add a skill to share what you can teach."
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
              style={[styles.addBtn, { backgroundColor: colors.ink }]}
              onPress={() => router.push('/(tabs)/create')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={colors.background} />
              <Text style={[styles.addBtnText, { color: colors.background }]}>Add a skill</Text>
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

const getStyles = (colors: typeof import('../../src/constants/Colors').Colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    emptyScreen: { justifyContent: 'center', alignItems: 'center' },
    content: { paddingBottom: 120 },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Theme.spacing.lg,
      paddingTop: 60,
      paddingBottom: 16,
    },
    pageTitle: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 30,
      color: colors.ink,
      letterSpacing: -0.5,
    },
    menuBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },

    heroCard: {
      marginHorizontal: Theme.spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.border,
      paddingTop: 28,
      paddingBottom: 0,
      paddingHorizontal: Theme.spacing.lg,
      alignItems: 'center',
      gap: 8,
    },

    avatarWrap: { position: 'relative' },
    avatarEditBadge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },

    nameBlock: { alignItems: 'center', gap: 4, marginTop: 4 },
    profileName: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 26,
      color: colors.ink,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
    profileBio: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 14,
      color: colors.muted,
      fontStyle: 'italic',
      textAlign: 'center',
      maxWidth: 260,
      lineHeight: 20,
    },
    profileBioEmpty: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 13,
      color: colors.border,
      fontStyle: 'italic',
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    metaText: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 12,
      color: colors.muted,
    },

    availBadge: {
      paddingHorizontal: Theme.spacing.md,
      paddingVertical: 5,
      borderRadius: Theme.borderRadius.full,
    },
    availText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 12,
      color: 'white',
    },

    statsDivider: { width: '100%', height: 1, backgroundColor: colors.border, marginTop: 4 },
    statsRow: { flexDirection: 'row', width: '100%', paddingVertical: 18 },
    statItem: { flex: 1, alignItems: 'center', gap: 3 },
    statNumber: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 22,
      color: colors.ink,
      letterSpacing: -0.3,
    },
    statLabel: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 11,
      color: colors.muted,
      letterSpacing: 0.3,
    },
    statSep: { width: 1, height: 32, backgroundColor: colors.border, alignSelf: 'center' },

    cardGrid: {
      flexDirection: 'row',
      paddingHorizontal: Theme.spacing.lg,
      marginTop: Theme.spacing.md,
      gap: Theme.spacing.sm,
    },
    activityCard: {
      backgroundColor: colors.surface,
      borderRadius: Theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 2,
    },
    activityIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    activityLabel: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 9,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    activityValue: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 22,
      color: colors.ink,
      letterSpacing: -0.3,
    },
    activitySub: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 10,
      color: colors.muted,
    },
    starsRow: {
      flexDirection: 'row',
      gap: 1,
      marginTop: 2,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.lg,
      paddingTop: 28,
      paddingBottom: 12,
      gap: 8,
    },
    sectionDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: colors.accent,
    },
    sectionLabel: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 10,
      color: colors.muted,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      flex: 1,
    },
    sectionCount: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 12,
      color: colors.muted,
    },

    cardPad: { paddingHorizontal: Theme.spacing.lg },

    portfolioRow: {
      paddingHorizontal: Theme.spacing.lg,
      gap: Theme.spacing.md,
      paddingBottom: 4,
    },
    portfolioCard: {
      width: 220,
      borderRadius: Theme.borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Theme.spacing.md,
      gap: 4,
    },
    portfolioBadge: {
      alignSelf: 'flex-start',
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.softSurface,
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: 3,
      marginBottom: 2,
    },
    portfolioBadgeText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 9,
      color: colors.muted,
      letterSpacing: 0.8,
    },
    portfolioTitle: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 18,
      color: colors.ink,
      lineHeight: 22,
    },
    portfolioMeta: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 10,
      color: colors.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    portfolioDesc: {
      fontFamily: 'Nunito_400Regular',
      fontSize: Theme.fontSize.small,
      color: colors.body,
      lineHeight: 18,
    },
    portfolioLinkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
    },
    portfolioLinkText: {
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 11,
      color: colors.muted,
    },

    linksCard: {
      borderRadius: Theme.borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Theme.spacing.md,
      marginTop: 12,
    },
    linkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    linkText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: Theme.fontSize.small,
      color: colors.accent,
      flex: 1,
    },

    footer: {
      paddingHorizontal: Theme.spacing.lg,
      paddingTop: 16,
      paddingBottom: 12,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: Theme.borderRadius.full,
      paddingVertical: 16,
    },
    addBtnText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: Theme.fontSize.body,
      letterSpacing: 0.2,
    },
  });
