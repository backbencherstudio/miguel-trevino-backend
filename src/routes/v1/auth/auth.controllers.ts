import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import { otpVerificationEmail } from "../../../utils/email.config";
import jwt from "jsonwebtoken";
import { generateJwtToken } from "../../../utils/jwt.utils";

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

export const registerSendOtp = async (request, reply) => {
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

    const prisma = request.server.prisma;
    const redis = request.server.redis;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(400).send({
        success: false,
        message: "User with this email already exists",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const otpExpiry = Date.now() + 5 * 60 * 1000;

    otpVerificationEmail(email, otp);

    await redis
      .multi()
      .hset(`register-verify-otp:${email}`, {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        password,
        otp,
        expiration: otpExpiry.toString(),
      })
      .expire(`register-verify-otp:${email}`, 5 * 60)
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

export const registerVerifyOtp = async (request, reply) => {
  try {
    const { email, otp } = request.body;

    if (!email || !otp) {
      return reply.status(400).send({
        success: false,
        message: "Email and OTP are required!",
      });
    }

    const redis = request.server.redis;
    const prisma = request.server.prisma;

    const userData = await redis.hgetall(`register-verify-otp:${email}`);
    console.log(userData);
    if (!Object.keys(userData || {}).length) {
      return reply.status(400).send({
        success: false,
        message: "not found! please register again",
      });
    }

    if (userData.otp !== otp) {
      return reply.status(400).send({
        success: false,
        message: "Invalid OTP!",
      });
    }

    const now = Date.now();
    if (now > parseInt(userData.expiration)) {
      return reply.status(400).send({
        success: false,
        message: "OTP expired!",
      });
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const fullName = `${userData.firstName} ${userData.lastName}`;

    const newUser = await prisma.user.create({
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: fullName,
        email: userData.email,
        password: hashedPassword,
      },
    });

    await redis.del(`register-verify-otp:${email}`);

    const token = generateJwtToken({ id: newUser.id, email: newUser.email });

    const { password, ...userdata } = newUser;

    return reply.status(200).send({
      success: true,
      message: "user registered successfully!",
      data: userdata,
      token,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getRecentOtp = async (request, reply) => {
  try {
    const { email } = request.body;

    if (!email) {
      return reply.status(400).send({
        success: false,
        message: "Email is required!",
      });
    }

    const redis = request.server.redis;

    const otpData = await redis.hgetall(`register-verify-otp:${email}`);

    if (!Object.keys(otpData || {}).length) {
      return reply.status(404).send({
        success: false,
        message: "not found! please register again",
      });
    }

    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const newExpiry = Date.now() + 5 * 60 * 1000;

   await redis
      .multi()
      .hset(`register-verify-otp:${email}`, {
        ...otpData,
        otp: newOtp,
        expiration: newExpiry.toString(),
      })
      .expire(`register-verify-otp:${email}`, 5 * 60)
      .exec();

    otpVerificationEmail(email, newOtp);

    return reply.status(200).send({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
