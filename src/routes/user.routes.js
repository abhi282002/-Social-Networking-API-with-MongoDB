import { Router } from "express";
import { signInUser, signUpUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/signup").post(upload.single("avatar"), signUpUser);
router.route("/signin").post(signInUser);

export default router;
