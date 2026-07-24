import dotenv from "dotenv";
dotenv.config();
import  connectDB from "./db/index.js";

import app from "./app.js";
import { createServer } from "node:http";
import { Server } from "socket.io";

const port = process.env.PORT || 4000;
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join-run", (runId) => {
    if (typeof runId === "string" && runId.trim()) {
      socket.join(runId);
    }
  });
});

// server.listen(port, () => {
//   console.log(`🚀 Agent running on port ${port}`);
// });

// Start server after DB connection
connectDB()
  .then(() => {
    server.listen(process.env.PORT || 8000, () =>
      console.log(`Server is listening on port ${process.env.PORT}`),
    );
  })
  .catch((error) => {
    console.log("MongoDB connection failed !!!", error);
  });
