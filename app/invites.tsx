import { useCallback, useState } from 'react';
import BackButton from '@/app/components/BackButton';

import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
} from 'expo-router';

import { supabase } from '@/lib/supabase';

type Invite = {
  invite_id: string;
  class_id: string;
  class_name: string;
  invited_by_name: string;
  expires_at: string;
};

export default function InvitesScreen() {
  const [invites, setInvites] =
    useState<Invite[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [acceptingId, setAcceptingId] =
    useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    setLoading(true);

    const { data, error } =
      await supabase.rpc(
        'get_my_pending_invites'
      );

    if (error) {
      console.error(
        'Kunne ikke hente invitationer:',
        error
      );

      Alert.alert(
        'Fejl',
        'Kunne ikke hente dine invitationer.'
      );
    } else {
      setInvites((data ?? []) as Invite[]);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [loadInvites])
  );

  async function acceptInvite(invite: Invite) {
    try {
      setAcceptingId(invite.invite_id);

      const { data: classId, error } =
        await supabase.rpc(
          'accept_class_invite',
          {
            target_invite_id:
              invite.invite_id,
          }
        );

      if (error) {
        Alert.alert(
          'Kunne ikke acceptere invitationen',
          error.message
        );

        return;
      }

      router.replace({
        pathname: '/classes/[id]',
        params: {
          id: classId,
        },
      });
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
        <BackButton/>
        
      <Text style={styles.eyebrow}>
        Samarbejde
      </Text>

      <Text style={styles.title}>
        Invitationer
      </Text>

      <Text style={styles.subtitle}>
        Klasser du er blevet inviteret til.
      </Text>

      {loading ? (
        <Text style={styles.muted}>
          Henter invitationer...
        </Text>
      ) : invites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            Ingen invitationer
          </Text>

          <Text style={styles.muted}>
            Du har ingen aktive invitationer.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {invites.map((invite) => (
            <View
              key={invite.invite_id}
              style={styles.card}
            >
              <Text style={styles.className}>
                {invite.class_name}
              </Text>

              <Text style={styles.invitedBy}>
                Inviteret af{' '}
                {invite.invited_by_name}
              </Text>

              <Text style={styles.expiry}>
                Udløber{' '}
                {formatDate(invite.expires_at)}
              </Text>

              <Pressable
                onPress={() =>
                  acceptInvite(invite)
                }
                disabled={
                  acceptingId ===
                  invite.invite_id
                }
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                  acceptingId ===
                    invite.invite_id &&
                    styles.disabled,
                ]}
              >
                <Text style={styles.buttonText}>
                  {acceptingId ===
                  invite.invite_id
                    ? 'Accepterer...'
                    : 'Acceptér invitation'}
                </Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    'da-DK',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    padding: 20,
    paddingTop: 70,
    paddingBottom: 50,
  },

  eyebrow: {
    fontSize: 14,
    color: '#6B7280',
  },

  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },

  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 28,
  },

  list: {
    gap: 14,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  className: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },

  invitedBy: {
    fontSize: 15,
    color: '#374151',
    marginTop: 8,
  },

  expiry: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },

  button: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },

  muted: {
    color: '#6B7280',
  },

  pressed: {
    opacity: 0.7,
  },

  disabled: {
    opacity: 0.5,
  },
});