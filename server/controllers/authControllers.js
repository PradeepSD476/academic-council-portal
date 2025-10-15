import express from 'express';

const login = async (req , res) => {
  try {
    
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    })
  }
}