const mongoose = require("mongoose");

const callSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "ringing",
        "accepted",
        "rejected",
        "completed",
        "missed",
      ],
      default: "ringing",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    endedAt: {
      type: Date,
      default: null,
    },

    durationSeconds: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      default: "",
    },

    disposition: {
      type: String,
      enum: [
        "resolved",
        "follow_up",
        "not_interested",
        "wrong_number",
        "other",
      ],
      default: "other",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Call", callSchema);