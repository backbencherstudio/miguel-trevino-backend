"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dashboard_controller_1 = require("./dashboard.controller");
const dashboardRoutes = (fastify) => {
    fastify.get("/calculation", 
    // {
    //   preHandler: [verifyUser("admin"), upload.single("scheduleFile")],
    // },
    dashboard_controller_1.dashboardCalculation);
    fastify.get('/schedule-statistics', dashboard_controller_1.getScheduleStatistics);
};
exports.default = dashboardRoutes;
//# sourceMappingURL=dashboard.route.js.map