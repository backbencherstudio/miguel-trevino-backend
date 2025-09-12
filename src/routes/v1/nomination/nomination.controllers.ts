

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
    const userId = request.user?.id;
    const admin = request.user?.type;


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
        userId,
        status: admin === "admin" ?  "Confirmed" : "Submitted"
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

