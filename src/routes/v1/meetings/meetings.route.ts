import { FastifyInstance } from "fastify";
import { getMeetingsData } from "./meetings.controllers";
import { verifyUser } from "../../../middleware/auth.middleware";

const meetingRoutes = (fastify: FastifyInstance) => {

  fastify.get("/",{preHandler: verifyUser("user", "admin")},getMeetingsData);
  
};

export default meetingRoutes;
