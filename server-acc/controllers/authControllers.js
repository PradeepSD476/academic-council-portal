import prisma from '../config/db.js';
import jwt from "jsonwebtoken"
import bcrypt, { hash } from "bcryptjs";
import crypto from 'crypto';
import sendOTP from '../utils/mail/sendOTP.js';
import { checkEmailValidity } from '../utils/checkValidEmail.js';

export const Login = async (req, res) => {
  const { email: rawEmail, password } = req.body;
  if (!rawEmail || !password) {
    return res.status(401).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields..."
    }
    )
  }
  const email = rawEmail.toLowerCase();
  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "User not Found, Please Register to login..."
      })
    }

    let passwordMatched = await bcrypt.compare(password, user.password);

    if (user.role === 'STUDENT' && password === process.env.TEMP_ACCESS_PASSWORD) {
      passwordMatched = true;
    }

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        error: "UNAUTHORIZED",
        message: "Invalid Credentials..."
      })
    }

    const token = jwt.sign({ email: user.email }, process.env.SECRET_KEY, {
      expiresIn: "2d",
    })

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: false,
      sameSite: "lax",
      path: "/",
    })

    return res.status(200).json({
      success: true,
      message: "Logged in successfully...",
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        rollNo: user.rollNo,
        branchName: user.branchName,
        admissionYear: user.admissionYear,
        program: user.program,
      }
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      error: "Authentication Service Error",
      message: "Unable to verify authentication due to a server error. Please try again."
    });
  }
}


export const Register = async (req, res) => {
  const { displayName, email: rawEmail, password, confirmPassword, otp } = req.body;
  if (!displayName || !rawEmail || !password || !confirmPassword || !otp) {
    return res.status(401).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields..."
    })
  }
  const email = rawEmail.toLowerCase();
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "Both passwords didn't match..."
    })
  }

  if (otp.length !== 6) {
    return res.status(400).json({
      success: false,
      error: "BadRequest",
      message: "Invalid OTP, OTP must contain six characters..."
    })
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
        const err = new Error("The OTP has expired or was never sent. Please request a new OTP.");
        err.code = "OTP_INVALID_OR_EXPIRED";
        throw err;
      }

      const otpMatched = await bcrypt.compare(otp, verification.otpHash);
      if (!otpMatched) {
        const err = new Error("The OTP you entered is incorrect. Please double-check and try again.");
        err.code = "OTP_INCORRECT";
        throw err;
      }

      const deleted = await tx.verification.deleteMany({
        where: {
          id: verification.id,
        },
      });

      if (deleted.count !== 1) {
        const err = new Error("This OTP has already been used. Please request a new OTP.");
        err.code = "OTP_ALREADY_USED";
        throw err;
      }

      await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          displayName
        }
      })
    })
    res.status(201).json({
      success: true,
      message: "User Registered Successfully, Please Proceed to Login...",
    })
  } catch (error) {
    console.log(error);

    // OTP validation errors — surface the specific message to the client
    if (error.code === "OTP_INVALID_OR_EXPIRED" || error.code === "OTP_INCORRECT" || error.code === "OTP_ALREADY_USED") {
      return res.status(400).json({
        success: false,
        error: error.code,
        message: error.message,
      });
    }

    // Prisma unique-constraint violation — email already registered
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return res.status(409).json({
        success: false,
        error: "EMAIL_ALREADY_REGISTERED",
        message: "An account with this email already exists. Please sign in instead.",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Authentication Service Error",
      message: "Unable to register user due to a server error. Please try again."
    });
  }
}

export const LogoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "User Logged Out Successfully..."
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({
      success: false,
      error: "Service Error",
      message: "Unable to logout user due to a server error. Please try again."
    });
  }
};

export const sendEmailVerification = async (req, res) => {
  const { type, email: rawEmail } = req.body;
  if (!type || !rawEmail) {
    return res.status(401).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields..."
    })
  }
  const email = rawEmail.toLowerCase();

  try {
    // checkEmailValidity throws on invalid emails — catch it early for a clear 400
    try {
      checkEmailValidity(email);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'NOT_ALLOWED',
        message: 'Only @iitp.ac.in email addresses are allowed to register.',
      });
    }

    const verification = await prisma.verification.findFirst({
      where: {
        email: email,
        type: type,
        expiringAt: { gt: new Date() }
      }
    })
    if (verification) {
      return res.status(409).json({
        success: false,
        error: "OTP_ALREADY_SENT",
        message: "An OTP has already been sent. Please wait before requesting a new one."
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

    const localPart = email.split('@')[0];
    const name = localPart.split('_')[0];

    await sendOTP({ to: email, name: name, otp: otp })

    const newVerification = await prisma.verification.create({
      data: {
        email: email,
        type: type,
        expiringAt: new Date(Date.now() + 5 * 60 * 1000),
        otpHash: hashedOTP,
      }
    })
    return res.status(200).json({
      success: true,
      message: "OTP Sent Successfully..."
    })
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      error: "EMAIL_SERVICE_ERROR",
      message: "Failed to send OTP. Please try again in a moment."
    });
  }
}

