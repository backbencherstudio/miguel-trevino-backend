"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_config_1 = require("../../../config/storage.config");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const schedule_controllers_1 = require("./schedule.controllers");
const scheduleRoutes = (fastify) => {
    fastify.post("/", {
        preHandler: [(0, auth_middleware_1.verifyUser)("admin"), storage_config_1.upload.single("scheduleFile")],
    }, schedule_controllers_1.uploadSchedule);
    fastify.get("/", {
        preHandler: [(0, auth_middleware_1.verifyUser)("admin")],
    }, schedule_controllers_1.getAllSchedules);
    fastify.get("/my", {
        preHandler: [(0, auth_middleware_1.verifyUser)("user")],
    }, schedule_controllers_1.getMySchedules);
    fastify.put("/:id", {
        preHandler: [(0, auth_middleware_1.verifyUser)("admin"), storage_config_1.upload.single("scheduleFile")],
    }, schedule_controllers_1.updateSchedule);
    fastify.delete("/delete/:scheduleId", { preHandler: (0, auth_middleware_1.verifyUser)("admin") }, schedule_controllers_1.deleteSchedules);
};
exports.default = scheduleRoutes;
//# sourceMappingURL=schedule.routes.js.map