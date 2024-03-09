import express from "express";
import cors from "cors";

import cookieParser from "cookie-parser";

const app = express();
app.set("trust proxy", 1);
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later",
});
app.use(apiLimiter);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import postRouter from "./routes/post.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import rateLimit from "express-rate-limit";
app.use("/api/v1/users", userRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/subscription", subscriptionRouter);

export { app };
