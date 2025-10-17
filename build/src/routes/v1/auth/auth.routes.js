"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controllers_1 = require("./auth.controllers");
const storage_config_1 = require("../../../config/storage.config");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const authRoutes = (fastify) => {
    // User Registration and OTP Verification
    fastify.post("/register/sendotp", auth_controllers_1.registerSendOtp);
    fastify.post("/register/verifyotp", auth_controllers_1.registerVerifyOtp);
    fastify.post("/register/recentotp", auth_controllers_1.getRecentOtp);
    ///login
    //google auth
    fastify.post("/register/google", auth_controllers_1.googleAuth);
    //manual log
    fastify.post("/user/login", auth_controllers_1.usersLogin);
    fastify.post("/admin/login", auth_controllers_1.adminLogin);
    //forgot passwors
    fastify.post("/forgotpassword/sendotp", auth_controllers_1.forgotPasswordSendOtp);
    fastify.post("/forgotpassword/verifyotp", auth_controllers_1.forgotPasswordVerifyOtp);
    fastify.post("/forgotpassword/reset", auth_controllers_1.forgotPasswordReset);
    fastify.post("/forgotpassword/recentotp", auth_controllers_1.forgotPasswordRecentOtp);
    //TwoFactor authentication (2FA)
    fastify.post("/2fa/email/sendotp", auth_controllers_1.email2FASendOtp);
    fastify.post("/2fa/email/verifyotp", auth_controllers_1.email2FAVerifyOtp);
    fastify.post("/2fa/email/recentotp", auth_controllers_1.email2FARecentOtp);
    //controll parmitions
    fastify.patch("/parmitions", { preHandler: (0, auth_middleware_1.verifyUser)("user", "admin") }, auth_controllers_1.parmitions);
    fastify.patch("/update", {
        preHandler: [(0, auth_middleware_1.verifyUser)("user", "admin"), storage_config_1.upload.single("avatar")],
    }, auth_controllers_1.updateUser);
    fastify.get("/me", {
        preHandler: [(0, auth_middleware_1.verifyUser)("user", "admin")],
    }, auth_controllers_1.getUserProfile);
};
exports.default = authRoutes;
//# sourceMappingURL=auth.routes.js.map