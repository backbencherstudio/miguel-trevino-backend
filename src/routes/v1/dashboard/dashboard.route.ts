import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { dashboardCalculation } from "./dashboard.controller";

const dashboardRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/calculation",
    // {
    //   preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    // },
    dashboardCalculation
  );
};

export default dashboardRoutes;
