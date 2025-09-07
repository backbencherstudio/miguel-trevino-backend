import { FastifyRequest, FastifyReply } from "fastify";
import { otpVerificationEmail } from "../../../utils/email.config";

// Interfaces para las solicitudes
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export const register = async (request, reply) => {
  try {
    const { firstName, lastName, email, password, conformPassword } =
      request.body;

    const missingField = [
      "firstName",
      "lastName",
      "email",
      "password",
      "conformPassword",
    ].find((field) => !request.body[field]);

    if (missingField) {
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    if (password !== conformPassword) {
      return reply.status(400).send({ error: "Passwords do not match" });
    }

    // const prisma = request.server.prisma;
    const redis = request.server.redis;

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const otpExpiry = Date.now() + 5 * 60 * 1000;

    otpVerificationEmail(email, otp);

    await redis
      .multi()
      .hset(`user:${email}`, {
        name: `${firstName} ${lastName}`,
        email,
        password,
        otp,
        expiration: otpExpiry.toString(),
      })
      .expire(`user:${email}`, 5 * 60)
      .exec();

    return reply
      .status(200)
      .send({ success: true, message: "OTP stored in Redis" });
  } catch (error) {
    request.log.error(error);
    return reply
      .status(500)
      .send({ succes: false, error: error, message: "Internal Server Error" });
  }
};

export const login = async (
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) => {
  try {
    const { email, password } = request.body;

    return reply.code(200).send({
      success: true,
      message: "Login exitoso",
      data: {
        token: "jwt-token-simulado",
        user: {
          email,
          name: "Usuario Simulado",
        },
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Error en el servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};

// Controlador para el registro

// Controlador para obtener el perfil del usuario
export const getProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    // Aquí iría la lógica para obtener el perfil del usuario autenticado
    // Por ahora, solo devolvemos una respuesta simulada

    return reply.code(200).send({
      success: true,
      message: "Perfil obtenido exitosamente",
      data: {
        user: {
          id: 1,
          name: "Usuario Simulado",
          email: "usuario@ejemplo.com",
        },
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Error en el servidor",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
};
