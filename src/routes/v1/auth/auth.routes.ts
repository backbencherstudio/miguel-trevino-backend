import { FastifyInstance } from "fastify";
import { login, register, getProfile } from "./auth.controllers";

// Use a unique route name to avoid conflicts
const authRoutes = (fastify: FastifyInstance) => {
  fastify.post("/auth-login", login);
  fastify.post("/auth-register", register);
  fastify.get("/auth-profile", getProfile);
};

export default authRoutes;
