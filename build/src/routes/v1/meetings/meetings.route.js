"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const meetings_controllers_1 = require("./meetings.controllers");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const meetingRoutes = (fastify) => {
    fastify.get("/", { preHandler: (0, auth_middleware_1.verifyUser)("user", "admin") }, meetings_controllers_1.getMeetingsData);
};
exports.default = meetingRoutes;
//# sourceMappingURL=meetings.route.js.map