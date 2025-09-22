import { FastifyInstance } from "fastify";
import { verifyUser } from "../../../middleware/auth.middleware";
import {
  getMyNotifications,
  readAllNotifications,
  deleteNotifications,
} from "./notification.controllers";

const notificationRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/my",
    { preHandler: verifyUser("user", "admin") },
    getMyNotifications
  );

  fastify.post(
    "/read-all",
    { preHandler: verifyUser("user", "admin") },
    readAllNotifications
  );
 
  
  fastify.delete(
    "/delete-many",
    { preHandler: verifyUser("user", "admin") },
    deleteNotifications
  );
};

export default notificationRoutes;
