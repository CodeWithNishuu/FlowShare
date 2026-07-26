/**
 * FlowShare Session Manager
 * Manages active file transfer handshakes and transfer sessions between local peers.
 */
class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession(senderId, receiverId, files) {
    const sessionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
    const session = {
      id: sessionId,
      senderId,
      receiverId,
      files,
      totalFiles: files.length,
      totalBytes,
      transferredBytes: 0,
      status: 'pending', // pending, accepted, rejected, transferring, completed, cancelled, failed
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  updateSession(sessionId, updates) {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      Object.assign(session, updates);
      return session;
    }
    return null;
  }

  removeSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

export default new SessionManager();
