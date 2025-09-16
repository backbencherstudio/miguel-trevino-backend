import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { getAllSchedules, getMySchedules, uploadSchedule } from "./schedule.controllers";

const scheduleRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    uploadSchedule
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
};

export default scheduleRoutes;
