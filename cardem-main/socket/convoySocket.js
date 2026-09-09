// Convoy Real-Time Socket.io Gateway: Live Map Telemetry, PTT Voice, and Hazard Broadcasts

module.exports = function (io) {
  const convoyRooms = new Map(); // convoyId -> Set of active socket IDs

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket Connected]: ${socket.id}`);

    // Join Convoy Room
    socket.on('join_convoy', ({ convoyId, user, vehicle }) => {
      if (!convoyId) return;

      const roomName = `convoy_${convoyId}`;
      socket.join(roomName);
      socket.convoyId = convoyId;
      socket.user = user;
      socket.vehicle = vehicle;

      if (!convoyRooms.has(convoyId)) {
        convoyRooms.set(convoyId, new Set());
      }
      convoyRooms.get(convoyId).add(socket.id);

      console.log(`🚗 Driver ${user?.name || socket.id} joined convoy room ${roomName}`);

      // Notify others in the convoy
      socket.to(roomName).emit('driver_joined', {
        socketId: socket.id,
        user,
        vehicle,
        timestamp: new Date()
      });
    });

    // Real-Time GPS Telemetry Streaming
    socket.on('telemetry_ping', ({ convoyId, telemetry }) => {
      if (!convoyId || !telemetry) return;
      const roomName = `convoy_${convoyId}`;

      // Broadcast coordinates, heading, and speed to all participants in convoy
      socket.to(roomName).emit('telemetry_update', {
        socketId: socket.id,
        userId: socket.user?.id || socket.user?._id,
        driverName: socket.user?.name,
        vehicle: socket.vehicle,
        telemetry: {
          lat: telemetry.lat,
          lng: telemetry.lng,
          heading: telemetry.heading || 0,
          speed_kph: telemetry.speed_kph || 0,
          altitude: telemetry.altitude || 0,
          accuracy: telemetry.accuracy || 0,
          timestamp: new Date()
        }
      });
    });

    // Walkie-Talkie Push-to-Talk (PTT): Voice Transmission Start
    socket.on('ptt_start', ({ convoyId, driverName }) => {
      if (!convoyId) return;
      const roomName = `convoy_${convoyId}`;

      console.log(`🎙️ PTT Started by ${driverName || socket.id} in ${roomName}`);

      // Notify all peers to display active speaker wave & duck background audio
      socket.to(roomName).emit('ptt_active_speaker', {
        speakerSocketId: socket.id,
        speakerName: driverName || socket.user?.name || 'Driver',
        speakerUserId: socket.user?.id || socket.user?._id,
        vehicle: socket.vehicle,
        isSpeaking: true,
        timestamp: new Date()
      });
    });

    // Walkie-Talkie: Binary Audio Chunk Stream
    socket.on('ptt_audio_data', ({ convoyId, audioChunk }) => {
      if (!convoyId || !audioChunk) return;
      const roomName = `convoy_${convoyId}`;

      // Broadcast audio payload to convoy participants
      socket.to(roomName).emit('ptt_audio_received', {
        speakerSocketId: socket.id,
        audioChunk
      });
    });

    // Walkie-Talkie Push-to-Talk: Voice Transmission End
    socket.on('ptt_stop', ({ convoyId }) => {
      if (!convoyId) return;
      const roomName = `convoy_${convoyId}`;

      console.log(`🔇 PTT Stopped in ${roomName}`);

      // Notify peers to release audio ducking and restore normal volume
      socket.to(roomName).emit('ptt_speaker_ended', {
        speakerSocketId: socket.id,
        isSpeaking: false,
        timestamp: new Date()
      });
    });

    // Real-Time Road Hazard Broadcast
    socket.on('broadcast_hazard', ({ convoyId, alert }) => {
      if (!convoyId || !alert) return;
      const roomName = `convoy_${convoyId}`;

      console.log(`⚠️ Hazard Broadcast [${alert.alert_type}] in ${roomName}`);

      // Broadcast instant hazard HUD popup with audio alert chime
      socket.to(roomName).emit('hazard_alert_incoming', {
        alert,
        reportedBy: socket.user?.name || 'Convoy Member',
        timestamp: new Date()
      });
    });

    // Leave Convoy
    socket.on('leave_convoy', ({ convoyId }) => {
      if (!convoyId) return;
      const roomName = `convoy_${convoyId}`;
      socket.leave(roomName);

      if (convoyRooms.has(convoyId)) {
        convoyRooms.get(convoyId).delete(socket.id);
      }

      socket.to(roomName).emit('driver_left', {
        socketId: socket.id,
        userId: socket.user?.id || socket.user?._id,
        driverName: socket.user?.name
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (socket.convoyId) {
        const roomName = `convoy_${socket.convoyId}`;
        socket.to(roomName).emit('driver_left', {
          socketId: socket.id,
          userId: socket.user?.id || socket.user?._id,
          driverName: socket.user?.name
        });

        if (convoyRooms.has(socket.convoyId)) {
          convoyRooms.get(socket.convoyId).delete(socket.id);
        }
      }
      console.log(`🔌 [Socket Disconnected]: ${socket.id}`);
    });
  });
};
