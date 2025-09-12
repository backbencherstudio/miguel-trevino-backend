import { FastifyInstance } from "fastify";
import auth from "./auth/auth.routes";
import meetings from "./meetings/meetings.route";

async function routesV1(fastify: FastifyInstance) {
  const moduleRoutes = [
    { path: "/auth", route: auth },
    { path: "/meetings", route: meetings },
  ];

  moduleRoutes.forEach(({ path, route }) => {
    fastify.register(route, { prefix: path });
  });
}

export default routesV1;

//UFO_TOKEN

//TRY_TO_HACK: eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzU3NTg3NDEwLCJqdGkiOiJmYmEwZDA3My00YzFiLTQ0NjEtYTlmYS01MzU5Yjc2OWRkZjAiLCJ1c2VyX3V1aWQiOiIxNjMzNWNlMS01ZTU2LTRmZWItYjRiYS1kNDYyYWQ4MGQ3N2IifQ.XG-_7tyZMSRpUxAMatRVhgS-_kVP-MVOXkrUkXelj2J149YNINeAjoZldQI-YsBEKZeHE22NowiwXeDmZ53RwQ

//eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzU3NTg3NDEwLCJqdGkiOiJmYmEwZDA3My00YzFiLTQ0NjEtYTlmYS01MzU5Yjc2OWRkZjAiLCJ1c2VyX3V1aWQiOiIxNjMzNWNlMS01ZTU2LTRmZWItYjRiYS1kNDYyYWQ4MGQ3N2IifQ.XG-_7tyZMSRpUxAMatRVhgS-_kVP-MVOXkrUkXelj2J149YNINeAjoZldQI-YsBEKZeHE22NowiwXeDmZ53RwQ
