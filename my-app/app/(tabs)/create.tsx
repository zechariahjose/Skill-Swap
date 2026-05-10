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
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { addSkill } from '../../src/firebase/firestore';
import { CATEGORIES, Category, Skill } from '../../src/types';

type SkillType = Skill['type'];

export default function CreateSkillScreen() {
  const { userProfile } = useAuthContext();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Coding');
  const [type, setType] = useState<SkillType>('offer');
  const [submitting, setSubmitting] = useState(false);

  const styles = getStyles(colors);

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
      <View style={styles.hero}>
        <Text style={[styles.eyebrow, { color: colors.accent }]}>Community board</Text>
        <Text style={[styles.heroTitle, { color: colors.ink }]}>Share a skill</Text>
        <Text style={[styles.heroSub, { color: colors.muted }]}>Teach what you know. Learn what you need.</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.secLabel, { color: colors.muted }]}>You are</Text>
        <View style={styles.typeRow}>
          {(['offer', 'need'] as const).map((t) => {
            const on = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={[styles.typeTile, on && styles.typeTileOn, { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? '#EEEDFE' : colors.surface }]}
              >
                <Text style={styles.tileIcon}>{t === 'offer' ? '🙋' : '🔍'}</Text>
                <Text style={[styles.tileName, on && styles.tileNameOn, { color: on ? '#3C3489' : colors.ink }]}> 
                  {t === 'offer' ? 'Offering' : 'Looking for'}
                </Text>
                <Text style={[styles.tileHint, { color: colors.muted }]}> 
                  {t === 'offer' ? 'Share your expertise' : 'Find a new skill'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, styles.sectionLast, { borderBottomColor: colors.border }]}> 
        <Text style={[styles.secLabel, { color: colors.muted }]}>The skill</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Name your skill…"
          placeholderTextColor={colors.muted}
          style={[styles.titleInput, { color: colors.ink, borderBottomColor: colors.border }]}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Scope, level, what you'd like in exchange…"
          placeholderTextColor={colors.muted}
          style={[styles.descInput, { color: colors.body, borderBottomColor: colors.border }]}
          multiline
          maxLength={280}
        />
        <Text style={[styles.charCount, { color: colors.muted }]}>{description.length} / 280</Text>
      </View>

      <View style={[styles.section, { borderBottomColor: colors.border }]}> 
        <Text style={[styles.secLabel, { color: colors.muted }]}>Category</Text>
        <View style={styles.catGrid}>
          {CATEGORIES.map((item) => {
            const on = item.label === category;
            return (
              <Pressable
                key={item.label}
                onPress={() => setCategory(item.label)}
                style={[styles.catChip, on && styles.catChipOn, { backgroundColor: on ? colors.accentSurface : colors.surface, borderColor: on ? colors.accent : colors.border }]}
              >
                <Text style={styles.catEmoji}>{item.emoji}</Text>
                <Text style={[styles.catName, on && styles.catNameOn, { color: on ? '#3C3489' : colors.body }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.submitWrap}>
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnOff, { backgroundColor: colors.ink }]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.82}
        >
          <Text style={[styles.submitText, { color: colors.white }]}> 
            {submitting ? 'Posting…' : 'Post to community →'}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.submitNote, { color: colors.muted }]}>Visible to everyone in the community</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: typeof import('../../src/constants/Colors').Colors) =>
  StyleSheet.create({
    screen:  { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 100 },
    hero: {
      paddingTop: 56,
      paddingHorizontal: Theme.spacing.lg,
      paddingBottom: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    eyebrow: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    heroTitle: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 28,
      letterSpacing: -0.6,
      lineHeight: 34,
    },
    heroSub: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 13,
      marginTop: 6,
      lineHeight: 19,
    },
    section: {
      paddingHorizontal: Theme.spacing.lg,
      paddingVertical: 20,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sectionLast: { borderBottomWidth: 0 },
    secLabel: {
      fontFamily: 'Nunito_700Bold',
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    typeRow: { flexDirection: 'row', gap: 10 },
    typeTile: {
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      padding: 16,
      gap: 5,
    },
    typeTileOn: {
      borderWidth: 1.5,
    },
    tileIcon:  { fontSize: 20 },
    tileName:  { fontFamily: 'Nunito_600SemiBold', fontSize: 13 },
    tileNameOn: { color: '#3C3489' },
    tileHint:  { fontFamily: 'Nunito_400Regular', fontSize: 11, lineHeight: 15 },
    titleInput: {
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 21,
      borderBottomWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 0,
      letterSpacing: -0.4,
      backgroundColor: 'transparent',
      marginBottom: 16,
    },
    descInput: {
      fontFamily: 'Nunito_400Regular',
      fontSize: Theme.fontSize.body,
      borderBottomWidth: 1,
      paddingVertical: 8,
      paddingHorizontal: 0,
      minHeight: 60,
      textAlignVertical: 'top',
      lineHeight: 23,
      backgroundColor: 'transparent',
    },
    charCount: {
      fontFamily: 'Nunito_400Regular',
      fontSize: Theme.fontSize.small,
      textAlign: 'right',
      marginTop: 8,
    },
    catGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    catChip: {
      flexBasis: '48%',
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      paddingVertical: 14,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    catChipOn: {
      borderWidth: 1.5,
    },
    catEmoji: { fontSize: 18 },
    catName: {
      fontFamily: 'Nunito_400Regular',
      fontSize: 12,
      flex: 1,
    },
    catNameOn: {
      fontFamily: 'Nunito_700Bold',
    },
    submitWrap: {
      paddingHorizontal: Theme.spacing.lg,
      paddingBottom: 32,
      paddingTop: 16,
    },
    submitBtn: {
      borderRadius: Theme.borderRadius.full,
      paddingVertical: 18,
      alignItems: 'center',
    },
    submitBtnOff: {
      opacity: 0.6,
    },
    submitText: {
      fontFamily: 'Nunito_700Bold',
      fontSize: Theme.fontSize.body,
    },
    submitNote: {
      fontFamily: 'Nunito_400Regular',
      fontSize: Theme.fontSize.small,
      marginTop: 10,
    },
  });
