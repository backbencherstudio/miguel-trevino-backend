// export const getAllChatRooms = async (request, reply) => {
//   try {
//     const prisma = request.server.prisma;

import { getImageUrl } from "../../../utils/baseurl";

//     const page = parseInt(request.query.page) || 1;
//     const limit = parseInt(request.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const totalItems = await prisma.chatRoom.count();

//     const rooms = await prisma.chatRoom.findMany({
//       skip,
//       take: limit,
//       orderBy: { updatedAt: "desc" },
//       include: {
//         user: {
//           select: { id: true, fullName: true, email: true, avatar: true },
//         },
//         messages: {
//           orderBy: { createdAt: "desc" },
//           take: 1,
//           include: {
//             sender: {
//               select: { id: true, fullName: true, type: true, avatar: true },
//             },
//           },
//         },
//       },
//     });

//     return reply.send({
//       success: true,
//       message: "Chat rooms retrieved successfully",
//       data: rooms,
//       pagination: {
//         totalItems,
//         currentPage: page,
//         itemsPerPage: limit,
//         totalPages: Math.ceil(totalItems / limit),
//       },
//     });
//   } catch (err) {
//     request.log.error(err);
//     return reply
//       .status(500)
//       .send({ success: false, message: "Internal Server Error" });
//   }
// };

export const getAllChatRooms = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.chatRoom.count();

    const chatRooms = await prisma.chatRoom.findMany({
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
              select: {
                id: true,
                fullName: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: {
              where: { read: false },
            },
          },
        },
      },
    });

    const rooms = chatRooms.map((room) => ({
      id: room.id,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      user: {
        ...room.user,
        avatar: room.user.avatar
          ? getImageUrl(`/uploads/${room.user.avatar}`)
          : null,
      },
      lastMessage: room.messages[0]
        ? {
            id: room.messages[0].id,
            content: room.messages[0].content,
            createdAt: room.messages[0].createdAt,
            sender: room.messages[0].sender,
          }
        : null,
      unreadCount: room._count?.messages || 0,
    }));

    return reply.send({
      success: true,
      message: "Chat rooms retrieved successfully",
      data: { rooms },
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

export const getUserChatRoom = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { id } = request.user;

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            sender: {
              select: { id: true, fullName: true, type: true },
            },
          },
        },
        _count: {
          select: { messages: { where: { read: false } } },
        },
      },
    });

    if (!chatRoom) {
      return reply.status(404).send({
        success: false,
        message: "Chat room not found",
      });
    }

    const room = {
      id: chatRoom.id,
      createdAt: chatRoom.createdAt,
      updatedAt: chatRoom.updatedAt,
      user: {
        ...chatRoom.user,
        avatar: chatRoom.user.avatar
          ? getImageUrl(`/uploads/${chatRoom.user.avatar}`)
          : null,
      },
      lastMessage: chatRoom.messages[0]
        ? {
            id: chatRoom.messages[0].id,
            content: chatRoom.messages[0].content,
            createdAt: chatRoom.messages[0].createdAt,
            sender: {
              ...chatRoom.messages[0].sender,
            },
          }
        : null,
      unreadCount: chatRoom._count?.messages || 0,
    };

    return reply.status(200).send({
      success: true,
      message: "Chat room retrieved successfully",
      data: { room },
    });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
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
            email: true,
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

    const roomData = {
      id: chatRoom.id,
      user: {
        ...chatRoom.user,
        avatar: chatRoom.user.avatar
          ? getImageUrl(`/uploads/${chatRoom.user.avatar}`)
          : null,
      },
      messages: chatRoom.messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        sender: {
          ...msg.sender,
          avatar: msg.sender.avatar
            ? getImageUrl(`/uploads/${msg.sender.avatar}`)
            : null,
        },
      })),
    };

    return reply.status(200).send({
      success: true,
      message: "Messages retrieved successfully",
      data: roomData,
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
    const io = request.server.io;
    const { chatRoomId, content } = request.body;
    const senderId = request.user.id;
    const senderType = request.user.type;

    if (!chatRoomId || !content) {
      return reply.status(400).send({
        success: false,
        message: "chatRoomId and content are required",
      });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    if (!room) {
      return reply.status(404).send({
        success: false,
        message: "Chat room not found",
      });
    }

    // Restrict non-admin users to their own room
    if (senderType !== "admin" && room.userId !== senderId) {
      return reply.status(403).send({
        success: false,
        message: "You are not allowed to send messages in this room",
      });
    }

    // Save message
    const message = await prisma.messages.create({
      data: { chatRoomId, senderId, content },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            type: true,
            avatar: true,
          },
        },
      },
    });

    io.to(chatRoomId).emit("new_message", {
      ...message,
      chatRoomId,
      createdAt: message.createdAt,
      sender: message.sender,
    });

    // io.emit("update_room_last_message", {
    //   roomId: chatRoomId,
    //   lastMessage: {
    //     id: message.id,
    //     content: message.content,
    //     createdAt: message.createdAt,
    //     sender: message.sender,
    //   },
    // });

    return reply.status(200).send({
      success: true,
      message: "Message sent successfully",
      data: {
        id: message.id,
        chatRoomId,
        content: message.content,
        createdAt: message.createdAt,
        sender: message.sender,
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
