import { FastifyInstance } from "fastify";
import { getMeetingsData } from "./meetings.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const authRoutes = (fastify: FastifyInstance) => {

  fastify.get("/",{preHandler: verifyUser("user", "admin")},getMeetingsData);
  
};

export default authRoutes;
