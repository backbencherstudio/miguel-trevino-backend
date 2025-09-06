// plugins/socket.ts
import fp from "fastify-plugin"
import { Server } from "socket.io"

export default fp(async (fastify) => {
  const io = new Server(fastify.server, {
    cors: { origin: "*" },
  })

  io.on("connection", (socket) => {
    fastify.log.info("Socket connected: " + socket.id)
    socket.on("message", (msg) => {
      fastify.log.info("Received: " + msg)
    })
  })

  fastify.decorate("io", io)
})

declare module "fastify" {
  interface FastifyInstance {
    io: Server
  }
}
