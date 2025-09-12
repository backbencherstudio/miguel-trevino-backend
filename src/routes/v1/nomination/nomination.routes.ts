import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { createNomination } from "./nomination.controllers";

const authRoutes = (fastify: FastifyInstance) => {
  fastify.post(
    "/create",
    {
      preHandler: verifyUser("user", "admin"),
    },
    createNomination
  );

  
};

export default authRoutes;
