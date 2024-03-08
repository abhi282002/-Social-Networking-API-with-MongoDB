import { Router } from "express";
import {
  changeCurrentPassword,
  deleteUserProfile,
  logoutUser,
  refreshAccessToken,
  signInUser,
  signUpUser,
  updateAccountDetails,
  updateUserAvatar,
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
router.route("/deleteUser").delete(verifyUserToken, deleteUserProfile);
router
  .route("/update-avatar")
  .patch(verifyUserToken, upload.single("avatar"), updateUserAvatar);
router.route("/change-password").post(verifyUserToken, changeCurrentPassword);
router.route("/updateUser").patch(verifyUserToken, updateAccountDetails);
export default router;
