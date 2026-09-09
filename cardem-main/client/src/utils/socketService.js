import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      // Connects to current host/port in dev (proxied to 5000)
      this.socket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('📡 [Client Socket Connected]:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 [Client Socket Disconnected]');
      });
    }
    return this.socket;
  }

  joinConvoy(convoyId, user, vehicle) {
    if (this.socket) {
      this.socket.emit('join_convoy', { convoyId, user, vehicle });
    }
  }

  sendTelemetry(convoyId, telemetry) {
    if (this.socket) {
      this.socket.emit('telemetry_ping', { convoyId, telemetry });
    }
  }

  startPTT(convoyId, driverName) {
    if (this.socket) {
      this.socket.emit('ptt_start', { convoyId, driverName });
    }
  }

  stopPTT(convoyId) {
    if (this.socket) {
      this.socket.emit('ptt_stop', { convoyId });
    }
  }

  broadcastHazard(convoyId, alert) {
    if (this.socket) {
      this.socket.emit('broadcast_hazard', { convoyId, alert });
    }
  }

  leaveConvoy(convoyId) {
    if (this.socket) {
      this.socket.emit('leave_convoy', { convoyId });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

const socketService = new SocketService();
export default socketService;
