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

const ACCENT       = '#7F77DD';
const ACCENT_LIGHT = '#AFA9EC';
const ACCENT_SURF  = '#EEEDFE';
const ACCENT_TEXT  = '#3C3489';

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
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to save skill';
      Alert.alert('Save failed', msg);
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
      {/* ── Hero header ── */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Community board</Text>
        <Text style={styles.heroTitle}>Share a skill</Text>
        <Text style={styles.heroSub}>Teach what you know. Learn what you need.</Text>
      </View>

      {/* ── Type ── */}
      <View style={styles.section}>
        <Text style={styles.secLabel}>You are</Text>
        <View style={styles.typeRow}>
          {(['offer', 'need'] as const).map((t) => {
            const on = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeTile, on && styles.typeTileOn]}
              >
                <Text style={styles.tileIcon}>{t === 'offer' ? '🙋' : '🔍'}</Text>
                <Text style={[styles.tileName, on && styles.tileNameOn]}>
                  {t === 'offer' ? 'Offering' : 'Looking for'}
                </Text>
                <Text style={styles.tileHint}>
                  {t === 'offer' ? 'Share your expertise' : 'Find a new skill'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Skill details ── */}
      <View style={styles.section}>
        <Text style={styles.secLabel}>The skill</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Name your skill…"
          placeholderTextColor={Colors.muted}
          style={styles.titleInput}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Scope, level, what you'd like in exchange…"
          placeholderTextColor={Colors.muted}
          style={styles.descInput}
          multiline
          maxLength={280}
        />
        <Text style={styles.charCount}>{description.length} / 280</Text>
      </View>

      {/* ── Category ── */}
      <View style={[styles.section, styles.sectionLast]}>
        <Text style={styles.secLabel}>Category</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((item) => {
            const on = item.label === category;
            return (
              <Pressable
                key={item.label}
                onPress={() => setCategory(item.label)}
                style={[styles.catChip, on && styles.catChipOn]}
              >
                <Text style={styles.catEmoji}>{item.emoji}</Text>
                <Text style={[styles.catName, on && styles.catNameOn]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* ── Submit ── */}
      <View style={styles.submitWrap}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnOff]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.82}
        >
          <Text style={styles.submitText}>
            {submitting ? 'Posting…' : 'Post to community →'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.submitNote}>Visible to everyone in the community</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100 },

  /* Hero */
  hero: {
    paddingTop: 56,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  eyebrow: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: ACCENT,
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: Colors.ink,
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  heroSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginTop: 6,
    lineHeight: 19,
  },

  /* Sections */
  section: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  sectionLast: { borderBottomWidth: 0 },
  secLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.muted,
    marginBottom: 12,
  },

  /* Type tiles */
  typeRow: { flexDirection: 'row', gap: 10 },
  typeTile: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 5,
    backgroundColor: Colors.surface,
  },
  typeTileOn: {
    borderWidth: 1.5,
    borderColor: ACCENT_LIGHT,
    backgroundColor: ACCENT_SURF,
  },
  tileIcon:  { fontSize: 20 },
  tileName:  { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: Colors.ink },
  tileNameOn: { color: ACCENT_TEXT },
  tileHint:  { fontFamily: 'Nunito_400Regular', fontSize: 11, color: Colors.muted, lineHeight: 15 },

  /* Inputs */
  titleInput: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 21,
    color: Colors.ink,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 0,
    letterSpacing: -0.4,
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  descInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minHeight: 60,
    textAlignVertical: 'top',
    lineHeight: 23,
    backgroundColor: 'transparent',
  },
  charCount: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'right',
    marginTop: 6,
  },

  /* Category */
  catGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipOn: {
    borderWidth: 1.5,
    borderColor: ACCENT_LIGHT,
    backgroundColor: ACCENT_SURF,
  },
  catEmoji: { fontSize: 16 },
  catName:  { fontFamily: 'Nunito_400Regular', fontSize: 12, color: Colors.body, flex: 1 },
  catNameOn: { color: ACCENT_TEXT, fontFamily: 'Nunito_600SemiBold' },

  /* Submit */
  submitWrap: { paddingHorizontal: Theme.spacing.lg, paddingTop: 20 },
  submitBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnOff: { opacity: 0.5 },
  submitText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: Theme.fontSize.body,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  submitNote: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 10,
  },
});