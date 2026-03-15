type PushReq = {
  teamId: string;
  incidentId: string;
  type: string;
  idempotencyKey: string;
  createdBy: string;
};

function validType(t: string) {
  return ['safety_check_started', 'safety_check_reminder', 'safety_check_closed'].includes(t);
}

function validate(req: Partial<PushReq>) {
  return (
    !!req.teamId &&
    !!req.incidentId &&
    !!req.idempotencyKey &&
    !!req.createdBy &&
    !!req.type &&
    validType(req.type)
  );
}

describe('push queue request contract', () => {
  test('accepts valid request', () => {
    expect(
      validate({
        teamId: 't1',
        incidentId: 'i1',
        type: 'safety_check_started',
        idempotencyKey: 'k1',
        createdBy: 'u1',
      }),
    ).toBe(true);
  });

  test('rejects missing createdBy', () => {
    expect(
      validate({
        teamId: 't1',
        incidentId: 'i1',
        type: 'safety_check_started',
        idempotencyKey: 'k1',
      }),
    ).toBe(false);
  });

  test('rejects invalid type', () => {
    expect(
      validate({
        teamId: 't1',
        incidentId: 'i1',
        type: 'unknown',
        idempotencyKey: 'k1',
        createdBy: 'u1',
      }),
    ).toBe(false);
  });
});
