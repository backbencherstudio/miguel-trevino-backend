"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
///src/plugins/socket.ts
const fastify_plugin_1 = __importDefault(require("fastify-plugin"));
const socket_io_1 = require("socket.io");
exports.default = (0, fastify_plugin_1.default)(async (fastify) => {
    const io = new socket_io_1.Server(fastify.server, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:50468", "http://localhost:4002", "http://127.0.0.1:5500"],
            methods: ["GET", "POST"],
            credentials: true
        },
    });
    io.on("connection", (socket) => {
        fastify.log.info(`Socket connected: ${socket.id}`);
        socket.on("join_room", ({ roomId, userType }) => {
            socket.join(roomId);
            if (userType === "admin") {
                fastify.log.info(`Admin joined room: ${roomId}`);
            }
            else {
                fastify.log.info(`User joined their room: ${roomId}`);
            }
        });
        // --- TYPING EVENTS ---
        socket.on("typing", ({ roomId, user }) => {
            socket.to(roomId).emit("user_typing", user);
        });
        socket.on("stop_typing", ({ roomId, user }) => {
            socket.to(roomId).emit("user_stop_typing", user);
        });
        socket.on("disconnect", () => {
            fastify.log.info(`Socket disconnected: ${socket.id}`);
        });
    });
    fastify.decorate("io", io);
});
//# sourceMappingURL=socket.js.map