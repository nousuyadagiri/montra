import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useDemoStore } from '../../store/demoStore';
import { toast } from '../../store/toastStore';
import { getErrorMessage } from '../../utils/errors';
import { splitService } from '../../services/splitService';
import { Text, Input, Button, Header, Card, LoadingState } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { Trash2, Check } from 'lucide-react-native';

const GROUP_CATEGORIES = ['Trip', 'Apartment', 'Household', 'Dinner', 'Project', 'Other'];

export default function CreateGroupScreen() {
  const router = useRouter();
  const { editGroupId } = useLocalSearchParams<{ editGroupId?: string }>();
  const isEditing = Boolean(editGroupId);
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const demoGroups = useDemoStore((s) => s.demoGroups);
  const demoProfile = useDemoStore((s) => s.demoProfile);
  const createDemoGroup = useDemoStore((s) => s.createDemoGroup);
  const updateDemoGroup = useDemoStore((s) => s.updateDemoGroup);

  const isDemo = !user || (editGroupId?.startsWith('demo-') ?? false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trip');
  const [memberNames, setMemberNames] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(Boolean(editGroupId && !isDemo));

  useEffect(() => {
    if (!editGroupId) {
      setInitialLoading(false);
      return;
    }
    if (isDemo) {
      const existing = demoGroups.find((g) => g.id === editGroupId);
      if (existing) {
        setName(existing.name);
        setDescription(existing.description || '');
        setCategory(existing.category || 'Trip');
      }
      setInitialLoading(false);
      return;
    }

    if (!user) {
      setInitialLoading(false);
      return;
    }
    setInitialLoading(true);
    splitService
      .getGroupDetails(editGroupId, user.id)
      .then((res) => {
        setName(res.group.name);
        setDescription(res.group.description || '');
        setCategory(res.group.category || 'Trip');
      })
      .catch((err) => {
        toast.error(getErrorMessage(err, 'Unable to load group details.'));
      })
      .finally(() => setInitialLoading(false));
  }, [editGroupId, isDemo, user, demoGroups]);

  const handleAddMemberField = () => {
    setMemberNames([...memberNames, '']);
  };

  const handleMemberChange = (index: number, text: string) => {
    const updated = [...memberNames];
    updated[index] = text;
    setMemberNames(updated);
  };

  const handleRemoveMember = (index: number) => {
    const updated = memberNames.filter((_, i) => i !== index);
    setMemberNames(updated);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.warning('Please enter a name for the group.', 'Group Name Required');
      return;
    }

    const filteredMembers = memberNames.map((m) => m.trim()).filter(Boolean);
    const activeProfile = isDemo ? demoProfile : profile;

    try {
      setLoading(true);
      if (isDemo) {
        if (editGroupId) {
          updateDemoGroup(editGroupId, {
            name: name.trim(),
            description: description.trim() || undefined,
            category,
          });
          toast.success('Group details updated.');
        } else {
          createDemoGroup({
            name: name.trim(),
            description: description.trim() || undefined,
            category,
            currency: activeProfile?.currency || 'INR',
            memberNames: filteredMembers,
          });
          toast.success(`Group "${name.trim()}" created.`);
        }
      } else if (user) {
        if (editGroupId) {
          await splitService.updateGroup(editGroupId, {
            name: name.trim(),
            description: description.trim() || null,
            category,
          });
          toast.success('Group details updated.');
        } else {
          await splitService.createGroup(user.id, {
            name: name.trim(),
            description: description.trim() || undefined,
            category,
            currency: activeProfile?.currency || 'INR',
            currentUserName: activeProfile?.full_name || 'You',
            memberNames: filteredMembers,
          });
          toast.success(`Group "${name.trim()}" created!`);
        }
      } else {
        toast.error('Please sign in to create a synced group.');
        return;
      }

      router.back();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to save group.'), 'Unable to Save Group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title={isEditing ? 'Edit Split Group' : 'Create Split Group'} showBack />
      {initialLoading ? (
        <LoadingState message="Loading group details..." />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Input
          label="Group Name"
          placeholder="e.g. Goa Trip 2026, Flat 402"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Description (Optional)"
          placeholder="Trip expenses, shared groceries, utilities..."
          value={description}
          onChangeText={setDescription}
        />

        {/* Category Pills */}
        <View style={styles.section}>
          <Text variant="sm" weight="medium" color="secondary" style={styles.label}>
            Group Type
          </Text>
          <View style={styles.pillsRow}>
            {GROUP_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.pill,
                    {
                      backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    variant="xs"
                    weight={isSelected ? 'bold' : 'regular'}
                    style={{ color: isSelected ? colors.primary : colors.mainText }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Group Members Input (only when creating a new group) */}
        {!isEditing ? (
          <View style={styles.section}>
            <View style={styles.membersHeader}>
              <Text variant="sm" weight="medium" color="secondary">
                Group Members
              </Text>
              <TouchableOpacity onPress={handleAddMemberField}>
                <Text variant="xs" color="primary" weight="bold">
                  + Add Member
                </Text>
              </TouchableOpacity>
            </View>

            <Card elevated style={styles.membersCard}>
              <View style={styles.selfMemberRow}>
                <Text variant="sm" weight="bold">
                  {(isDemo ? demoProfile?.full_name : profile?.full_name) || 'You'} (Admin)
                </Text>
              </View>

              {memberNames.map((mem, index) => (
                <View key={index} style={styles.memberInputRow}>
                  <Input
                    placeholder={`Friend ${index + 1} Name`}
                    value={mem}
                    onChangeText={(val) => handleMemberChange(index, val)}
                    containerStyle={{ flex: 1, marginBottom: 0 }}
                  />
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(index)}
                    style={styles.trashBtn}
                  >
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </Card>
          </View>
        ) : null}

        <Button
          title={isEditing ? 'Save Changes' : 'Create Group'}
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSave}
          leftIcon={<Check size={20} color={colors.onPrimary} />}
          buttonStyle={{ marginTop: Spacing.xl }}
        />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  membersCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  selfMemberRow: {
    paddingVertical: Spacing.xs,
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  trashBtn: {
    padding: Spacing.sm,
  },
});

