import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { splitService } from '../../services/splitService';
import { Text, Heading, Input, Button, Header, Card } from '../../components/ui';
import { Spacing, BorderRadius } from '../../theme/tokens';
import { Plus, Trash2, Check, Users } from 'lucide-react-native';

const GROUP_CATEGORIES = ['Trip', 'Apartment', 'Household', 'Dinner', 'Project', 'Other'];

export default function CreateGroupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Trip');
  const [memberNames, setMemberNames] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

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
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a name for the group.');
      return;
    }

    const filteredMembers = memberNames.map((m) => m.trim()).filter(Boolean);

    try {
      setLoading(true);
      await splitService.createGroup(user.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        currency: profile?.currency || 'INR',
        currentUserName: profile?.full_name || 'You',
        memberNames: filteredMembers,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Create Split Group" showBack />
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

        {/* Group Members Input */}
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
                {profile?.full_name || 'You'} (Admin)
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

        <Button
          title="Create Group"
          variant="primary"
          size="lg"
          loading={loading}
          onPress={handleSave}
          leftIcon={<Check size={20} color="#0B0F14" />}
          buttonStyle={{ marginTop: Spacing.xl }}
        />
      </ScrollView>
    </View>
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

