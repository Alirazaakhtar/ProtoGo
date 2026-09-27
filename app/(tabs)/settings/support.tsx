import {
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import {
  FunctionsHttpError,
} from '@supabase/supabase-js';

import BackButton from '@/app/components/BackButton';
import { supabase } from '@/lib/supabase';

const SUPPORT_EMAIL =
  'protogo.support@proton.me';

const COLORS = {
  navy: '#1E3A5F',
  navyDark: '#16324F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  soft: '#F5F6F8',
  white: '#FFFFFF',

  border: '#E5E7EB',
};

export default function SupportScreen() {
  const [
    subject,
    setSubject,
  ] = useState('');

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    sent,
    setSent,
  ] = useState(false);

  async function handleSendMessage() {
    const cleanSubject =
      subject.trim();

    const cleanMessage =
      message.trim();

    if (!cleanSubject) {
      Alert.alert(
        'Emne mangler',
        'Skriv kort hvad din henvendelse handler om.'
      );

      return;
    }

    if (!cleanMessage) {
      Alert.alert(
        'Besked mangler',
        'Skriv en besked til ProtoGo Support.'
      );

      return;
    }

    if (
      cleanSubject.length > 120
    ) {
      Alert.alert(
        'Emnet er for langt',
        'Emnet må højst være 120 tegn.'
      );

      return;
    }

    if (
      cleanMessage.length > 5000
    ) {
      Alert.alert(
        'Beskeden er for lang',
        'Beskeden må højst være 5000 tegn.'
      );

      return;
    }

    try {
      setSending(true);

      const {
        data,
        error,
      } =
        await supabase.functions.invoke(
          'send-support-message',
          {
            body: {
              subject:
                cleanSubject,

              message:
                cleanMessage,
            },
          }
        );

      /*
       * EDGE FUNCTION RETURNEREDE EN FEJL
       */

      if (error) {
        if (
          error instanceof
          FunctionsHttpError
        ) {
          let responseBody:
            unknown = null;

          let errorMessage =
            'Din besked kunne ikke sendes. Prøv igen senere.';

          try {
            responseBody =
              await error.context.json();

            if (
              responseBody &&
              typeof responseBody ===
                'object'
            ) {
              const body =
                responseBody as {
                  error?: unknown;
                  message?: unknown;
                };

              if (
                typeof body.error ===
                'string'
              ) {
                errorMessage =
                  body.error;
              } else if (
                typeof body.message ===
                'string'
              ) {
                errorMessage =
                  body.message;
              }
            }
          } catch (
            responseError
          ) {
            console.error(
              'Kunne ikke læse Edge Function response:',
              responseError
            );
          }

          console.error(
            'Edge Function HTTP-fejl:',
            {
              status:
                error.context.status,

              statusText:
                error.context
                  .statusText,

              body:
                responseBody,
            }
          );

          Alert.alert(
            'Kunne ikke sende',
            errorMessage
          );

          return;
        }

        console.error(
          'Supabase Function fejl:',
          error
        );

        Alert.alert(
          'Kunne ikke sende',
          'Der opstod en fejl ved forbindelsen til supporttjenesten. Prøv igen senere.'
        );

        return;
      }

      /*
       * FUNCTIONEN SVAREDE MED EN ERROR I DATA
       */

      if (
        data?.error
      ) {
        console.error(
          'Edge Function returnerede fejl:',
          data
        );

        Alert.alert(
          'Kunne ikke sende',
          typeof data.error ===
            'string'
            ? data.error
            : 'Din besked kunne ikke sendes. Prøv igen senere.'
        );

        return;
      }

      /*
       * SUCCESS
       */

      setSubject('');
      setMessage('');
      setSent(true);
    } catch (error) {
      console.error(
        'Uventet fejl ved supportbesked:',
        error
      );

      Alert.alert(
        'Kunne ikke sende',
        'Der opstod en uventet fejl under afsendelsen. Prøv igen senere.'
      );
    } finally {
      setSending(false);
    }
  }

  async function handleOpenEmail() {
    try {
      const mailSubject =
        'ProtoGo support';

      const url =
        `mailto:${SUPPORT_EMAIL}` +
        `?subject=${encodeURIComponent(
          mailSubject
        )}`;

      const canOpen =
        await Linking.canOpenURL(
          url
        );

      if (!canOpen) {
        Alert.alert(
          'Kunne ikke åbne mail',
          `Du kan kontakte os på ${SUPPORT_EMAIL}.`
        );

        return;
      }

      await Linking.openURL(
        url
      );
    } catch (error) {
      console.error(
        'Kunne ikke åbne mail:',
        error
      );

      Alert.alert(
        'Kunne ikke åbne mail',
        `Du kan kontakte os på ${SUPPORT_EMAIL}.`
      );
    }
  }

  async function handleCopyEmail() {
    try {
      await Clipboard.setStringAsync(
        SUPPORT_EMAIL
      );

      Alert.alert(
        'Mail kopieret',
        SUPPORT_EMAIL
      );
    } catch (error) {
      console.error(
        'Kunne ikke kopiere mail:',
        error
      );

      Alert.alert(
        'Kunne ikke kopiere',
        'Mailadressen kunne ikke kopieres.'
      );
    }
  }

  function handleNewMessage() {
    setSubject('');
    setMessage('');
    setSent(false);
  }

  return (
    <KeyboardAvoidingView
      style={
        styles.container
      }
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <BackButton />

        {sent ? (
          <>
            {/* SUCCESS */}

            <View
              style={
                styles.successContainer
              }
            >
              <View
                style={
                  styles.successIcon
                }
              >
                <Ionicons
                  name="checkmark"
                  size={38}
                  color={
                    COLORS.navy
                  }
                />
              </View>

              <Text
                style={
                  styles.successTitle
                }
              >
                Tak for din henvendelse
              </Text>

              <Text
                style={
                  styles.successDescription
                }
              >
                Din besked er sendt til
                ProtoGo Support.
              </Text>

              <Text
                style={
                  styles.successDescription
                }
              >
                Vi vender tilbage hurtigst
                muligt på den e-mailadresse,
                der er tilknyttet din
                ProtoGo-konto.
              </Text>

              <View
                style={
                  styles.successDivider
                }
              />

              <View
                style={
                  styles.successInfo
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={
                    COLORS.navy
                  }
                />

                <Text
                  style={
                    styles.successInfoText
                  }
                >
                  Din henvendelse er
                  modtaget og sendt til
                  vores support.
                </Text>
              </View>

              <Pressable
                onPress={
                  handleNewMessage
                }
                style={({
                  pressed,
                }) => [
                  styles.newMessageButton,

                  pressed &&
                    styles.newMessageButtonPressed,
                ]}
              >
                <View
                  style={
                    styles.buttonContent
                  }
                >
                  <Ionicons
                    name="create-outline"
                    size={19}
                    color={
                      COLORS.white
                    }
                  />

                  <Text
                    style={
                      styles.newMessageButtonText
                    }
                  >
                    Send en ny besked
                  </Text>
                </View>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* HEADER */}

            <Text
              style={
                styles.title
              }
            >
              Kontakt & support
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Har du fundet en fejl eller
              brug for hjælp til ProtoGo?
              Send os en besked direkte
              herfra.
            </Text>

            {/* SUPPORT FORM */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Send en besked
            </Text>

            <View
              style={
                styles.formCard
              }
            >
              <View
                style={
                  styles.formHeader
                }
              >
                <View
                  style={
                    styles.formIcon
                  }
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color={
                      COLORS.navy
                    }
                  />
                </View>

                <View
                  style={
                    styles.formHeaderText
                  }
                >
                  <Text
                    style={
                      styles.formTitle
                    }
                  >
                    ProtoGo Support
                  </Text>

                  <Text
                    style={
                      styles.formDescription
                    }
                  >
                    Beskriv dit spørgsmål
                    eller problem.
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.cardDivider
                }
              />

              {/* SUBJECT */}

              <Text
                style={
                  styles.inputLabel
                }
              >
                Emne
              </Text>

              <TextInput
                value={
                  subject
                }
                onChangeText={
                  setSubject
                }
                placeholder="Fx problem med protokol"
                placeholderTextColor={
                  COLORS.lightMuted
                }
                maxLength={120}
                editable={
                  !sending
                }
                returnKeyType="next"
                style={
                  styles.input
                }
              />

              <Text
                style={
                  styles.characterCount
                }
              >
                {subject.length}/120
              </Text>

              {/* MESSAGE */}

              <Text
                style={[
                  styles.inputLabel,
                  styles.messageLabel,
                ]}
              >
                Besked
              </Text>

              <TextInput
                value={
                  message
                }
                onChangeText={
                  setMessage
                }
                placeholder={
                  'Beskriv hvad du oplever, og hvad du forventede skulle ske.'
                }
                placeholderTextColor={
                  COLORS.lightMuted
                }
                maxLength={5000}
                multiline
                textAlignVertical="top"
                editable={
                  !sending
                }
                style={[
                  styles.input,
                  styles.messageInput,
                ]}
              />

              <Text
                style={
                  styles.characterCount
                }
              >
                {message.length}/5000
              </Text>

              {/* SEND */}

              <Pressable
                onPress={
                  handleSendMessage
                }
                disabled={
                  sending
                }
                style={({
                  pressed,
                }) => [
                  styles.sendButton,

                  pressed &&
                    !sending &&
                    styles.sendButtonPressed,

                  sending &&
                    styles.buttonDisabled,
                ]}
              >
                {sending ? (
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
                      name="send-outline"
                      size={19}
                      color={
                        COLORS.white
                      }
                    />

                    <Text
                      style={
                        styles.sendButtonText
                      }
                    >
                      Send besked
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* INFO */}

            <View
              style={
                styles.infoBox
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={
                  COLORS.navy
                }
              />

              <Text
                style={
                  styles.infoText
                }
              >
                Ved fejl hjælper det, hvis
                du beskriver hvad du gjorde,
                hvad der skete, og hvad du
                forventede skulle ske.
              </Text>
            </View>

            {/* DIVIDER */}

            <View
              style={
                styles.sectionDivider
              }
            />

            {/* CONTACT */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Andre kontaktmuligheder
            </Text>

            <View
              style={
                styles.contactCard
              }
            >
              <View
                style={
                  styles.contactTop
                }
              >
                <View
                  style={
                    styles.contactIcon
                  }
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={
                      COLORS.navy
                    }
                  />
                </View>

                <View
                  style={
                    styles.contactText
                  }
                >
                  <Text
                    style={
                      styles.contactLabel
                    }
                  >
                    Supportmail
                  </Text>

                  <Text
                    selectable
                    style={
                      styles.contactValue
                    }
                  >
                    {SUPPORT_EMAIL}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.cardDivider
                }
              />

              <View
                style={
                  styles.actions
                }
              >
                <Pressable
                  onPress={
                    handleOpenEmail
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.secondaryButton,

                    pressed &&
                      styles.secondaryButtonPressed,
                  ]}
                >
                  <View
                    style={
                      styles.buttonContent
                    }
                  >
                    <Ionicons
                      name="mail-outline"
                      size={19}
                      color={
                        COLORS.navy
                      }
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Åbn mail-app
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={
                    handleCopyEmail
                  }
                  style={({
                    pressed,
                  }) => [
                    styles.secondaryButton,

                    pressed &&
                      styles.secondaryButtonPressed,
                  ]}
                >
                  <View
                    style={
                      styles.buttonContent
                    }
                  >
                    <Ionicons
                      name="copy-outline"
                      size={19}
                      color={
                        COLORS.navy
                      }
                    />

                    <Text
                      style={
                        styles.secondaryButtonText
                      }
                    >
                      Kopiér mail
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* FOOTER */}

        <Text
          style={
            styles.footer
          }
        >
          © 2026 ProtoGo
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
      flexGrow: 1,

      paddingHorizontal: 20,

      paddingTop: 70,

      paddingBottom: 50,
    },

    /* LOGO */

    logoContainer: {
      alignItems: 'center',

      marginTop: 4,

      marginBottom: 10,
    },

    logo: {
      width: 145,

      height: 90,
    },

    /* HEADER */

    title: {
      fontSize: 34,

      fontWeight: '700',

      color:
        COLORS.text,

      marginTop: 4,
    },

    subtitle: {
      fontSize: 15,

      lineHeight: 21,

      color:
        COLORS.muted,

      marginTop: 7,

      marginBottom: 26,
    },

    /* SECTION */

    sectionTitle: {
      fontSize: 18,

      fontWeight: '700',

      color:
        COLORS.text,

      marginBottom: 12,
    },

    sectionDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 28,

      marginBottom: 24,
    },

    /* FORM */

    formCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 18,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,

      shadowRadius: 14,

      elevation: 1,
    },

    formHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    formIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 13,
    },

    formHeaderText: {
      flex: 1,
    },

    formTitle: {
      fontSize: 16,

      fontWeight: '700',

      color:
        COLORS.text,
    },

    formDescription: {
      fontSize: 13,

      lineHeight: 18,

      color:
        COLORS.muted,

      marginTop: 3,
    },

    cardDivider: {
      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 18,

      marginBottom: 18,
    },

    inputLabel: {
      fontSize: 13,

      fontWeight: '600',

      color:
        COLORS.text,

      marginBottom: 8,
    },

    messageLabel: {
      marginTop: 14,
    },

    input: {
      minHeight: 52,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius: 14,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 15,

      fontSize: 15,

      color:
        COLORS.text,
    },

    messageInput: {
      minHeight: 150,

      paddingTop: 14,

      paddingBottom: 14,

      lineHeight: 21,
    },

    characterCount: {
      fontSize: 11,

      color:
        COLORS.lightMuted,

      textAlign: 'right',

      marginTop: 5,
    },

    /* SEND */

    sendButton: {
      height: 54,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginTop: 20,

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.12,

      shadowRadius: 10,

      elevation: 2,
    },

    sendButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    sendButtonText: {
      fontSize: 15,

      fontWeight: '700',

      color:
        COLORS.white,
    },

    buttonDisabled: {
      opacity: 0.55,
    },

    buttonContent: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 8,
    },

    /* INFO */

    infoBox: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      backgroundColor:
        COLORS.navySoft,

      borderRadius: 16,

      padding: 16,

      marginTop: 18,
    },

    infoText: {
      flex: 1,

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.muted,

      marginLeft: 10,
    },

    /* CONTACT */

    contactCard: {
      backgroundColor:
        COLORS.white,

      borderRadius: 20,

      padding: 18,

      shadowColor:
        '#000000',

      shadowOffset: {
        width: 0,
        height: 4,
      },

      shadowOpacity: 0.04,

      shadowRadius: 14,

      elevation: 1,
    },

    contactTop: {
      flexDirection:
        'row',

      alignItems:
        'center',
    },

    contactIcon: {
      width: 46,

      height: 46,

      borderRadius: 14,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginRight: 13,
    },

    contactText: {
      flex: 1,
    },

    contactLabel: {
      fontSize: 13,

      color:
        COLORS.muted,
    },

    contactValue: {
      fontSize: 15,

      fontWeight: '600',

      color:
        COLORS.text,

      marginTop: 3,
    },

    actions: {
      gap: 10,
    },

    secondaryButton: {
      height: 52,

      borderRadius: 15,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    secondaryButtonPressed: {
      opacity: 0.7,
    },

    secondaryButtonText: {
      fontSize: 15,

      fontWeight: '700',

      color:
        COLORS.navy,
    },

    /* SUCCESS */

    successContainer: {
      alignItems: 'center',

      paddingTop: 30,

      paddingHorizontal: 18,
    },

    successIcon: {
      width: 82,

      height: 82,

      borderRadius: 41,

      backgroundColor:
        COLORS.navySoft,

      alignItems: 'center',

      justifyContent: 'center',

      marginBottom: 24,
    },

    successTitle: {
      fontSize: 28,

      fontWeight: '700',

      color:
        COLORS.text,

      textAlign: 'center',
    },

    successDescription: {
      fontSize: 15,

      lineHeight: 22,

      color:
        COLORS.muted,

      textAlign: 'center',

      marginTop: 10,

      maxWidth: 330,
    },

    successDivider: {
      width: '100%',

      height: 1,

      backgroundColor:
        '#EEF0F3',

      marginTop: 30,

      marginBottom: 20,
    },

    successInfo: {
      width: '100%',

      flexDirection: 'row',

      alignItems: 'center',

      backgroundColor:
        COLORS.navySoft,

      borderRadius: 16,

      padding: 16,
    },

    successInfoText: {
      flex: 1,

      fontSize: 13,

      lineHeight: 19,

      color:
        COLORS.muted,

      marginLeft: 10,
    },

    newMessageButton: {
      width: '100%',

      height: 54,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems: 'center',

      justifyContent: 'center',

      marginTop: 20,

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,
        height: 5,
      },

      shadowOpacity: 0.12,

      shadowRadius: 10,

      elevation: 2,
    },

    newMessageButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    newMessageButtonText: {
      fontSize: 15,

      fontWeight: '700',

      color:
        COLORS.white,
    },

    /* FOOTER */

    footer: {
      fontSize: 12,

      color:
        COLORS.lightMuted,

      textAlign: 'center',

      marginTop: 30,
    },
  });