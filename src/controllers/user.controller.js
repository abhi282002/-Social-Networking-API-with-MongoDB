import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

import jwt from "jsonwebtoken";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something Went Wrong While generating refresh and access token"
    );
  }
};

const signUpUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username, bio } = req.body;

  if (
    [fullName, email, password, username, bio].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Field Are Required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exits");
  }

  console.log("req files", req.files);

  const avatarLocalPath = req.file?.path;
  console.log(avatarLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error in Uploading File! Please try again");
  }

  const user = await User.create({
    fullName,
    avatar: {
      public_id: avatar.public_id,
      url: avatar.url,
    },
    bio,
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log("user", user);
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Register Successfully"));
});

const signInUser = asyncHandler(async (req, res) => {
  //req body -> data
  //username or email
  //find the user
  //password check
  //access and refersh token
  //send cookie

  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });

  if (!user) {
    throw new ApiError(404, "User does't exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid User Credential!");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"));
});

const viewProfile = asyncHandler(async (req, res) => {
  try {
    if (!req?.user._id) {
      throw new ApiError(400, "User Does't Exit");
    }
  } catch (error) {
    throw new ApiError(400, "User Does't Exit");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current User fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorize request");
  }
  try {
    const user = await User.findOne({
      refreshToken: incomingRefreshToken,
    });

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    console.log(refreshToken);
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Refresh Token");
  }
});

const deleteUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.user._id);

  return res
    .status(200)

    .json(new ApiResponse(200, {}, "User Deleted Successfully"));
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change Successfully"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }
  const user = await User.findById(req.user._id).select("avatar");

  const avatarToDelete = user.avatar.public_id;

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, "Error while uplaoding on avatar");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: {
          public_id: avatar.public_id,
          url: avatar?.secure_url,
        },
      },
    },
    { new: true }
  ).select("-password");
  if (avatarToDelete && updatedUser.avatar.public_id) {
    await deleteOnCloudinary(avatarToDelete);
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser, "Avatar Image Updated Successfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email, bio } = req.body;
  const updatedFields = {};
  if (fullName) {
    updatedFields.fullName = fullName;
  }
  if (email) {
    updatedFields.email = email;
  }
  if (bio) {
    updatedFields.bio = bio;
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: updatedFields,
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
});

export {
  signUpUser,
  signInUser,
  logoutUser,
  viewProfile,
  updateAccountDetails,
  updateUserAvatar,
  changeCurrentPassword,
  refreshAccessToken,
  deleteUserProfile,
};
