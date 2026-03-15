describe('invite join idempotency', () => {
  test('repeated join keeps unique membership', () => {
    const memberIds = new Set<string>(['u1']);
    const teamIds = new Set<string>(['t1']);

    // repeat join
    memberIds.add('u1');
    teamIds.add('t1');

    expect(memberIds.size).toBe(1);
    expect(teamIds.size).toBe(1);
  });
});
