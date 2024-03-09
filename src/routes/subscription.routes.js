import { Router } from "express";
const router = Router();
import { verifyUserToken } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels } from "../controllers/subscription.controller.js";
import {
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
router.use(verifyUserToken);
router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router;
