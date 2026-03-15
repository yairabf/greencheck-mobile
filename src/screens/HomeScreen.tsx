import { useEffect, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppButton } from '../components/AppButton';
import { AppContainer } from '../components/AppContainer';
import { StatusCard } from '../components/StatusCard';
import { IncidentRoster, type RosterMember } from '../components/IncidentRoster';
import { AppBanner } from '../components/AppBanner';
import { colors } from '../config/theme';
import { useAuth } from '../services/AuthProvider';
import { triggerSafetyCheck, getActiveIncident, getIncidentResponseCounts, submitMyStatus, subscribeIncidentResponses, endSafetyCheck, reconcileActiveIncidentPointer, type IncidentResponseMap, type ResponseCounts } from '../services/incident';
import { getTeamMembers } from '../services/teamMembers';
import { useProfile } from '../services/ProfileProvider';
import { usePush } from '../services/PushProvider';
import { consumePendingIntent } from '../services/notificationIntent';
import { consumeWebNotificationAction } from '../services/webNotificationAction';
import { notifyTeamSafetyCheckStarted, notifyIncidentReminderNonResponders } from '../services/notify';
import { humanizeError } from '../services/errors';
import { logEvent } from '../services/observability';
import { flags } from '../config/env';
import type { Incident } from '../types/incident';
import { useT } from '../i18n';

