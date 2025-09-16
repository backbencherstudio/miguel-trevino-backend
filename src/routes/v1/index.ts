import { FastifyInstance } from "fastify";
import auth from "./auth/auth.routes";
import meetings from "./meetings/meetings.route";
import nomination from "./nomination/nomination.routes"
import schedule from  "./schedule/schedule.route"
import dashboard from "./dashboard/dashboard.route"

async function routesV1(fastify: FastifyInstance) {
  const moduleRoutes = [
    { path: "/auth", route: auth },
    { path: "/meetings", route: meetings },
    { path: "/nomination", route: nomination},
    { path: "/schedule", route: schedule },
    { path: "/dashboard", route: dashboard }

  ];

  moduleRoutes.forEach(({ path, route }) => {
    fastify.register(route, { prefix: path });
  });
}

export default routesV1;