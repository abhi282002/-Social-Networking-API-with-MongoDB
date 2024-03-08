import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
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
    avatar: avatar.url,
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

export { signUpUser };
