import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import {
  getAllSchedules,
  getMySchedules,
  updateSchedule,
  uploadSchedule,
  deleteSchedules
} from "./schedule.controllers";

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

  fastify.put(
    "/:id",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    updateSchedule
  );

  fastify.delete(
    "/delete/:scheduleId",
    { preHandler: verifyUser("admin") },
    deleteSchedules
  );
};




export default scheduleRoutes;
