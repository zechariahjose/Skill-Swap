import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import SkillCard from '../components/SkillCard';
import Avatar from '../components/Avatar';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useAuthContext } from '../context/AuthContext';
import { createSwapRequest, getSkillsByUser } from '../firebase/firestore';
import { useSkills } from '../hooks/useSkills';
import { CATEGORIES, Category, Skill } from '../types';

const COMMUNITY_MEMBERS = [
  { initials: 'AK', name: 'Aiko' },
  { initials: 'MR', name: 'Marco' },
  { initials: 'SR', name: 'Sara' },
  { initials: 'TL', name: 'Tayla' },
  { initials: 'JB', name: 'Jamie' },
  { initials: 'PD', name: 'Priya' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { skills, loading } = useSkills();
  const { userProfile } = useAuthContext();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      if (skill.userId === userProfile?.uid) return false;
      const categoryOk = selectedCategory === 'All' || skill.category === selectedCategory;
      const query = search.toLowerCase().trim();
      const textOk =
        query.length === 0 ||
        skill.title.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query);
      return categoryOk && textOk;
    });
  }, [search, selectedCategory, skills, userProfile?.uid]);

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
      const message = error instanceof Error ? error.message : 'Request failed';
      Alert.alert('Unable to send request', message);
    }
  };

  const firstName = userProfile?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredSkills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.cardPad}>
            <SkillCard skill={item} onSwapPress={sendSwapRequest} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* Greeting */}
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()}, {firstName}</Text>
              <Text style={styles.headline}>What will you{'\n'}learn today?</Text>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <Ionicons name="search" size={16} color={Colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search skills..."
                placeholderTextColor={Colors.muted}
                style={styles.searchInput}
              />
            </View>

            {/* Active Today */}
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>ACTIVE TODAY</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.peopleRow}>
                {COMMUNITY_MEMBERS.map((m) => (
                  <View key={m.initials} style={styles.personItem}>
                    <Avatar initials={m.initials} size={48} />
                    <Text style={styles.personName}>{m.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Category chips */}
            <FlatList
              data={['All', ...CATEGORIES.map((c) => c.label)] as (Category | 'All')[]}
              horizontal
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <CategoryChip
                  label={item}
                  selected={selectedCategory === item}
                  onPress={() => setSelectedCategory(item)}
                />
              )}
              contentContainerStyle={styles.chips}
            />

            {/* Skill Board header */}
            <View style={styles.boardHeader}>
              <Text style={styles.sectionLabel}>SKILL BOARD</Text>
              {!loading && (
                <Text style={styles.boardCount}>{filteredSkills.length}</Text>
              )}
            </View>
            <View style={styles.boardSpacer} />

            {loading && (
              <View style={styles.cardPad}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              emoji="✦"
              title="Nothing here yet"
              subtitle="Try another category, or be the first to post a skill."
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingBottom: 96,
  },
  header: {
    backgroundColor: Colors.background,
  },
  // Greeting block
  greetingBlock: {
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 16,
    gap: 6,
  },
  greeting: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.muted,
  },
  headline: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    color: Colors.ink,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginHorizontal: Theme.spacing.lg,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
    flex: 1,
    paddingVertical: 0,
  },
  // Active today
  section: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 24,
    paddingBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  peopleRow: {
    gap: 20,
    paddingBottom: 12,
  },
  personItem: {
    alignItems: 'center',
    gap: 6,
  },
  personName: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  // Category chips
  chips: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 12,
    paddingBottom: 18,
  },
  // Skill board
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: 0,
  },
  boardCount: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },
  boardSpacer: { height: 12 },
  cardPad: {
    paddingHorizontal: Theme.spacing.lg,
  },
});
