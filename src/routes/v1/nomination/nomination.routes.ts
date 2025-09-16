import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import {
  createNomination,
  getAllNominations,
  getMyNominations,
  uploadSchedule,
} from "./nomination.controllers";

const nominationRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("user", "admin"),
    },
    createNomination
  );

  fastify.post(
    "/uploads-schedule/:nominationId",
    {
      preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    },
    uploadSchedule
  );

  fastify.get(
    "/my",
    {
      preHandler: verifyUser("user"),
    },
    getMyNominations
  );

  fastify.get("/all", { preHandler: verifyUser("admin") }, getAllNominations);
};

export default nominationRoutes;
