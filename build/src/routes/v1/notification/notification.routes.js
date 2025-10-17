"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const notification_controllers_1 = require("./notification.controllers");
const notificationRoutes = (fastify) => {
    fastify.get("/my", { preHandler: (0, auth_middleware_1.verifyUser)("user", "admin") }, notification_controllers_1.getMyNotifications);
    fastify.post("/read-all", { preHandler: (0, auth_middleware_1.verifyUser)("user", "admin") }, notification_controllers_1.readAllNotifications);
    fastify.delete("/delete-many", { preHandler: (0, auth_middleware_1.verifyUser)("user", "admin") }, notification_controllers_1.deleteNotifications);
};
exports.default = notificationRoutes;
//# sourceMappingURL=notification.routes.js.map