export function HomeScreen() {
  const { signOutUser, user } = useAuth();
  const { profile, refresh: refreshProfile } = useProfile();
  const { status: pushStatus, reason: pushReason, retry: retryPush } = usePush();
  const navigation = useNavigation();
  const hasTeams = !!profile?.teamIds?.length;
  const t = useT();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [counts, setCounts] = useState<ResponseCounts>({ green: 0, not_green: 0, no_response: 0 });
  const [busyTrigger, setBusyTrigger] = useState(false);
  const [busyStatus, setBusyStatus] = useState<'green' | 'not_green' | null>(null);
  const [busyEnd, setBusyEnd] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterMember[]>([]);
  const [liveErr, setLiveErr] = useState<string | null>(null);
  const [notifySummary, setNotifySummary] = useState<string | null>(null);
  const [intentMsg, setIntentMsg] = useState<string | null>(null);
  const [busyReminder, setBusyReminder] = useState(false);
  const [responseMap, setResponseMap] = useState<IncidentResponseMap>({});
  const [memberDirectory, setMemberDirectory] = useState<Record<string, { name: string; phone: string }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const webActionHandledRef = useRef(false);

  const activeTeamId = profile?.teamIds?.[0] ?? null;

  async function refreshIncident() {
    if (!activeTeamId) {
      setIncident(null);
      setCounts({ green: 0, not_green: 0, no_response: 0 });
      return;
    }
    try {
      await reconcileActiveIncidentPointer(activeTeamId);
      const i = await getActiveIncident(activeTeamId);
      setIncident(i);
      if (i) {
        const nextCounts = await getIncidentResponseCounts(activeTeamId, i.id);
        setCounts(nextCounts);
      } else {
        setCounts({ green: 0, not_green: 0, no_response: 0 });
      }
    } catch {
      setIncident(null);
      setCounts({ green: 0, not_green: 0, no_response: 0 });
    }
  }

  async function onTrigger() {
    if (!activeTeamId || !user) {
      setMsg('You must be in a team to trigger a safety check.');
      return;
    }
    setBusyTrigger(true);
    setMsg(null);
    try {
      const incidentId = await triggerSafetyCheck(activeTeamId, user.uid);
      await logEvent({ teamId: activeTeamId, incidentId, type: 'incident_triggered', actor: user.uid });
      const push = await notifyTeamSafetyCheckStarted(activeTeamId, incidentId, user.uid);
      await logEvent({ teamId: activeTeamId, incidentId, type: 'push_sent', actor: user.uid, meta: { attempted: push.attempted, sent: push.sent, failed: push.failed } });
      if (!flags.enableClientPush) {
        setNotifySummary('Push disabled in client. Configure backend sender for production.');
      } else {
        setNotifySummary(`Push attempted ${push.attempted}, sent ${push.sent}, failed ${push.failed}`);
      }
      setMsg(`Safety check started: ${incidentId}`);
      await refreshIncident();
    } catch (e) {
      setMsg(humanizeError(e, 'Failed action.'));
    } finally {
      setBusyTrigger(false);
    }
  }

  function normalizeDisplayName(uid: string, rawName: string | undefined) {
    const n = (rawName || '').trim();
    if (!n) return '';
    if (n === uid) return '';
    // Guard against showing technical IDs as names.
    if (/^[A-Za-z0-9:_-]{10,}$/.test(n) && !n.includes(' ')) return '';
    if (/^[A-Za-z0-9_-]{20,}$/.test(n)) return '';
    return n;
  }

  function buildRoster(responseMap: IncidentResponseMap) {
    const rows: RosterMember[] = Object.entries(responseMap).map(([uid, r]) => {
      const previousName = roster.find((x) => x.uid === uid)?.name;
      const name =
        normalizeDisplayName(uid, memberDirectory[uid]?.name)
        || normalizeDisplayName(uid, previousName)
        || (uid === user?.uid ? profile?.name || 'You' : 'Member');

      return {
        uid,
        name,
        phone:
          memberDirectory[uid]?.phone
          || (uid === user?.uid ? profile?.phone || '' : ''),
        status: r.status,
        isYou: uid === user?.uid,
      };
    });
    rows.sort((a,b)=>a.name.localeCompare(b.name));
    setRoster(rows);
  }

  async function onSubmitStatus(status: 'green' | 'not_green') {
    if (!activeTeamId || !incident?.id || !user) {
      setMsg('No active incident to update.');
      return;
    }
    setBusyStatus(status);
    setMsg(null);
    try {
      const beforeId = incident.id;
      await submitMyStatus(activeTeamId, beforeId, user.uid, status);
      await logEvent({ teamId: activeTeamId, incidentId: beforeId, type: 'status_submitted', actor: user.uid, meta: { status } });
      await refreshIncident();
      const after = await getActiveIncident(activeTeamId);
      if (!after || after.id !== beforeId) {
        setMsg('Incident auto-closed.');
      } else {
        setMsg(status === 'green' ? 'Marked as Green.' : 'Marked as Not Green.');
      }
    } catch (e) {
      setMsg(humanizeError(e, 'Failed action.'));
    } finally {
      setBusyStatus(null);
    }
  }

  useEffect(() => {
    void refreshIncident();
    void refreshTeamDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId]);

  async function refreshTeamDirectory() {
    if (!activeTeamId) {
      setMemberDirectory({});
      return;
    }

    try {
      const { members } = await getTeamMembers(activeTeamId);
      const next: Record<string, { name: string; phone: string }> = {};
      for (const m of members) {
        next[m.uid] = {
          name: normalizeDisplayName(m.uid, m.name) || (m.uid === user?.uid ? profile?.name || 'You' : 'Member'),
          phone: m.phone,
        };
      }
      setMemberDirectory(next);
    } catch {
      // keep existing map on transient errors
    }
  }

  async function onPullRefresh() {
    setRefreshing(true);
    try {
      await refreshProfile();
      await Promise.all([refreshIncident(), refreshTeamDirectory()]);
      setMsg('Refreshed');
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const intent = consumePendingIntent();
    if (!intent) return;
    if (intent.type.includes('safety_check')) {
      setIntentMsg(`Opened from notification: ${intent.type}`);
      void refreshIncident();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incident?.id]);

  useEffect(() => {
    if (webActionHandledRef.current) return;
    const notifAction = consumeWebNotificationAction();
    if (!notifAction) return;
    webActionHandledRef.current = true;

    if (!user) {
      setMsg('Opened from notification. Please sign in to submit your status.');
      return;
    }

    if (!notifAction.teamId || !notifAction.incidentId) {
      setMsg('Opened from notification. Missing team/incident context.');
      return;
    }

    if (notifAction.action === 'green' || notifAction.action === 'not_green') {
      const status = notifAction.action;
      void (async () => {
        try {
          await submitMyStatus(notifAction.teamId!, notifAction.incidentId!, user.uid, status);
          setMsg(status === 'green' ? 'Status submitted from notification: Green.' : 'Status submitted from notification: Not Green.');
          await refreshIncident();
        } catch (e) {
          setMsg(humanizeError(e, 'Failed to submit status from notification.'));
        }
      })();
    } else {
      setIntentMsg('Opened from notification');
      void refreshIncident();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function onReminder() {
    if (!activeTeamId || !incident?.id || !user) {
      setMsg('No active incident for reminder.');
      return;
    }
    setBusyReminder(true);
    setMsg(null);
    try {
      const r = await notifyIncidentReminderNonResponders(activeTeamId, incident.id, user.uid);
      await logEvent({ teamId: activeTeamId, incidentId: incident.id, type: 'reminder_sent', actor: user?.uid, meta: { attempted: r.attempted, sent: r.sent, failed: r.failed } });
      if (!flags.enableClientPush) {
        setNotifySummary('Reminder push disabled in client.');
      } else {
        setNotifySummary(`Reminder attempted ${r.attempted}, sent ${r.sent}, failed ${r.failed}${r.errors[0] ? ` (${r.errors[0]})` : ''}`);
      }
    } catch (e) {
      setMsg(humanizeError(e, 'Reminder failed'));
    } finally {
      setBusyReminder(false);
    }
  }

  async function onEndCheck() {
    if (!activeTeamId || !incident?.id || !user) {
      setMsg('No active incident to end.');
      return;
    }

    setBusyEnd(true);
    setMsg(null);
    try {
      const ended = await endSafetyCheck(activeTeamId, incident.id, user.uid);
      if (ended) await logEvent({ teamId: activeTeamId, incidentId: incident.id, type: 'incident_closed_manual', actor: user.uid });
      await refreshIncident();
      setMsg(ended ? 'Safety check ended.' : 'Incident already closed.');
    } catch (e) {
      setMsg(humanizeError(e, 'Failed action.'));
    } finally {
      setBusyEnd(false);
    }
  }

  useEffect(() => {
    if (!activeTeamId || !incident?.id || !user) {
      setRoster([]);
      setResponseMap({});
      return;
    }
    const unsub = subscribeIncidentResponses(
      activeTeamId,
      incident.id,
      (map) => {
        setLiveErr(null);
        setResponseMap(map);
        void refreshTeamDirectory();
      },
      (e) => setLiveErr(e.message),
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTeamId, incident?.id, profile?.name, profile?.phone, user?.uid]);

  useEffect(() => {
    buildRoster(responseMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseMap, memberDirectory, user?.uid, profile?.name, profile?.phone]);

  return (
    <AppContainer>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onPullRefresh()} />}
        contentContainerStyle={{ flexGrow: 1, gap: 10, paddingBottom: 24 }}
        alwaysBounceVertical
        bounces
        overScrollMode="always"
      >
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{t('home.dashboard')}</Text>
      <Text style={{ color: colors.muted }}>{t('home.hi')} {profile?.name ?? 'teammate'} 👋</Text>
      <AppButton
        label={refreshing ? t('common.loading') : t('common.refreshNow')}
        variant="secondary"
        onPress={() => void onPullRefresh()}
      />
      <StatusCard
        title={t('home.teamStatus')}
        subtitle={hasTeams ? t('home.inTeams', { count: profile?.teamIds.length ?? 0 }) : t('home.noTeam')}
      />
      <StatusCard
        title={t('home.activeCheck')}
        subtitle={incident ? t('home.activeIncident', { id: incident.id }) : t('home.noActiveCheck')}
      />
      <StatusCard
        title={t('home.pushStatus')}
        subtitle={pushStatus === 'ok' ? t('home.pushRegistered') : pushReason ? t('home.push', { status: pushReason }) : t('home.push', { status: pushStatus })}
      />
      {pushStatus === 'error' ? (
        <AppButton label={t('home.retryPush')} variant="secondary" onPress={() => void retryPush()} />
      ) : null}
      <StatusCard
        title={t('home.teammates')}
        subtitle={t('home.teammatesStatus', { green: counts.green, notGreen: counts.not_green, noResponse: counts.no_response })}
      />
      <AppButton
        label={busyTrigger ? t('home.triggering') : t('home.triggerCheck')}
        onPress={() => void onTrigger()}
      />
      {incident ? (
        <View style={{ gap: 10 }}>
          <AppButton
            label={busyStatus === 'green' ? t('home.submitting') : t('home.imGreen')}
            onPress={() => void onSubmitStatus('green')}
          />
          <AppButton
            label={busyStatus === 'not_green' ? t('home.submitting') : t('home.notGreen')}
            variant="danger"
            onPress={() => void onSubmitStatus('not_green')}
          />
          <AppButton
            label={busyEnd ? t('home.ending') : t('home.endCheck')}
            variant="secondary"
            onPress={() => void onEndCheck()}
          />
          <AppButton
            label={busyReminder ? t('home.sendingReminder') : t('home.sendReminder')}
            variant="secondary"
            onPress={() => void onReminder()}
          />
        </View>
      ) : null}
      {msg ? <AppBanner tone="info" text={msg} /> : null}
      {intentMsg ? <AppBanner tone="info" text={intentMsg} /> : null}
      {notifySummary ? <AppBanner tone="success" text={notifySummary} /> : null}
      {liveErr ? <AppBanner tone="error" text={liveErr} /> : null}
      {incident ? (
        <>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{t('home.incidentRoster')}</Text>
          <IncidentRoster members={roster} />
        </>
      ) : null}
      {!hasTeams ? (
        <View style={{ gap: 10 }}>
          <AppButton label={t('home.createTeam')} onPress={() => navigation.navigate('CreateTeam' as never)} />
          <AppButton
            label={t('home.joinTeam')}
            variant="secondary"
            onPress={() => navigation.navigate('JoinTeam' as never)}
          />
        </View>
      ) : null}
      <AppButton label={t('home.signOut')} variant="secondary" onPress={() => void signOutUser()} />
      </ScrollView>
    </AppContainer>
  );
}
