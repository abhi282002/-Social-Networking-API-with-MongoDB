import { Router } from "express";
const router = Router();
import { verifyUserToken } from "../middlewares/auth.middleware.js";
import {
  deletePost,
  getAllPost,
  getUserPost,
  postTweet,
  updatePost,
} from "../controllers/post.controller.js";

//verify jwt
router.use(verifyUserToken);

router.route("/").post(postTweet).get(getAllPost);
router.route("/:postId").patch(updatePost).delete(deletePost);
router.route("/user/:userId").get(getUserPost);
export default router;
