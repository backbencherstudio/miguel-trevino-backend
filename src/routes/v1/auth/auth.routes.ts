import { FastifyInstance } from "fastify";
import {
  getRecentOtp,
  registerSendOtp,
  registerVerifyOtp,
  googleAuth,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset,
  forgotPasswordRecentOtp,
  email2FASendOtp
} from "./auth.controllers";

const authRoutes = (fastify: FastifyInstance) => {

  // User Registration and OTP Verification
  fastify.post("/register/sendotp", registerSendOtp);
  fastify.post("/register/verifyotp", registerVerifyOtp);
  fastify.post("/register/recentotp", getRecentOtp); 

  //google auth
  fastify.post("/register/google", googleAuth);

  //forgot passwors
  fastify.post("/forgotpassword/sendotp", forgotPasswordSendOtp);
  fastify.post("/forgotpassword/verifyotp", forgotPasswordVerifyOtp);
  fastify.post("/forgotpassword/reset", forgotPasswordReset);
  fastify.post("/forgotpassword/recentotp", forgotPasswordRecentOtp); 
  
  //TwoFactor authentication (2FA)
  fastify.post("/2fa/email/sendotp", email2FASendOtp);

  

};

export default authRoutes;
