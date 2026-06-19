import { RuleEngineService } from '../../src/services/rule-engine.service.js';
import { DEFAULT_SLIPPAGE_MAX_BPS, DEFAULT_GAS_PRICE_CEILING } from '@discifi/shared';

const ruleEngine = new RuleEngineService();

describe('RuleEngineService', () => {
  describe('evaluateTransaction', () => {
    it('should pass when all rules are satisfied', async () => {
      const result = await ruleEngine.evaluateTransaction('test_wallet', {
        walletPubkey: 'test_wallet',
        transactionAmount: 1000,
        gasPrice: 5000,
        slippage: 50,
        currentHour: 14,
      });
      expect(result.passed).toBe(true);
      expect(result.failed_rules).toHaveLength(0);
    });

    it('should fail time lock rule when outside allowed hours', async () => {
      const result = await ruleEngine.evaluateTransaction('test_wallet', {
        walletPubkey: 'test_wallet',
        transactionAmount: 1000,
        gasPrice: 5000,
        slippage: 50,
        currentHour: 3,
      });
      const timeLock = result.rule_events.find(e => e.rule_name === 'time_lock');
      expect(timeLock).toBeDefined();
    });

    it('should fail gas price rule when above ceiling', async () => {
      const result = await ruleEngine.evaluateTransaction('test_wallet', {
        walletPubkey: 'test_wallet',
        transactionAmount: 1000,
        gasPrice: DEFAULT_GAS_PRICE_CEILING + 1000000,
        slippage: 50,
        currentHour: 14,
      });
      const gasCheck = result.rule_events.find(e => e.rule_name === 'gas_price');
      expect(gasCheck?.passed).toBe(false);
      expect(result.failed_rules).toContain('gas_price');
    });

    it('should fail slippage rule when above max bps', async () => {
      const result = await ruleEngine.evaluateTransaction('test_wallet', {
        walletPubkey: 'test_wallet',
        transactionAmount: 1000,
        gasPrice: 5000,
        slippage: DEFAULT_SLIPPAGE_MAX_BPS + 100,
        currentHour: 14,
      });
      const slippageCheck = result.rule_events.find(e => e.rule_name === 'slippage');
      expect(slippageCheck?.passed).toBe(false);
    });
  });
});
