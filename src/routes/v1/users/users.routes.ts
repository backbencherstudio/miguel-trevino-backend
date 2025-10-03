import { FastifyInstance } from "fastify";

import { upload } from "../../../config/storage.config";
import { verifyUser } from "../../../middleware/auth.middleware";
import { getAllusers } from "./users.coontrollers";

const userRoutes = (fastify: FastifyInstance) => {
  fastify.get(
    "/all",
    {
      preHandler: verifyUser("admin"),
    },
    getAllusers
  );
};

export default userRoutes;
