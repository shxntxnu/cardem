import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
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

  // Step 3: Global Presence Broadcast - Active drivers on map
  sendGlobalPresence(presenceData) {
    const s = this.connect();
    if (s && s.connected) {
      s.emit('global_presence_ping', presenceData);
    }
  }

  onGlobalDriversUpdated(callback) {
    const s = this.connect();
    s.off('global_drivers_updated');
    s.on('global_drivers_updated', callback);
  }

  // Step 2: Convoy Navigation Destination & Multi-Stop Waypoints Sync
  setConvoyDestination(convoyId, destination, waypoints = []) {
    const s = this.connect();
    if (s) {
      s.emit('set_convoy_destination', { convoyId, destination, waypoints });
    }
  }

  onConvoyDestinationUpdated(callback) {
    const s = this.connect();
    s.off('convoy_destination_updated');
    s.on('convoy_destination_updated', callback);
  }

  // Step 3: Convoy Route Finalised
  finaliseConvoyRoute(convoyId, destination, waypoints = []) {
    const s = this.connect();
    if (s) {
      s.emit('finalise_convoy_route', { convoyId, destination, waypoints });
    }
  }

  onConvoyRouteFinalised(callback) {
    const s = this.connect();
    s.off('convoy_route_finalised');
    s.on('convoy_route_finalised', callback);
  }

  // Convoy Lobby & Roster
  joinConvoy(convoyId, user, vehicle) {
    const s = this.connect();
    if (s) {
      s.emit('join_convoy', { convoyId, user, vehicle });
    }
  }

  leaveConvoy(convoyId) {
    const s = this.connect();
    if (s) {
      s.emit('leave_convoy', { convoyId });
    }
  }

  onDriverJoined(callback) {
    const s = this.connect();
    s.off('driver_joined');
    s.on('driver_joined', callback);
  }

  onDriverLeft(callback) {
    const s = this.connect();
    s.off('driver_left');
    s.on('driver_left', callback);
  }

  // Real-Time GPS Telemetry Streaming
  sendTelemetry(convoyId, telemetry) {
    const s = this.connect();
    if (s) {
      s.emit('telemetry_ping', { convoyId, telemetry });
    }
  }

  onParticipantLocation(callback) {
    const s = this.connect();
    s.off('telemetry_update');
    s.on('telemetry_update', callback);
  }

  // Real-Time Road Hazard Broadcasts
  broadcastHazard(convoyId, alert) {
    const s = this.connect();
    if (s) {
      s.emit('broadcast_hazard', { convoyId, alert });
    }
  }

  onHazardBroadcast(callback) {
    const s = this.connect();
    s.off('hazard_alert_incoming');
    s.on('hazard_alert_incoming', callback);
  }

  // Walkie-Talkie Push-to-Talk (PTT)
  startVoiceTransmission(convoyId, { userId, userName }) {
    const s = this.connect();
    if (s) {
      s.emit('ptt_start', { convoyId, driverName: userName });
    }
  }

  sendVoiceChunk(convoyId, audioChunk) {
    const s = this.connect();
    if (s) {
      s.emit('ptt_audio_data', { convoyId, audioChunk });
    }
  }

  stopVoiceTransmission(convoyId) {
    const s = this.connect();
    if (s) {
      s.emit('ptt_stop', { convoyId });
    }
  }

  onActiveSpeaker(callback) {
    const s = this.connect();
    s.off('ptt_active_speaker');
    s.on('ptt_active_speaker', callback);
  }

  onSpeakerEnded(callback) {
    const s = this.connect();
    s.off('ptt_speaker_ended');
    s.on('ptt_speaker_ended', callback);
  }

  onVoiceChunk(callback) {
    const s = this.connect();
    s.off('ptt_audio_received');
    s.on('ptt_audio_received', callback);
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
