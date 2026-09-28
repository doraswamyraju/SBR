const { Server } = require('socket.io');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');

let io = null;

/**
 * Initialize Socket.IO with HTTP server
 * @param {import('http').Server} server 
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Join room for a specific service request (Customer or Admin tracking)
    socket.on('join:request', (data) => {
      const requestId = typeof data === 'string' ? data : (data.requestId || data.room?.replace('request:', ''));
      if (requestId) {
        socket.join(`request:${requestId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined request:${requestId}`);
      }
    });

    socket.on('leave:request', (data) => {
      const requestId = typeof data === 'string' ? data : (data.requestId || data.room?.replace('request:', ''));
      if (requestId) {
        socket.leave(`request:${requestId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left request:${requestId}`);
      }
    });

    // Join room for a specific agent
    socket.on('join:agent', (data) => {
      const agentId = typeof data === 'string' ? data : data.agentId;
      if (agentId) {
        socket.join(`agent:${agentId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined agent:${agentId}`);
      }
    });

    // Join role-based room (e.g. 'ADMIN', 'STORE_INCHARGE')
    socket.on('join:role', (data) => {
      const role = (typeof data === 'string' ? data : data.role)?.toUpperCase();
      if (role) {
        socket.join(`role:${role}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined role:${role}`);
      }
    });

    // Live agent location broadcast received from field agent
    socket.on('agent:location:send', async (payload) => {
      const {
        requestId,
        agentId,
        latitude,
        longitude,
        heading = 0,
        speed = 0,
        timestamp = Date.now()
      } = payload;

      if (!latitude || !longitude) return;

      const updateData = {
        requestId,
        agentId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        heading: parseFloat(heading),
        speed: parseFloat(speed),
        timestamp
      };

      // 1. Broadcast immediately to request room (Customer real-time map)
      if (requestId) {
        io.to(`request:${requestId}`).emit('agent:location:update', updateData);
      }

      // 2. Broadcast to agent room
      if (agentId) {
        io.to(`agent:${agentId}`).emit('agent:location:update', updateData);
      }

      // 3. Broadcast to Admin and Store In-Charge live fleet view
      io.to('role:ADMIN').emit('agent:location:update', updateData);
      io.to('role:STORE_INCHARGE').emit('agent:location:update', updateData);

      // 4. Asynchronously persist location point to ServiceRequest history in DB
      if (requestId) {
        try {
          await ServiceRequest.findByIdAndUpdate(
            requestId,
            {
              $push: {
                locationPath: {
                  latitude: parseFloat(latitude),
                  longitude: parseFloat(longitude),
                  timestamp: new Date(timestamp)
                }
              }
            },
            { new: false }
          );
        } catch (dbErr) {
          console.error('[Socket.IO] Error appending location to request DB:', dbErr.message);
        }
      }

      // 5. Update agent's current coordinates in User profile
      if (agentId) {
        try {
          await User.findByIdAndUpdate(agentId, {
            currentLat: parseFloat(latitude),
            currentLng: parseFloat(longitude)
          });
        } catch (uErr) {
          console.error('[Socket.IO] Error updating agent current coordinates:', uErr.message);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Emit event to a room or user
 * @param {string} room 
 * @param {string} event 
 * @param {any} data 
 */
const emitSocketEvent = (room, event, data) => {
  if (io) {
    io.to(room).emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitSocketEvent };
