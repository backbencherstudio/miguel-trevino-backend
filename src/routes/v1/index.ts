import { FastifyInstance } from "fastify";
import auth from "./auth/auth.routes";
import meetings from "./meetings/meetings.route";
import nomination from "./nomination/nomination.routes";
import schedule from "./schedule/schedule.route";
 
import dashboard from "./dashboard/dashboard.route";
import message from "./message/message.routes";
import notification from "./notification/notification.routes"
import users from "./users/users.routes";

async function routesV1(fastify: FastifyInstance) {
  const moduleRoutes = [
    { path: "/auth", route: auth },
    { path: "/meetings", route: meetings },
    { path: "/nomination", route: nomination },
    { path: "/schedule", route: schedule },
    { path: "/dashboard", route: dashboard },
    { path: "/message", route: message },
    { path: "/notification", route: notification },
    { path: "/users", route: users }
  ];

  moduleRoutes.forEach(({ path, route }) => {
    fastify.register(route, { prefix: path });
  });
}

export default routesV1;
