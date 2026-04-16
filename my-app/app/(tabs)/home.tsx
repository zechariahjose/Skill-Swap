import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import SkillCard from '../components/SkillCard';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { useAuthContext } from '../context/AuthContext';
import { createSwapRequest, getSkillsByUser } from '../firebase/firestore';
import { useSkills } from '../hooks/useSkills';
import { CATEGORIES, Category, Skill } from '../types';

export default function HomeScreen() {
  const { skills, loading } = useSkills();
  const { userProfile } = useAuthContext();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      if (skill.userId === userProfile?.uid) {
        return false;
      }

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
    if (!userProfile) {
      return;
    }

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

      Alert.alert('Swap sent', 'Your request has been sent successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      Alert.alert('Unable to send request', message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Find your next skill swap</Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search skills, topics, or help needed"
        placeholderTextColor={Colors.muted}
        style={styles.searchInput}
      />

      <FlatList
        data={['All', ...CATEGORIES.map((c) => c.label)]}
        horizontal
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryChip
            label={item as Category | 'All'}
            selected={selectedCategory === item}
            onPress={() => setSelectedCategory(item as Category | 'All')}
          />
        )}
        contentContainerStyle={styles.categories}
      />

      {loading ? (
        <View>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : filteredSkills.length === 0 ? (
        <EmptyState
          emoji="🤝"
          title="No matching skills right now"
          subtitle="Try another category or post your own skill offer."
        />
      ) : (
        <FlatList
          data={filteredSkills}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SkillCard skill={item} onSwapPress={sendSwapRequest} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    paddingTop: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.md,
  },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    color: Colors.charcoal,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.charcoal,
  },
  categories: {
    paddingVertical: Theme.spacing.md,
  },
  listContent: {
    paddingBottom: Theme.spacing.xxl,
  },
});
