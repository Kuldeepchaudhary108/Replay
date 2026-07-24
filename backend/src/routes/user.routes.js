import express from "express";
import {
  signup,
  loginUser,
  googleCallbackHandler,
  googleAuthHandler,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  refreshAccessToken,
} from "../controller/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(signup);
router.route("/login").post(loginUser);
router.route("/google-auth").get(googleAuthHandler);
router.route("/google-callback").get(googleCallbackHandler);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
