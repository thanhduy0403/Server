// socket.js
let io = null;

function initSocket(server) {
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
  });

  let adminSockets = [];
  let clientSockets = [];
  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    // admin
    socket.on("join_admin", () => {
      socket.join("admins");
      adminSockets.push(socket.id);
      console.log("admin joined", socket.id);
    });
    // client
    socket.on("join_user", (userId) => {
      if (!userId) return;
      socket.join(`user_${userId}`);
      clientSockets.push(socket.id);
      console.log("user joined");
    });

    socket.on("disconnect", () => {
      // admin
      adminSockets = adminSockets.filter((id) => id !== socket.id);
      console.log("socket disconnected:", socket.id);
      // client
      clientSockets = clientSockets.filter((id) => id !== socket.id);
      console.log("socket disconnected", socket.id);
    });
  });
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

module.exports = { initSocket, getIO };
