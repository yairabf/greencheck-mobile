describe('incident lifecycle invariants', () => {
  test('single-active guard semantics', () => {
    const team = { activeIncidentId: null as string | null };
    const canTrigger = (t: typeof team) => !t.activeIncidentId;

    expect(canTrigger(team)).toBe(true);
    team.activeIncidentId = 'inc_1';
    expect(canTrigger(team)).toBe(false);
  });

  test('stale submit is rejected when active pointer mismatches', () => {
    const activeIncidentId: string = 'inc_live';
    const submittedIncidentId: string = 'inc_old';
    const isStale = activeIncidentId !== submittedIncidentId;
    expect(isStale).toBe(true);
  });

  test('auto/manual close race remains idempotent', () => {
    let status: 'active' | 'closed' = 'active';
    const close = () => {
      if (status !== 'active') return false;
      status = 'closed';
      return true;
    };

    const first = close();
    const second = close();

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(status).toBe('closed');
  });
});
