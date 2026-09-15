const Patient = require("../models/patient");
const Doctor = require("../models/doctor");
const Appointment = require("../models/appointment");
const Billing = require("../models/billing");
const Inventory = require("../models/inventory");
const Expense = require("../models/expense");
const Prescription = require("../models/prescription");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalPatients,
      activePatients,
      totalDoctors,
      activeDoctors,
      todayAppointments,
      scheduledAppointments,
      completedAppointments,
      cancelledAppointments,
      billingStats,
      expenseStats,
      lowStockItems,
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments({ isActive: true }),

      Doctor.countDocuments(),
      Doctor.countDocuments({ isActive: true }),

      Appointment.countDocuments({
        appointmentDate: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      }),

      Appointment.countDocuments({
        status: { $in: ["scheduled", "confirmed"] },
      }),

      Appointment.countDocuments({
        status: "completed",
      }),

      Appointment.countDocuments({
        status: "cancelled",
      }),

      Billing.aggregate([
        {
          $match: {
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            totalBilled: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            pendingAmount: {
              $sum: {
                $subtract: ["$totalAmount", "$paidAmount"],
              },
            },
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: "$amount" },
          },
        },
      ]),

      Inventory.countDocuments({
        isActive: true,
        $expr: {
          $lte: ["$quantity", "$reorderLevel"],
        },
      }),
    ]);

    const billingSummary = billingStats[0] || {
      totalBilled: 0,
      totalPaid: 0,
      pendingAmount: 0,
    };

    const totalExpenses = expenseStats[0]?.totalExpenses || 0;

    const netAmount = billingSummary.totalPaid - totalExpenses;

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        patients: {
          total: totalPatients,
          active: activePatients,
        },

        doctors: {
          total: totalDoctors,
          active: activeDoctors,
        },

        appointments: {
          today: todayAppointments,
          scheduled: scheduledAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments,
        },

        finance: {
          totalBilled: billingSummary.totalBilled,
          totalPaid: billingSummary.totalPaid,
          pendingAmount: billingSummary.pendingAmount,
          totalExpenses,
          netAmount,
        },

        inventory: {
          lowStockItems,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving dashboard statistics",
    });
  }
};

// Get recent appointments for dashboard
const getRecentAppointments = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 10, 1),
      50
    );

    const appointments = await Appointment.find()
      .populate("patient", "patientId name phone")
      .populate(
        "doctor",
        "specialization qualification consultationFee"
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      })
      .limit(limit);

    res.status(200).json({
      success: true,
      message: "Recent appointments retrieved successfully",
      count: appointments.length,
      data: {
        appointments,
      },
    });
  } catch (error) {
    console.error("Recent appointments error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving recent appointments",
    });
  }
};

// Get monthly financial analytics
const getMonthlyFinance = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Year must be between 2000 and 2100",
      });
    }

    const [revenue, expenses] = await Promise.all([
      Billing.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: {
              $gte: new Date(`${year}-01-01T00:00:00.000Z`),
              $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
            },
            billed: { $sum: "$totalAmount" },
            paid: { $sum: "$paidAmount" },
            invoices: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]),

      Expense.aggregate([
        {
          $match: {
            isActive: true,
            createdAt: {
              $gte: new Date(`${year}-01-01T00:00:00.000Z`),
              $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
            },
            amount: { $sum: "$amount" },
            expenses: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]),
    ]);

    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const revenueMonth = revenue.find(
        (item) => item._id.month === month
      );

      const expenseMonth = expenses.find(
        (item) => item._id.month === month
      );

      const billed = revenueMonth?.billed || 0;
      const paid = revenueMonth?.paid || 0;
      const expenseAmount = expenseMonth?.amount || 0;

      monthlyData.push({
        month,
        billed,
        paid,
        expenses: expenseAmount,
        net: paid - expenseAmount,
        invoices: revenueMonth?.invoices || 0,
        expenseCount: expenseMonth?.expenses || 0,
      });
    }

    const totals = monthlyData.reduce(
      (result, month) => {
        result.billed += month.billed;
        result.paid += month.paid;
        result.expenses += month.expenses;
        result.net += month.net;
        result.invoices += month.invoices;
        result.expenseCount += month.expenseCount;

        return result;
      },
      {
        billed: 0,
        paid: 0,
        expenses: 0,
        net: 0,
        invoices: 0,
        expenseCount: 0,
      }
    );

    res.status(200).json({
      success: true,
      message: "Monthly financial analytics retrieved successfully",
      year,
      data: {
        monthly: monthlyData,
        totals,
      },
    });
  } catch (error) {
    console.error("Monthly finance error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving monthly financial analytics",
    });
  }
};

