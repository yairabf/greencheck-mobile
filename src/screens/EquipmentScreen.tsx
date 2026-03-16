import { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { AppContainer } from '../components/AppContainer';
import { AppButton } from '../components/AppButton';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMembers } from '../services/teamMembers';
import { listEquipment, updateEquipmentStatus, type EquipmentItem } from '../services/equipment';
import { useT } from '../i18n';

export function EquipmentScreen() {
  const t = useT();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [members, setMembers] = useState<{ uid: string; name: string; isAdmin: boolean }[]>([]);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const teamId = profile?.teamIds?.[0] ?? null;
  const myItems = useMemo(() => items.filter((x) => x.assignedToUid === user?.uid), [items, user?.uid]);

  async function reload() {
    if (!teamId) return;
    const [{ members: m }, equipment] = await Promise.all([
      getTeamMembers(teamId),
      listEquipment(teamId),
    ]);
    setMembers(m.map((x) => ({ uid: x.uid, name: x.name, isAdmin: x.isAdmin })));
    setItems(equipment);
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);


  async function onStatus(itemId: string, status: 'in_possession' | 'stored') {
    if (!teamId || !user) return;
    try {
      await updateEquipmentStatus(teamId, itemId, user.uid, status);
      await reload();
      setMsg(t('equipment.updated'));
    } catch (e: any) {
      const raw = String(e?.message || '');
      if (raw.includes('Only assignee or admin')) setMsg(t('equipment.onlyAssigneeOrAdmin'));
      else if (raw.includes('Equipment not found')) setMsg(t('equipment.notFound'));
      else setMsg(e?.message || t('common.failedAction'));
    }
  }

  return (
    <AppContainer>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('equipment.title')}</Text>
      {msg ? <Text style={{ color: colors.muted }}>{msg}</Text> : null}

      <StatusCard title={t('equipment.myItems')} subtitle={`${myItems.length}`} />
      <View style={{ gap: 8 }}>
        {myItems.map((it) => (
          <View key={it.id} style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, gap: 6 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>{it.name}</Text>
            <Text style={{ color: colors.muted }}>{it.serialNumber}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AppButton label={t('equipment.inPossession')} variant={it.status === 'in_possession' ? 'primary' : 'secondary'} onPress={() => void onStatus(it.id, 'in_possession')} />
              <AppButton label={t('equipment.stored')} variant={it.status === 'stored' ? 'primary' : 'secondary'} onPress={() => void onStatus(it.id, 'stored')} />
            </View>
          </View>
        ))}
        {myItems.length === 0 ? <Text style={{ color: colors.muted }}>{t('equipment.noItems')}</Text> : null}
      </View>

    </AppContainer>
  );
}
