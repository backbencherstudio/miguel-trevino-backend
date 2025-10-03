import fs from "fs";
import path from "path";
import { getImageUrl } from "../../../utils/baseurl";
import { uploadsDir } from "../../../config/storage.config";

export const getAllusers = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const query = request.query as any;
    const parseStrictBoolean = (val: any) => {
      if (typeof val === "boolean") return val;
      const str = typeof val === "string" ? val.toLowerCase() : undefined;
      if (str === "true") return true;
      if (str === "false") return false;
      return undefined;
    };
    const active = parseStrictBoolean(query.active);
    if (active === undefined) {
      return reply.status(400).send({
        success: false,
        message:
          "Query parameter 'active' is required and must be 'true' or 'false'",
      });
    }
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const where: any = { type: "user", active };

    const totalItems = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // delete users.password;

    const formattedUsers = users.map((user) => {
      const { password, ...rest } = user;
      return {
        ...rest,
        avatar: user.avatar ? getImageUrl(`/uploads/${user.avatar}`) : null,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);

    return reply.status(200).send({
      success: true,
      message: "Users retrieved successfully",
      data: formattedUsers,
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
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deactiveToActiveUser = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { userId } = request.params;

    const toactive = await prisma.user.update({
      where: { id: userId },
      data: { active: true },
    });

    return reply.status(200).send({
      success: true,
      message: "Users active successfully",
      data: toactive,
    });
  } catch (error) {
    request.log.error(error);
    if (error.code === "P2025") {
      return reply.status(404).send({
        success: false,
        message: "User not found",
      });
    }
    
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
    });
  }
};
