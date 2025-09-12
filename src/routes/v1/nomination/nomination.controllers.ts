export const createNomination = async (request, reply) => {
  try {
    
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
