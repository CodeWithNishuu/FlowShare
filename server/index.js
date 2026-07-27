import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import os from 'os';

import deviceRegistry from './deviceRegistry.js';
import sessionManager from './sessionManager.js';
import connectionManager from './connectionManager.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Get local network interfaces & IP
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const SERVER_IP = getLocalIp();
const PORT = process.env.PORT || 4000;

// REST API Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    appName: 'FlowShare Backend',
    version: '1.0.0',
    ip: SERVER_IP,
    port: PORT,
    activeDevicesCount: deviceRegistry.getAllDevices().length,
  });
});

app.get('/api/network-info', (req, res) => {
  res.json({
    ip: SERVER_IP,
    subnet: `${SERVER_IP.split('.').slice(0, 3).join('.')}.0/24`,
    interfaceName: 'Wi-Fi / LAN',
    signalStrength: 98,
    speedMbps: 1200,
    latencyMs: 8,
  });
});

app.get('/api/devices', (req, res) => {
  const currentDeviceId = req.query.excludeId || null;
  res.json({ devices: deviceRegistry.getAllDevices(currentDeviceId) });
});

// WebSocket Protocol Signaling
wss.on('connection', (ws, req) => {
  let clientDeviceId = null;
  const rawIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : req.socket.remoteAddress
    ? req.socket.remoteAddress.replace('::ffff:', '')
    : '127.0.0.1';
  const clientIp = rawIp;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      const { type, payload, senderId, targetId } = msg;

      switch (type) {
        case 'REGISTER_DEVICE': {
          clientDeviceId = senderId;
          connectionManager.addConnection(senderId, ws);
          const devData = { ...payload, ip: payload?.ip || clientIp };
          const dev = deviceRegistry.register(senderId, devData, ws);

          // Reply with registration confirmation and list of online devices
          ws.send(JSON.stringify({
            type: 'REGISTERED',
            payload: {
              device: dev,
              serverIp: SERVER_IP,
              onlineDevices: deviceRegistry.getAllDevices(senderId)
            }
          }));

          // Notify existing devices about the new peer
          connectionManager.broadcast({
            type: 'DEVICE_JOINED',
            payload: { device: dev }
          }, senderId);
          break;
        }

        case 'GET_DISCOVERED_DEVICES': {
          ws.send(JSON.stringify({
            type: 'DISCOVERED_DEVICES_LIST',
            payload: { devices: deviceRegistry.getAllDevices(senderId) }
          }));
          break;
        }

        // WebRTC Signaling: SDP Offer, Answer, ICE Candidate
        case 'WEBRTC_OFFER':
        case 'WEBRTC_ANSWER':
        case 'WEBRTC_ICE_CANDIDATE': {
          if (targetId) {
            connectionManager.send(targetId, {
              type,
              senderId,
              targetId,
              payload
            });
          }
          break;
        }

        // Transfer Negotiation Handshake
        case 'TRANSFER_REQUEST': {
          const session = sessionManager.createSession(senderId, targetId, payload.files);
          connectionManager.send(targetId, {
            type: 'INCOMING_TRANSFER_REQUEST',
            senderId,
            targetId,
            payload: {
              sessionId: session.id,
              senderName: payload.senderName || 'Peer',
              senderDevice: payload.senderDevice || 'Unknown Device',
              files: payload.files,
              totalBytes: session.totalBytes,
              totalFiles: session.totalFiles,
              estimatedTimeSec: Math.ceil(session.totalBytes / (15 * 1024 * 1024)), // ~15MB/s LAN baseline
            }
          });
          break;
        }

        case 'TRANSFER_RESPONSE': {
          const { sessionId, accepted, reason } = payload;
          const session = sessionManager.getSession(sessionId);
          if (session) {
            sessionManager.updateSession(sessionId, {
              status: accepted ? 'accepted' : 'rejected'
            });
            // Inform sender of response
            connectionManager.send(session.senderId, {
              type: 'TRANSFER_RESPONSE_RESULT',
              senderId,
              payload: {
                sessionId,
                accepted,
                reason: reason || (accepted ? 'Accepted by receiver' : 'Declined by receiver'),
              }
            });
          }
          break;
        }

        case 'TRANSFER_CONTROL': {
          // Pause, Resume, Cancel commands relayed between peers
          if (targetId) {
            connectionManager.send(targetId, {
              type: 'TRANSFER_CONTROL_COMMAND',
              senderId,
              payload
            });
          }
          break;
        }

        case 'TRANSFER_PROGRESS': {
          if (targetId) {
            connectionManager.send(targetId, {
              type: 'TRANSFER_PROGRESS_UPDATE',
              senderId,
              payload
            });
          }
          break;
        }

        case 'FALLBACK_FILE_CHUNK': {
          // Direct fallback WebSocket chunk transfer for restricted WebRTC networks
          if (targetId) {
            connectionManager.send(targetId, {
              type: 'RECEIVE_FALLBACK_FILE_CHUNK',
              senderId,
              payload
            });
          }
          break;
        }

        case 'HEARTBEAT': {
          if (clientDeviceId) {
            deviceRegistry.updateStatus(clientDeviceId, payload || {});
            ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
          }
          break;
        }

        default:
          console.log(`[WebSocket] Unknown message type: ${type}`);
      }
    } catch (err) {
      console.error('[WebSocket Error]', err);
    }
  });

  ws.on('close', () => {
    if (clientDeviceId) {
      connectionManager.removeConnection(clientDeviceId);
      deviceRegistry.unregister(clientDeviceId);
      connectionManager.broadcast({
        type: 'DEVICE_LEFT',
        payload: { deviceId: clientDeviceId }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  FlowShare Express & Signaling Server Running  `);
  console.log(`  Local Address: http://localhost:${PORT}        `);
  console.log(`  Network IP:    http://${SERVER_IP}:${PORT}      `);
  console.log(`=================================================`);
});