// Get appointment analytics
const getAppointmentAnalytics = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Year must be between 2000 and 2100",
      });
    }

    const appointments = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$appointmentDate" },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);

    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const getCount = (status) => {
        const result = appointments.find(
          (item) =>
            item._id.month === month &&
            item._id.status === status
        );

        return result?.count || 0;
      };

      const scheduled = getCount("scheduled");
      const confirmed = getCount("confirmed");
      const completed = getCount("completed");
      const cancelled = getCount("cancelled");
      const noShow = getCount("no-show");

      monthlyData.push({
        month,
        scheduled,
        confirmed,
        completed,
        cancelled,
        noShow,
        total:
          scheduled +
          confirmed +
          completed +
          cancelled +
          noShow,
      });
    }

    const totals = monthlyData.reduce(
      (result, month) => {
        result.scheduled += month.scheduled;
        result.confirmed += month.confirmed;
        result.completed += month.completed;
        result.cancelled += month.cancelled;
        result.noShow += month.noShow;
        result.total += month.total;

        return result;
      },
      {
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        total: 0,
      }
    );

    res.status(200).json({
      success: true,
      message: "Appointment analytics retrieved successfully",
      year,
      data: {
        monthly: monthlyData,
        totals,
      },
    });
  } catch (error) {
    console.error("Appointment analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving appointment analytics",
    });
  }
};

// Get doctor-wise analytics
const getDoctorAnalytics = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Year must be between 2000 and 2100",
      });
    }

    const doctorAnalytics = await Appointment.aggregate([
      {
        $match: {
          appointmentDate: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: {
            doctor: "$doctor",
            status: "$status",
          },
          count: {
            $sum: 1,
          },
        },
      },
      {
        $group: {
          _id: "$_id.doctor",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          totalAppointments: {
            $sum: "$count",
          },
        },
      },
      {
        $lookup: {
          from: "doctors",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      {
        $unwind: {
          path: "$doctor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "doctor.user",
          foreignField: "_id",
          as: "doctorUser",
        },
      },
      {
        $unwind: {
          path: "$doctorUser",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          doctorId: "$_id",
          doctorName: {
            $ifNull: ["$doctorUser.name", "Unknown Doctor"],
          },
          doctorEmail: {
            $ifNull: ["$doctorUser.email", "N/A"],
          },
          specialization: {
            $ifNull: ["$doctor.specialization", "N/A"],
          },
          qualification: {
            $ifNull: ["$doctor.qualification", "N/A"],
          },
          totalAppointments: 1,

          scheduled: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$statuses",
                        as: "statusItem",
                        cond: {
                          $eq: [
                            "$$statusItem.status",
                            "scheduled",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                $ifNull: ["$$item.count", 0],
              },
            },
          },

          confirmed: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$statuses",
                        as: "statusItem",
                        cond: {
                          $eq: [
                            "$$statusItem.status",
                            "confirmed",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                $ifNull: ["$$item.count", 0],
              },
            },
          },

          completed: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$statuses",
                        as: "statusItem",
                        cond: {
                          $eq: [
                            "$$statusItem.status",
                            "completed",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                $ifNull: ["$$item.count", 0],
              },
            },
          },

          cancelled: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$statuses",
                        as: "statusItem",
                        cond: {
                          $eq: [
                            "$$statusItem.status",
                            "cancelled",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                $ifNull: ["$$item.count", 0],
              },
            },
          },

          noShow: {
            $let: {
              vars: {
                item: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$statuses",
                        as: "statusItem",
                        cond: {
                          $eq: [
                            "$$statusItem.status",
                            "no-show",
                          ],
                        },
                      },
                    },
                    0,
                  ],
                },
              },
              in: {
                $ifNull: ["$$item.count", 0],
              },
            },
          },
        },
      },
      {
        $sort: {
          totalAppointments: -1,
        },
      },
    ]);

    const doctorBilling = await Billing.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: {
            $gte: new Date(`${year}-01-01T00:00:00.000Z`),
            $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: "$doctor",
          totalBilled: {
            $sum: "$totalAmount",
          },
          totalPaid: {
            $sum: "$paidAmount",
          },
        },
      },
    ]);

    const result = doctorAnalytics.map((doctor) => {
      const billing = doctorBilling.find(
        (item) =>
          item._id &&
          item._id.toString() === doctor.doctorId.toString()
      );

      return {
        ...doctor,
        totalBilled: billing?.totalBilled || 0,
        totalPaid: billing?.totalPaid || 0,
      };
    });

    res.status(200).json({
      success: true,
      message: "Doctor analytics retrieved successfully",
      year,
      count: result.length,
      data: {
        doctors: result,
      },
    });
  } catch (error) {
    console.error("Doctor analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving doctor analytics",
    });
  }
};

