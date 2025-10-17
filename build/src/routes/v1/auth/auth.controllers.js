"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.updateUser = exports.parmitions = exports.email2FARecentOtp = exports.email2FAVerifyOtp = exports.email2FASendOtp = exports.forgotPasswordRecentOtp = exports.forgotPasswordReset = exports.forgotPasswordVerifyOtp = exports.forgotPasswordSendOtp = exports.adminLogin = exports.usersLogin = exports.googleAuth = exports.getRecentOtp = exports.registerVerifyOtp = exports.registerSendOtp = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_config_1 = require("../../../utils/email.config");
const jwt_utils_1 = require("../../../utils/jwt.utils");
const baseurl_1 = require("../../../utils/baseurl");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const otplib_1 = require("otplib");
const storage_config_1 = require("../../../config/storage.config");
const downloadAndSaveImage = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok)
            throw new Error("Failed to download image");
        const buffer = await response.arrayBuffer();
        const filename = `${(0, uuid_1.v4)()}.jpg`;
        const uploadDir = path_1.default.join(__dirname, "../../../../uploads");
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const filepath = path_1.default.join(uploadDir, filename);
        fs_1.default.writeFileSync(filepath, Buffer.from(buffer));
        return filename;
    }
    catch (error) {
        console.error("Error saving image:", error);
        throw new Error("Failed to download and save image");
    }
};
const registerSendOtp = async (request, reply) => {
    try {
        const { firstName, lastName, email, password, conformPassword } = request.body;
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
        (0, email_config_1.otpVerificationEmail)(email, otp);
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
            .send({ success: true, message: "send otp to your email!" });
    }
    catch (error) {
        request.log.error(error);
        return reply
            .status(500)
            .send({ succes: false, error: error, message: "Internal Server Error" });
    }
};
exports.registerSendOtp = registerSendOtp;
const registerVerifyOtp = async (request, reply) => {
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
        const hashedPassword = await bcrypt_1.default.hash(userData.password, 10);
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
        const chatRoom = await prisma.chatRoom.create({
            data: {
                userId: newUser.id,
            },
        });
        console.log("roome :", chatRoom);
        await redis.del(`register-verify-otp:${email}`);
        const token = (0, jwt_utils_1.generateJwtToken)({
            id: newUser.id,
            email: newUser.email,
            type: newUser.type,
        });
        const { password, ...userdata } = newUser;
        return reply.status(200).send({
            success: true,
            message: "user registered successfully!",
            data: userdata,
            token,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
exports.registerVerifyOtp = registerVerifyOtp;
const getRecentOtp = async (request, reply) => {
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
        (0, email_config_1.otpVerificationEmail)(email, newOtp);
        return reply.status(200).send({
            success: true,
            message: "OTP resent successfully",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getRecentOtp = getRecentOtp;
///login
const googleAuth = async (request, reply) => {
    const parseNameFromFullName = (fullName) => {
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
        return { firstName, lastName };
    };
    try {
        const { email, name, image } = request.body;
        const missingField = ["email", "name", "image"].find((field) => !request.body[field]);
        if (missingField) {
            return reply.status(400).send({
                success: false,
                message: `${missingField} is required!`,
            });
        }
        const prisma = request.server.prisma;
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            const token = (0, jwt_utils_1.generateJwtToken)({
                id: existingUser.id,
                email: existingUser.email,
                type: existingUser.type,
            });
            const userResponse = {
                ...existingUser,
                avatar: existingUser.avatar
                    ? (0, baseurl_1.getImageUrl)(`/uploads/${existingUser.avatar}`)
                    : null,
            };
            return reply.status(200).send({
                success: true,
                message: "User found, login successful!",
                data: userResponse,
                token,
            });
        }
        const processedAvatar = image ? await downloadAndSaveImage(image) : null;
        const { firstName, lastName } = parseNameFromFullName(name);
        const newUser = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                fullName: name,
                ...(processedAvatar && { avatar: processedAvatar }),
            },
        });
        const chatRoom = await prisma.chatRoom.create({
            data: {
                userId: newUser.id,
            },
        });
        if (chatRoom) {
            console.log("chatRoom: ", chatRoom);
        }
        console.log(chatRoom);
        console.log("roome :", chatRoom);
        const token = (0, jwt_utils_1.generateJwtToken)({
            id: newUser.id,
            email: newUser.email,
            type: newUser.type,
        });
        const userResponse = {
            ...newUser,
            avatar: newUser.avatar ? (0, baseurl_1.getImageUrl)(`/uploads/${newUser.avatar}`) : null,
        };
        return reply.status(201).send({
            success: true,
            message: "New user created successfully!",
            data: userResponse,
            token,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.googleAuth = googleAuth;
const usersLogin = async (request, reply) => {
    try {
        const { email, password } = request.body;
        const missingField = ["email", "password"].find((field) => !request.body[field]);
        if (missingField) {
            return reply.status(400).send({
                success: false,
                message: `${missingField} is required!`,
            });
        }
        const prisma = request.server.prisma;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.type === "admin") {
            return reply.status(404).send({
                success: false,
                message: "User not found",
            });
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return reply.status(401).send({
                success: false,
                message: "Invalid password",
            });
        }
        const token = (0, jwt_utils_1.generateJwtToken)({
            id: user.id,
            email: user.email,
            type: user.type,
        });
        const userResponse = {
            ...user,
            avatar: user.avatar ? (0, baseurl_1.getImageUrl)(`/uploads/${user.avatar}`) : null,
        };
        delete userResponse.password;
        return reply.status(200).send({
            success: true,
            message: "Login successful",
            data: userResponse,
            token,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.usersLogin = usersLogin;
const adminLogin = async (request, reply) => {
    try {
        const { email, password } = request.body;
        const missingField = ["email", "password"].find((field) => !request.body[field]);
        if (missingField) {
            return reply.status(400).send({
                success: false,
                message: `${missingField} is required!`,
            });
        }
        const prisma = request.server.prisma;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.type === "user") {
            return reply.status(404).send({
                success: false,
                message: "Credential not match!",
            });
        }
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch) {
            return reply.status(401).send({
                success: false,
                message: "Invalid password",
            });
        }
        const token = (0, jwt_utils_1.generateJwtToken)({
            id: user.id,
            email: user.email,
            type: user.type,
        });
        const userResponse = {
            ...user,
            avatar: user.avatar ? (0, baseurl_1.getImageUrl)(`/uploads/${user.avatar}`) : null,
        };
        delete userResponse.password;
        return reply.status(200).send({
            success: true,
            message: "admin Login successful",
            data: userResponse,
            token,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.adminLogin = adminLogin;
const forgotPasswordSendOtp = async (request, reply) => {
    try {
        const { email } = request.body;
        if (!email) {
            return reply.status(400).send({
                success: false,
                message: "Email is required!",
            });
        }
        const prisma = request.server.prisma;
        const redis = request.server.redis;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (!existingUser) {
            return reply.status(404).send({
                success: false,
                message: "User with this email does not exist",
            });
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000;
        (0, email_config_1.forgotPasswordEmail)(email, otp);
        await redis
            .multi()
            .hset(`forgot-password-otp:${email}`, {
            email,
            otp,
            expiration: otpExpiry.toString(),
            userId: existingUser.id.toString(),
            permission_to_update_password: "true",
        })
            .expire(`forgot-password-otp:${email}`, 5 * 60)
            .exec();
        return reply.status(200).send({
            success: true,
            message: "OTP sent to your email for password reset",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.forgotPasswordSendOtp = forgotPasswordSendOtp;
const forgotPasswordVerifyOtp = async (request, reply) => {
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
        const otpData = await redis.hgetall(`forgot-password-otp:${email}`);
        if (!Object.keys(otpData || {}).length) {
            return reply.status(400).send({
                success: false,
                message: "OTP not found or expired!",
            });
        }
        if (otpData.otp !== otp) {
            return reply.status(400).send({
                success: false,
                message: "Invalid OTP!",
            });
        }
        const now = Date.now();
        if (now > parseInt(otpData.expiration)) {
            return reply.status(400).send({
                success: false,
                message: "OTP expired!",
            });
        }
        if (otpData.permission_to_update_password !== "true") {
            return reply.status(400).send({
                success: false,
                message: "Permission to update password not granted!",
            });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "User not found!",
            });
        }
        await redis.expire(`forgot-password-otp:${email}`, 10 * 60);
        return reply.status(200).send({
            success: true,
            message: "OTP verified successfully! You can now reset your password.",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.forgotPasswordVerifyOtp = forgotPasswordVerifyOtp;
const forgotPasswordReset = async (request, reply) => {
    try {
        const { email, password } = request.body;
        if (!email || !password) {
            return reply.status(400).send({
                success: false,
                message: "Email and password are required!",
            });
        }
        const redis = request.server.redis;
        const prisma = request.server.prisma;
        const otpData = await redis.hgetall(`forgot-password-otp:${email}`);
        console.log(otpData);
        if (!Object.keys(otpData || {}).length) {
            return reply.status(400).send({
                success: false,
                message: "Password reset session expired!",
            });
        }
        if (otpData.permission_to_update_password !== "true") {
            return reply.status(400).send({
                success: false,
                message: "Permission to update password not granted!",
            });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "User not found!",
            });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });
        await redis.del(`forgot-password-otp:${email}`);
        return reply.status(200).send({
            success: true,
            message: "Password reset successfully!",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.forgotPasswordReset = forgotPasswordReset;
const forgotPasswordRecentOtp = async (request, reply) => {
    try {
        const { email } = request.body;
        if (!email) {
            return reply.status(400).send({
                success: false,
                message: "Email is required!",
            });
        }
        const redis = request.server.redis;
        const prisma = request.server.prisma;
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (!existingUser) {
            return reply.status(404).send({
                success: false,
                message: "User with this email does not exist",
            });
        }
        const otpData = await redis.hgetall(`forgot-password-otp:${email}`);
        if (!Object.keys(otpData || {}).length) {
            return reply.status(404).send({
                success: false,
                message: "No active OTP session found. Please request a new OTP.",
            });
        }
        const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const newExpiry = Date.now() + 5 * 60 * 1000;
        await redis
            .multi()
            .hset(`forgot-password-otp:${email}`, {
            ...otpData,
            otp: newOtp,
            expiration: newExpiry.toString(),
        })
            .expire(`forgot-password-otp:${email}`, 5 * 60)
            .exec();
        (0, email_config_1.sendForgotPasswordOTP)(email, newOtp);
        return reply.status(200).send({
            success: true,
            message: "New OTP sent successfully",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.forgotPasswordRecentOtp = forgotPasswordRecentOtp;
const email2FASendOtp = async (request, reply) => {
    try {
        const { email } = request.body;
        if (!email) {
            return reply.status(400).send({
                success: false,
                message: "Email is required!",
            });
        }
        const prisma = request.server.prisma;
        const redis = request.server.redis;
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "User does not exist",
            });
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpiry = Date.now() + 5 * 60 * 1000;
        await redis
            .multi()
            .hset(`2fa-otp:${email}`, {
            otp,
            expiration: otpExpiry.toString(),
            userId: user.id.toString(),
        })
            .expire(`2fa-otp:${email}`, 5 * 60)
            .exec();
        (0, email_config_1.sendTwoFactorOtp)(email, otp);
        return reply.status(200).send({
            success: true,
            message: "2FA OTP sent to your email",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.email2FASendOtp = email2FASendOtp;
const email2FAVerifyOtp = async (request, reply) => {
    try {
        const { email, otp } = request.body;
        if (!email || !otp) {
            return reply.status(400).send({
                success: false,
                message: "Email and OTP are required!",
            });
        }
        const prisma = request.server.prisma;
        const redis = request.server.redis;
        const otpData = await redis.hgetall(`2fa-otp:${email}`);
        if (!Object.keys(otpData || {}).length) {
            return reply.status(400).send({
                success: false,
                message: "OTP not found or expired!",
            });
        }
        if (otpData.otp !== otp) {
            return reply.status(400).send({
                success: false,
                message: "Invalid OTP!",
            });
        }
        const now = Date.now();
        if (now > parseInt(otpData.expiration)) {
            return reply.status(400).send({
                success: false,
                message: "OTP expired!",
            });
        }
        const secret = otplib_1.authenticator.generateSecret();
        const user = await prisma.user.update({
            where: { email },
            data: {
                two_factor_authentication: 1,
                secret: secret,
            },
        });
        await redis.del(`2fa-otp:${email}`);
        return reply.status(200).send({
            success: true,
            message: "Two-factor authentication enabled successfully!",
            data: {
                id: user.id,
                email: user.email,
                two_factor_authentication: user.two_factor_authentication,
                secret: user.secret,
            },
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.email2FAVerifyOtp = email2FAVerifyOtp;
const email2FARecentOtp = async (request, reply) => {
    try {
        const { email } = request.body;
        if (!email) {
            return reply.status(400).send({
                success: false,
                message: "Email is required!",
            });
        }
        const prisma = request.server.prisma;
        const redis = request.server.redis;
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "User does not exist",
            });
        }
        const otpData = await redis.hgetall(`2fa-otp:${email}`);
        if (!Object.keys(otpData || {}).length) {
            return reply.status(404).send({
                success: false,
                message: "No active 2FA OTP session found. Please request a new OTP.",
            });
        }
        const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
        const newExpiry = Date.now() + 5 * 60 * 1000;
        await redis
            .multi()
            .hset(`2fa-otp:${email}`, {
            ...otpData,
            otp: newOtp,
            expiration: newExpiry.toString(),
        })
            .expire(`2fa-otp:${email}`, 5 * 60)
            .exec();
        (0, email_config_1.sendTwoFactorOtp)(email, newOtp);
        return reply.status(200).send({
            success: true,
            message: "New 2FA OTP sent successfully",
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.email2FARecentOtp = email2FARecentOtp;
const parmitions = async (request, reply) => {
    try {
        const prisma = request.server.prisma;
        const userId = request.user?.id;
        const { emailAccess, phoneAccess, pushAccess } = request.body;
        if (emailAccess === undefined &&
            phoneAccess === undefined &&
            pushAccess === undefined) {
            return reply.status(400).send({
                success: false,
                message: "At least one permission field",
            });
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(emailAccess !== undefined && { emailAccess }),
                ...(phoneAccess !== undefined && { phoneAccess }),
                ...(pushAccess !== undefined && { pushAccess }),
            },
            select: {
                id: true,
                email: true,
                emailAccess: true,
                phoneAccess: true,
                pushAccess: true,
            },
        });
        return reply.status(200).send({
            success: true,
            message: "Permissions updated successfully.",
            data: updatedUser,
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.parmitions = parmitions;
const updateUser = async (request, reply) => {
    const toInt = (val) => {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? undefined : parsed;
    };
    const removeFile = (filePath) => {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    };
    try {
        const prisma = request.server.prisma;
        const userId = request.user?.id;
        const allowedFields = [
            "firstName",
            "lastName",
            "companyName",
            "jobTitle",
            "phone",
            "timezone",
            "dateFormat",
            "sessionTimeout",
            "passwordExpiry",
        ];
        const updateData = {};
        for (const field of allowedFields) {
            const value = request.body[field];
            if (value !== undefined && value !== null && value !== "") {
                if (field === "passwordExpiry" || field === "sessionTimeout") {
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed)) {
                        updateData[field] = parsed;
                    }
                }
                else {
                    updateData[field] = value;
                }
            }
        }
        if (request.file) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { avatar: true },
            });
            if (currentUser?.avatar) {
                removeFile(path_1.default.join(storage_config_1.uploadsDir, currentUser.avatar));
            }
            updateData.avatar = request.file.filename;
        }
        if (Object.keys(updateData).length === 0) {
            return reply.code(400).send({
                success: false,
                message: "At least one field must be provided for update",
            });
        }
        if (updateData.firstName || updateData.lastName) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { firstName: true, lastName: true },
            });
            updateData.fullName = `${(updateData.firstName ?? user?.firstName) || ""} ${(updateData.lastName ?? user?.lastName) || ""}`.trim();
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                fullName: true,
                companyName: true,
                jobTitle: true,
                phone: true,
                timezone: true,
                dateFormat: true,
                sessionTimeout: true,
                passwordExpiry: true,
                avatar: true,
                two_factor_authentication: true,
                type: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return reply.code(200).send({
            success: true,
            message: "User profile updated successfully",
            data: {
                ...updatedUser,
                avatar: updatedUser.avatar
                    ? (0, baseurl_1.getImageUrl)(`/uploads/${updatedUser.avatar}`)
                    : null,
            },
        });
    }
    catch (error) {
        request.log.error(error);
        if (request.file?.path) {
            removeFile(request.file.path);
        }
        return reply.code(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.updateUser = updateUser;
const getUserProfile = async (request, reply) => {
    try {
        const prisma = request.server.prisma;
        const userId = request.user?.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            return reply.status(404).send({
                success: false,
                message: "User not found",
            });
        }
        const { password, ...userData } = user;
        return reply.status(200).send({
            success: true,
            message: "User profile fetched successfully",
            data: {
                ...userData,
                avatar: user.avatar ? (0, baseurl_1.getImageUrl)(`/uploads/${user.avatar}`) : null,
            },
        });
    }
    catch (error) {
        request.log.error(error);
        return reply.status(500).send({
            success: false,
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.getUserProfile = getUserProfile;
//# sourceMappingURL=auth.controllers.js.map