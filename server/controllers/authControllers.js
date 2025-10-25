import express from 'express';
import admin from '../config/firebaseAdmin.js';
import prisma from '../config/db.js';

const login = async (req, res) => {
  const idToken = req.headers.authorization?.split(' ')[1];
  if (!idToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid idToken",
    })
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, name, picture, email } = decodedToken;
    const isValidEmail = (email && email.endsWith('@iitp.ac.in'));
    const isDevEmail = (email === 'sagitrapradeep2006@gmail.com');
    
    if (!isValidEmail && !isDevEmail) {
      return res.status(403).json({
        success: false,
        message: "Invalid Email Address",
      })
    }

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
      user: {
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
    console.error('Error during backend login:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export default login;