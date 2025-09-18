import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { getALlChatRoome, getChatformRoom, sendMessage } from "./message.controllers";

const messagenRoutes = (fastify: FastifyInstance) => {
  //Room Routes
  //  Get all chat rooms (for admin) ok
  //  Create a new chat room (when creating user) //ok

  fastify.get("/rooms", { preHandler: verifyUser("admin") }, getALlChatRoome);
  fastify.post("/send-message", { preHandler: verifyUser("admin", "user") }, sendMessage );
  fastify.get("/rooms/:roomId", { preHandler: verifyUser("admin", "user") }, getChatformRoom);

  //Message Routes
  //  Get all messages in a chat room
  //  Send a message in a chat room

  //  Update a message (edit)
  //  Delete a message
  //  Mark messages as read
};

export default messagenRoutes;
