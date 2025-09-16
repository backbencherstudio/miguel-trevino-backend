import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { uploadSchedule } from "./schedule.controllers";


const authRoutes = (fastify: FastifyInstance) => {

  fastify.post(
    "/schedule/:",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    uploadSchedule
  );

};

export default authRoutes;
