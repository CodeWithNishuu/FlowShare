/**
 * FlowShare Connection Manager
 * Manages WebSocket connections, heartbeat, and message routing.
 */
class ConnectionManager {
  constructor() {
    this.connections = new Map(); // deviceId -> ws
  }

  addConnection(deviceId, ws) {
    this.connections.set(deviceId, ws);
  }

  removeConnection(deviceId) {
    this.connections.delete(deviceId);
  }

  getConnection(deviceId) {
    return this.connections.get(deviceId);
  }

  send(deviceId, message) {
    const ws = this.connections.get(deviceId);
    if (ws && ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcast(message, excludeDeviceId = null) {
    const data = JSON.stringify(message);
    for (const [id, ws] of this.connections.entries()) {
      if (id !== excludeDeviceId && ws.readyState === 1) {
        ws.send(data);
      }
    }
  }
}

export default new ConnectionManager();
