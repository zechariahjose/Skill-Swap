import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import SkillCard from '../components/SkillCard';
import Avatar from '../components/Avatar';
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { createSwapRequest, getSkillsByUser } from '../../src/firebase/firestore';
import { useSkills } from '../../src/hooks/useSkills';
import { CATEGORIES, Category, Skill } from '../../src/types';

function getGreeting(name?: string) {
  const h = new Date().getHours();

  let greeting = 'Good evening';
  if (h < 12) greeting = 'Good morning';
  else if (h < 17) greeting = 'Good afternoon';

  return `${greeting}${name ? `, ${name}` : ''}`;
}

export default function HomeScreen() {
  const { skills, loading, refreshSkills } = useSkills();
  const { userProfile } = useAuthContext();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

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

  const activeUsers = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const users = new Map<string, { initials: string; name: string }>();

    skills.forEach((skill) => {
      const createdAt = skill.createdAt;
      const timestamp =
        createdAt instanceof Date
          ? createdAt.getTime()
          : typeof createdAt === 'object' && createdAt !== null && 'seconds' in createdAt
          ? (createdAt as { seconds: number }).seconds * 1000
          : 0;

      if (timestamp >= cutoff && !users.has(skill.userId)) {
        users.set(skill.userId, {
          initials: skill.userInitials,
          name: skill.userName,
        });
      }
    });

    return Array.from(users.values()).slice(0, 8);
  }, [skills]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSkills();
    } finally {
      setRefreshing(false);
    }
  };

  const sendSwapRequest = async (requestedSkill: Skill) => {
    if (!userProfile) return;
    try {
      const mySkills = await getSkillsByUser(userProfile.uid);
      const offeredSkill = mySkills.find((s) => s.type === 'offer');
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.muted}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cardPad}>
            <SkillCard skill={item} onSwapPress={sendSwapRequest} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            {/* ── Greeting ── */}
            <View style={styles.greetingBlock}>
              <View style={styles.greetingBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.muted} />
                <Text style={styles.greetingBadgeText}>
                  {getGreeting(firstName)}
                </Text>
              </View>
              <Text style={styles.headline}>
                What will you{'\n'}
                <Text style={styles.headlineAccent}>learn</Text> today?
              </Text>
              <Text style={styles.subHeadline}>
                {filteredSkills.length > 0
                  ? `${filteredSkills.length} skills available to swap`
                  : 'Explore skills from your community'}
              </Text>
            </View>

            {/* ── Search ── */}
            <View style={styles.searchWrapper}>
              <View style={styles.searchRow}>
                <Ionicons name="search" size={16} color={Colors.muted} style={styles.searchIcon} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search skills..."
                  placeholderTextColor={Colors.muted}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={16} color={Colors.muted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* ── Active Today ── */}
            {activeUsers.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Active Today" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.peopleRow}
                >
                  {activeUsers.map((member) => (
                    <View key={member.initials + member.name} style={styles.personItem}>
                      <View style={styles.avatarRing}>
                        <Avatar initials={member.initials} size={44} />
                      </View>
                      <Text style={styles.personName}>{member.name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Category chips ── */}
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

            {/* ── Skill Board header ── */}
            <View style={styles.boardHeader}>
              <SectionHeader label="Skill Board" />
              {!loading && filteredSkills.length > 0 && (
                <View style={styles.countPill}>
                  <Text style={styles.countText}>{filteredSkills.length}</Text>
                </View>
              )}
            </View>

            {/* Skeleton loading */}
            {loading && (
              <View style={[styles.cardPad, { gap: 12, marginTop: 8 }]}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}

            <View style={styles.boardSpacer} />
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

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionLabel}>{label.toUpperCase()}</Text>
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

  // ── Greeting ──
  greetingBlock: {
    paddingTop: 64,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: 20,
    gap: 8,
  },
  greetingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  greetingBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: Colors.muted,
    letterSpacing: 0.3,
  },
  headline: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 34,
    color: Colors.ink,
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  headlineAccent: {
    fontFamily: 'DMSerifDisplay_400Italic',
    color: Colors.accent,
  },
  subHeadline: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },

  // ── Search ──
  searchWrapper: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
    flex: 1,
    paddingVertical: 0,
  },

  // ── Active Today ──
  section: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 28,
    paddingBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  sectionDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.muted,
    opacity: 0.5,
  },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: Colors.muted,
    letterSpacing: 1.4,
  },
  peopleRow: {
    gap: 18,
    paddingBottom: 4,
    paddingRight: 4,
  },
  personItem: {
    alignItems: 'center',
    gap: 7,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  personName: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.muted,
  },

  // ── Category chips ──
  chips: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 8,
  },

  // ── Skill Board ──
  boardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: 0,
  },
  countPill: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 11,
    color: Colors.muted,
  },
  boardSpacer: { height: 14 },

  cardPad: {
    paddingHorizontal: Theme.spacing.lg,
  },
});