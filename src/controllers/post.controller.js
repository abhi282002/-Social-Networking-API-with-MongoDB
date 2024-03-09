import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Post } from "../models/post.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const postTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(403, "Content is required");
  }
  const post = await Post.create({
    content,
    owner: req.user?._id,
  });
  if (!post) {
    throw new ApiError(500, "Something went wrong Please try again ");
  }
  res
    .status(200)
    .json(new ApiResponse(200, post, "Tweet  posted Successfully"));
});
const updatePost = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { postId } = req.params;
  console.log(postId);
  if (!content) {
    throw new ApiError(403, "Content is required");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(403, "Post is Not found");
  }
  if (post.owner.toString() != req.user?._id.toString()) {
    throw new ApiError(400, "You don't fave permission to updated this Post");
  }
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedPost) {
    throw new ApiError(
      500,
      "Something went wrong while updating Post Please Try again"
    );
  }
  res
    .status(200)
    .json(new ApiResponse(200, updatedPost, "Post Updated Successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  if (!isValidObjectId(postId)) {
    throw new ApiError(200, "PostId is not Valid");
  }
  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(403, "Post Not found");
  }
  if (post.owner.toString() != req.user?._id.toString()) {
    throw new ApiError(400, "You don't fave permission to delete this post");
  }
  await Post.findByIdAndDelete(postId);

  if (!post) {
    throw new ApiError(
      500,
      "Something went wrong While deleting Post! Please try again later"
    );
  }
  res.status(200).json(new ApiResponse(200, {}, "Post Deleted Successfully"));
});

const getUserPost = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(403, "UserId is not valid");
  }
  const post = await Post.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        ownerDetails: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        ownerDetails: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  res.status(200).json(new ApiResponse(200, post, "Post Fetched Successfully"));
});

const getAllPost = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const aggregateResult = Post.aggregate([
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "Subscriber",
            },
          },
          {
            $addFields: {
              subscriberCount: {
                $size: "$Subscriber",
              },
              isSubscribed: {
                $cond: {
                  if: {
                    $in: [req.user?._id, "$Subscriber.subscriber"],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
              bio: 1,
              isSubscribed: 1,
              subscriberCount: 1,
            },
          },
        ],
      },
    },
    {
      $unwind: "$owner",
    },
  ]);

  const options = {
    page: page,
    limit: limit,
  };

  const result = await Post.aggregatePaginate(aggregateResult, options);

  res
    .status(200)
    .json(new ApiResponse(200, result, "All Posts Fetch successfully"));
});

export { postTweet, updatePost, deletePost, getAllPost, getUserPost };
