import { FastifyInstance } from "fastify";
import auth from "./auth/auth.routes";
import meetings from "./meetings/meetings.route";
import nomination from "./nomination/nomination.routes"
import schedule from  "./schedule/schedule.route"
async function routesV1(fastify: FastifyInstance) {
  const moduleRoutes = [
    { path: "/auth", route: auth },
    { path: "/meetings", route: meetings },
    { path: "/nomination", route: nomination},
    { path: "/schedule", route: schedule }
  ];

  moduleRoutes.forEach(({ path, route }) => {
    fastify.register(route, { prefix: path });
  });
}

export default routesV1;