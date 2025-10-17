"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../../../middleware/auth.middleware");
const users_coontrollers_1 = require("./users.coontrollers");
const userRoutes = (fastify) => {
    fastify.get("/all", {
        preHandler: (0, auth_middleware_1.verifyUser)("admin"),
    }, users_coontrollers_1.getAllusers);
    fastify.post("/toactive/:userId", {
        preHandler: (0, auth_middleware_1.verifyUser)("admin"),
    }, users_coontrollers_1.deactiveToActiveUser);
    fastify.get("/search", {
        preHandler: (0, auth_middleware_1.verifyUser)("admin"),
    }, users_coontrollers_1.searchUsers);
};
exports.default = userRoutes;
//# sourceMappingURL=users.routes.js.map