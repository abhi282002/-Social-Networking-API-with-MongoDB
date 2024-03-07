import { Router } from "express";
import { signUpUser } from "../controllers/user.controller";
const router = Router();

router.route("/signup", signUpUser);
