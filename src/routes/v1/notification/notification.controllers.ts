import { getImageUrl } from "../../../utils/baseurl";

export const getMyNotifications = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { id } = request.user;

    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
    });

    return reply.status(200).send({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      count: notifications.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const readAllNotifications = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { id } = request.user;

    await prisma.notification.updateMany({
      where: { userId: id, read: false },
      data: { read: true },
    });

    return reply.status(200).send({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteNotifications = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { id } = request.user;
    const { notificationIds } = request.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return reply.status(400).send({
        success: false,
        message: "notificationIds must be a non-empty array",
      });
    }

    await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: id,
      },
    });

    return reply.status(200).send({
      success: true,
      message: "Selected notifications deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};
