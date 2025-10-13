import fs from "fs";
import path from "path";
import { getImageUrl } from "../../../utils/baseurl";
import { uploadsDir } from "../../../config/storage.config";

export const createNomination = async (request, reply) => {
  try {
    // const CommodityTypes = [
    //   "NGLs",
    //   "Refined_Products",
    //   "Natural_Gas",
    //   "Petrochemicals",
    //   "Crude_Oil",
    // ];
    // const Volumes = ["low", "medium", "high"];
    // const Units = ["bbls", "gallons", "MCF", "tons"];
    // const TransportModes = ["Pipeline", "Trucking", "Railcar", "Marine"];
    // const NominationStatus = ["Submitted", "Complete", "Withdraw"];

    const {
      commodityType,
      assetGroup,
      origin,
      volume,
      destination,
      unit,
      transportMode,
      beginningDate,
      endDate,
      notes,
      userId,
      connection,
    } = request.body;

    const missingField = [
      "commodityType",
      "assetGroup",
      "origin",
      "volume",
      "destination",
      "unit",
      "transportMode",
      "beginningDate",
      "endDate",
      "connection",
    ].find((field) => !request.body[field]);

    if (missingField) {
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    // // --- Step 2: Enum Validation ---
    // if (!CommodityTypes.includes(commodityType)) {
    //   return reply.status(400).send({
    //     success: false,
    //     message: `Invalid commodityType: "${commodityType}". Allowed values are: ${CommodityTypes.join(
    //       ", "
    //     )}`,
    //   });
    // }

    // if (!Volumes.includes(volume)) {
    //   return reply.status(400).send({
    //     success: false,
    //     message: `Invalid volume: "${volume}". Allowed values are: ${Volumes.join(
    //       ", "
    //     )}`,
    //   });
    // }

    // if (!Units.includes(unit)) {
    //   return reply.status(400).send({
    //     success: false,
    //     message: `Invalid unit: "${unit}". Allowed values are: ${Units.join(
    //       ", "
    //     )}`,
    //   });
    // }

    // if (!TransportModes.includes(transportMode)) {
    //   return reply.status(400).send({
    //     success: false,
    //     message: `Invalid transportMode: "${transportMode}". Allowed values are: ${TransportModes.join(
    //       ", "
    //     )}`,
    //   });
    // }

    const prisma = request.server.prisma;
    const admin = request.user?.type;
    const userIde = admin === "admin" ? userId : request.user?.id;

    if (admin === "admin" && !userId) {
      return reply.status(400).send({
        success: false,
        message: "user entity require",
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userIde },
      select: { id: true },
    });

    if (!targetUser) {
      return reply.status(400).send({
        success: false,
        message: "Invalid userId. User does not exist.",
      });
    }
    const randomNum = Math.floor(100000 + Math.random() * 900000);

    const nomination = await prisma.nomination.create({
      data: {
        commodityType,
        assetGroup,
        nominationId: `#${randomNum}`,
        origin,
        volume,
        destination,
        unit,
        transportMode,
        beginningDate,
        endDate,
        notes,
        userId: userIde,
        status: admin === "admin" ? "Complete" : "Submitted",
        connection,
      },
    });

    if (admin === "admin") {
      await prisma.notification.create({
        data: {
          userId: userIde,
          type: "NominationComplete",
          title: "New Nomination Assigned",
          message: `Admin has created a nomination #${nomination.nominationId} for you.`,
          eventId: nomination.id,
        },
      });
    } else {
      const adminIds = (
        await prisma.user.findMany({
          where: { type: "admin" },
          select: { id: true },
        })
      ).map((a) => a.id);

      if (adminIds.length > 0) {
        await prisma.notification.createMany({
          data: adminIds.map((id) => ({
            userId: id,
            type: "NominationSubmitted",
            title: "New Nomination Submitted",
            message: `A user has submitted a nomination #${nomination.nominationId}.`,
            eventId: nomination.id,
          })),
        });
      }
    }

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

    const startDate =
      request.query.startDate && !isNaN(Date.parse(request.query.startDate))
        ? new Date(request.query.startDate)
        : null;

    const endDate =
      request.query.endDate && !isNaN(Date.parse(request.query.endDate))
        ? new Date(new Date(request.query.endDate).setHours(23, 59, 59, 999))
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
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            type: true,
          },
        },
      },
    });

    const formattedNominations = nominations.map((nomination) => ({
      ...nomination,
      scheduleFile: nomination.scheduleFile
        ? getImageUrl(`/uploads/${nomination.scheduleFile}`)
        : null,
      user: nomination.user
        ? {
            ...nomination.user,
            avatar: nomination.user.avatar
              ? getImageUrl(`/uploads/${nomination.user.avatar}`)
              : null,
          }
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

export const updateNominationStatus = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { nominationId } = request.params;
    const { status } = request.body;

    const allowedStatuses = ["Submitted", "Complete", "Withdraw"];

    if (!nominationId) {
      return reply.status(400).send({
        success: false,
        message: "nominationId is required!",
      });
    }

    if (!status) {
      return reply.status(400).send({
        success: false,
        message: "status is required!",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return reply.status(400).send({
        success: false,
        message: `Invalid status value! Allowed statuses are: ${allowedStatuses.join(", ")}.`,
      });
    }

    const nomination = await prisma.nomination.findUnique({
      where: { id: nominationId },
      select: { status: true },
    });

    if (!nomination) {
      return reply.status(404).send({
        success: false,
        message: "Nomination not found!",
      });
    }

    const updatedNomination = await prisma.nomination.update({
      where: { id: nominationId },
      data: { status },
    });

    return reply.status(200).send({
      success: true,
      message: `Nomination status updated to ${updatedNomination?.status}.`,
      data: updatedNomination,
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


export const deleteNomination = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { nominationId } = request.params;

    if (!nominationId) {
      return reply.code(400).send({
        success: false,
        message: "nomination Id is reqiord!",
      });
    }

    const nomination = await prisma.nomination.findUnique({
      where: { id: nominationId },
      select: { id: true, scheduleFile: true },
    });

    if (!nomination) {
      return reply.status(404).send({
        success: false,
        message: "Nomination not found!",
      });
    }

    // Delete nomination
    await prisma.nomination.delete({
      where: { id: nominationId },
    });

    return reply.status(200).send({
      success: true,
      message: "Nomination deleted successfully",
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
