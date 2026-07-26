/**
 * FlowShare Device Registry
 * Manages registered peer devices in the local network segment.
 */
class DeviceRegistry {
  constructor() {
    this.devices = new Map();
  }

  register(deviceId, metadata, ws) {
    const existing = this.devices.get(deviceId) || {};
    const updated = {
      id: deviceId,
      name: metadata.name || `Device-${deviceId.slice(0, 4)}`,
      type: metadata.type || 'Desktop', // Desktop, Mobile, Tablet
      os: metadata.os || 'Windows',
      ip: metadata.ip || '192.168.1.100',
      battery: metadata.battery !== undefined ? metadata.battery : null,
      signalStrength: metadata.signalStrength || 95,
      connectionQuality: metadata.connectionQuality || 'Excellent',
      latency: metadata.latency || 12,
      isOnline: true,
      lastSeen: Date.now(),
      ws: ws,
    };
    this.devices.set(deviceId, updated);
    return updated;
  }

  unregister(deviceId) {
    if (this.devices.has(deviceId)) {
      const device = this.devices.get(deviceId);
      device.isOnline = false;
      device.lastSeen = Date.now();
      // Delete after a grace period or retain for history
      this.devices.delete(deviceId);
    }
  }

  getDevice(deviceId) {
    return this.devices.get(deviceId);
  }

  getAllDevices(excludeId = null) {
    const result = [];
    for (const [id, dev] of this.devices.entries()) {
      if (id !== excludeId && dev.isOnline) {
        // Strip non-serializable ws object
        const { ws, ...safeDev } = dev;
        result.push(safeDev);
      }
    }
    return result;
  }

  updateStatus(deviceId, partial) {
    if (this.devices.has(deviceId)) {
      const dev = this.devices.get(deviceId);
      Object.assign(dev, partial);
      dev.lastSeen = Date.now();
    }
  }
}

export default new DeviceRegistry();
