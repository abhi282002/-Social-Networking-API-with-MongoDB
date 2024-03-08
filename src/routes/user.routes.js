import { Router } from "express";
import { signUpUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/signup").post(upload.single("avatar"), signUpUser);

export default router;
