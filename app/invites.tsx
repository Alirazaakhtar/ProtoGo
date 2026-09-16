import { useCallback, useState } from 'react';
import BackButton from '@/app/components/BackButton';
import { Ionicons } from '@expo/vector-icons';

import {
  ActivityIndicator,
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

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

type Invite = {
  invite_id: string;
  class_id: string;
  class_name: string;
  invited_by_name: string;
  expires_at: string;
};

let invitesCache: Invite[] | null = null;

export default function InvitesScreen() {
  const [invites, setInvites] =
    useState<Invite[]>(
      invitesCache ?? []
    );

  const [loading, setLoading] =
    useState(invitesCache === null);

  const [acceptingId, setAcceptingId] =
    useState<string | null>(null);

  const loadInvites =
    useCallback(async () => {
      const { data, error } =
        await supabase.rpc(
          'get_my_pending_invites'
        );

      if (error) {
        console.error(
          'Kunne ikke hente invitationer:',
          error
        );

        if (invitesCache === null) {
          Alert.alert(
            'Fejl',
            'Kunne ikke hente dine invitationer.'
          );
        }

        setLoading(false);
        return;
      }

      const freshInvites =
        (data ?? []) as Invite[];

      invitesCache =
        freshInvites;

      setInvites(
        freshInvites
      );

      setLoading(false);
    }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvites();
    }, [loadInvites])
  );

  async function acceptInvite(
    invite: Invite
  ) {
    try {
      setAcceptingId(
        invite.invite_id
      );

      const {
        data: classId,
        error,
      } = await supabase.rpc(
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

      const newInvites =
        invites.filter(
          (item) =>
            item.invite_id !==
            invite.invite_id
        );

      invitesCache =
        newInvites;

      setInvites(
        newInvites
      );

      router.replace({
        pathname:
          '/classes/[id]',
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
      contentContainerStyle={
        styles.content
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <BackButton />

      <Text style={styles.title}>
        Invitationer
      </Text>

      <Text style={styles.subtitle}>
        Klasser du er blevet inviteret til.
      </Text>

      {loading &&
      invites.length === 0 ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="small"
            color={COLORS.navy}
          />
        </View>
      ) : invites.length === 0 ? (
        <View
          style={
            styles.emptyState
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="mail-open-outline"
              size={26}
              color={COLORS.navy}
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            Ingen invitationer
          </Text>

          <Text
            style={styles.muted}
          >
            Du har ingen aktive invitationer.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {invites.map(
            (invite) => (
              <View
                key={
                  invite.invite_id
                }
                style={
                  styles.card
                }
              >
                <Text
                  style={
                    styles.className
                  }
                >
                  {invite.class_name}
                </Text>

                <View
                  style={
                    styles.metaSection
                  }
                >
                  <View
                    style={
                      styles.metaRow
                    }
                  >
                    <View
                      style={
                        styles.metaIcon
                      }
                    >
                      <Ionicons
                        name="person-outline"
                        size={16}
                        color={
                          COLORS.navy
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.metaContent
                      }
                    >
                      <Text
                        style={
                          styles.metaLabel
                        }
                      >
                        Inviteret af
                      </Text>

                      <Text
                        style={
                          styles.metaValue
                        }
                      >
                        {
                          invite.invited_by_name
                        }
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.metaRow
                    }
                  >
                    <View
                      style={
                        styles.metaIcon
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={16}
                        color={
                          COLORS.navy
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.metaContent
                      }
                    >
                      <Text
                        style={
                          styles.metaLabel
                        }
                      >
                        Udløber
                      </Text>

                      <Text
                        style={
                          styles.metaValue
                        }
                      >
                        {formatDate(
                          invite.expires_at
                        )}
                      </Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() =>
                    acceptInvite(
                      invite
                    )
                  }
                  disabled={
                    acceptingId ===
                    invite.invite_id
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.button,

                    pressed &&
                      styles.buttonPressed,

                    acceptingId ===
                      invite.invite_id &&
                      styles.disabled,
                  ]}
                >
                  {acceptingId ===
                  invite.invite_id ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        COLORS.white
                      }
                    />
                  ) : (
                    <View
                      style={
                        styles.buttonContent
                      }
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color={
                          COLORS.white
                        }
                      />

                      <Text
                        style={
                          styles.buttonText
                        }
                      >
                        Acceptér invitation
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            )
          )}
        </View>
      )}
    </ScrollView>
  );
}

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    'da-DK',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        COLORS.white,
    },

    content: {
      padding: 20,
      paddingTop: 70,
      paddingBottom: 50,
    },

    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    title: {
      fontSize: 34,
      fontWeight: '700',
      color: COLORS.text,
      marginTop: 4,
    },

    subtitle: {
      color: COLORS.muted,
      fontSize: 15,
      marginTop: 8,
      marginBottom: 28,
    },

    list: {
      gap: 16,
      paddingHorizontal: 2,
      paddingVertical: 4,
    },

    card: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      padding: 20,

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    className: {
      fontSize: 22,
      fontWeight: '700',
      color: COLORS.text,
    },

    metaSection: {
      gap: 12,
      marginTop: 18,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    metaIcon: {
      width: 36,
      height: 36,
      borderRadius: 11,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginRight: 10,
    },

    metaContent: {
      flex: 1,
    },

    metaLabel: {
      fontSize: 12,
      color:
        COLORS.lightMuted,
    },

    metaValue: {
      fontSize: 14,
      fontWeight: '600',
      color: COLORS.text,
      marginTop: 2,
    },

    button: {
      height: 52,
      borderRadius: 14,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',
      justifyContent:
        'center',

      marginTop: 20,

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.12,
      shadowRadius: 10,

      elevation: 2,
    },

    buttonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 8,
    },

    buttonText: {
      color: COLORS.white,
      fontSize: 15,
      fontWeight: '700',
    },

    emptyState: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,
      padding: 28,

      alignItems: 'center',

      shadowColor: '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,
      shadowRadius: 14,

      elevation: 1,
    },

    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: 16,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',
      justifyContent:
        'center',

      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: 6,
    },

    muted: {
      color: COLORS.muted,
      textAlign: 'center',
    },

    disabled: {
      opacity: 0.5,
    },
  });