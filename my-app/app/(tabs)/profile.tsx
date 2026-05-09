import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import SkillCard from '../components/SkillCard';
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { signOut } from '../../src/firebase/auth';
import { deleteSkill, getSkillsByUser, updateUserProfile } from '../../src/firebase/firestore';
import { Skill } from '../../src/types';

export default function ProfileScreen() {
  const { userProfile, refreshProfile } = useAuthContext();
  const [name, setName] = useState(userProfile?.name ?? '');
  const [bio, setBio] = useState(userProfile?.bio ?? '');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const drawerTranslate = useRef(new Animated.Value(400)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const drawerTheme = themeMode === 'dark'
    ? {
        background: '#1A1C24',
        surface: '#252B3A',
        text: '#F2F2F7',
        muted: '#9CA3B5',
        border: '#3A4153',
      }
    : {
        background: Colors.background,
        surface: Colors.surface,
        text: Colors.ink,
        muted: Colors.muted,
        border: Colors.border,
      };

  const loadMySkills = async () => {
    if (!userProfile) return;
    const data = await getSkillsByUser(userProfile.uid);
    setSkills(data);
  };

  useEffect(() => {
    setName(userProfile?.name ?? '');
    setBio(userProfile?.bio ?? '');
    loadMySkills();
  }, [userProfile?.uid, userProfile?.name, userProfile?.bio]);

  useFocusEffect(
    useCallback(() => {
      loadMySkills();
    }, [userProfile?.uid])
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

  useEffect(() => {
    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue: drawerOpen ? 0 : 400,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: drawerOpen ? 1 : 0,
        duration: drawerOpen ? 260 : 180,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerOpen, drawerTranslate, overlayOpacity]);

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
      <View style={styles.screen}>
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
          {/* Profile card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTop}>
              <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                style={styles.settingsBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={20} color={drawerTheme.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>{userProfile.name}</Text>
            {userProfile.bio ? (
              <Text style={styles.profileBio}>{userProfile.bio}</Text>
            ) : (
              <Text style={styles.profileBioEmpty}>No bio yet.</Text>
            )}

            {/* Quiet stats row */}
            <Text style={styles.statsRow}>
              {`${offersCount} offering · ${needsCount} looking for${memberSince ? ` · since ${memberSince}` : ''}`}
            </Text>

          </View>

          {/* Skills section */}
          <View style={styles.skillsHeader}>
            <Text style={styles.skillsLabel}>Your Skills</Text>
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

      {drawerOpen && (
        <View style={styles.drawerLayer} pointerEvents="box-none">
          <Animated.View
            style={[styles.drawerOverlay, { opacity: overlayOpacity }]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: drawerTranslate }],
                backgroundColor: drawerTheme.background,
                borderLeftColor: drawerTheme.border,
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <View>
                <Text style={[styles.drawerLabel, { color: drawerTheme.text }]}>Profile settings</Text>
                <Text style={[styles.drawerHint, { color: drawerTheme.muted }]}>Edit details, controls, and sign out.</Text>
              </View>
              <TouchableOpacity onPress={() => setDrawerOpen(false)} style={styles.drawerClose}>
                <Ionicons name="close" size={22} color={drawerTheme.muted} />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerSection}>
              <Text style={[styles.drawerSectionTitle, { color: drawerTheme.muted }]}>Edit profile</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={drawerTheme.muted}
                style={[styles.input, { color: drawerTheme.text, borderBottomColor: drawerTheme.border, backgroundColor: drawerTheme.surface }]}
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Your bio"
                placeholderTextColor={drawerTheme.muted}
                style={[styles.input, styles.bioInput, { color: drawerTheme.text, borderBottomColor: drawerTheme.border, backgroundColor: drawerTheme.surface }]}
                multiline
              />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={onSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerSection}>
              <Text style={[styles.drawerSectionTitle, { color: drawerTheme.muted }]}>Profile picture</Text>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: drawerTheme.surface, borderColor: drawerTheme.border }]}
                onPress={() => Alert.alert('Change profile picture', 'This feature will be available soon.')}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionBtnText, { color: drawerTheme.text }]}>Change profile picture</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.drawerSection}>
              <Text style={[styles.drawerSectionTitle, { color: drawerTheme.muted }]}>Theme</Text>
              <View style={styles.themeRow}>
                {(['light', 'dark'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.themeOption,
                      {
                        borderColor: drawerTheme.border,
                        backgroundColor: themeMode === mode ? Colors.ink : drawerTheme.surface,
                      },
                    ]}
                    onPress={() => setThemeMode(mode)}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.themeOptionText,
                        {
                          color: themeMode === mode ? Colors.white : drawerTheme.text,
                        },
                      ]}
                    >
                      {mode === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.drawerSection}> 
              <TouchableOpacity
                style={[styles.signOutBtnPanel, styles.signOutBtnPanelPrimary]}
                onPress={() => signOut()}
                activeOpacity={0.85}
              >
                <Text style={styles.signOutBtnPanelText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },
  // Profile card
  profileCard: {
    backgroundColor: Colors.surface,
    paddingTop: 72,
    paddingBottom: 28,
    paddingHorizontal: Theme.spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  profileTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingsBtn: {
    padding: 10,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  signOutBtn: { paddingTop: 4 },
  signOutText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.muted,
  },
  profileName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.6,
    textAlign: 'center',
},
  profileBio: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.muted,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
},
  profileBioEmpty: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.border,
    fontStyle: 'italic',
  },
  statsRow: {
    marginTop: 12,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  editLink: {
    marginTop: 14,
  },

  editLinkText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  drawerLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  drawer: {
    width: '82%',
    height: '100%',
    padding: Theme.spacing.lg,
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 20,
  },
  drawerBody: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 14,
  },
  drawerClose: {
    padding: 8,
  },
  drawerLabel: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: Colors.ink,
  },
  drawerHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 4,
  },
  drawerSection: {
    marginBottom: 20,
  },
  drawerSectionTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  actionBtn: {
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.ink,
    fontSize: Theme.fontSize.small,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    alignItems: 'center',
  },
  themeOptionActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  themeOptionText: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.ink,
  },
  themeOptionTextActive: {
    color: Colors.white,
  },
  signOutBtnPanel: {
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutBtnPanelPrimary: {
    backgroundColor: Colors.terracotta,
  },
  signOutBtnPanelText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.white,
  },
  // Edit panel
  editPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 24,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: 18,
  },
  editTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: Colors.ink,
    letterSpacing: -0.3,
  },
  inputGroup: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bioInput: { minHeight: 72, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  // Skills section
  skillsHeader: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 28,
    paddingBottom: 8,
  },
  skillsLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardPad: { paddingHorizontal: Theme.spacing.lg },
  footer: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 6,
    paddingBottom: 12,
  },
  addBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.body,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  // content: {
  // paddingBottom: 120,
  // },
});
