"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const message_controllers_1 = require("./message.controllers");
const messagenRoutes = (fastify) => {
    fastify.get("/rooms", { preHandler: (0, auth_middleware_1.verifyUser)("admin") }, message_controllers_1.getAllChatRooms);
    //ইউজারের ক্ষেত্রে একটা হার্ড কোডেড নেইম আর ইমেইজ ব্যবহার করতে হবে
    fastify.get("/my-room", { preHandler: (0, auth_middleware_1.verifyUser)("user") }, message_controllers_1.getUserChatRoom);
    fastify.get("/rooms/:roomId", { preHandler: (0, auth_middleware_1.verifyUser)("admin", "user") }, message_controllers_1.getChatformRoom);
    fastify.post("/send-message", { preHandler: (0, auth_middleware_1.verifyUser)("admin", "user") }, message_controllers_1.sendMessage);
};
exports.default = messagenRoutes;
// import { FastifyInstance } from "fastify";
// import { upload } from "../../../config/storage.config";
// import { verifyUser } from "../../../middleware/auth.middleware";
// import { getAllChatRooms, getChatformRoom, sendMessage } from "./message.controllers";
// const messagenRoutes = (fastify: FastifyInstance) => {
//   //Room Routes
//   //  Get all chat rooms (for admin) ok
//   //  Create a new chat room (when creating user) //ok
//   fastify.get("/rooms", { preHandler: verifyUser("admin") }, getAllChatRooms);
//   fastify.get("/rooms/:roomId", { preHandler: verifyUser("admin", "user") }, getChatformRoom);
//   fastify.post("/send-message", { preHandler: verifyUser("admin", "user") }, sendMessage);
//   //Message Routes
//   //  Get all messages in a chat room
//   //  Send a message in a chat room
//   //  Update a message (edit)
//   //  Delete a message
//   //  Mark messages as read
// };
// export default messagenRoutes;
//# sourceMappingURL=message.routes.js.map