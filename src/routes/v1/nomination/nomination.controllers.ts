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
    const randomNum = Math.floor(100000 + Math.random() * 900000);

    const nomination = await prisma.nomination.create({
      data: {
        commodityType,
        nominationId: `#${randomNum}`,
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
    console.log(nominationId);

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

export const getMyNominations = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { id } = request.user;

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const startDate = request.query.startDate
      ? new Date(request.query.startDate)
      : null;
    const endDate = request.query.endDate
      ? new Date(request.query.endDate)
      : null;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      userId: id,
    };

    if (startDate && endDate) {
      whereClause.requestedDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.requestedDate = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.requestedDate = {
        lte: endDate,
      };
    }

    const totalItems = await prisma.nomination.count({
      where: whereClause,
    });

    const nominations = await prisma.nomination.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
    });

    const formattedNominations = nominations.map((nomination) => ({
      ...nomination,
      scheduleFile: nomination.scheduleFile
        ? getImageUrl(`/uploads/${nomination.scheduleFile}`)
        : null,
    }));

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return reply.status(200).send({
      success: true,
      message: "Nominations retrieved successfully",
      data: formattedNominations,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
      count: formattedNominations.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllNominations = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const startDate = request.query.startDate
      ? new Date(request.query.startDate)
      : null;
    const endDate = request.query.endDate
      ? new Date(request.query.endDate)
      : null;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.requestedDate = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.requestedDate = {
        gte: startDate,
      };
    } else if (endDate) {
      whereClause.requestedDate = {
        lte: endDate,
      };
    }

    const totalItems = await prisma.nomination.count({
      where: whereClause,
    });

    const nominations = await prisma.nomination.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        id: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    const formattedNominations = nominations.map((nomination) => ({
      ...nomination,
      scheduleFile: nomination.scheduleFile
        ? getImageUrl(`/uploads/${nomination.scheduleFile}`)
        : null,
      user: {
        ...nomination.user,
        avatar: nomination.user?.avatar
          ? getImageUrl(`/uploads/${nomination.user.avatar}`)
          : null,
      },
    }));

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return reply.status(200).send({
      success: true,
      message: "All nominations retrieved successfully",
      data: formattedNominations,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
      count: formattedNominations.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
