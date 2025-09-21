import fs from "fs";
import path from "path";
import { getImageUrl } from "../../../utils/baseurl";
import { uploadsDir } from "../../../config/storage.config";

export const getMyNotifications = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { id } = request.user;

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.notification.count({
      where: { userId: id },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: id, read: false },
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return reply.status(200).send({
      success: true,
      message: "Notifications retrieved successfully",
      data: notifications,
      count: notifications.length,
      unreadCount: unreadCount,  
      pagination: {
        unreadCount: unreadCount,
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllSchedules = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const page = Number(request.query?.page) || 1;
    const limit = Number(request.query?.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.schedule.count();

    const schedules = await prisma.schedule.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedSchedules = schedules.map((schedule) => ({
      ...schedule,
      scheduleFile: getImageUrl(`/uploads/${schedule.scheduleFile}`),
      user: {
        ...schedule.user,
        avatar: schedule.user?.avatar
          ? getImageUrl(`/uploads/${schedule.user.avatar}`)
          : null,
      },
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return reply.status(200).send({
      success: true,
      message: "Schedules fetched successfully",
      data: formattedSchedules,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getMySchedules = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }

    const page = Number(request.query?.page) || 1;
    const limit = Number(request.query?.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.schedule.count({
      where: { assignTo: userId },
    });

    const schedules = await prisma.schedule.findMany({
      where: { assignTo: userId },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSchedules = schedules.map((schedule) => ({
      ...schedule,
      scheduleFile: getImageUrl(`/uploads/${schedule.scheduleFile}`),
      user: {
        ...schedule.user,
        avatar: schedule.user?.avatar
          ? getImageUrl(`/uploads/${schedule.user.avatar}`)
          : null,
      },
    }));

    const totalPages = Math.ceil(totalItems / limit);

    return reply.status(200).send({
      success: true,
      message: "Your schedules fetched successfully",
      data: formattedSchedules,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateSchedule = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const scheduleId = request.params?.id;
    const { assignTo, commodityType, transportMode } = request.body;

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });

    if (!existingSchedule) {
      if (request.file?.path && fs.existsSync(request.file.path)) {
        fs.unlinkSync(request.file.path);
      }
      return reply.status(404).send({
        success: false,
        message: "Schedule not found",
      });
    }

    const dataToUpdate: any = {};

    if (commodityType) dataToUpdate.commodityType = commodityType;
    if (transportMode) dataToUpdate.transportMode = transportMode;

    if (assignTo) {
      const user = await prisma.user.findUnique({ where: { id: assignTo } });
      if (!user) {
        if (request.file?.path && fs.existsSync(request.file.path)) {
          fs.unlinkSync(request.file.path);
        }
        return reply.status(400).send({
          success: false,
          message: "User not found for assignTo",
        });
      }
      dataToUpdate.user = { connect: { id: assignTo } };
    }

    if (request.file) {
      if (fs.existsSync(path.join(uploadsDir, existingSchedule.scheduleFile))) {
        fs.unlinkSync(path.join(uploadsDir, existingSchedule.scheduleFile));
      }
      dataToUpdate.scheduleFile = request.file.filename;
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return reply.status(200).send({
      success: true,
      message: "Schedule updated successfully",
      data: {
        ...updatedSchedule,
        scheduleFile: getImageUrl(`/uploads/${updatedSchedule.scheduleFile}`),
        user: {
          ...updatedSchedule.user,
          avatar: updatedSchedule.user?.avatar
            ? getImageUrl(`/uploads/${updatedSchedule.user.avatar}`)
            : null,
        },
      },
    });
  } catch (error) {
    request.log.error(error);

    if (request.file?.path && fs.existsSync(request.file.path)) {
      fs.unlinkSync(request.file.path);
    }

    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
