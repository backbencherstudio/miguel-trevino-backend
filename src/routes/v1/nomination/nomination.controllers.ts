import fs from "fs";
import path from "path";
import { getImageUrl } from "../../../utils/baseurl";
import { uploadsDir } from "../../../config/storage.config";

export const createNomination = async (request, reply) => {
  try {
    const {
      commodityType,
      Origin,
      volume,
      destination,
      unit,
      transportMode,
      BeginningDate,
      EndDate,
      Notes,
      userId,
    } = request.body;

    const missingField = [
      "commodityType",
      "Origin",
      "volume",
      "destination",
      "unit",
      "transportMode",
      "BeginningDate",
      "EndDate",
    ].find((field) => !request.body[field]);

    if (missingField) {
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    const prisma = request.server.prisma;
    const admin = request.user?.type;
    const userIde = admin === "admin" ? userId : request.user?.id;

    if (admin === "admin" && !userId) {
      return reply.status(400).send({
        success: false,
        message: "user entity require",
      });
    }

    const nomination = await prisma.nomination.create({
      data: {
        commodityType,
        Origin,
        volume,
        destination,
        unit,
        transportMode,
        BeginningDate,
        EndDate,
        Notes,
        userId: userIde,
        status: admin === "admin" ? "Confirmed" : "Submitted",
      },
    });

    const { userId: _, ...withoutId } = nomination;

    return reply.status(200).send({
      success: true,
      message: "Nomination create successfull",
      data: withoutId,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const uploadSchedule = async (request, reply) => {
  try {
    const { nominationId } = request.params;
    console.log(nominationId)

    if (!nominationId) {
      return reply.status(400).send({
        success: false,
        message: "nominationId is required!",
      });
    }

    if (!request.file) {
      return reply.status(400).send({
        success: false,
        message: "scheduleFile is required!",
      });
    }

    const prisma = request.server.prisma;

    // Find nomination
    const nomination = await prisma.nomination.findUnique({
      where: { id: nominationId },
      select: { scheduleFile: true },
    });

    if (!nomination) {
      return reply.status(404).send({
        success: false,
        message: "Nomination not found!",
      });
    }

    if (nomination.scheduleFile) {
      const oldFilePath = path.join(uploadsDir, nomination.scheduleFile);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const updatedNomination = await prisma.nomination.update({
      where: { id: nominationId },
      data: { scheduleFile: request.file.filename },
      select: {
        id: true,
        commodityType: true,
        destination: true,
        scheduleFile: true,
        requestedDate: true,
      },
    });

    return reply.status(200).send({
      success: true,
      message: "Schedule file uploaded successfully",
      data: {
        ...updatedNomination,
        scheduleFile: updatedNomination.scheduleFile
          ? getImageUrl(`/uploads/${updatedNomination.scheduleFile}`)
          : null,
      },
    });
  } catch (error) {
    request.log.error(error);

    // Clean up the newly uploaded file if error occurs
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
