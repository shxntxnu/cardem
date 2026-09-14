// Convoy Real-Time Socket.io Gateway: Live Map Telemetry, PTT Voice, Navigation Sync, and Global Member Presence

module.exports = function (io) {
  const convoyRooms = new Map(); // convoyId -> Set of active socket IDs
  const activeOnlineDrivers = new Map(); // userId -> { socketId, userId, name, avatar, vehicle, location, convoyId, lastActive }

  io.on('connection', (socket) => {
    console.log(`⚡ [Socket Connected]: ${socket.id}`);

    // Global Presence: Track all logged-in drivers on the enthusiast map at all times (Step 3)
    socket.on('global_presence_ping', ({ user, vehicle, location }) => {
      if (!user || (!user.id && !user._id) || !location) return;
      const uid = String(user.id || user._id);
      socket.userId = uid;
      socket.user = user;
      socket.vehicle = vehicle;

      activeOnlineDrivers.set(uid, {
        userId: uid,
        socketId: socket.id,
        name: user.name || 'Enthusiast Driver',
        avatar: user.avatar,
        vehicle: vehicle || { make: 'Car', model: 'Ride', vehicle_type: 'Car' },
        location: {
          lat: Number(location.lat),
          lng: Number(location.lng),
          heading: Number(location.heading || 0),
          speed: Number(location.speed || 0)
        },
        convoyId: socket.convoyId || null,
        lastActive: Date.now()
      });

      // Broadcast list of all active logged-in drivers
      io.emit('global_drivers_updated', Array.from(activeOnlineDrivers.values()));
    });

    // Join Convoy Room
    socket.on('join_convoy', ({ convoyId, user, vehicle }) => {
      if (!convoyId) return;

      const roomName = `convoy_${convoyId}`;
      socket.join(roomName);
      socket.convoyId = convoyId;
      if (user) {
        socket.user = user;
        socket.userId = String(user.id || user._id);
      }
      if (vehicle) socket.vehicle = vehicle;

      if (!convoyRooms.has(convoyId)) {
        convoyRooms.set(convoyId, new Set());
      }
      convoyRooms.get(convoyId).add(socket.id);

      // Update convoyId in global presence if registered
      if (socket.userId && activeOnlineDrivers.has(socket.userId)) {
        const d = activeOnlineDrivers.get(socket.userId);
        d.convoyId = convoyId;
        activeOnlineDrivers.set(socket.userId, d);
        io.emit('global_drivers_updated', Array.from(activeOnlineDrivers.values()));
      }

      console.log(`🚗 Driver ${user?.name || socket.id} joined convoy room ${roomName}`);

      // Notify others in the convoy
      socket.to(roomName).emit('driver_joined', {
        socketId: socket.id,
        user,
        vehicle,
        timestamp: new Date()
      });
    });

    // Real-Time GPS Telemetry Streaming within Convoy
    socket.on('telemetry_ping', ({ convoyId, telemetry }) => {
      if (!convoyId || !telemetry) return;
      const roomName = `convoy_${convoyId}`;

      // Update in global active online list as well
      if (socket.userId && activeOnlineDrivers.has(socket.userId)) {
        const d = activeOnlineDrivers.get(socket.userId);
        d.location = {
          lat: telemetry.lat,
          lng: telemetry.lng,
          heading: telemetry.heading || 0,
          speed: telemetry.speed_kph || telemetry.speed || 0
        };
        d.lastActive = Date.now();
        activeOnlineDrivers.set(socket.userId, d);
      }

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
          speed_kph: telemetry.speed_kph || telemetry.speed || 0,
          altitude: telemetry.altitude || 0,
          accuracy: telemetry.accuracy || 0,
          timestamp: new Date()
        }
      });
    });

    // Step 2: Synchronize Convoy Navigation Destination & Multi-Stop Sequence across all members
    socket.on('set_convoy_destination', ({ convoyId, destination, waypoints }) => {
      if (!convoyId || (!destination && (!waypoints || waypoints.length === 0))) return;
      const roomName = `convoy_${convoyId}`;

      const targetDest = destination || (waypoints && waypoints[waypoints.length - 1]);
      console.log(`🎯 Convoy destination set to "${targetDest?.name}" by ${socket.user?.name || socket.id}`);

      // Broadcast destination and ordered waypoints to all convoy members
      socket.to(roomName).emit('convoy_destination_updated', {
        destination: targetDest ? {
          name: targetDest.name,
          display_name: targetDest.display_name || targetDest.name,
          coordinates: targetDest.coordinates, // [lng, lat]
          lat: targetDest.lat !== undefined ? targetDest.lat : targetDest.coordinates?.[1],
          lng: targetDest.lng !== undefined ? targetDest.lng : targetDest.coordinates?.[0],
          setBy: socket.user?.name || 'Convoy Host'
        } : null,
        waypoints: Array.isArray(waypoints) ? waypoints : [],
        isHostRoute: true,
        hostName: socket.user?.name || 'Convoy Host',
        timestamp: new Date()
      });
    });

    // Step 3: Host finalises the convoy route sequence to unlock group "Go" button
    socket.on('finalise_convoy_route', ({ convoyId, destination, waypoints }) => {
      if (!convoyId) return;
      const roomName = `convoy_${convoyId}`;

      console.log(`🔒 Convoy route finalised by ${socket.user?.name || socket.id}`);

      socket.to(roomName).emit('convoy_route_finalised', {
        destination,
        waypoints: Array.isArray(waypoints) ? waypoints : [],
        isRouteFinalised: true,
        finalisedBy: socket.user?.name || 'Convoy Host',
        timestamp: new Date()
      });
    });

    // Walkie-Talkie Push-to-Talk (PTT): Voice Transmission Start
    socket.on('ptt_start', ({ convoyId, driverName }) => {
      if (!convoyId) return;
      const roomName = `convoy_${convoyId}`;

      console.log(`🎙️ PTT Started by ${driverName || socket.id} in ${roomName}`);

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

      if (socket.userId && activeOnlineDrivers.has(socket.userId)) {
        const d = activeOnlineDrivers.get(socket.userId);
        d.convoyId = null;
        activeOnlineDrivers.set(socket.userId, d);
        io.emit('global_drivers_updated', Array.from(activeOnlineDrivers.values()));
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

      if (socket.userId && activeOnlineDrivers.has(socket.userId)) {
        activeOnlineDrivers.delete(socket.userId);
        io.emit('global_drivers_updated', Array.from(activeOnlineDrivers.values()));
      }

      console.log(`🔌 [Socket Disconnected]: ${socket.id}`);
    });
  });
};
