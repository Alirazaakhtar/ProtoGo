import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import { Ionicons } from '@expo/vector-icons';

import { supabase } from '@/lib/supabase';

type Teacher = {
  user_id: string;
  role: 'owner' | 'teacher';
  profiles: {
    full_name: string;
  } | null;
};

type ClassData = {
  id: string;
  name: string;
  school_year: string | null;
  created_by: string;
};

export default function ClassSettingsScreen() {
  const { id } =
    useLocalSearchParams<{
      id: string;
    }>();

  const [classData, setClassData] =
    useState<ClassData | null>(null);

  const [teachers, setTeachers] =
    useState<Teacher[]>([]);

  const [name, setName] =
    useState('');

  const [schoolYear, setSchoolYear] =
    useState('');

  const [isOwner, setIsOwner] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const {
      data: currentClass,
      error: classError,
    } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        school_year,
        created_by
      `)
      .eq('id', id)
      .single();

    if (classError) {
      console.error(classError);

      Alert.alert(
        'Fejl',
        'Kunne ikke hente klassen.'
      );

      setLoading(false);
      return;
    }

    setClassData(currentClass);
    setName(currentClass.name);
    setSchoolYear(
      currentClass.school_year ?? ''
    );

    const {
      data: members,
      error: membersError,
    } = await supabase
      .from('class_members')
      .select(`
        user_id,
        role,
        profiles (
          full_name
        )
      `)
      .eq('class_id', id);

    if (membersError) {
      console.error(membersError);
    } else {
      setTeachers(
        (members ?? []) as Teacher[]
      );

      const currentMember =
        members?.find(
          (member) =>
            member.user_id === user.id
        );

      setIsOwner(
        currentMember?.role === 'owner'
      );
    }

    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function saveClass() {
    if (!id || !isOwner) {
      return;
    }

    if (!name.trim()) {
      Alert.alert(
        'Navn mangler',
        'Klassen skal have et navn.'
      );

      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('classes')
        .update({
          name: name.trim(),
          school_year:
            schoolYear.trim() || null,
        })
        .eq('id', id);

      if (error) {
        Alert.alert(
          'Kunne ikke gemme',
          error.message
        );

        return;
      }

      await loadData();

      Alert.alert(
        'Gemt',
        'Klassen er blevet opdateret.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteClass() {
  if (!id || !isOwner) {
    return;
  }

  Alert.alert(
    'Slet klasse',
    `Er du sikker på, at du vil slette ${classData?.name ?? 'klassen'}?\n\nElever, protokoller og historik for klassen bliver permanent slettet.`,
    [
      {
        text: 'Annuller',
        style: 'cancel',
      },
      {
        text: 'Slet klasse',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);

          if (error) {
            Alert.alert(
              'Kunne ikke slette klassen',
              error.message
            );
            return;
          }

          router.replace('/(tabs)');
        },
      },
    ]
  );
}

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Henter klasse...</Text>
      </View>
    );
  }

  if (!classData) {
    return (
      <View style={styles.center}>
        <Text>
          Klassen blev ikke fundet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.content
      }
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={styles.backButton}
      >
        <Text style={styles.backText}>
          ‹
        </Text>
      </Pressable>

      <Text style={styles.eyebrow}>
        Klasse
      </Text>

      <Text style={styles.title}>
        Indstillinger
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Klasseoplysninger
        </Text>

        <Text style={styles.label}>
          Klassenavn
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          editable={isOwner}
          placeholder="Klassenavn"
          style={[
            styles.input,
            !isOwner &&
              styles.disabledInput,
          ]}
        />

        <Text style={styles.label}>
          Skoleår
        </Text>

        <TextInput
          value={schoolYear}
          onChangeText={setSchoolYear}
          editable={isOwner}
          placeholder="Fx 2026/2027"
          style={[
            styles.input,
            !isOwner &&
              styles.disabledInput,
          ]}
        />

        {isOwner ? (
          <Pressable
            onPress={saveClass}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}
          >
            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? 'Gemmer...'
                : 'Gem ændringer'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.helper}>
            Kun klassens ejer kan
            redigere klasseoplysninger.
          </Text>
        )}
      </View>

      <View style={styles.teacherHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Lærere
          </Text>

          <Text style={styles.teacherCount}>
            {teachers.length}{' '}
            {teachers.length === 1
              ? 'lærer'
              : 'lærere'}
          </Text>
        </View>

        {isOwner && (
          <Pressable
            onPress={() =>
              router.push({
                pathname:
                  '/classes/[id]/invite',
                params: { id },
              })
            }
          >
            <Text style={styles.inviteText}>
              + Inviter
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.teacherList}>
        {teachers.map((teacher) => (
          <View
            key={teacher.user_id}
            style={styles.teacherCard}
          >
            <View
              style={
                styles.teacherAvatar
              }
            >
              <Ionicons
                name="person-outline"
                size={20}
                color="#374151"
              />
            </View>

            <View style={styles.teacherInfo}>
              <Text
                style={
                  styles.teacherName
                }
              >
                {teacher.profiles
                  ?.full_name ??
                  'Ukendt lærer'}
              </Text>

              <Text
                style={
                  styles.teacherRole
                }
              >
                {teacher.role ===
                'owner'
                  ? 'Ejer'
                  : 'Lærer'}
              </Text>
            </View>

            {teacher.role ===
              'owner' && (
              <View
                style={styles.ownerBadge}
              >
                <Text
                  style={
                    styles.ownerBadgeText
                  }
                >
                  Ejer
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {isOwner && (
  <View style={styles.dangerZone}>
    <Text style={styles.dangerTitle}>
      Slet klasse
    </Text>

    <Text style={styles.dangerText}>
      Klassen, eleverne og al protokolhistorik bliver
      permanent slettet.
    </Text>

    <Pressable
      onPress={deleteClass}
      style={({ pressed }) => [
        styles.deleteClassButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.deleteClassButtonText}>
        Slet klasse
      </Text>
    </Pressable>
  </View>
)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6F8',
  },

  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 14,
  },

  backText: {
    fontSize: 34,
    lineHeight: 34,
    color: '#111827',
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
    marginBottom: 30,
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 7,
  },

  input: {
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#111827',
  },

  disabledInput: {
    opacity: 0.6,
  },

  saveButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  helper: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 18,
  },

  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  teacherCount: {
    color: '#6B7280',
    marginTop: 3,
  },

  inviteText: {
    color: '#4F46E5',
    fontWeight: '700',
  },

  teacherList: {
    gap: 10,
  },

  teacherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  teacherAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  teacherInfo: {
    flex: 1,
    marginLeft: 13,
  },

  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  teacherRole: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  ownerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  ownerBadgeText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.65,
  },

  disabled: {
    opacity: 0.5,
  },

  dangerZone: {
  marginTop: 40,
  backgroundColor: '#FEF2F2',
  borderRadius: 20,
  padding: 20,
},

dangerTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: '#991B1B',
},

dangerText: {
  fontSize: 14,
  lineHeight: 20,
  color: '#7F1D1D',
  marginTop: 6,
  marginBottom: 18,
},

deleteClassButton: {
  height: 52,
  borderRadius: 14,
  backgroundColor: '#DC2626',
  alignItems: 'center',
  justifyContent: 'center',
},

deleteClassButtonText: {
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: '700',
},
});