import { Router } from "express";
import {
  logoutUser,
  refreshAccessToken,
  signInUser,
  signUpUser,
  viewProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyUserToken } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/signup").post(upload.single("avatar"), signUpUser);
router.route("/signin").post(signInUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/logout").get(verifyUserToken, logoutUser);
router.route("/profile").get(verifyUserToken, viewProfile);
export default router;
