

export const dashboardCalculation = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = currentYear - 1;
    }

    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? 100 : 0;
      }
      return Math.round(((current - previous) / previous) * 100);
    };

    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    const prevMonthStart = new Date(prevYear, prevMonth, 1);
    const prevMonthEnd = new Date(prevYear, prevMonth + 1, 0);

    const currentMonthSubmitted = await prisma.nomination.count({
      where: {
        status: "Submitted",
        requestedDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    const currentMonthConfirmed = await prisma.nomination.count({
      where: {
        status: "Confirmed",
        requestedDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    const currentMonthSchedules = await prisma.schedule.count({
      where: {
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    const prevMonthSubmitted = await prisma.nomination.count({
      where: {
        status: "Submitted",
        requestedDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
    });

    const prevMonthConfirmed = await prisma.nomination.count({
      where: {
        status: "Confirmed",
        requestedDate: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
    });

    const prevMonthSchedules = await prisma.schedule.count({
      where: {
        createdAt: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
    });

    // Calculate percentage changes
    const submittedPercentage = calculatePercentageChange(
      currentMonthSubmitted,
      prevMonthSubmitted
    );
    const confirmedPercentage = calculatePercentageChange(
      currentMonthConfirmed,
      prevMonthConfirmed
    );
    const schedulesPercentage = calculatePercentageChange(
      currentMonthSchedules,
      prevMonthSchedules
    );

    return reply.status(200).send({
      success: true,
      message: "Dashboard data fetched successfully",
      data: {
        nominations: {
          submitted: {
            count: currentMonthSubmitted,
            percentage: submittedPercentage,
            trend: submittedPercentage >= 0 ? "up" : "down",
          },
          confirmed: {
            count: currentMonthConfirmed,
            percentage: confirmedPercentage,
            trend: confirmedPercentage >= 0 ? "up" : "down",
          },
        },
        schedules: {
          count: currentMonthSchedules,
          percentage: schedulesPercentage,
          trend: schedulesPercentage >= 0 ? "up" : "down",
        },

        previousMonth: {
          submitted: prevMonthSubmitted,
          confirmed: prevMonthConfirmed,
          schedules: prevMonthSchedules,
        },
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
