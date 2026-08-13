const Call = require("../models/Call");
const Customer = require("../models/Customer");
const User = require("../models/User");

const simulateIncomingCall = async (req, res) => {
  try {
    const { phone } = req.body;

    // 1. Find customer by phone number
    const customer = await Customer.findOne({ phone });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 2. Find one available agent
    const availableAgent = await User.findOne({
      role: "agent",
      status: "available",
    });

    if (!availableAgent) {
      return res.status(503).json({
        success: false,
        message: "No available agent at the moment",
      });
    }

    // 3. Create call record
    const call = await Call.create({
      customer: customer._id,
      agent: availableAgent._id,
      direction: "incoming",
      status: "ringing",
    });

    // 4. Start missed-call timer
  setTimeout(async () => {
  try {
    const latestCall = await Call.findById(call._id);

    if (latestCall && latestCall.status === "ringing") {
      latestCall.status = "missed";
      latestCall.endedAt = new Date();

      await latestCall.save();

      console.log(
        `Call ${latestCall._id} marked as missed`
      );

      const io = req.app.get("io");

      io.to(
        `agent:${availableAgent._id.toString()}`
      ).emit("call-missed", {
        callId: latestCall._id.toString(),
        customer: {
          name: customer.name,
          phone: customer.phone,
        },
      });
    }
  } catch (error) {
    console.error(
      "Missed call timeout error:",
      error.message
    );
  }
}, 30000);
    // 5. Populate useful information for response
    const populatedCall = await Call.findById(call._id)
      .populate("customer", "name phone email")
      .populate("agent", "name email status");
      const io = req.app.get("io");

io.to(`agent:${availableAgent._id.toString()}`).emit(
  "incoming-call",
  populatedCall
);

    return res.status(201).json({
      success: true,
      message: "Incoming call simulated successfully",
      call: populatedCall,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to simulate incoming call",
      error: error.message,
    });
  }
};

const acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    if (call.status !== "ringing") {
      return res.status(400).json({
        success: false,
        message: "Only ringing calls can be accepted",
      });
    }

    if (call.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "This call is not assigned to you",
      });
    }

    call.status = "accepted";
    call.startedAt = new Date();

    await call.save();

    await User.findByIdAndUpdate(req.user._id, {
      status: "busy",
    });

    return res.status(200).json({
      success: true,
      message: "Call accepted",
      call,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to accept call",
      error: error.message,
    });
  }
};
const rejectCall = async (req, res) => {
  try {
    const { callId } = req.params;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    if (call.status !== "ringing") {
      return res.status(400).json({
        success: false,
        message: "Only ringing calls can be rejected",
      });
    }

    if (call.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "This call is not assigned to you",
      });
    }

    call.status = "rejected";
    call.endedAt = new Date();

    await call.save();

    return res.status(200).json({
      success: true,
      message: "Call rejected",
      call,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject call",
      error: error.message,
    });
  }
};
const endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const { notes, disposition } = req.body;

    const call = await Call.findById(callId);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: "Call not found",
      });
    }

    if (call.status !== "accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted calls can be ended",
      });
    }

    if (call.agent.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "This call is not assigned to you",
      });
    }

    const endedAt = new Date();

    const durationSeconds = Math.floor(
      (endedAt.getTime() - call.startedAt.getTime()) / 1000
    );

    call.status = "completed";
    call.endedAt = endedAt;
    call.durationSeconds = durationSeconds;
    call.notes = notes || "";
    call.disposition = disposition || "other";

    await call.save();

    await User.findByIdAndUpdate(req.user._id, {
      status: "available",
    });

    return res.status(200).json({
      success: true,
      message: "Call completed successfully",
      call,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to end call",
      error: error.message,
    });
  }
};
const getCallHistory = async (req, res) => {
  try {
    const filter = {};

    // Agent হলে শুধু নিজের calls দেখবে
    if (req.user.role === "agent") {
      filter.agent = req.user._id;
    }

    const calls = await Call.find(filter)
      .populate("customer", "name phone email")
      .populate("agent", "name email role status")
      .sort({ createdAt: -1 });


    return res.status(200).json({
      success: true,
      count: calls.length,
      calls,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch call history",
      error: error.message,
    });
  }
};
module.exports = {
  simulateIncomingCall,
  acceptCall,
  rejectCall,
  endCall,
  getCallHistory,
};
