const User = require("../models/User");
const Call = require("../models/Call");

const getAgents = async (req, res) => {
  try {
    const agents = await User.find({
      role: "agent",
    })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: agents.length,
      agents,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch agents",
      error: error.message,
    });
  }
};

const getOverview = async (req, res) => {
  try {
const [
  totalAgents,
  availableAgents,
  busyAgents,
  offlineAgents,
  totalCalls,
  completedCalls,
  ringingCalls,
  rejectedCalls,
  missedCalls,
] = await Promise.all([
  User.countDocuments({
    role: "agent",
  }),

  User.countDocuments({
    role: "agent",
    status: "available",
  }),

  User.countDocuments({
    role: "agent",
    status: "busy",
  }),

  User.countDocuments({
    role: "agent",
    status: "offline",
  }),

  Call.countDocuments(),

  Call.countDocuments({
    status: "completed",
  }),

  Call.countDocuments({
    status: "ringing",
  }),

  Call.countDocuments({
    status: "rejected",
  }),

  Call.countDocuments({
    status: "missed",
  }),
]);

    const recentCalls = await Call.find()
      .populate(
        "customer",
        "name phone"
      )
      .populate(
        "agent",
        "name email status"
      )
      .sort({
        createdAt: -1,
      })
      .limit(10);

    return res.status(200).json({
      success: true,

      overview: {
        agents: {
          total: totalAgents,
          available: availableAgents,
          busy: busyAgents,
          offline: offlineAgents,
        },

        calls: {
  total: totalCalls,
  completed: completedCalls,
  ringing: ringingCalls,
  rejected: rejectedCalls,
  missed: missedCalls,
},
      },

      recentCalls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch admin overview",
      error: error.message,
    });
  }
};

module.exports = {
  getAgents,
  getOverview,
};