import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';
import { SwapRequest, SwapStatus } from '../../src/types';
import { rateUser } from '../../src/firebase/firestore';
import Avatar from './Avatar';

interface SwapRequestCardProps {
  request: SwapRequest;
  mode: 'incoming' | 'outgoing';
  currentUserId?: string;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
}

// ─── Rating Modal ─────────────────────────────────────────────────────────────

interface RatingModalProps {
  visible: boolean;
  otherName: string;
  onSubmit: (stars: number) => Promise<void>;
  onSkip: () => void;
  colors: any;
}

function RatingModal({ visible, otherName, onSubmit, onSkip, colors }: RatingModalProps) {
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const display = hovered || selected;

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onSubmit(selected);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={ratingStyles.overlay}>
        <View style={[ratingStyles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={ratingStyles.iconWrap}>
            <Text style={ratingStyles.iconEmoji}>🎉</Text>
          </View>
          <Text style={[ratingStyles.title, { color: colors.ink }]}>Swap Complete!</Text>
          <Text style={[ratingStyles.subtitle, { color: colors.muted }]}>
            How was your experience with{'\n'}
            <Text style={{ color: colors.ink, fontFamily: 'Nunito_700Bold' }}>{otherName}</Text>?
          </Text>

          {/* Stars */}
          <View style={ratingStyles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setSelected(star)}
                onPressIn={() => setHovered(star)}
                onPressOut={() => setHovered(0)}
                activeOpacity={0.7}
                style={ratingStyles.starBtn}
              >
                <Ionicons
                  name={display >= star ? 'star' : 'star-outline'}
                  size={36}
                  color={display >= star ? '#F5C842' : colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Label */}
          <Text style={[ratingStyles.ratingLabel, { color: display ? colors.ink : 'transparent' }]}>
            {labels[display] || ' '}
          </Text>

          {/* Actions */}
          <TouchableOpacity
            style={[
              ratingStyles.submitBtn,
              { backgroundColor: colors.ink },
              (!selected || submitting) && ratingStyles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selected || submitting}
            activeOpacity={0.85}
          >
            <Text style={[ratingStyles.submitBtnText, { color: colors.background }]}>
              {submitting ? 'Submitting…' : 'Submit rating'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} style={ratingStyles.skipBtn} activeOpacity={0.6}>
            <Text style={[ratingStyles.skipText, { color: colors.muted }]}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export default function SwapRequestCard({
  request,
  mode,
  currentUserId,
  onAccept,
  onReject,
  onComplete,
}: SwapRequestCardProps) {
  const { colors } = useTheme();
  const [ratingVisible, setRatingVisible] = useState(false);
  const status = STATUS_CONFIG[request.status];
  const isIncoming = mode === 'incoming';
  const otherUserId = isIncoming ? request.fromUserId : request.toUserId;
  const otherInitials = isIncoming ? request.fromUserInitials : request.toUserInitials;
  const otherName = isIncoming ? request.fromUserName : request.toUserName;

  // Check if the current user has already rated this specific swap.
  // The field written is ratedBy_<raterUserId> — only true when THIS user submitted a rating.
  const ratedByKey = currentUserId ? `ratedBy_${currentUserId}` : null;
  const hasRated = ratedByKey ? (request as Record<string, any>)[ratedByKey] === true : false;

  const handleComplete = () => {
    onComplete?.(request.id);
    setRatingVisible(true);
  };

  const handleRatingSubmit = async (stars: number) => {
    if (!currentUserId) return;
    try {
      await rateUser(currentUserId, otherUserId, request.id, stars);
      setRatingVisible(false);
      Alert.alert('Thanks for rating!', `Your rating for ${otherName} has been saved.`);
    } catch {
      Alert.alert('Error', 'Could not save rating. Please try again.');
    }
  };

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Avatar initials={otherInitials} size={40} />
          <TouchableOpacity
            style={styles.nameGroup}
            onPress={() => router.push({ pathname: '/user-profile', params: { userId: otherUserId } })}
            activeOpacity={0.7}
          >
            <Text style={[styles.name, { color: colors.ink }]}>{otherName}</Text>
            <Text style={[styles.nameHint, { color: colors.accent }]}>View profile →</Text>
          </TouchableOpacity>
          <View style={styles.statusGroup}>
            <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
            <Text style={[styles.statusLabel, { color: colors.muted }]}>{status.label}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SKILL EXCHANGE</Text>

        <View style={styles.exchangeRow}>
          <View style={[styles.skillPill, { backgroundColor: colors.softSurface, borderColor: colors.border }]}>
            <Text style={[styles.skillText, { color: colors.body }]} numberOfLines={1}>
              {request.offeredSkillTitle}
            </Text>
          </View>
          <Text style={[styles.exchangeSymbol, { color: colors.muted }]}>↔</Text>
          <View style={[styles.skillPill, { backgroundColor: colors.softSurface, borderColor: colors.border }]}>
            <Text style={[styles.skillText, { color: colors.body }]} numberOfLines={1}>
              {request.requestedSkillTitle}
            </Text>
          </View>
        </View>

        {isIncoming && request.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onReject?.(request.id)} activeOpacity={0.6}>
              <Text style={[styles.declineLink, { color: colors.muted }]}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onAccept?.(request.id)}
              activeOpacity={0.85}
              style={[styles.acceptBtn, { backgroundColor: colors.ink }]}
            >
              <Text style={[styles.acceptBtnText, { color: colors.white }]}>Accept →</Text>
            </TouchableOpacity>
          </View>
        )}

        {request.status === 'accepted' && (
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.85}
            style={[styles.completeBtn, { backgroundColor: colors.ink }]}
          >
            <Text style={[styles.completeBtnText, { color: colors.white }]}>Mark as completed →</Text>
          </TouchableOpacity>
        )}

        {request.status === 'completed' && !hasRated && (
          <TouchableOpacity
            onPress={() => setRatingVisible(true)}
            activeOpacity={0.85}
            style={[styles.rateBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="star-outline" size={14} color={colors.muted} />
            <Text style={[styles.rateBtnText, { color: colors.muted }]}>Rate {otherName.split(' ')[0]}</Text>
          </TouchableOpacity>
        )}

        {request.status === 'completed' && hasRated && (
          <View style={styles.ratedRow}>
            <Ionicons name="star" size={13} color="#F5C842" />
            <Text style={[styles.ratedText, { color: colors.muted }]}>You rated this swap</Text>
          </View>
        )}
      </View>

      <RatingModal
        visible={ratingVisible}
        otherName={otherName}
        onSubmit={handleRatingSubmit}
        onSkip={() => setRatingVisible(false)}
        colors={colors}
      />
    </>
  );
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SwapStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Pending',   color: '#8E9ACA', dot: '#8E9ACA' },
  accepted:  { label: 'Accepted',  color: '#7FD1B8', dot: '#7FD1B8' },
  rejected:  { label: 'Declined',  color: '#F38E99', dot: '#F38E99' },
  completed: { label: 'Completed', color: '#9AA8C4', dot: '#9AA8C4' },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  nameGroup: { flex: 1 },
  name: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 17,
  },
  nameHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    marginTop: 1,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
  },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  exchangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  skillPill: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  skillText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
  },
  exchangeSymbol: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 14,
  },
  declineLink: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
  },
  acceptBtn: {
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  acceptBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
  },
  completeBtn: {
    alignSelf: 'flex-end',
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  completeBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
  },
  rateBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rateBtnText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: Theme.fontSize.small,
  },
  ratedRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratedText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    fontStyle: 'italic',
  },
});

const ratingStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  sheet: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 28,
    alignItems: 'center',
    gap: 0,
  },
  iconWrap: {
    marginBottom: 12,
  },
  iconEmoji: {
    fontSize: 44,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 26,
    letterSpacing: -0.4,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    letterSpacing: 0.4,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  submitBtn: {
    width: '100%',
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitBtnDisabled: {
    opacity: 0.35,
  },
  submitBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  skipBtn: {
    paddingVertical: 6,
  },
  skipText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
  },
});
