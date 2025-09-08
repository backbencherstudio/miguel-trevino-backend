import { FastifyInstance } from "fastify";
import {
  getRecentOtp,
  registerSendOtp,
  registerVerifyOtp,
  googleAuth
} from "./auth.controllers";

const authRoutes = (fastify: FastifyInstance) => {

  // User Registration and OTP Verification
  fastify.post("/register/sendotp", registerSendOtp);
  fastify.post("/register/verifyotp", registerVerifyOtp);
  fastify.post("/register/recentotp", getRecentOtp); 

  //google auth
  fastify.post("/register/google", googleAuth);

};

export default authRoutes;
