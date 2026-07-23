import { ApiError, ApiResponse, asyncHandler } from "../utils/utils.index.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorization request");
    }

    const decoderToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoderToken?._id).select(
      "-password -refreshToken",
    );

    if (!user) {
      throw new ApiError(404, "Invaild Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invaild Access Token");
  }
});