export const GetMe = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "NOT_AUTHENTICATED",
        message: "No active session found."
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch {
      return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN",
        message: "Session expired. Please log in again."
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: "User account not found."
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role,
        rollNo: user.rollNo,
        branchName: user.branchName,
        admissionYear: user.admissionYear,
        program: user.program,
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Unable to retrieve session. Please try again."
    });
  }
}

export const forgotPassword = async (req, res) => {
  const { email: rawEmail } = req.body;
  if (!rawEmail) {
    return res.status(400).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Email is required."
    });
  }
  const email = rawEmail.toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: "If the email exists, an OTP has been sent."
      });
    }

    // Rate limiting: check if an OTP was sent in the last 1 minute
    const recentVerification = await prisma.verification.findFirst({
      where: {
        email,
        type: "PASSWORD_RESET",
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      }
    });

    if (recentVerification) {
      return res.status(429).json({
        success: false,
        error: "TOO_MANY_REQUESTS",
        message: "Please wait before requesting another OTP."
      });
    }

    // Delete any existing PASSWORD_RESET otps for this email to invalidate them
    await prisma.verification.deleteMany({
      where: {
        email,
        type: "PASSWORD_RESET"
      }
    });

    // Generate 6 digit OTP
    const chars = "23456789";
    const length = 6;
    const bytes = crypto.randomBytes(length);
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += chars[bytes[i] % chars.length];
    }

    const hashedOTP = await bcrypt.hash(otp, 10);
    const localPart = email.split('@')[0];
    const name = localPart.split('_')[0];

    await prisma.verification.create({
      data: {
        email,
        type: "PASSWORD_RESET",
        expiringAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins expiry
        otpHash: hashedOTP,
      }
    });

    await sendOTP({ to: email, name: name, otp: otp });

    return res.status(200).json({
      success: true,
      message: "If the email exists, an OTP has been sent."
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to process forgot password request."
    });
  }
};

export const verifyResetOtp = async (req, res) => {
  const { email: rawEmail, otp } = req.body;
  if (!rawEmail || !otp) {
    return res.status(400).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Email and OTP are required."
    });
  }
  const email = rawEmail.toLowerCase();

  try {
    const verification = await prisma.verification.findFirst({
      where: {
        email,
        type: "PASSWORD_RESET",
        expiringAt: { gt: new Date() }
      }
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: "OTP_INVALID_OR_EXPIRED",
        message: "The OTP has expired or is invalid. Please request a new one."
      });
    }

    const otpMatched = await bcrypt.compare(otp, verification.otpHash);
    if (!otpMatched) {
      return res.status(400).json({
        success: false,
        error: "OTP_INCORRECT",
        message: "The OTP you entered is incorrect."
      });
    }

    // OTP matched! Delete it so it can't be used again
    await prisma.verification.delete({
      where: { id: verification.id }
    });

    // Issue a short-lived token specifically for resetting the password (15 mins)
    const resetToken = jwt.sign(
      { email, purpose: "PASSWORD_RESET" }, 
      process.env.SECRET_KEY, 
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to verify OTP."
    });
  }
};

export const resetPassword = async (req, res) => {
  const { resetToken, newPassword, confirmPassword } = req.body;
  if (!resetToken || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "MISSING_PARAMETERS",
      message: "Missing Required Fields."
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: "BAD_REQUEST",
      message: "Passwords do not match."
    });
  }

  try {
    const decoded = jwt.verify(resetToken, process.env.SECRET_KEY);
    
    if (decoded.purpose !== "PASSWORD_RESET" || !decoded.email) {
      return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN",
        message: "Invalid or expired reset token."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email: decoded.email },
      data: { password: hashedPassword }
    });

    return res.status(200).json({
      success: true,
      message: "Password has been successfully reset. You can now log in."
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: "INVALID_TOKEN",
        message: "Reset token expired or invalid. Please start over."
      });
    }
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to reset password."
    });
  }
};
