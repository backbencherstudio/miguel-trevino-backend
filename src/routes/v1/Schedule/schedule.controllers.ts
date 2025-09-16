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
