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
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { addSkill } from '../../src/firebase/firestore';
import { CATEGORIES, Category, Skill } from '../../src/types';

type SkillType = Skill['type'];

export default function CreateSkillScreen() {
  const { userProfile } = useAuthContext();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Coding');
  const [type, setType] = useState<SkillType>('offer');
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
      Alert.alert('Posted', 'Your skill is now visible to the community.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save skill';
      Alert.alert('Save failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Share a Skill</Text>
      </View>

      <View style={styles.body}>
        {/* Type selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>TYPE</Text>
          <View style={styles.typeCol}>
            <Pressable
              onPress={() => setType('offer')}
              style={[styles.typeTile, type === 'offer' && styles.typeTileSelected]}
            >
              <Text style={styles.tileTitle}>🙋 I'm offering</Text>
              <Text style={styles.tileSub}>Teach what you know</Text>
            </Pressable>
            <Pressable
              onPress={() => setType('need')}
              style={[styles.typeTile, type === 'need' && styles.typeTileSelected]}
            >
              <Text style={styles.tileTitle}>🔍 I'm looking for</Text>
              <Text style={styles.tileSub}>Learn what you need</Text>
            </Pressable>
          </View>
        </View>

        {/* Title — feels like writing in a journal */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>SKILL DETAILS</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Name your skill…"
            placeholderTextColor={Colors.muted}
            style={styles.titleInput}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DETAILS</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Scope, level, what you'd like in exchange…"
            placeholderTextColor={Colors.muted}
            style={styles.descInput}
            multiline
          />
        </View>

        {/* Category — 3-column text+emoji */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>CATEGORY</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((item) => {
              const selected = item.label === category;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setCategory(item.label)}
                  style={[styles.catItem, selected && styles.catItemSelected]}
                >
                  <Text style={styles.catEmoji}>{item.emoji}</Text>
                  <Text style={[styles.catLabel, selected && styles.catLabelSelected]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Posting…' : 'Share with the community →'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },
  pageHeader: {
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 12,
  },
  pageTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.5,
  },
  body: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 24,
    gap: 28,
  },
  fieldGroup: { gap: 10 },
  fieldLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  // Type tiles
  typeCol: { gap: 12 },
  typeTile: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    backgroundColor: Colors.surface,
  },
  typeTileSelected: {
    borderColor: Colors.border,
    backgroundColor: Colors.accentSurface,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  tileTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.body,
    color: Colors.ink,
  },
  tileSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.muted,
    lineHeight: 19,
  },
  // Inputs — journal-style
  titleInput: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 22,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 0,
    letterSpacing: -0.3,
    backgroundColor: Colors.surface,
  },
  descInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 0,
    minHeight: 72,
    textAlignVertical: 'top',
    lineHeight: 24,
    backgroundColor: Colors.surface,
  },
  // Category grid — 3 columns
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '31%',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catItemSelected: {
    backgroundColor: Colors.accentSurface,
    borderColor: Colors.border,
  },
  catEmoji: { fontSize: 14 },
  catLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.body,
    flex: 1,
  },
  catLabelSelected: {
    color: Colors.ink,
    fontFamily: 'Nunito_600SemiBold',
  },
  // Submit
  submitBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.body,
    color: Colors.white,
    letterSpacing: 0.3,
  },
});
