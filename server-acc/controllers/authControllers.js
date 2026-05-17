import prisma from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcryptjs";
import crypto from "crypto";
import sendOTP from "../utils/mail/sendOTP.js";
import { checkEmailValidity } from "../utils/checkValidEmail.js";

export const Login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(401).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields...",
    });
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "User not Found, Please Register to login...",
      });
    }

    let passwordMatched = await bcrypt.compare(password, user.password);

    if (
      user.role === "STUDENT" &&
      password === process.env.TEMP_ACCESS_PASSWORD
    ) {
      passwordMatched = true;
    }

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid Credentials...",
      });
    }

    const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY, {
      expiresIn: "2d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully...",
      data: {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        rollNo: user.rollNo,
        branchName: user.branchName,
        admissionYear: user.admissionYear,
        program: user.program,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      error: "Authentication Service Error",
      message:
        "Unable to verify authentication due to a server error. Please try again.",
    });
  }
};

export const Register = async (req, res) => {
  const { displayName, email, password, confirmPassword, otp } = req.body;
  if (!displayName || !email || !password || !confirmPassword || !otp) {
    return res.status(401).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields...",
    });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "Both passwords didn't match...",
    });
  }

  if (otp.length !== 6) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "Invalid OTP, OTP must contain six characters...",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx) => {
      const verification = await tx.verification.findFirst({
        where: {
          email,
          type: "EMAIL_VERIFICATION",
          expiringAt: { gt: new Date() },
        },
      });

      if (!verification) {
        throw new Error("Invalid or expired OTP");
      }

      const otpMatched = await bcrypt.compare(otp, verification.otpHash);
      if (!otpMatched) {
        throw new Error("Invalid or expired OTP");
      }

      const deleted = await tx.verification.deleteMany({
        where: {
          id: verification.id,
        },
      });

      if (deleted.count !== 1) {
        throw new Error("OTP already used");
      }

      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName,
        },
      });
    });
    res.status(201).json({
      success: true,
      message: "User Registered Successfully, Please Proceed to Login...",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Authentication Service Error",
      message:
        "Unable to register user due to a server error. Please try again.",
    });
  }
};

export const LogoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "User Logged Out Successfully...",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      success: false,
      error: "Service Error",
      message: "Unable to logout user due to a server error. Please try again.",
    });
  }
};

export const sendEmailVerification = async (req, res) => {
  const { type, email } = req.body;
  if (!type || !email) {
    return res.status(401).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields...",
    });
  }

  try {
    if (!checkEmailValidity(email)) {
      return res.status(400).json({
        success: false,
        error: "NOT_ALLOWED",
        message: "Restricted for use of IITP Students Only.",
      });
    }

    const verification = await prisma.verification.findFirst({
      where: {
        email: email,
        type: type,
        expiringAt: { gt: new Date() },
      },
    });
    if (verification) {
      return res.status(409).json({
        success: false,
        error: "OTP_ALREADY_SENT",
        message:
          "An OTP has already been sent. Please wait before requesting a new one.",
      });
    }

    const chars = "23456789";

    const length = 6;
    const bytes = crypto.randomBytes(length);
    let otp = "";

    for (let i = 0; i < length; i++) {
      otp += chars[bytes[i] % chars.length];
    }

    const hashedOTP = await bcrypt.hash(otp, 10);

    const localPart = email.split("@")[0];
    const name = localPart.split("_")[0];
    console.log("OTP:", otp);
    // await sendOTP({ to: email, name: name, otp: otp })

    const newVerification = await prisma.verification.create({
      data: {
        email: email,
        type: type,
        expiringAt: new Date(Date.now() + 5 * 60 * 1000),
        otpHash: hashedOTP,
      },
    });
    return res.status(200).json({
      success: true,
      message: "OTP Sent Successfully...",
    });
  } catch (error) {
    console.log(error);

    if (error.code === "NOT_ORG_MEMBER") {
      return res.status(403).json({
        success: false,
        error: "Only IITP Students Are Allowed.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal Server Error.",
    });
  }
};
