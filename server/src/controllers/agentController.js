const User = require("../models/User");

const updateAgentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["available", "busy", "offline"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent status",
      });
    }

    const agent = await User.findById(req.user._id);

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent not found",
      });
    }

    agent.status = status;

    await agent.save();

    return res.status(200).json({
      success: true,
      message: "Agent status updated successfully",
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        status: agent.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update agent status",
      error: error.message,
    });
  }
};

module.exports = {
  updateAgentStatus,
};