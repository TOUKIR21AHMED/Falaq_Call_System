const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const authRoutes = require("./routes/authRoutes");
const agentRoutes = require("./routes/agentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const callRoutes = require("./routes/callRoutes");
const adminRoutes = require(
  "./routes/adminRoutes"
);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/agents", agentRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/calls", callRoutes);
app.use(
  "/api/admin",
  adminRoutes
);
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Falaq Call Center API is running",
  });
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-agent-room", (agentId) => {
    const roomName = `agent:${agentId}`;

    socket.join(roomName);

    console.log(`Agent joined room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});
app.set("io", io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});