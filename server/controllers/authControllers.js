import express from 'express';
import admin from '../config/firebaseAdmin.js';
import prisma from '../config/db.js';

const login = async (req, res) => {
  const idToken = req.headers.authorization?.split(' ')[1];
  if (!idToken) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication token is required."
    }
    )
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name, picture, email } = decodedToken;
    console.log(idToken);
    const user = await prisma.user.upsert({
      where: {
        email: email,
      },
      update: {
        displayName: name,
        photoURL: picture
      },
      create: {
        displayName: name,
        photoURL: picture,
        email: email
      },
    });

    return res.status(200).json({
      success: true,
      message: "Authentication successful.",
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
    return res.status(500).json({
      success: false,
      error: "Authentication Service Error",
      message: "Unable to verify authentication token due to a server error. Please try again."
    });
  }
}

export default login;