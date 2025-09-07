import { FastifyInstance } from "fastify";
import {
  getRecentOtp,
  registerSendOtp,
  registerVerifyOtp,
} from "./auth.controllers";

const authRoutes = (fastify: FastifyInstance) => {
  fastify.post("/register/sendotp", registerSendOtp);
  fastify.post("/register/verifyotp", registerVerifyOtp);
   fastify.post("/register/recentotp", getRecentOtp); 

};

export default authRoutes;
