import { FastifyInstance } from "fastify";
import { login, register, getProfile } from "./auth.controllers";

const authRoutes = (fastify: FastifyInstance) => {


  fastify.post("/register/sendotp", register);

  fastify.post("/auth-login", login);
  fastify.get("/auth-profile", getProfile);
};

export default authRoutes;
