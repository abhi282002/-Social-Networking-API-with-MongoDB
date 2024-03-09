import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../routes/subscription.routes.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(req.params);

  console.log(isValidObjectId(channelId));
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }
  const isSubscribed = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });
  if (isSubscribed) {
    await Subscription.findByIdAndDelete(isSubscribed?._id);
    return res
      .status(200)
      .json(
        new ApiResponse(200, { subscribed: false }, "unsubscribed successfully")
      );
  }
  await Subscription.create({
    subscriber: req.user?._id,
    channel: channelId,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "subscribed successfully")
    );
});

//get User Channel Subscribers
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  let { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid ChannelId");
  }
  channelId = new mongoose.Types.ObjectId(channelId);
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: channelId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribedToSubscriber",
            },
          },
          {
            $addFields: {
              subscribedToSubscriber: {
                $cond: {
                  if: {
                    $in: [channelId, "$subscribedToSubscriber.subscriber"],
                  },
                  then: true,
                  else: true,
                },
              },
              subscribesCount: {
                $size: "$subscribedToSubscriber",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscriber",
    },
    {
      $project: {
        _id: 0,
        subscriber: {
          _id: 1,
          username: 1,
          fullName: 1,
          avatar: 1,
          subscribedToSubscriber: 1,
          subscribesCount: 1,
        },
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "subscribers fetch successfully"));
});

//How Many User I have subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedChannel",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
              bio: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$subscribedChannel",
    },
    {
      $addFields: {
        subscribedCount: {
          $size: "$subscribedChannel",
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscribedCount: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscriber fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
