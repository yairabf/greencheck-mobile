import { useEffect, useMemo, useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { AppContainer } from '../components/AppContainer';
import { AppButton } from '../components/AppButton';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMembers } from '../services/teamMembers';
import { assignEquipment, createEquipment, listEquipment, updateEquipmentStatus, type EquipmentItem } from '../services/equipment';
import { useT } from '../i18n';

export function EquipmentScreen() {
  const t = useT();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [members, setMembers] = useState<{ uid: string; name: string; isAdmin: boolean }[]>([]);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [assignModalItemId, setAssignModalItemId] = useState<string | null>(null);

  const teamId = profile?.teamIds?.[0] ?? null;
  const me = members.find((m) => m.uid === user?.uid);
  const isAdmin = !!me?.isAdmin;

  const myItems = useMemo(() => items.filter((x) => x.assignedToUid === user?.uid), [items, user?.uid]);
  const storedItems = useMemo(() => items.filter((x) => x.status === 'stored'), [items]);
  const possessedItems = useMemo(() => items.filter((x) => x.status === 'in_possession'), [items]);

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

  async function onCreate() {
    if (!teamId || !user) return;
    setBusy(true);
    setMsg(null);
    try {
      await createEquipment(teamId, user.uid, name, serial);
      setName('');
      setSerial('');
      setMsg(t('equipment.created'));
      await reload();
    } catch (e: any) {
      setMsg(e?.message || t('common.failedAction'));
    } finally {
      setBusy(false);
    }
  }

  async function onAssign(itemId: string, uid: string | null) {
    if (!teamId || !user) return;
    try {
      await assignEquipment(teamId, itemId, user.uid, uid);
      await reload();
      setMsg(t('equipment.updated'));
    } catch (e: any) {
      setMsg(e?.message || t('common.failedAction'));
    }
  }

  async function onStatus(itemId: string, status: 'in_possession' | 'stored') {
    if (!teamId || !user) return;
    try {
      await updateEquipmentStatus(teamId, itemId, user.uid, status);
      await reload();
      setMsg(t('equipment.updated'));
    } catch (e: any) {
      setMsg(e?.message || t('common.failedAction'));
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

      {isAdmin ? (
        <>
          <StatusCard title={t('equipment.teamItems')} subtitle={`${items.length}`} />
          <View style={{ gap: 6 }}>
            <TextInput style={{ backgroundColor: colors.card, color: colors.text, borderRadius: 8, padding: 10 }} placeholder={t('equipment.name')} placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
            <TextInput style={{ backgroundColor: colors.card, color: colors.text, borderRadius: 8, padding: 10 }} placeholder={t('equipment.serial')} placeholderTextColor={colors.muted} value={serial} onChangeText={setSerial} />
            <AppButton label={busy ? t('common.loading') : t('equipment.create')} onPress={() => void onCreate()} />
          </View>

          <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>{t('equipment.inPossession')}</Text>
          {possessedItems.map((it) => (
            <View key={`p-${it.id}`} style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, gap: 4 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{it.name}</Text>
              <Text style={{ color: colors.muted }}>{it.serialNumber}</Text>
              <Text style={{ color: colors.muted }}>{t('equipment.assignTo')}: {members.find((m) => m.uid === it.assignedToUid)?.name || t('equipment.unassigned')}</Text>
              <AppButton label={t('equipment.assignTo')} variant="secondary" onPress={() => setAssignModalItemId(it.id)} />
            </View>
          ))}

          <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>{t('equipment.stored')}</Text>
          {storedItems.map((it) => (
            <View key={`s-${it.id}`} style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, gap: 4 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{it.name}</Text>
              <Text style={{ color: colors.muted }}>{it.serialNumber}</Text>
              <Text style={{ color: colors.muted }}>{t('equipment.assignTo')}: {members.find((m) => m.uid === it.assignedToUid)?.name || t('equipment.unassigned')}</Text>
              <AppButton label={t('equipment.assignTo')} variant="secondary" onPress={() => setAssignModalItemId(it.id)} />
            </View>
          ))}

          <Modal visible={!!assignModalItemId} transparent animationType="fade" onRequestClose={() => setAssignModalItemId(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 }}>
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{t('equipment.chooseAssignee')}</Text>
                <AppButton
                  label={t('equipment.unassigned')}
                  variant="secondary"
                  onPress={() => {
                    if (!assignModalItemId) return;
                    void onAssign(assignModalItemId, null);
                    setAssignModalItemId(null);
                  }}
                />
                {members.map((m) => (
                  <AppButton
                    key={`assignee-${m.uid}`}
                    label={m.name || t('team.unnamed')}
                    variant="secondary"
                    onPress={() => {
                      if (!assignModalItemId) return;
                      void onAssign(assignModalItemId, m.uid);
                      setAssignModalItemId(null);
                    }}
                  />
                ))}
                <AppButton label={t('equipment.close')} variant="danger" onPress={() => setAssignModalItemId(null)} />
              </View>
            </View>
          </Modal>
        </>
      ) : null}
    </AppContainer>
  );
}
