import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Alert,
  AppState,
  Linking,
  Platform,
} from 'react-native';

import { Stack } from 'expo-router';

import {
  Session,
} from '@supabase/supabase-js';

import * as Application from 'expo-application';
import * as SplashScreen from 'expo-splash-screen';

import { supabase } from '@/lib/supabase';

// Vigtigt: skal ligge uden for komponenten.
// Så når splash-screen ikke at blive skjult automatisk.
SplashScreen.preventAutoHideAsync();

type AppVersion = {
  ios_latest: string;
  ios_minimum: string;

  android_latest: string;
  android_minimum: string;

  ios_url: string | null;
  android_url: string | null;
};

function compareVersions(
  currentVersion: string,
  targetVersion: string
) {
  const currentParts =
    currentVersion
      .split('.')
      .map((part) => {
        const number =
          Number.parseInt(
            part,
            10
          );

        return Number.isNaN(number)
          ? 0
          : number;
      });

  const targetParts =
    targetVersion
      .split('.')
      .map((part) => {
        const number =
          Number.parseInt(
            part,
            10
          );

        return Number.isNaN(number)
          ? 0
          : number;
      });

  const length =
    Math.max(
      currentParts.length,
      targetParts.length
    );

  for (
    let index = 0;
    index < length;
    index++
  ) {
    const current =
      currentParts[index] ?? 0;

    const target =
      targetParts[index] ?? 0;

    if (current < target) {
      return -1;
    }

    if (current > target) {
      return 1;
    }
  }

  return 0;
}

export default function RootLayout() {
  const [
    session,
    setSession,
  ] =
    useState<Session | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const updateCheckRunning =
    useRef(false);

  const optionalUpdateShown =
    useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        const [sessionResult] =
          await Promise.all([
            supabase.auth.getSession(),

            // Vis splash i minimum 1,5 sekund
            new Promise<void>(
              (resolve) => {
                setTimeout(
                  resolve,
                  1500
                );
              }
            ),
          ]);

        if (!mounted) {
          return;
        }

        setSession(
          sessionResult.data.session
        );
      } catch (error) {
        console.error(
          'Kunne ikke starte appen:',
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeApp();

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        (
          _event,
          session
        ) => {
          if (mounted) {
            setSession(
              session
            );
          }
        }
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hide();

      void checkForUpdate();
    }
  }, [loading]);

  /*
   * TJEK IGEN NÅR APPEN BLIVER AKTIV
   *
   * Fx hvis brugeren trykker "Opdater",
   * går til App Store / Play Store
   * og derefter vender tilbage.
   */
  useEffect(() => {
    const subscription =
      AppState.addEventListener(
        'change',
        (state) => {
          if (
            state === 'active' &&
            !loading
          ) {
            void checkForUpdate();
          }
        }
      );

    return () => {
      subscription.remove();
    };
  }, [loading]);

  async function openStore(
    storeUrl: string | null
  ) {
    if (!storeUrl) {
      Alert.alert(
        'Opdatering',
        'Linket til den nye version er endnu ikke tilgængeligt.'
      );

      return;
    }

    try {
      await Linking.openURL(
        storeUrl
      );
    } catch (error) {
      console.error(
        'Kunne ikke åbne app-butikken:',
        error
      );

      Alert.alert(
        'Kunne ikke åbne butikken',
        'App-butikken kunne ikke åbnes. Prøv igen senere.'
      );
    }
  }

  async function checkForUpdate() {
    if (
      updateCheckRunning.current
    ) {
      return;
    }

    if (
      Platform.OS !== 'ios' &&
      Platform.OS !== 'android'
    ) {
      return;
    }

    updateCheckRunning.current =
      true;

    try {
      const currentVersion =
        Application
          .nativeApplicationVersion;

      if (!currentVersion) {
        return;
      }

      const {
        data,
        error,
      } =
        await supabase
          .from('app_versions')
          .select(`
            ios_latest,
            ios_minimum,
            android_latest,
            android_minimum,
            ios_url,
            android_url
          `)
          .eq('id', 1)
          .single();

      if (error) {
        console.error(
          'Kunne ikke hente app-version:',
          error
        );

        return;
      }

      if (!data) {
        return;
      }

      const versionData =
        data as AppVersion;

      const isIOS =
        Platform.OS === 'ios';

      const latestVersion =
        isIOS
          ? versionData.ios_latest
          : versionData.android_latest;

      const minimumVersion =
        isIOS
          ? versionData.ios_minimum
          : versionData.android_minimum;

      const storeUrl =
        isIOS
          ? versionData.ios_url
          : versionData.android_url;

      const belowMinimum =
        compareVersions(
          currentVersion,
          minimumVersion
        ) < 0;

      const newerVersionAvailable =
        compareVersions(
          currentVersion,
          latestVersion
        ) < 0;

      /*
       * TVUNGEN OPDATERING
       */

      if (belowMinimum) {
        Alert.alert(
          'Opdatering påkrævet',
          `Din version af ProtoGo (${currentVersion}) er ikke længere understøttet.\n\nOpdater til version ${latestVersion} for at fortsætte.`,
          [
            {
              text:
                'Opdater ProtoGo',

              onPress: () => {
                void openStore(
                  storeUrl
                );
              },
            },
          ],
          {
            cancelable: false,
          }
        );

        return;
      }

      /*
       * VALGFRI OPDATERING
       */

      if (
        newerVersionAvailable &&
        !optionalUpdateShown.current
      ) {
        optionalUpdateShown.current =
          true;

        Alert.alert(
          'Ny version af ProtoGo',
          `Version ${latestVersion} er nu tilgængelig.\n\nOpdater ProtoGo for at få de seneste forbedringer og rettelser.`,
          [
            {
              text: 'Senere',
              style: 'cancel',
            },
            {
              text: 'Opdater',

              onPress: () => {
                void openStore(
                  storeUrl
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error(
        'Fejl ved versionskontrol:',
        error
      );
    } finally {
      updateCheckRunning.current =
        false;
    }
  }

  if (loading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* LOGGET UD */}

      <Stack.Protected
        guard={!session}
      >
        <Stack.Screen
          name="login"
        />

        <Stack.Screen
          name="signup"
        />

        <Stack.Screen
          name="forgot-password"
        />
      </Stack.Protected>

      {/* LOGGET IND */}

      <Stack.Protected
        guard={!!session}
      >
        <Stack.Screen
          name="(tabs)"
        />

        <Stack.Screen
          name="invites"
        />
      </Stack.Protected>

      {/*
       * PASSWORD RECOVERY
       *
       * Skal være tilgængelig uanset
       * auth-state, fordi Supabase kan
       * oprette en midlertidig session
       * under password recovery.
       *
       * Den ligger sidst, så den ikke
       * bliver appens fallback-side
       * ved normal opstart.
       */}

      <Stack.Screen
        name="reset-password"
      />

      <Stack.Screen
        name="verify-email"
      />
    </Stack>
  );
}