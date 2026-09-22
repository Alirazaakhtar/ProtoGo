import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import * as SplashScreen from 'expo-splash-screen';

import { supabase } from '@/lib/supabase';

// Vigtigt: skal ligge uden for komponenten.
// Så når splash-screen ikke at blive skjult automatisk.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [session, setSession] =
    useState<Session | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        const [sessionResult] =
          await Promise.all([
            supabase.auth.getSession(),

            // Vis splash i minimum 1,5 sekund
            new Promise<void>((resolve) => {
              setTimeout(resolve, 1500);
            }),
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
        (_event, session) => {
          if (mounted) {
            setSession(session);
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
    }
  }, [loading]);

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

      <Stack.Protected guard={!session}>
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

      <Stack.Protected guard={!!session}>
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
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}