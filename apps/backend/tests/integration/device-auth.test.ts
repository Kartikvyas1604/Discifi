import { DeviceAuthService } from '../../src/services/device-auth.service.js';
import { AuthenticationError, DeviceError } from '../../src/errors/index.js';

const deviceAuth = new DeviceAuthService();

describe('DeviceAuthService Integration', () => {
  const VALID_DEVICE_ID = 'test_device_001';

  describe('registerDevice', () => {
    it('should reject invalid certificate', async () => {
      await expect(
        deviceAuth.registerDevice({
          device_id: VALID_DEVICE_ID,
          attestation_certificate: 'invalid_cert',
          firmware_version: '1.0.0',
          platform: 'ios',
          app_version: '1.0.0',
        }),
      ).rejects.toThrow(DeviceError);
    });
  });

  describe('authenticateDevice', () => {
    it('should reject non-existent device', async () => {
      await expect(
        deviceAuth.authenticateDevice({
          device_id: 'nonexistent',
          signature: 'sig',
          challenge: 'challenge',
        }),
      ).rejects.toThrow(DeviceError);
    });
  });

  describe('security: authentication failures', () => {
    it('should throw 401 on invalid signature', async () => {
      await expect(
        deviceAuth.authenticateDevice({
          device_id: VALID_DEVICE_ID,
          signature: 'invalid_signature',
          challenge: 'test_challenge',
        }),
      ).rejects.toThrow();
    });
  });
});
