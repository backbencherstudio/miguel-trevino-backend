"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const storage_config_1 = require("../../../config/storage.config");
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const nomination_controllers_1 = require("./nomination.controllers");
const nominationRoutes = (fastify) => {
    fastify.post("/create", {
        preHandler: (0, auth_middleware_1.verifyUser)("user", "admin"),
    }, nomination_controllers_1.createNomination);
    fastify.post("/uploads-schedule/:nominationId", {
        preHandler: [(0, auth_middleware_1.verifyUser)("admin"), storage_config_1.upload.single("scheduleFile")],
    }, nomination_controllers_1.uploadSchedule);
    fastify.get("/my", {
        preHandler: (0, auth_middleware_1.verifyUser)("user"),
    }, nomination_controllers_1.getMyNominations);
    fastify.get("/all", { preHandler: (0, auth_middleware_1.verifyUser)("admin") }, nomination_controllers_1.getAllNominations);
    fastify.patch("/status/:nominationId", { preHandler: (0, auth_middleware_1.verifyUser)("admin") }, nomination_controllers_1.updateNominationStatus);
    fastify.delete("/delete/:nominationId", { preHandler: (0, auth_middleware_1.verifyUser)("admin") }, nomination_controllers_1.deleteNomination);
};
exports.default = nominationRoutes;
//# sourceMappingURL=nomination.routes.js.map