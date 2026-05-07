import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, FlatList, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import SkillCard from '../components/SkillCard';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useAuthContext } from '../context/AuthContext';
import { signOut } from '../firebase/auth';
import { deleteSkill, getSkillsByUser, updateUserProfile } from '../firebase/firestore';
import { Skill } from '../types';

export default function ProfileScreen() {
  const { userProfile, refreshProfile } = useAuthContext();
  const [name, setName] = useState(userProfile?.name ?? '');
  const [bio, setBio] = useState(userProfile?.bio ?? '');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

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

  const onSave = async () => {
    if (!userProfile) return;
    try {
      setSaving(true);
      await updateUserProfile(userProfile.uid, { name: name.trim(), bio: bio.trim() });
      await refreshProfile();
      setEditOpen(false);
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
              <Avatar initials={userProfile.initials} size={64} />
              <TouchableOpacity onPress={() => signOut()} style={styles.signOutBtn}>
                <Text style={styles.signOutText}>Sign out</Text>
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

            {/* Edit link */}
            <TouchableOpacity onPress={() => setEditOpen(!editOpen)} style={styles.editLink}>
              <Text style={styles.editLinkText}>{editOpen ? 'Cancel editing' : 'Edit profile →'}</Text>
            </TouchableOpacity>
          </View>

          {/* Edit panel */}
          {editOpen && (
            <View style={styles.editPanel}>
              <Text style={styles.editTitle}>Edit profile</Text>
              <View style={styles.inputGroup}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={Colors.muted}
                  style={styles.input}
                />
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="A sentence about what you do or love"
                  placeholderTextColor={Colors.muted}
                  style={[styles.input, styles.bioInput]}
                  multiline
                />
              </View>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={onSave}
                disabled={saving}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save changes'}</Text>
              </TouchableOpacity>
            </View>
          )}

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
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },
  // Profile card
  profileCard: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 24,
    gap: 8,
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  signOutBtn: { paddingTop: 4 },
  signOutText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.muted,
  },
  profileName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 24,
    color: Colors.ink,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  profileBio: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.muted,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  profileBioEmpty: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.border,
    fontStyle: 'italic',
  },
  statsRow: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.muted,
    letterSpacing: 0.2,
    marginTop: 4,
    textAlign: 'center',
  },
  editLink: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  editLinkText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.accent,
  },
  // Edit panel
  editPanel: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 16,
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
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'transparent',
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
    paddingTop: 20,
    paddingBottom: 4,
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
    paddingVertical: 16,
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.body,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
