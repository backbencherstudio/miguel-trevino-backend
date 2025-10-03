import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { deactiveToActiveUser, getAllusers } from "./users.coontrollers";

const userRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/all",
    {
      preHandler: verifyUser("admin"),
    },
    getAllusers
  );

  fastify.post(
    "/toactive/:userId",
    {
      preHandler: verifyUser("admin"),
    },
    deactiveToActiveUser
  );
};

export default userRoutes;
