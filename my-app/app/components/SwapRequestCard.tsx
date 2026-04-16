import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';
import { SwapRequest, SwapStatus } from '../types';
import Avatar from './Avatar';

interface SwapRequestCardProps {
  request: SwapRequest;
  mode: 'incoming' | 'outgoing';
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onComplete?: (id: string) => void;
}

const STATUS_CONFIG: Record<SwapStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: '⏳ Pending',   color: '#B8860B', bg: '#FFF8DC' },
  accepted:  { label: '✅ Accepted',  color: '#2E7D32', bg: '#E8F5E9' },
  rejected:  { label: '❌ Rejected',  color: '#C62828', bg: '#FFEBEE' },
  completed: { label: '🎉 Completed', color: '#1565C0', bg: '#E3F2FD' },
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
      {/* User row */}
      <View style={styles.row}>
        <Avatar initials={otherInitials} size={40} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.name}>{otherName}</Text>
          <Text style={styles.direction}>
            {isIncoming ? 'wants to swap with you' : 'you sent a request'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      {/* Swap details */}
      <View style={styles.swapDetails}>
        <View style={styles.skillBox}>
          <Text style={styles.skillLabel}>They offer</Text>
          <Text style={styles.skillTitle}>{request.offeredSkillTitle}</Text>
        </View>
        <View style={styles.arrowBox}>
          <Text style={styles.arrow}>⇄</Text>
        </View>
        <View style={styles.skillBox}>
          <Text style={styles.skillLabel}>For your</Text>
          <Text style={styles.skillTitle}>{request.requestedSkillTitle}</Text>
        </View>
      </View>

      {/* Actions */}
      {isIncoming && request.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject?.(request.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.rejectText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => onAccept?.(request.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.acceptText}>Accept Swap</Text>
          </TouchableOpacity>
        </View>
      )}

      {request.status === 'accepted' && (
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={() => onComplete?.(request.id)}
          activeOpacity={0.75}
        >
          <Text style={styles.completeBtnText}>🎉 Mark as Completed</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.sand,
    borderRadius: Theme.borderRadius.lg,
    padding: 16,
    marginBottom: 14,
    ...Theme.shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  name: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
    color: Colors.charcoal,
  },
  direction: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
  },
  statusText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
  },
  swapDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  skillBox: {
    flex: 1,
    alignItems: 'center',
  },
  skillLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: Colors.muted,
    marginBottom: 4,
  },
  skillTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: Colors.charcoal,
    textAlign: 'center',
  },
  arrowBox: {
    width: 32,
    alignItems: 'center',
  },
  arrow: {
    fontSize: 22,
    color: Colors.terracotta,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.sandDark,
    alignItems: 'center',
  },
  rejectText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    color: Colors.muted,
  },
  acceptBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.sage,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
  completeBtn: {
    paddingVertical: 11,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    ...Theme.shadow.btn,
  },
  completeBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
});