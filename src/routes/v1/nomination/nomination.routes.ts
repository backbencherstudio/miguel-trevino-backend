import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import {
  createNomination,
  getAllNominations,
  getMyNominations,
  uploadSchedule,
  updateNominationStatus,
  deleteNomination
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

  fastify.patch("/status/:nominationId", { preHandler: verifyUser("admin") }, updateNominationStatus);

  fastify.delete("/delete/:nominationId", { preHandler: verifyUser("admin") }, deleteNomination);

};

export default nominationRoutes;
