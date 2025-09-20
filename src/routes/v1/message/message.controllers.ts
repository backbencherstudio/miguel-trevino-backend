export const getAllChatRooms = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.chatRoom.count();

    const rooms = await prisma.chatRoom.findMany({
      skip,
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, fullName: true, type: true, avatar: true },
            },
          },
        },
      },
    });

    return reply.send({
      success: true,
      message: "Chat rooms retrieved successfully",
      data: rooms,
      pagination: {
        totalItems,
        currentPage: page,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    request.log.error(err);
    return reply
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};

export const getChatformRoom = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { roomId } = request.params;

    // Pagination params
    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    if (!roomId) {
      return reply.status(400).send({
        success: false,
        message: "Room ID is required",
      });
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
      include: {
        user: {
          select: {
            id: true,
            type: true,
            avatar: true,
            fullName: true,
          },
        },
        messages: {
          skip,
          take: limit,
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                type: true,
                avatar: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!chatRoom) {
      return reply.status(404).send({
        success: false,
        message: "Chat room not found",
      });
    }

    return reply.status(200).send({
      success: true,
      message: "Messages retrieved successfully",
      data: chatRoom,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
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

export const sendMessage = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { chatRoomId, content } = request.body;
    const senderId = request.user.id;
    const senderType = request.user.type;


    const missingField = ["chatRoomId", "content"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });
    if (!room) {
      return reply
        .status(404)
        .send({ success: false, message: "Chat room not found" });
    }

    if (senderType !== "admin" && room.userId !== senderId) {
      return reply.status(403).send({ success: false, message: "Not allowed" });
    }

    const message = await prisma.messages.create({
      data: { chatRoomId, senderId, content },
      include: {
        sender: {
          select: { id: true, fullName: true, type: true, avatar: true },
        },
      },
    });

    return reply.send({
      success: true,
      message: "Message sent",
      data: message,
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
