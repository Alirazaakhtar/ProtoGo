import { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

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

type OnboardingStep = {
  icon:
    keyof typeof Ionicons.glyphMap;

  eyebrow: string;

  title: string;

  description: string;

  details: string[];
};

const STEPS: OnboardingStep[] = [
  {
    icon: 'school-outline',

    eyebrow: 'Kom godt i gang',

    title:
      'Velkommen til ProtoGo',

    description:
      'ProtoGo hjælper dig med at administrere klasser, elever og fremmøde samlet ét sted.',

    details: [
      'Hold styr på dine klasser',
      'Administrer elever',
      'Før dagens protokol',
    ],
  },

  {
    icon: 'add-circle-outline',

    eyebrow: 'Trin 1',

    title:
      'Opret din første klasse',

    description:
      'Start med at oprette en klasse og tilføj de vigtigste oplysninger.',

    details: [
      'Vælg et klassenavn',
      'Tilføj fag',
      'Angiv skoleår',
    ],
  },

  {
    icon: 'people-outline',

    eyebrow: 'Trin 2',

    title:
      'Tilføj elever og lærere',

    description:
      'Saml klassens elever ét sted og inviter andre lærere, hvis I arbejder sammen om klassen.',

    details: [
      'Tilføj og administrer elever',
      'Inviter andre lærere',
      'Administrer forældre og værger',
    ],
  },

  {
    icon: 'clipboard-outline',

    eyebrow: 'Trin 3',

    title:
      'Før dagens protokol',

    description:
      'Registrer hurtigt elevernes fremmøde og få et overskueligt overblik over klassens historik.',

    details: [
      'Registrer fremmøde',
      'Registrer fravær og forsinkelse',
      'Se tidligere protokoller',
    ],
  },

  {
    icon: 'stats-chart-outline',

    eyebrow: 'Trin 4',

    title:
      'Få overblik med statistik',

    description:
      'Brug klassens statistik til hurtigt at få overblik over fremmøde og fravær.',

    details: [
      'Se klassens fremmøde',
      'Se elevens fremmøde',
      'Følg deres udvikling over tid',
    ],
  },
];

export default function OnboardingScreen() {
  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    completing,
    setCompleting,
  ] = useState(false);

  const step =
    STEPS[currentStep];

  const isFirstStep =
    currentStep === 0;

  const isLastStep =
    currentStep ===
    STEPS.length - 1;

  async function completeOnboarding() {
    if (completing) {
      return;
    }

    try {
      setCompleting(true);

      const {
        error,
      } =
        await supabase.auth.updateUser({
          data: {
            onboarding_completed:
              true,
          },
        });

      if (error) {
        console.error(
          'Kunne ikke gemme onboarding-status:',
          error
        );

        return;
      }

      router.replace('/(tabs)');
    } finally {
      setCompleting(false);
    }
  }

  function nextStep() {
    if (isLastStep) {
      void completeOnboarding();

      return;
    }

    setCurrentStep(
      (current) =>
        current + 1
    );
  }

  return (
    <View
      style={
        styles.container
      }
    >
      {/* TOP */}

      <View
        style={
          styles.topBar
        }
      >
        <View />

        <Pressable
          onPress={() => {
            void completeOnboarding();
          }}
          disabled={completing}
          hitSlop={10}
          style={({ pressed }) => [
            styles.skipButton,

            pressed &&
              !completing &&
              styles.pressed,

            completing &&
              styles.disabled,
          ]}
        >
          <Text
            style={
              styles.skipText
            }
          >
            Spring over
          </Text>
        </Pressable>
      </View>

      {/* INDHOLD */}

      <View
        style={
          styles.content
        }
      >
        {isFirstStep ? (
          <View
            style={
              styles.logoContainer
            }
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={
                styles.logo
              }
              resizeMode="contain"
            />
          </View>
        ) : (
          <View
            style={
              styles.iconOuter
            }
          >
            <View
              style={
                styles.iconInner
              }
            >
              <Ionicons
                name={
                  step.icon
                }
                size={42}
                color={
                  COLORS.navy
                }
              />
            </View>
          </View>
        )}

        <Text
          style={
            styles.eyebrow
          }
        >
          {step.eyebrow}
        </Text>

        <Text
          style={
            styles.title
          }
        >
          {step.title}
        </Text>

        <Text
          style={
            styles.description
          }
        >
          {step.description}
        </Text>

        <View
          style={
            styles.details
          }
        >
          {step.details.map(
            (detail) => (
              <View
                key={
                  detail
                }
                style={
                  styles.detailRow
                }
              >
                <View
                  style={
                    styles.checkIcon
                  }
                >
                  <Ionicons
                    name="checkmark"
                    size={15}
                    color={
                      COLORS.navy
                    }
                  />
                </View>

                <Text
                  style={
                    styles.detailText
                  }
                >
                  {detail}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* BUND */}

      <View
        style={
          styles.bottom
        }
      >
        <View
          style={
            styles.dots
          }
        >
          {STEPS.map(
            (
              _,
              index
            ) => (
              <View
                key={
                  index
                }
                style={[
                  styles.dot,

                  index ===
                    currentStep &&
                    styles.activeDot,
                ]}
              />
            )
          )}
        </View>

        <Pressable
          onPress={
            nextStep
          }
          disabled={
            completing
          }
          style={({
            pressed,
          }) => [
            styles.nextButton,

            pressed &&
              !completing &&
              styles.nextButtonPressed,

            completing &&
              styles.disabled,
          ]}
        >
          {completing ? (
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
              <Text
                style={
                  styles.nextButtonText
                }
              >
                {isLastStep
                  ? 'Kom i gang'
                  : 'Næste'}
              </Text>

              <Ionicons
                name={
                  isLastStep
                    ? 'checkmark-circle-outline'
                    : 'arrow-forward-outline'
                }
                size={20}
                color={
                  COLORS.white
                }
              />
            </View>
          )}
        </Pressable>

        {currentStep > 0 && (
          <Pressable
            onPress={() =>
              setCurrentStep(
                (current) =>
                  current - 1
              )
            }
            disabled={
              completing
            }
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,

              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              Tilbage
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor:
        COLORS.white,

      paddingHorizontal: 24,

      paddingTop: 58,

      paddingBottom: 34,
    },

    topBar: {
      flexDirection:
        'row',

      justifyContent:
        'space-between',

      alignItems:
        'center',
    },

    skipButton: {
      paddingVertical: 8,

      paddingHorizontal: 4,
    },

    skipText: {
      fontSize: 14,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    content: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingBottom: 20,
    },

    /* LOGO PÅ FØRSTE SIDE */

    logoContainer: {
      width: 220,

      height: 150,

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 20,
    },

    logo: {
      width: 240,

      height: 175,
    },

    /* IKONER PÅ RESTEN AF SIDERNE */

    iconOuter: {
      width: 112,

      height: 112,

      borderRadius: 36,

      backgroundColor:
        '#F5F7FA',

      alignItems:
        'center',

      justifyContent:
        'center',

      marginBottom: 28,
    },

    iconInner: {
      width: 84,

      height: 84,

      borderRadius: 28,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    eyebrow: {
      fontSize: 13,

      fontWeight:
        '700',

      color:
        COLORS.navy,

      textTransform:
        'uppercase',

      letterSpacing: 1,

      marginBottom: 8,
    },

    title: {
      fontSize: 30,

      lineHeight: 37,

      fontWeight:
        '700',

      color:
        COLORS.text,

      textAlign:
        'center',

      paddingHorizontal: 10,
    },

    description: {
      fontSize: 15,

      lineHeight: 22,

      color:
        COLORS.muted,

      textAlign:
        'center',

      marginTop: 13,

      paddingHorizontal: 8,
    },

    details: {
      width: '100%',

      marginTop: 30,

      gap: 13,
    },

    detailRow: {
      minHeight: 48,

      borderRadius: 14,

      backgroundColor:
        '#F8F9FB',

      flexDirection:
        'row',

      alignItems:
        'center',

      paddingHorizontal: 14,

      paddingVertical: 10,

      gap: 11,
    },

    checkIcon: {
      width: 28,

      height: 28,

      borderRadius: 9,

      backgroundColor:
        COLORS.navySoft,

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    detailText: {
      flex: 1,

      fontSize: 14,

      lineHeight: 19,

      color:
        COLORS.text,

      fontWeight:
        '500',
    },

    bottom: {
      alignItems:
        'center',
    },

    dots: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap: 7,

      marginBottom: 20,
    },

    dot: {
      width: 7,

      height: 7,

      borderRadius: 4,

      backgroundColor:
        '#D1D5DB',
    },

    activeDot: {
      width: 22,

      backgroundColor:
        COLORS.navy,
    },

    nextButton: {
      width: '100%',

      height: 56,

      borderRadius: 16,

      backgroundColor:
        COLORS.navy,

      alignItems:
        'center',

      justifyContent:
        'center',

      shadowColor:
        COLORS.navyDark,

      shadowOffset: {
        width: 0,

        height: 5,
      },

      shadowOpacity: 0.13,

      shadowRadius: 12,

      elevation: 2,
    },

    nextButtonPressed: {
      backgroundColor:
        COLORS.navyDark,

      transform: [
        {
          scale: 0.99,
        },
      ],
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

    nextButtonText: {
      color:
        COLORS.white,

      fontSize: 16,

      fontWeight:
        '700',
    },

    backButton: {
      marginTop: 13,

      paddingVertical: 7,

      paddingHorizontal: 10,
    },

    backButtonText: {
      fontSize: 14,

      fontWeight:
        '600',

      color:
        COLORS.muted,
    },

    pressed: {
      opacity: 0.6,
    },

    disabled: {
      opacity: 0.5,
    },
  });