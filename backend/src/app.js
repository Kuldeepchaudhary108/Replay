// app.js
import express from "express";
import cors from "cors";
import agentRoutes from "./routes/agent.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://replay-nine-ruddy.vercel.app",
      "https://replay.kuldeepchaudhary.dev"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use("/user", userRoutes);
app.use("/agent", agentRoutes);

export default app;
