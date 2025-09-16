import fs from "fs";
import path from "path";
import { getImageUrl } from "../../../utils/baseurl";
import { uploadsDir } from "../../../config/storage.config";

export const uploadSchedule = async (request, reply) => {
  try {
    const { assignTo, commodityType, transportMode } = request.body;

    const missingField = ["assignTo", "commodityType", "transportMode"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      if (request.file?.path && fs.existsSync(request.file.path)) {
        fs.unlinkSync(request.file.path);
      }
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    if (!request.file) {
      return reply.status(400).send({
        success: false,
        message: "scheduleFile is required!",
      });
    }

    const prisma = request.server.prisma;

    const user = await prisma.user.findUnique({
      where: { id: assignTo },
      select: { id: true, avatar: true },
    });

    if (!user) {
      if (request.file?.path && fs.existsSync(request.file.path)) {
        fs.unlinkSync(request.file.path);
      }
      return reply.status(400).send({
        success: false,
        message: "User not found for assignTo",
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        commodityType,
        transportMode,
        scheduleFile: request.file.filename,
        user: {
          connect: { id: assignTo },
        },
      },
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
      message: "Schedule uploaded successfully",
      data: {
        ...schedule,
        scheduleFile: getImageUrl(`/uploads/${request.file.filename}`),
        user: {
          ...schedule.user,
          avatar: schedule.user?.avatar
            ? getImageUrl(`/uploads/${schedule.user.avatar}`)
            : null,
        },
      },
    });
  } catch (error) {
    request.log.error(error);

    if (request.file?.path && fs.existsSync(request.file.path)) {
      fs.unlinkSync(request.file.path);
    }

    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
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
