import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useAuthContext } from '../context/AuthContext';
import { addSkill } from '../firebase/firestore';
import { CATEGORIES, Category, Skill } from '../types';

export default function CreateSkillScreen() {
  const { userProfile } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Coding');
  const [type, setType] = useState<Skill['type']>('offer');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!userProfile) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Add a short title for your skill.');
      return;
    }

    try {
      setSubmitting(true);
      await addSkill({
        userId: userProfile.uid,
        userName: userProfile.name,
        userInitials: userProfile.initials,
        title: title.trim(),
        category,
        description: description.trim(),
        type,
      });
      setTitle('');
      setDescription('');
      setType('offer');
      Alert.alert('Skill posted', 'Your skill is now visible to the community.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save skill';
      Alert.alert('Save failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Post a skill</Text>
      <Text style={styles.subheading}>Offer what you know or request what you need.</Text>

      <View style={styles.toggleRow}>
        <Pressable
          onPress={() => setType('offer')}
          style={[styles.toggleButton, type === 'offer' && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, type === 'offer' && styles.toggleTextActive]}>Offering</Text>
        </Pressable>
        <Pressable
          onPress={() => setType('need')}
          style={[styles.toggleButton, type === 'need' && styles.toggleActive]}
        >
          <Text style={[styles.toggleText, type === 'need' && styles.toggleTextActive]}>Looking For</Text>
        </Pressable>
      </View>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Skill title (e.g. React Native tutoring)"
        placeholderTextColor={Colors.muted}
        style={styles.input}
      />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Describe scope, level, and preferred exchange."
        placeholderTextColor={Colors.muted}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryWrap}>
        {CATEGORIES.map((item) => {
          const selected = item.label === category;
          return (
            <Pressable
              key={item.label}
              onPress={() => setCategory(item.label)}
              style={[styles.categoryChip, selected && { backgroundColor: item.color }]}
            >
              <Text style={styles.categoryEmoji}>{item.emoji}</Text>
              <Text style={[styles.categoryText, selected && { color: Colors.white }]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.submitButtonText}>{submitting ? 'Posting...' : 'Publish skill'}</Text>
      </TouchableOpacity>
    </ScrollView>
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
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    color: Colors.charcoal,
  },
  subheading: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.muted,
    marginBottom: Theme.spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  toggleButton: {
    flex: 1,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  toggleActive: {
    backgroundColor: Colors.terracotta,
    borderColor: Colors.terracotta,
  },
  toggleText: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.charcoal,
  },
  toggleTextActive: {
    color: Colors.white,
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
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  label: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.charcoal,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryEmoji: {
    fontSize: 12,
  },
  categoryText: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.charcoal,
    fontSize: 12,
  },
  submitButton: {
    marginTop: Theme.spacing.lg,
    backgroundColor: Colors.terracotta,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontFamily: 'Nunito_700Bold',
  },
});
