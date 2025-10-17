"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_routes_1 = __importDefault(require("./auth/auth.routes"));
const meetings_route_1 = __importDefault(require("./meetings/meetings.route"));
const nomination_routes_1 = __importDefault(require("./nomination/nomination.routes"));
const schedule_route_1 = __importDefault(require("./schedule/schedule.route"));
const dashboard_route_1 = __importDefault(require("./dashboard/dashboard.route"));
const message_routes_1 = __importDefault(require("./message/message.routes"));
const notification_routes_1 = __importDefault(require("./notification/notification.routes"));
const users_routes_1 = __importDefault(require("./users/users.routes"));
async function routesV1(fastify) {
    const moduleRoutes = [
        { path: "/auth", route: auth_routes_1.default },
        { path: "/meetings", route: meetings_route_1.default },
        { path: "/nomination", route: nomination_routes_1.default },
        { path: "/schedule", route: schedule_route_1.default },
        { path: "/dashboard", route: dashboard_route_1.default },
        { path: "/message", route: message_routes_1.default },
        { path: "/notification", route: notification_routes_1.default },
        { path: "/users", route: users_routes_1.default }
    ];
    moduleRoutes.forEach(({ path, route }) => {
        fastify.register(route, { prefix: path });
    });
}
exports.default = routesV1;
//# sourceMappingURL=index.js.map