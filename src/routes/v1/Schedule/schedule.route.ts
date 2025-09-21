import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import {
  getAllSchedules,
  getMySchedules,
  updateSchedule,
  getMyNotifications,
} from "./schedule.controllers";

const scheduleRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    getMyNotifications
  );

  fastify.get(
    "/",
    {
      preHandler: [verifyUser("admin")],
    },
    getAllSchedules
  );

  fastify.get(
    "/my",
    {
      preHandler: [verifyUser("user")],
    },
    getMySchedules
  );

  fastify.put(
    "/:id",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    updateSchedule
  );
};

export default scheduleRoutes;
