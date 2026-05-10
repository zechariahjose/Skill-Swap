import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';
import { SwapRequest, SwapStatus } from '../../src/types';
import Avatar from './Avatar';

interface SwapRequestCardProps {
  request: SwapRequest;
  mode: 'incoming' | 'outgoing';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
}

export default function SwapRequestCard({
  request, mode, onAccept, onReject, onComplete,
}: SwapRequestCardProps) {
  const { colors } = useTheme();
  const status = STATUS_CONFIG[request.status];
  const isIncoming = mode === 'incoming';
  const otherInitials = isIncoming ? request.fromUserInitials : request.toUserInitials;
  const otherName = isIncoming ? request.fromUserName : request.toUserName;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.headerRow}>
        <Avatar initials={otherInitials} size={40} />
        <View style={styles.nameGroup} pointerEvents="none">
          <Text style={[styles.name, { color: colors.ink }]}>{otherName}</Text>
        </View>
        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
          <Text style={[styles.statusLabel, { color: colors.muted }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.muted }]}>SKILL EXCHANGE</Text>

      <View style={styles.exchangeRow}>
        <View style={[styles.skillPill, { backgroundColor: colors.softSurface, borderColor: colors.border }]}> 
          <Text style={[styles.skillText, { color: colors.body }]} numberOfLines={1}>{request.offeredSkillTitle}</Text>
        </View>
        <Text style={[styles.exchangeSymbol, { color: colors.muted }]}>↔</Text>
        <View style={[styles.skillPill, { backgroundColor: colors.softSurface, borderColor: colors.border }]}> 
          <Text style={[styles.skillText, { color: colors.body }]} numberOfLines={1}>{request.requestedSkillTitle}</Text>
        </View>
      </View>

      {isIncoming && request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onReject?.(request.id)} activeOpacity={0.6}>
            <Text style={[styles.declineLink, { color: colors.muted }]}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAccept?.(request.id)} activeOpacity={0.85} style={[styles.acceptBtn, { backgroundColor: colors.ink }]}> 
            <Text style={[styles.acceptBtnText, { color: colors.white }]}>Accept →</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'accepted' && (
        <TouchableOpacity onPress={() => onComplete?.(request.id)} activeOpacity={0.85} style={[styles.completeBtn, { backgroundColor: colors.ink }]}> 
          <Text style={[styles.completeBtnText, { color: colors.white }]}>Mark as completed →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const STATUS_CONFIG: Record<SwapStatus, { label: string; color: string; dot: string }> = {
  pending: { label: 'Pending', color: '#8E9ACA', dot: '#8E9ACA' },
  accepted: { label: 'Accepted', color: '#7FD1B8', dot: '#7FD1B8' },
  rejected: { label: 'Declined', color: '#F38E99', dot: '#F38E99' },
  completed: { label: 'Completed', color: '#9AA8C4', dot: '#9AA8C4' },
};

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
  nameGroup: {
    flex: 1,
  },
  name: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 17,
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
});
