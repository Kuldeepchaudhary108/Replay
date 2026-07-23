import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
    },
    contact: {
      type: Number,
      // required: true,
      // unique: true,
    },
    college: {
      type: String,
      // required: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
    },
    otpExpiry: {
      type: Date,
    },
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
    },
    coverPhoto: {
      type: String,
    },
    isAvailableForTeam: {
      type: Boolean,
      default: true,
    },
    isMentor: {
      type: Boolean,
      default: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "male",
    },
    about: { type: String },
    // description: { type: String },
    branch: { type: String },
    year: { type: Number },
    github: { type: String },
    linkedIn: { type: String },
    leetCode: { type: String },
    twitter: { type: String },
    portfolio: { type: String },
    resume: { type: String },
    workExperience: { type: String },
    education: { type: String },
    review: { type: String },
    projects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    // domainInterest: [{ type: String }],
    achievements: [{ type: String }],
    skill: [{ type: String }],

    refreshToken: {
      type: String,
    },
    socketId: {
      type: String,
    },
  },

  { timestamps: true },
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    },
  );
};

UserSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    },
  );
};

export const User = mongoose.model("User", UserSchema);
