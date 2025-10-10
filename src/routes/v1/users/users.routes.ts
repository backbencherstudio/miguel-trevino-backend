import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { deactiveToActiveUser, getAllusers, searchUsers } from "./users.coontrollers";

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


    fastify.get(
    "/search",
    {
      preHandler: verifyUser("admin"),
    },
    searchUsers
  );
};

export default userRoutes;
