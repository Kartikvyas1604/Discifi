import { SimulationService } from '../../src/services/simulation.service.js';

const simulation = new SimulationService();

describe('SimulationService', () => {
  describe('simulateTransaction', () => {
    it('should handle RPC failures gracefully', async () => {
      const result = await simulation.simulateTransaction(
        'invalid_base64_tx',
        'expected_outcome',
      );
      expect(result.simulation_passed).toBe(false);
      expect(result.actual_outcome).toContain('unavailable');
      expect(result.mismatch_detected).toBe(false);
    });

    it('should return simulation result structure', async () => {
      const result = await simulation.simulateTransaction('test_tx', 'test_outcome');
      expect(result).toHaveProperty('simulation_passed');
      expect(result).toHaveProperty('expected_outcome');
      expect(result).toHaveProperty('actual_outcome');
      expect(result).toHaveProperty('mismatch_detected');
      expect(result).toHaveProperty('token_changes');
      expect(result).toHaveProperty('programs_invoked');
      expect(result).toHaveProperty('estimated_fee');
    });
  });
});
