import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Text, TextInput, View } from 'react-native';
import { AppContainer } from '../components/AppContainer';
import { AppButton } from '../components/AppButton';
import { StatusCard } from '../components/StatusCard';
import { colors } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { useProfile } from '../services/ProfileProvider';
import { getTeamMembers, type TeamMember } from '../services/teamMembers';
import { assignTeamAdmin, removeTeamMember, revokeTeamAdmin } from '../services/teamAdmin';
import { assignEquipment, createEquipment, deleteEquipment, editEquipment, listEquipment, type EquipmentCategory, type EquipmentItem } from '../services/equipment';
import { useT } from '../i18n';

export function TeamManagementScreen() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const t = useT();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyRemoveUid, setBusyRemoveUid] = useState<string | null>(null);
  const [busyAdminUid, setBusyAdminUid] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [serial, setSerial] = useState('');
  const [busyCreateEquipment, setBusyCreateEquipment] = useState(false);
  const [category, setCategory] = useState<EquipmentCategory>('general');
  const [assignModalItemId, setAssignModalItemId] = useState<string | null>(null);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSerial, setEditSerial] = useState('');
  const [editCategory, setEditCategory] = useState<EquipmentCategory>('general');
  const [busyEdit, setBusyEdit] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [section, setSection] = useState<'teammates' | 'equipment'>('teammates');
  const [equipmentTab, setEquipmentTab] = useState<'stored' | 'in_possession'>('stored');
  const [equipmentCategoryTab, setEquipmentCategoryTab] = useState<EquipmentCategory>('general');

  const teamId = profile?.teamIds?.[0] ?? null;
  const isAdmin = !!members.find((m) => m.uid === user?.uid)?.isAdmin;

  const categoryItems = useMemo(() => items.filter((x) => (x.category ?? 'general') === equipmentCategoryTab), [items, equipmentCategoryTab]);
  const storedItems = useMemo(() => categoryItems.filter((x) => x.status === 'stored'), [categoryItems]);
  const possessedItems = useMemo(() => categoryItems.filter((x) => x.status === 'in_possession'), [categoryItems]);

  async function loadAll() {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const [{ members: list }, equipment] = await Promise.all([
        getTeamMembers(teamId),
        listEquipment(teamId),
      ]);
      setMembers(list);
      setItems(equipment);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.failedAction'));
    } finally {
      setLoading(false);
    }
  }

  async function onCreateEquipment() {
    if (!teamId || !user) return;
    setBusyCreateEquipment(true);
    setError(null);
    setMsg(null);
    try {
      await createEquipment(teamId, user.uid, name, serial, category);
      setName('');
      setSerial('');
      setCategory('general');
      setMsg(t('equipment.created'));
      await loadAll();
    } catch (e: any) {
      setError(e?.message || t('common.failedAction'));
    } finally {
      setBusyCreateEquipment(false);
    }
  }

  async function onAssign(itemId: string, uid: string | null) {
    if (!teamId || !user) return;
    setError(null);
    setMsg(null);
    try {
      await assignEquipment(teamId, itemId, user.uid, uid);
      setMsg(t('equipment.updated'));
      await loadAll();
    } catch (e: any) {
      setError(e?.message || t('common.failedAction'));
    }
  }

  async function onSaveEdit() {
    if (!teamId || !user || !editItemId) return;
    setBusyEdit(true);
    setError(null);
    setMsg(null);
    try {
      await editEquipment(teamId, editItemId, user.uid, { name: editName, serialNumber: editSerial, category: editCategory });
      setMsg(t('equipment.updated'));
      setEditItemId(null);
      await loadAll();
    } catch (e: any) {
      setError(e?.message || t('common.failedAction'));
    } finally {
      setBusyEdit(false);
    }
  }

  async function onDeleteItem(itemId: string) {
    if (!teamId || !user) return;
    setBusyDeleteId(itemId);
    setError(null);
    setMsg(null);
    try {
      await deleteEquipment(teamId, itemId, user.uid);
      setMsg(t('equipment.deleted'));
      await loadAll();
    } catch (e: any) {
      setError(e?.message || t('common.failedAction'));
    } finally {
      setBusyDeleteId(null);
    }
  }

  async function onToggleAdmin(uid: string, makeAdmin: boolean) {
    if (!teamId || !user) return;
    setBusyAdminUid(uid);
    setError(null);
    setMsg(null);
    try {
      if (makeAdmin) {
        await assignTeamAdmin(teamId, user.uid, uid);
        setMsg(t('team.adminAssigned'));
      } else {
        await revokeTeamAdmin(teamId, user.uid, uid);
        setMsg(t('team.adminRevoked'));
      }
      await loadAll();
    } catch (e: any) {
      const raw = String(e?.message || '');
      if (raw.includes('Only team admin')) setError(t('team.onlyAdminCanManage'));
      else if (raw.includes('last admin')) setError(t('team.cannotRemoveLastAdmin'));
      else setError(e instanceof Error ? e.message : t('common.failedAction'));
    } finally {
      setBusyAdminUid(null);
    }
  }

  async function onRemove(uid: string) {
    if (!teamId || !user) return;
    setBusyRemoveUid(uid);
    setError(null);
    setMsg(null);
    try {
      await removeTeamMember(teamId, user.uid, uid);
      setMsg(t('team.removedMember'));
      await loadAll();
    } catch (e: any) {
      const raw = String(e?.message || '');
      if (raw.includes('Only team admin')) setError(t('team.onlyAdminCanManage'));
      else if (raw.includes('Cannot remove team creator')) setError(t('team.cannotRemoveCreator'));
      else if (raw.includes('last admin')) setError(t('team.cannotRemoveLastAdmin'));
      else setError(e instanceof Error ? e.message : t('common.failedAction'));
    } finally {
      setBusyRemoveUid(null);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (!teamId) {
    return (
      <AppContainer>
        <Text style={{ color: colors.muted }}>{t('team.yourTeam')}</Text>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('team.adminTools')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AppButton label={t('team.tabTeammates')} variant={section === 'teammates' ? 'primary' : 'secondary'} onPress={() => setSection('teammates')} />
        <AppButton label={t('team.tabEquipment')} variant={section === 'equipment' ? 'primary' : 'secondary'} onPress={() => setSection('equipment')} />
      </View>

      {!isAdmin ? <Text style={{ color: colors.danger }}>{t('team.onlyAdminCanManage')}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      {msg ? <Text style={{ color: colors.muted }}>{msg}</Text> : null}

      {section === 'teammates' ? (
        <>
          <StatusCard title={t('team.manageMembers')} subtitle={t('team.selectMemberToRemove')} />
          <View style={{ gap: 10 }}>
            {members.map((m) => (
              <View key={m.uid} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{m.name || t('team.unnamed')} {m.isAdmin ? `(${t('team.adminBadge')})` : ''}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{m.phone || t('team.noPhone')}</Text>
                </View>
                {isAdmin && m.uid !== user?.uid ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <AppButton label={busyAdminUid === m.uid ? t('common.loading') : (m.isAdmin ? t('team.revokeAdmin') : t('team.assignAdmin'))} variant="secondary" onPress={() => void onToggleAdmin(m.uid, !m.isAdmin)} />
                    <AppButton label={busyRemoveUid === m.uid ? t('common.loading') : '🗑️'} variant="danger" onPress={() => void onRemove(m.uid)} />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <StatusCard title={t('equipment.teamItems')} subtitle={`${items.length}`} />
          <View style={{ gap: 6 }}>
            <TextInput style={{ backgroundColor: colors.card, color: colors.text, borderRadius: 8, padding: 10 }} placeholder={t('equipment.name')} placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
            <TextInput style={{ backgroundColor: colors.card, color: colors.text, borderRadius: 8, padding: 10 }} placeholder={t('equipment.serial')} placeholderTextColor={colors.muted} value={serial} onChangeText={setSerial} />
            <Text style={{ color: colors.muted }}>{t('equipment.category')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AppButton label={t('equipment.categoryGeneral')} variant={category === 'general' ? 'primary' : 'secondary'} onPress={() => setCategory('general')} />
              <AppButton label={t('equipment.categoryGrenades')} variant={category === 'grenades' ? 'primary' : 'secondary'} onPress={() => setCategory('grenades')} />
            </View>
            <AppButton label={busyCreateEquipment ? t('common.loading') : t('equipment.create')} onPress={() => void onCreateEquipment()} />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <AppButton
              label={`${t('equipment.tabCategoryGeneral')} (${items.filter((x) => (x.category ?? 'general') === 'general').length})`}
              variant={equipmentCategoryTab === 'general' ? 'primary' : 'secondary'}
              onPress={() => setEquipmentCategoryTab('general')}
            />
            <AppButton
              label={`${t('equipment.tabCategoryGrenades')} (${items.filter((x) => (x.category ?? 'general') === 'grenades').length})`}
              variant={equipmentCategoryTab === 'grenades' ? 'primary' : 'secondary'}
              onPress={() => setEquipmentCategoryTab('grenades')}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <AppButton
              label={`${t('equipment.tabStored')} (${storedItems.length})`}
              variant={equipmentTab === 'stored' ? 'primary' : 'secondary'}
              onPress={() => setEquipmentTab('stored')}
            />
            <AppButton
              label={`${t('equipment.tabInPossession')} (${possessedItems.length})`}
              variant={equipmentTab === 'in_possession' ? 'primary' : 'secondary'}
              onPress={() => setEquipmentTab('in_possession')}
            />
          </View>

          {(equipmentTab === 'in_possession' ? possessedItems : storedItems).map((it) => (
            <View key={`${equipmentTab}-${it.id}`} style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, gap: 4 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{it.name}</Text>
              <Text style={{ color: colors.muted }}>{it.serialNumber}</Text>
              <Text style={{ color: colors.muted }}>{t('equipment.assignTo')}: {members.find((m) => m.uid === it.assignedToUid)?.name || t('equipment.unassigned')}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <AppButton label={t('equipment.assignTo')} variant="secondary" onPress={() => setAssignModalItemId(it.id)} />
                <AppButton label={t('equipment.edit')} variant="secondary" onPress={() => { setEditItemId(it.id); setEditName(it.name); setEditSerial(it.serialNumber); setEditCategory(it.category ?? 'general'); }} />
                <AppButton label={busyDeleteId === it.id ? t('common.loading') : t('equipment.delete')} variant="danger" onPress={() => void onDeleteItem(it.id)} />
              </View>
            </View>
          ))}

          <Modal visible={!!assignModalItemId} transparent animationType="fade" onRequestClose={() => setAssignModalItemId(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 }}>
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{t('equipment.chooseAssignee')}</Text>
                <AppButton label={t('equipment.unassigned')} variant="secondary" onPress={() => { if (!assignModalItemId) return; void onAssign(assignModalItemId, null); setAssignModalItemId(null); }} />
                {members.map((m) => (
                  <AppButton key={`assignee-${m.uid}`} label={m.name || t('team.unnamed')} variant="secondary" onPress={() => { if (!assignModalItemId) return; void onAssign(assignModalItemId, m.uid); setAssignModalItemId(null); }} />
                ))}
                <AppButton label={t('equipment.close')} variant="danger" onPress={() => setAssignModalItemId(null)} />
              </View>
            </View>
          </Modal>

          <Modal visible={!!editItemId} transparent animationType="fade" onRequestClose={() => setEditItemId(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 16 }}>
              <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 8 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>{t('equipment.edit')}</Text>
                <TextInput style={{ backgroundColor: colors.cardAlt, color: colors.text, borderRadius: 8, padding: 10 }} placeholder={t('equipment.name')} placeholderTextColor={colors.muted} value={editName} onChangeText={setEditName} />
                <TextInput style={{ backgroundColor: colors.cardAlt, color: colors.text, borderRadius: 8, padding: 10 }} placeholder={t('equipment.serial')} placeholderTextColor={colors.muted} value={editSerial} onChangeText={setEditSerial} />
                <Text style={{ color: colors.muted }}>{t('equipment.category')}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <AppButton label={t('equipment.categoryGeneral')} variant={editCategory === 'general' ? 'primary' : 'secondary'} onPress={() => setEditCategory('general')} />
                  <AppButton label={t('equipment.categoryGrenades')} variant={editCategory === 'grenades' ? 'primary' : 'secondary'} onPress={() => setEditCategory('grenades')} />
                </View>
                <AppButton label={busyEdit ? t('common.loading') : t('equipment.saveItem')} onPress={() => void onSaveEdit()} />
                <AppButton label={t('equipment.close')} variant="danger" onPress={() => setEditItemId(null)} />
              </View>
            </View>
          </Modal>
        </>
      )}

      <AppButton label={t('team.refreshTeam')} variant="secondary" onPress={() => void loadAll()} />
    </AppContainer>
  );
}
