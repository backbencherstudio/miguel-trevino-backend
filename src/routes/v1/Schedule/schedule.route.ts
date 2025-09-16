import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { uploadSchedule } from "./schedule.controllers";


const scheduleRoutes = (fastify: FastifyInstance) => {

  fastify.post(
    "/",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    uploadSchedule
  );

};

export default scheduleRoutes;
