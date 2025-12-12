import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/UserModel.js'; // Make sure to add .js

// Function to sign a JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

export const signup = async (req, res) => {
  try {
    const newUser = await User.create({
      name: req.body.name, // Use 'name' to match your corrected user model
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      studentId: req.body.studentId,
    });

    const token = signToken(newUser._id);
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password!',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    const token = signToken(user._id);
    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    });
  }
};

export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.',
      });
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = currentUser;
    next();
  } catch (err) {
    res.status(401).json({
      status: 'fail',
      message: 'Invalid token.',
    });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action.',
      });
    }
    next();
  };
};

// ... at the end of the file ...

export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      // Ensure faceDescriptor is included in the user object
      user: req.user, 
    },
  });
};

// Add this new function
export const registerFace = async (req, res) => {
  try {
    const { faceDescriptor } = req.body; // Expecting an array of numbers

    await User.findByIdAndUpdate(req.user.id, {
      faceDescriptor: faceDescriptor
    });

    res.status(200).json({ status: 'success', message: 'Face registered successfully!' });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

