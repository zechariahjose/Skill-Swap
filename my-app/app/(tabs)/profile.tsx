import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import SkillCard from '../components/SkillCard';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { signOut } from '../../src/firebase/auth';
import { deleteSkill, getSkillsByUser, updateUserProfile } from '../../src/firebase/firestore';
import { Skill } from '../../src/types';
import ProfileDrawer from './ProfileDrawer';

export default function ProfileScreen() {
  const { userProfile, refreshProfile } = useAuthContext();
  const { colors } = useTheme();
  const [name, setName]           = useState(userProfile?.name ?? '');
  const [bio, setBio]             = useState(userProfile?.bio  ?? '');
  const [skills, setSkills]       = useState<Skill[]>([]);
  const [saving, setSaving]       = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const styles = getStyles(colors);

  const loadMySkills = async () => {
    if (!userProfile) return;
    const data = await getSkillsByUser(userProfile.uid);
    setSkills(data);
  };

  useEffect(() => {
    setName(userProfile?.name ?? '');
    setBio(userProfile?.bio  ?? '');
    loadMySkills();
  }, [userProfile?.uid, userProfile?.name, userProfile?.bio]);

  useFocusEffect(
    useCallback(() => { loadMySkills(); }, [userProfile?.uid])
  );

  const onSave = async () => {
    if (!userProfile) return;
    try {
      setSaving(true);
      await updateUserProfile(userProfile.uid, { name: name.trim(), bio: bio.trim() });
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

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={skills}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}

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
                <Text style={styles.settingsIcon}>⚙️</Text>
              </TouchableOpacity>
            </View>

            {/* ── Hero card ───────────────────────────────────────────── */}
            <View style={styles.heroCard}>

              {/* Avatar */}
              <Avatar initials={userProfile.initials} size={76} />

              {/* Name + bio */}
              <View style={styles.nameBlock}>
                <Text style={styles.profileName}>{userProfile.name}</Text>
                {userProfile.bio ? (
                  <Text style={styles.profileBio}>{userProfile.bio}</Text>
                ) : (
                  <Text style={styles.profileBioEmpty}>No bio yet.</Text>
                )}
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

            {/* ── Section label ───────────────────────────────────────── */}
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
        onNameChange={setName}
        onBioChange={setBio}
        onSave={onSave}
        saving={saving}
        onSignOut={() => signOut()}
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

    settingsIcon: {
      fontSize: 18,
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

    // ── Cards ────────────────────────────────────────────────────────────────

    cardPad: {
      paddingHorizontal: Theme.spacing.lg,
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