import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
      await updateUserProfile(userProfile.uid, {
        name: name.trim(),
        bio: bio.trim(),
      });
      await refreshProfile();
      Alert.alert('Profile updated', 'Your changes have been saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Save failed', message);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteSkill = async (id: string) => {
    try {
      await deleteSkill(id);
      await loadMySkills();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete skill';
      Alert.alert('Delete failed', message);
    }
  };

  if (!userProfile) {
    return (
      <View style={styles.container}>
        <EmptyState emoji="👤" title="Profile unavailable" subtitle="Please sign in again." />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={skills}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View style={styles.headerCard}>
            <Avatar initials={userProfile.initials} size={62} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nameText}>{userProfile.name}</Text>
              <Text style={styles.emailText}>Build trust through clear profile details.</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Your profile</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Name" />
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.bioInput]}
            placeholder="Bio"
            multiline
          />

          <TouchableOpacity style={styles.primaryButton} onPress={onSave} disabled={saving}>
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save profile'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              signOut();
            }}
          >
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Your skills</Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState emoji="🧰" title="No skills posted yet" subtitle="Create your first offer from the Post Skill tab." />
      }
      renderItem={({ item }) => <SkillCard skill={item} isOwn onDeletePress={onDeleteSkill} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  content: {
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
  headerCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    alignItems: 'center',
    ...Theme.shadow.card,
  },
  nameText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 18,
    color: Colors.charcoal,
  },
  emailText: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.muted,
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    color: Colors.charcoal,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.charcoal,
    marginBottom: Theme.spacing.sm,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    paddingVertical: 11,
    marginBottom: Theme.spacing.sm,
  },
  primaryButtonText: {
    color: Colors.white,
    fontFamily: 'Nunito_700Bold',
  },
  secondaryButton: {
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    alignItems: 'center',
    paddingVertical: 11,
    marginBottom: Theme.spacing.md,
  },
  secondaryButtonText: {
    color: Colors.muted,
    fontFamily: 'Nunito_600SemiBold',
  },
});
