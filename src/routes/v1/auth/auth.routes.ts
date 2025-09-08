import { FastifyInstance } from "fastify";
import {
  getRecentOtp,
  registerSendOtp,
  registerVerifyOtp,
  googleAuth,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset
} from "./auth.controllers";

const authRoutes = (fastify: FastifyInstance) => {

  // User Registration and OTP Verification
  fastify.post("/register/sendotp", registerSendOtp);
  fastify.post("/register/verifyotp", registerVerifyOtp);
  fastify.post("/register/recentotp", getRecentOtp); 

  //google auth
  fastify.post("/register/google", googleAuth);

  //forgot passwors
  // 1. get email and send otp
  // 2. verify otp
  // 3. reset password
  fastify.post("/forgotpassword/sendotp", forgotPasswordSendOtp);
  fastify.post("/forgotpassword/verifyotp", forgotPasswordVerifyOtp);
  fastify.post("/forgotpassword/reset", forgotPasswordReset);
};

export default authRoutes;
