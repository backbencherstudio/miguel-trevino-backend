
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
      
      const percentage = Math.round(((current - previous) / previous) * 100);
      
      // Cap extreme percentages for better UX
      if (percentage > 500) return 500; // Maximum 500% increase
      if (percentage < -100) return -100; // Maximum 100% decrease
      
      return percentage;
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

    const currentMonthComplete = await prisma.nomination.count({
      where: {
        status: "Complete",
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

    const prevMonthComplete = await prisma.nomination.count({
      where: {
        status: "Complete",
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

    const submittedPercentage = calculatePercentageChange(
      currentMonthSubmitted,
      prevMonthSubmitted
    );
    const completePercentage = calculatePercentageChange(
      currentMonthComplete,
      prevMonthComplete
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
          complete: {
            count: currentMonthComplete,
            percentage: completePercentage,
            trend: completePercentage >= 0 ? "up" : "down",
          },
        },
        schedules: {
          count: currentMonthSchedules,
          percentage: schedulesPercentage,
          trend: schedulesPercentage >= 0 ? "up" : "down",
        },
        previousMonth: {
          submitted: prevMonthSubmitted,
          complete: prevMonthComplete,
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

export const getScheduleStatistics = async (request, reply) => {
  try {
    const prisma = request.server.prisma;
    const { year = new Date().getFullYear(), month } = request.query;

    const yearNum = Number(year);
    const monthNum = month !== undefined ? Number(month) : undefined;

    // If month is provided, return day-wise data for that month
    if (monthNum !== undefined) {
      // Validate month (0-11 or 1-12, we'll normalize to 0-11)
      const monthIndex = monthNum >= 1 && monthNum <= 12 ? monthNum - 1 : monthNum;
      if (monthIndex < 0 || monthIndex > 11) {
        return reply.status(400).send({
          success: false,
          message: "Invalid month. Month must be between 1-12 or 0-11",
        });
      }

      // Get the first and last day of the month
      // Using Date(year, month, 0) gives us the last day of the previous month
      // So Date(year, month + 1, 0) gives us the last day of the current month
      const monthStart = new Date(yearNum, monthIndex, 1);
      const monthEnd = new Date(yearNum, monthIndex + 1, 0, 23, 59, 59, 999);
      const daysInMonth = monthEnd.getDate(); // Gets the last day (28, 29, 30, or 31)

      // Get all schedules for the month
      const schedules = await prisma.schedule.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        select: {
          createdAt: true
        }
      });

      // Group by day (1 to last day of month)
      const dailyCounts = Array(daysInMonth).fill(0);
      
      schedules.forEach(schedule => {
        const day = schedule.createdAt.getDate(); // 1-31
        if (day >= 1 && day <= daysInMonth) {
          dailyCounts[day - 1]++; // Array is 0-indexed, day is 1-indexed
        }
      });

      const monthNames = ["January", "February", "March", "April", "May", "June", 
                          "July", "August", "September", "October", "November", "December"];

      const chartData = Array.from({ length: daysInMonth }, (_, index) => ({
        day: index + 1,
        schedules: dailyCounts[index]
      }));

      return reply.status(200).send({
        success: true,
        message: "Schedule statistics fetched successfully",
        data: chartData,
        year: yearNum,
        month: monthNames[monthIndex]
      });
    }

    // If month is not provided, return month-wise data for the year
    const yearStart = new Date(yearNum, 0, 1);
    const yearEnd = new Date(yearNum, 11, 31, 23, 59, 59);

    // Get all schedules for the year
    const schedules = await prisma.schedule.findMany({
      where: {
        createdAt: {
          gte: yearStart,
          lte: yearEnd
        }
      },
      select: {
        createdAt: true
      }
    });

    // Group by month
    const monthlyCounts = Array(12).fill(0);
    
    schedules.forEach(schedule => {
      const month = schedule.createdAt.getMonth(); // 0-11
      monthlyCounts[month]++;
    });

    const monthNames = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];

    const chartData = monthNames.map((monthName, index) => ({
      month: monthName,
      schedules: monthlyCounts[index]
    }));

    return reply.status(200).send({
      success: true,
      message: "Schedule statistics fetched successfully",
      data: chartData,
      year: yearNum
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