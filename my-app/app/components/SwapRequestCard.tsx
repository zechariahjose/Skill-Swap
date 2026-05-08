import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/Colors';
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

const STATUS_CONFIG: Record<SwapStatus, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Pending',   color: Colors.statusPending, dot: Colors.statusPending },
  accepted:  { label: 'Accepted',  color: Colors.statusGreen,   dot: Colors.statusGreen },
  rejected:  { label: 'Declined',  color: Colors.statusRed,     dot: Colors.statusRed },
  completed: { label: 'Completed', color: Colors.muted,          dot: Colors.muted },
};

export default function SwapRequestCard({
  request, mode, onAccept, onReject, onComplete,
}: SwapRequestCardProps) {
  const status = STATUS_CONFIG[request.status];
  const isIncoming = mode === 'incoming';
  const otherInitials = isIncoming ? request.fromUserInitials : request.toUserInitials;
  const otherName     = isIncoming ? request.fromUserName     : request.toUserName;

  return (
    <View style={styles.card}>
      {/* Row 1: avatar + name + status */}
      <View style={styles.headerRow}>
        <Avatar initials={otherInitials} size={40} />
        <View style={styles.nameGroup} pointerEvents="none">
          <Text style={styles.name}>{otherName}</Text>
        </View>
        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
          <Text style={styles.statusLabel}>{status.label}</Text>
        </View>
      </View>

      {/* Row 2: section label */}
      <Text style={styles.sectionLabel}>SKILL EXCHANGE</Text>

      {/* Row 3: pills */}
      <View style={styles.exchangeRow}>
        <View style={styles.skillPill}>
          <Text style={styles.skillText} numberOfLines={1}>{request.offeredSkillTitle}</Text>
        </View>
        <Text style={styles.exchangeSymbol}>↔</Text>
        <View style={styles.skillPill}>
          <Text style={styles.skillText} numberOfLines={1}>{request.requestedSkillTitle}</Text>
        </View>
      </View>

      {/* Row 4: actions */}
      {isIncoming && request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onReject?.(request.id)} activeOpacity={0.6}>
            <Text style={styles.declineLink}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onAccept?.(request.id)} activeOpacity={0.85} style={styles.acceptBtn}>
            <Text style={styles.acceptBtnText}>Accept →</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'accepted' && (
        <TouchableOpacity onPress={() => onComplete?.(request.id)} activeOpacity={0.85} style={styles.completeBtn}>
          <Text style={styles.completeBtnText}>Mark as completed →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.ink,
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
    color: Colors.muted,
  },
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: Colors.muted,
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
    backgroundColor: Colors.softSurface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  skillText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.body,
  },
  exchangeSymbol: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.muted,
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
    color: Colors.muted,
  },
  acceptBtn: {
    backgroundColor: Colors.ink,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  acceptBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.white,
  },
  completeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.ink,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  completeBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.white,
  },
});