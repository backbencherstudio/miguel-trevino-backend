"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchUsers = exports.deactiveToActiveUser = exports.getAllusers = void 0;
const baseurl_1 = require("../../../utils/baseurl");
const getAllusers = async (request, reply) => {
    try {
        const prisma = request.server.prisma;
        const query = request.query;
        // Parse boolean parameters flexibly
        const parseStrictBoolean = (val) => {
            if (val === undefined || val === null)
                return undefined;
            if (typeof val === "boolean")
                return val;
            const str = typeof val === "string" ? val.toLowerCase() : undefined;
            if (str === "true")
                return true;
            if (str === "false")
                return false;
            return undefined;
        };
        const active = parseStrictBoolean(query.active);
        const page = parseInt(request.query.page);
        const limit = parseInt(request.query.limit);
        // Build where clause flexibly
        const where = { type: "user" };
        if (active !== undefined) {
            where.active = active;
        }
        // Check if pagination is requested
        const usePagination = !isNaN(page) && !isNaN(limit) && page > 0 && limit > 0;
        const skip = usePagination ? (page - 1) * limit : undefined;
        const take = usePagination ? limit : undefined;
        const totalItems = await prisma.user.count({ where });
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        });
        // Remove password and format avatar URL
        const formattedUsers = users.map((user) => {
            const { password, ...rest } = user;
            return {
                ...rest,
                avatar: user.avatar ? (0, baseurl_1.getImageUrl)(`/uploads/${user.avatar}`) : null,
            };
        });
        // Prepare response
        const response = {
            success: true,
            message: "Users retrieved successfully",
            data: formattedUsers,
        };
        // Add pagination info only if pagination was used
        if (usePagination) {
            const totalPages = Math.ceil(totalItems / limit);
            response.pagination = {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            };
        }
        else {
            // If no pagination, include total count in the main response
            response.totalItems = totalItems;
        }
        return reply.status(200).send(response);
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getAllusers = getAllusers;
const deactiveToActiveUser = async (request, reply) => {
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
    }
    catch (error) {
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
exports.deactiveToActiveUser = deactiveToActiveUser;
const searchUsers = async (request, reply) => {
    try {
        const prisma = request.server.prisma;
        const query = (request.query.query || "").trim();
        console.log("Query:", query);
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 10;
        const skip = (page - 1) * limit;
        const activeParam = request.query.active;
        const active = activeParam === "true"
            ? true
            : activeParam === "false"
                ? false
                : undefined;
        if (!query) {
            return reply.status(200).send({
                success: true,
                message: "Users search results retrieved successfully",
                data: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    itemsPerPage: limit,
                    hasNextPage: false,
                    hasPrevPage: false,
                },
            });
        }
        const where = {
            type: "user",
            OR: [
                { fullName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { companyName: { contains: query, mode: "insensitive" } },
            ],
        };
        if (active !== undefined)
            where.active = active;
        const totalItems = await prisma.user.count({ where });
        const users = await prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        });
        const formattedUsers = users.map((user) => {
            const { password, ...rest } = user;
            return {
                ...rest,
                avatar: user.avatar ? (0, baseurl_1.getImageUrl)(`/uploads/${user.avatar}`) : null,
            };
        });
        const totalPages = Math.ceil(totalItems / limit);
        return reply.status(200).send({
            success: true,
            message: "Users search results retrieved successfully",
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
    }
    catch (error) {
        request.log.error(error);
        return reply.code(500).send({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.searchUsers = searchUsers;
//# sourceMappingURL=users.coontrollers.js.map