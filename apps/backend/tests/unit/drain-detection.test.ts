import { DrainDetectionService } from '../../src/services/drain-detection.service.js';

const drainDetection = new DrainDetectionService();

describe('DrainDetectionService', () => {
  describe('analyzeTransaction', () => {
    it('should detect unlimited approval as critical', async () => {
      const result = await drainDetection.analyzeTransaction({
        transactionBase64: 'test_tx',
        walletPubkey: 'test_wallet',
        instructionData: { amount: '18446744073709551615', discriminator: 'approve' },
        approvedPrograms: [],
      });
      expect(result.overall_risk_score).toBeGreaterThanOrEqual(60);
      expect(result.risk_level).toBe('critical');
      expect(result.recommendation).toBe('block');
    });

    it('should return safe for normal transactions', async () => {
      const result = await drainDetection.analyzeTransaction({
        transactionBase64: 'test_tx',
        walletPubkey: 'test_wallet',
        instructionData: { amount: '1000', discriminator: 'transfer' },
        approvedPrograms: ['test_program'],
      });
      expect(result.overall_risk_score).toBeLessThan(30);
      expect(['safe', 'caution']).toContain(result.risk_level);
    });

    it('should detect drain patterns as critical', async () => {
      const result = await drainDetection.analyzeTransaction({
        transactionBase64: 'test_tx',
        walletPubkey: 'test_wallet',
        instructionData: { discriminator: 'setAuthority', amount: '1000' },
        approvedPrograms: [],
      });
      const calldataFlag = result.flags.find(f => f.check_name === 'calldata_analysis');
      expect(calldataFlag?.triggered).toBe(true);
      expect(calldataFlag?.severity).toBe('critical');
    });

    it('should run all 8 checks without any blocking others', async () => {
      const result = await drainDetection.analyzeTransaction({
        transactionBase64: 'test_tx',
        walletPubkey: 'test_wallet',
        instructionData: { amount: '100', discriminator: 'transfer' },
      });
      const checkNames = result.flags.map(f => f.check_name);
      expect(checkNames).toContain('calldata_analysis');
      expect(checkNames).toContain('contract_age');
      expect(checkNames).toContain('approval_amount');
      expect(checkNames).toContain('phishing_domain');
      expect(checkNames).toContain('velocity');
      expect(checkNames).toContain('spending_dna');
      expect(checkNames).toContain('new_address_quarantine');
      expect(checkNames).toContain('simulation_mismatch');
    });
  });
});
