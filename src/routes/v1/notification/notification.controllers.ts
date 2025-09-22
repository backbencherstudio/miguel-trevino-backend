import { getImageUrl } from "../../../utils/baseurl";

export const getMyNotifications = async (request, reply) => {
  try {
    const { prisma } = request.server;
    const { id: userId } = request.user;
    const { page = 1, limit = 10 } = request.query;

    const currentPage = Math.max(1, Number(page));
    const itemsPerPage = Math.max(1, Math.min(Number(limit), 100));
    const skip = (currentPage - 1) * itemsPerPage;

    const [totalItems, unreadCount] = await Promise.all([
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } })
    ]);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: itemsPerPage,
    });

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return reply.status(200).send({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      count: notifications.length,
      unreadCount,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        itemsPerPage,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
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
