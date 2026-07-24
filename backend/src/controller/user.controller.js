import { ApiResponse, ApiError, asyncHandler } from "../utils/utils.index.js";
import { User } from "../models/user.model.js";
import fs from "fs";

const gernateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("TOKEN ERROR:", error);
    // throw new ApiError(
    //   500,
    //   " something went wrong while generaing refresh and access token ",
    // );
    throw error;
  }
};

const signup = asyncHandler(async (req, res) => {
  const { email, password, fullname } = req.body;
  const resolvedName = [fullname?.firstname, fullname?.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (
    [resolvedName, email, password].some((field) => String(field).trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // const existUser = await User.findOne({
  //   $or: [{ email }, { contact }],
  // });
  const orConditions = [{ email }];

  const existUser = await User.findOne({ $or: orConditions });

  if (existUser) {
    throw new ApiError(401, "user is  already exist ");
  }

  const user = await User.create({
    email: email?.toLowerCase(),
    name: resolvedName.toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(505, "Something went wrong while registering the user");
  }

  const { accessToken, refreshToken } = await gernateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "None" : "Lax",
    maxAge: 24 * 60 * 60 * 1000,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(201, loggedInUser, "user register successdully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "  email is required ");
  }

  const user = await User.findOne({
    $or: [{ email }],
  });

  if (!user) {
    throw new ApiError(404, " User does not exist ");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, " Password does not match with user ");
  }

  const { accessToken, refreshToken } = await gernateAccessAndRefreshTokens(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "None" : "Lax",
    maxAge: 24 * 60 * 60 * 1000,
  };
  console.log("login successfully ");
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
        "User Loggin successfully ",
      ),
    );
});

//this is send req to google
// 2. Controller to redirect to Google
const googleAuthHandler = asyncHandler(async (req, res) => {
  const redirectPath = req.query.redirect || "/";
  const { OAuth2Client } = await import("google-auth-library");
  const authorizeUrl = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_OAUTH_REDIRECT_URI,
  ).generateAuthUrl({
    access_type: "offline", // Use 'offline' to get a refresh token from Google if needed
    //  prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: redirectPath,
  });
  res.redirect(authorizeUrl);
});

// 3. Controller to handle the callback from Google

const googleCallbackHandler = asyncHandler(async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    throw new ApiError(400, "Google OAuth failed, code not found.");
  }

  try {
    const { OAuth2Client } = await import("google-auth-library");
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    // Exchange authorization code for tokens
    const { tokens } = await new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI,
    ).getToken(code);

    const { id_token } = tokens;

    // Verify the ID token and get user info
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;
    if (!user) {
      // If user does not exist, create a new one
      isNewUser = true;
      user = await User.create({
        email,
        name: name || "Guest", // or generate a unique username
        avatar: picture,
        googleId: sub,
        password: name + "@" + Math.floor(1000 + Math.random() * 9000),
      });
    } else if (!user.googleId) {
      // If user exists but hasn't linked Google, link it now
      user.googleId = sub;
      await user.save({ validateBeforeSave: false });
    } else if (user.college === "") {
      isNewUser = true;
    }
    // At this point, `user` is our user, either new or existing
    // Now, generate our own JWT tokens for session management
    const { accessToken, refreshToken } = await gernateAccessAndRefreshTokens(
      user._id,
    );
    // Save the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000,
    };

    // const redirectURL = isNewUser
    //   ? `${process.env.FRONTEND_URL}/complete-profile`
    //   : process.env.FRONTEND_URL;
    const redirectPath = state || "/";

    const redirectURL = isNewUser
      ? `${process.env.FRONTEND_URL}/complete-profile`
      : `${process.env.FRONTEND_URL}${redirectPath}`;

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .redirect(redirectURL); // Redirect to your app's dashboard
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong with Google authentication",
      error,
    );
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true },
  );

  const isProduction = process.env.NODE_ENV === "production";
  const options = {
    secure: isProduction,
    httpOnly: true,
    sameSite: isProduction ? "None" : "Lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out "));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invaild old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully "));
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request ");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const isProduction = process.env.NODE_ENV === "production";
    const options = {
      secure: isProduction,
      httpOnly: true,
      sameSite: isProduction ? "None" : "Lax",
    };

    const { accessToken, newRefreshToken } =
      await gernateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export {
  signup,
  loginUser,
  googleCallbackHandler,
  googleAuthHandler,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  refreshAccessToken,
};