// Get patient-wise analytics
const getPatientAnalytics = async (req, res) => {
  try {
    const patients = await Patient.find({ isActive: true })
      .select("patientId name phone email")
      .sort({ name: 1 });

    const result = await Promise.all(
      patients.map(async (patient) => {
        const patientId = patient._id;

        const [
          appointmentStats,
          prescriptionCount,
          billingStats,
        ] = await Promise.all([
          Appointment.aggregate([
            {
              $match: {
                patient: patientId,
              },
            },
            {
              $group: {
                _id: null,
                totalVisits: { $sum: 1 },

                completedVisits: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "completed"] },
                      1,
                      0,
                    ],
                  },
                },

                cancelledVisits: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "cancelled"] },
                      1,
                      0,
                    ],
                  },
                },

                scheduledVisits: {
                  $sum: {
                    $cond: [
                      {
                        $in: [
                          "$status",
                          ["scheduled", "confirmed"],
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ]),

          Prescription.countDocuments({
            patient: patientId,
            isActive: true,
          }),

          Billing.aggregate([
            {
              $match: {
                patient: patientId,
                isActive: true,
              },
            },
            {
              $group: {
                _id: null,
                totalBilled: {
                  $sum: "$totalAmount",
                },
                totalPaid: {
                  $sum: "$paidAmount",
                },
              },
            },
          ]),
        ]);

        const appointmentSummary = appointmentStats[0] || {
          totalVisits: 0,
          completedVisits: 0,
          cancelledVisits: 0,
          scheduledVisits: 0,
        };

        const billingSummary = billingStats[0] || {
          totalBilled: 0,
          totalPaid: 0,
        };

        return {
          patientId: patient._id,
          patientCode: patient.patientId,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,

          totalVisits: appointmentSummary.totalVisits,
          completedVisits: appointmentSummary.completedVisits,
          cancelledVisits: appointmentSummary.cancelledVisits,
          scheduledVisits: appointmentSummary.scheduledVisits,

          prescriptions: prescriptionCount,

          totalBilled: billingSummary.totalBilled,
          totalPaid: billingSummary.totalPaid,

          pendingAmount:
            billingSummary.totalBilled -
            billingSummary.totalPaid,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Patient analytics retrieved successfully",
      count: result.length,
      data: {
        patients: result,
      },
    });
  } catch (error) {
    console.error("Patient analytics error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while retrieving patient analytics",
    });
  }
};

module.exports = {
  getDashboardStats,
  getRecentAppointments,
  getMonthlyFinance,
  getAppointmentAnalytics,
  getDoctorAnalytics,
  getPatientAnalytics,
};