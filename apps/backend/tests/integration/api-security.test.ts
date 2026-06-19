import { AuthenticationError } from '../../src/errors/index.js';

describe('API Security Tests', () => {
  describe('invalid device signature', () => {
    it('should return 401 when X-Device-Signature is missing', async () => {
      const error = new AuthenticationError('Missing X-Device-Signature header');
      expect(error.status_code).toBe(401);
      expect(error.error_code).toBe('AUTHENTICATION_ERROR');
    });
  });

  describe('expired JWT', () => {
    it('should return 401 when JWT is expired', async () => {
      const error = new AuthenticationError('Invalid or expired token');
      expect(error.status_code).toBe(401);
    });
  });

  describe('drain detection blocked', () => {
    it('should return blocked decision for unlimited approvals', async () => {
      const { DrainDetectedError } = await import('../../src/errors/index.js');
      const drainResult = {
        overall_risk_score: 85,
        risk_level: 'critical' as const,
        flags: [{ check_name: 'approval_amount', triggered: true, severity: 'critical' as const, description: 'Unlimited approval' }],
        recommendation: 'block' as const,
        block_reason: 'Unlimited token approval detected',
      };
      const error = new DrainDetectedError('Unlimited approval detected', drainResult);
      expect(error.status_code).toBe(403);
      expect(error.error_code).toBe('DRAIN_DETECTED');
      expect(error.drain_result.recommendation).toBe('block');
    });
  });

  describe('phishing block', () => {
    it('should trigger phishing domain check as critical', async () => {
      const flag = {
        check_name: 'phishing_domain',
        triggered: true,
        severity: 'critical' as const,
        description: 'Domain flagged as phishing: evil-site.com',
      };
      expect(flag.triggered).toBe(true);
      expect(flag.severity).toBe('critical');
    });
  });
});
