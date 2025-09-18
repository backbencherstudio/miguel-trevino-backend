export const getALlChatRoome = async (request, reply) => {
  try {
    const prisma = request.server.prisma;

    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalItems = await prisma.chatRoom.count();

    const totalPages = Math.ceil(totalItems / limit);

    const chatRooms = await prisma.chatRoom.findMany({
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    });

    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return reply.status(200).send({
      success: true,
      message: "Chat rooms retrieved successfully",
      data: chatRooms,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// export const sendMessage = async (request, reply) => {
//   try {
//     const { roomId } = request.params;
//     const { content } = request.body;
//     const userId = request.user?.id;
//     const userStatus = request.user?.status;

//     // Validate input
//     if (!content || content.trim().length === 0) {
//       return reply.status(400).send({
//         success: false,
//         message: "Message content is required",
//       });
//     }

//     if (content.length > 1000) {
//       return reply.status(400).send({
//         success: false,
//         message: "Message content cannot exceed 1000 characters",
//       });
//     }

//     const prisma = request.server.prisma;

//     // Check if chat room exists and user has access to it
//     const chatRoom = await prisma.chatRoom.findUnique({
//       where: { id: roomId },
//       include: {
//         user: {
//           select: {
//             id: true,
//             status: true
//           }
//         }
//       }
//     });

//     if (!chatRoom) {
//       return reply.status(404).send({
//         success: false,
//         message: "Chat room not found",
//       });
//     }

//     // Check if user is either the room owner or an admin
//     const isRoomOwner = chatRoom.userId === userId;
//     const isAdmin = userStatus === 'ADMIN';

//     if (!isRoomOwner && !isAdmin) {
//       return reply.status(403).send({
//         success: false,
//         message: "Access denied to this chat room",
//       });
//     }

//     // Create the message
//     const message = await prisma.message.create({
//       data: {
//         content: content.trim(),
//         chatRoomId: roomId,
//         senderId: userId!,
//         isAdmin: isAdmin
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             email: true,
//             avatar: true,
//             status: true
//           }
//         },
//         thread: {
//           select: {
//             id: true,
//             userId: true
//           }
//         }
//       }
//     });

//     return reply.status(201).send({
//       success: true,
//       message: "Message sent successfully",
//       data: {
//         id: message.id,
//         content: message.content,
//         createdAt: message.createdAt,
//         isAdmin: message.isAdmin,
//         read: message.read,
//         sender: {
//           id: message.sender.id,
//           name: `${message.sender.firstName} ${message.sender.lastName}`,
//           email: message.sender.email,
//           avatar: message.sender.avatar,
//           status: message.sender.status
//         }
//       }
//     });

//   } catch (error) {
//     request.log.error(error);
//     return reply.status(500).send({
//       success: false,
//       message: "Internal Server Error",
//       error: error instanceof Error ? error.message : "Unknown error",
//     });
//   }
// };

export const sendMessage = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    // const chatRoomId = request.params.chatRoomId
    const { chatRoomId, senderId, content, read } = request.body;
    const missingField = ["chatRoomId", "senderId", "content"].find(
      (field) => !request.body[field]
    );

    if (missingField) {
      return reply.status(400).send({
        success: false,
        message: `${missingField} is required!`,
      });
    }

    const message = await prisma.messages.create({
      data: {
        chatRoomId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            type: true,
          },
        },
      },
    });

    return reply.status(200).send({
      success: true,
      message: "message send",
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

// export const getChatformRoom = async (request, reply) => {

// }

export const getChatformRoom = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { roomId } = request.params;
    const userId = request.user?.id;
    const type = request.user?.type;

    if (!roomId) {
      return reply.status(400).send({
        success: false,
        message: "Room ID is required",
      });
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: roomId },
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
      roomInfo: {
        id: chatRoom.id,
        userId: chatRoom.userId,
        createdAt: chatRoom.createdAt
      }
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
