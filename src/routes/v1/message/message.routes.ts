import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";

const messagenRoutes = (fastify: FastifyInstance) => {
  //Room Routes
  //  Get all chat rooms (for admin)
  //  Get specific user's chat room
  //  Create a new chat room (when creating user)
  //Message Routes
  //  Get all messages in a chat room
  //  Send a message in a chat room
  //  Update a message (edit)
  //  Delete a message
  //  Mark messages as read
};

export default messagenRoutes;
