import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../components/Avatar';
import GoogleMapCanvas from '../components/GoogleMapCanvas';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { createSwapRequest, getSkillsByUser } from '../../src/firebase/firestore';
import { useSkills } from '../../src/hooks/useSkills';
import { CATEGORIES, Category, Skill } from '../../src/types';

export default function MapScreen() {
  const { skills } = useSkills();
  const { userProfile } = useAuthContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const styles = getStyles(colors);
  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase();
    return skills.filter((skill) => {
      if (skill.userId === userProfile?.uid) return false;
      if (selectedCategory !== 'All' && skill.category !== selectedCategory) return false;
      return !query || `${skill.title} ${skill.description} ${skill.category} ${skill.userName}`.toLowerCase().includes(query);
    });
  }, [search, selectedCategory, skills, userProfile?.uid]);

  const selectedSkill = filteredSkills.find((skill) => skill.id === selectedSkillId) ?? null;

  const selectCategory = (category: Category | 'All') => {
    setSelectedCategory(category);
    setSelectedSkillId(null);
  };

  const sendSwapRequest = async (requestedSkill: Skill) => {
    if (!userProfile) return;
    try {
      const mySkills = await getSkillsByUser(userProfile.uid);
      const offeredSkill = mySkills.find((skill) => skill.type === 'offer');
      if (!offeredSkill) {
        Alert.alert('Add a skill first', 'Post at least one offered skill before requesting swaps.');
        return;
      }
      await createSwapRequest({
        fromUserId: userProfile.uid,
        fromUserName: userProfile.name,
        fromUserInitials: userProfile.initials,
        toUserId: requestedSkill.userId,
        toUserName: requestedSkill.userName,
        toUserInitials: requestedSkill.userInitials,
        offeredSkillId: offeredSkill.id,
        offeredSkillTitle: offeredSkill.title,
        requestedSkillId: requestedSkill.id,
        requestedSkillTitle: requestedSkill.title,
        status: 'pending',
      });
      Alert.alert('Request sent', 'Your swap request has been sent.');
    } catch (error) {
      Alert.alert('Unable to send request', error instanceof Error ? error.message : 'Request failed');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: '#EEECE6' }]}>
      <GoogleMapCanvas />

      <View style={[styles.content, { paddingTop: insets.top + 10 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.nearbyLabel}>
            <Ionicons name="sparkles" size={13} color={colors.muted} />
            <Text style={styles.nearbyText}>SKILL EXPLORER</Text>
          </View>
          <View style={styles.radiusPill}>
            <Text style={styles.radiusText}>Google Maps</Text>
          </View>
        </View>

        <Text style={styles.title}>Explore map</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setSelectedSkillId(null);
            }}
            placeholder="Search skills nearby..."
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search map skills"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </TouchableOpacity>
          )}
          {!search && <Ionicons name="options-outline" size={20} color={colors.muted} />}
        </View>

        <FlatList
          horizontal
          data={['All', ...CATEGORIES.map((category) => category.label)] as (Category | 'All')[]}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item }) => {
            const category = CATEGORIES.find((entry) => entry.label === item);
            const active = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => selectCategory(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                {category && <Text style={styles.chipEmoji}>{category.emoji}</Text>}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {item === 'All' ? '✦  All' : item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={[styles.mapTools, { top: insets.top + 250 }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Show skills list"
          onPress={() => setShowList((visible) => !visible)}
          style={styles.mapTool}
          activeOpacity={0.75}
        >
          <Ionicons name={showList ? 'map-outline' : 'menu'} size={21} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {showList ? (
        <View style={[styles.listPanel, { bottom: insets.bottom + 104 }]}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelTitle}>Skills to explore</Text>
            <TouchableOpacity onPress={() => setShowList(false)} accessibilityLabel="Close skills list">
              <Ionicons name="close" size={21} color={colors.muted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filteredSkills.map((skill) => (
              <TouchableOpacity
                key={skill.id}
                onPress={() => {
                  setSelectedSkillId(skill.id);
                  setShowList(false);
                }}
                style={styles.listItem}
              >
                <Avatar initials={skill.userInitials} size={38} />
                <View style={styles.listItemText}>
                  <Text numberOfLines={1} style={styles.listItemTitle}>{skill.title}</Text>
                  <Text numberOfLines={1} style={styles.listItemSubtitle}>
                    {skill.userName} · {skill.category}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
            {filteredSkills.length === 0 && (
              <Text style={styles.emptyText}>No skills match your search yet.</Text>
            )}
          </ScrollView>
        </View>
      ) : selectedSkill ? (
        <View style={[styles.skillPanel, { bottom: insets.bottom + 104 }]}>
          <View style={styles.profileRow}>
            <Avatar initials={selectedSkill.userInitials} size={52} />
            <View style={styles.profileDetails}>
              <View style={styles.nameAndType}>
                <Text style={styles.userName} numberOfLines={1}>{selectedSkill.userName}</Text>
                <Text style={styles.typePill}>
                  {selectedSkill.type === 'offer' ? 'Offering' : 'Looking for'}
                </Text>
              </View>
              <Text style={styles.locationText}>Location unavailable</Text>
            </View>
          </View>
          <Text style={styles.skillTitle} numberOfLines={1}>{selectedSkill.title}</Text>
          <Text style={styles.skillDescription} numberOfLines={2}>
            {selectedSkill.description || 'Connect with this member to learn more about their skill.'}
          </Text>
          <View style={styles.panelDivider} />
          <View style={styles.skillFooter}>
            <Text style={styles.categoryBadge}>
              {CATEGORIES.find((category) => category.label === selectedSkill.category)?.emoji ?? '✦'}  {selectedSkill.category}
            </Text>
            <TouchableOpacity
              onPress={() => sendSwapRequest(selectedSkill)}
              style={styles.swapButton}
              activeOpacity={0.8}
            >
              <Text style={styles.swapButtonText}>Let's swap</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={[styles.emptyPanel, { bottom: insets.bottom + 104 }]}>
          <Text style={styles.emptyTitle}>Explore the map</Text>
          <Text style={styles.emptyText}>
            Skill locations will appear here when members choose to share them.
          </Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: typeof import('../../src/constants/Colors').Colors) =>
  StyleSheet.create({
    screen: { flex: 1, overflow: 'hidden' },
    content: {
      zIndex: 2,
      paddingHorizontal: Theme.spacing.lg,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderWidth: 1,
      borderColor: 'rgba(20,19,18,0.08)',
    },
    nearbyLabel: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    nearbyText: {
      color: colors.muted,
      fontFamily: 'Nunito_700Bold',
      fontSize: 11,
      letterSpacing: 1.2,
    },
    radiusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.92)',
      borderWidth: 1,
      borderColor: 'rgba(20,19,18,0.06)',
    },
    radiusText: {
      color: colors.ink,
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 12,
    },
    title: {
      color: colors.ink,
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 39,
      lineHeight: 48,
      letterSpacing: -0.8,
      marginTop: 7,
      marginBottom: 15,
    },
    searchBox: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      borderRadius: 19,
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderWidth: 1,
      borderColor: 'rgba(20,19,18,0.1)',
      shadowColor: '#443F37',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    searchInput: {
      flex: 1,
      color: colors.ink,
      fontFamily: 'Nunito_400Regular',
      fontSize: 14,
    },
    chipRow: {
      gap: 9,
      paddingVertical: 13,
      paddingRight: Theme.spacing.lg,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.93)',
      borderWidth: 1,
      borderColor: 'rgba(20,19,18,0.09)',
      shadowColor: '#443F37',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    chipActive: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    chipEmoji: { fontSize: 13 },
    chipText: {
      color: colors.ink,
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 13,
    },
    chipTextActive: { color: '#FFFFFF' },
    mapTools: {
      position: 'absolute',
      right: 18,
      zIndex: 3,
    },
    mapTool: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 23,
      backgroundColor: 'rgba(255,255,255,0.97)',
      borderWidth: 1,
      borderColor: 'rgba(20,19,18,0.08)',
      shadowColor: '#352F27',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    skillPanel: {
      position: 'absolute',
      left: 18,
      right: 18,
      zIndex: 4,
      padding: 18,
      borderRadius: 30,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: 'rgba(20,19,18,0.06)',
      shadowColor: '#443F37',
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.13,
      shadowRadius: 18,
      elevation: 10,
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    profileDetails: { flex: 1, minWidth: 0 },
    nameAndType: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    userName: {
      flexShrink: 1,
      color: colors.ink,
      fontFamily: 'Nunito_700Bold',
      fontSize: 15,
    },
    typePill: {
      overflow: 'hidden',
      color: colors.body,
      backgroundColor: colors.softSurface,
      borderRadius: Theme.borderRadius.full,
      paddingHorizontal: 9,
      paddingVertical: 4,
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 10,
    },
    locationText: {
      marginTop: 4,
      color: colors.muted,
      fontFamily: 'Nunito_400Regular',
      fontSize: 12,
    },
    skillTitle: {
      color: colors.ink,
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 26,
      lineHeight: 32,
      marginTop: 14,
    },
    skillDescription: {
      color: colors.muted,
      fontFamily: 'Nunito_400Regular',
      fontSize: 13,
      lineHeight: 19,
      marginTop: 4,
    },
    panelDivider: {
      height: 1,
      marginTop: 14,
      marginBottom: 13,
      backgroundColor: colors.border,
    },
    skillFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    categoryBadge: {
      overflow: 'hidden',
      color: colors.body,
      backgroundColor: colors.softSurface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontFamily: 'Nunito_600SemiBold',
      fontSize: 13,
    },
    swapButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 17,
      paddingVertical: 12,
      borderRadius: Theme.borderRadius.full,
      backgroundColor: colors.ink,
    },
    swapButtonText: {
      color: '#FFFFFF',
      fontFamily: 'Nunito_700Bold',
      fontSize: 13,
    },
    emptyPanel: {
      position: 'absolute',
      left: 18,
      right: 18,
      zIndex: 4,
      padding: 22,
      borderRadius: 24,
      backgroundColor: colors.surface,
    },
    emptyTitle: {
      color: colors.ink,
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 22,
    },
    emptyText: {
      marginTop: 4,
      color: colors.muted,
      fontFamily: 'Nunito_400Regular',
      fontSize: 13,
    },
    listPanel: {
      position: 'absolute',
      left: 18,
      right: 18,
      maxHeight: '48%',
      zIndex: 5,
      padding: 18,
      borderRadius: 26,
      backgroundColor: colors.surface,
      shadowColor: '#443F37',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 9,
    },
    panelHeading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    panelTitle: {
      color: colors.ink,
      fontFamily: 'DMSerifDisplay_400Regular',
      fontSize: 22,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    listItemText: { flex: 1 },
    listItemTitle: {
      color: colors.ink,
      fontFamily: 'Nunito_700Bold',
      fontSize: 14,
    },
    listItemSubtitle: {
      marginTop: 2,
      color: colors.muted,
      fontFamily: 'Nunito_400Regular',
      fontSize: 12,
    },
  });
