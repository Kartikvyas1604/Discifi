import { FastifyInstance } from 'fastify';
import { deviceAuthService } from '../services/device-auth.service.js';
import { authenticateRequest } from '../middleware/auth.middleware.js';
import type { DeviceRegistrationRequest, DeviceAuthRequest } from '@discifi/shared';

export async function deviceRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/v1/device/register', {
    schema: {
      body: {
        type: 'object',
        required: ['device_id', 'attestation_certificate', 'firmware_version', 'platform', 'app_version'],
        properties: {
          device_id: { type: 'string' },
          attestation_certificate: { type: 'string' },
          firmware_version: { type: 'string' },
          platform: { type: 'string', enum: ['ios', 'android'] },
          app_version: { type: 'string' },
        },
      },
      response: { 200: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object' } } } },
    },
  }, async (request, reply) => {
    const result = await deviceAuthService.registerDevice(request.body as DeviceRegistrationRequest);
    return reply.send({ success: true, data: result });
  });

  app.post('/api/v1/device/authenticate', {
    schema: {
      body: {
        type: 'object', required: ['device_id', 'signature', 'challenge'],
        properties: { device_id: { type: 'string' }, signature: { type: 'string' }, challenge: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const result = await deviceAuthService.authenticateDevice(request.body as DeviceAuthRequest);
    return reply.send({ success: true, data: result });
  });

  app.post('/api/v1/device/sync', {
    preHandler: [authenticateRequest],
    schema: {
      body: {
        type: 'object', required: ['device_id'],
        properties: { device_id: { type: 'string' }, firmware_version: { type: 'string' }, app_version: { type: 'string' } },
      },
    },
  }, async (request, reply) => {
    const { device_id, firmware_version, app_version } = request.body as any;
    const { DeviceRegistryModel } = await import('../models/device-registry.model.js');
    await DeviceRegistryModel.findOneAndUpdate(
      { device_id },
      {
        $set: { last_sync_at: Date.now(), firmware_version, app_version },
        $push: { sync_history: { timestamp: Date.now(), event_type: 'sync', details: 'Device sync' } },
      },
    );
    return reply.send({ success: true, data: { synced_at: Date.now() } });
  });

  app.delete('/api/v1/device/wipe', {
    preHandler: [authenticateRequest],
  }, async (request, reply) => {
    const { device_id } = request.body as any;
    await deviceAuthService.wipeDevice(device_id);
    return reply.send({ success: true, data: { message: 'Device wiped successfully' } });
  });
}
