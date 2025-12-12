// controllers/classController.js

import Class from '../models/ClassModel.js';
import Location from '../models/LocationModel.js';

// Use 'export const' instead of 'exports.createClass'
export const createClass = async (req, res) => {
  try {
    // 1. Create the location first
    const newLocation = await Location.create({
      roomName: req.body.roomName,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      radius: req.body.radius,
    });

    // 2. Create the class, linking the location and teacher
    const newClass = await Class.create({
      className: req.body.className,
      classCode: req.body.classCode,
      teacher: req.user.id, // from protect middleware
      location: newLocation._id,
    });

    res.status(201).json({
      status: 'success',
      data: {
        class: newClass,
      },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Use 'export const'
export const joinClass = async (req, res) => {
  try {
    const { classCode } = req.body;
    const studentId = req.user.id;

    const classToJoin = await Class.findOneAndUpdate(
      { classCode: classCode },
      { $addToSet: { students: studentId } }, // $addToSet prevents duplicates
      { new: true }
    );

    if (!classToJoin) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'Class code not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully joined class',
      data: {
        class: classToJoin,
      },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// Use 'export const'
export const getMyClasses = async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user.id }).populate('location');
    } else {
      classes = await Class.find({ students: req.user.id }).populate(
        'location'
      );
    }

    res.status(200).json({
      status: 'success',
      results: classes.length,
      data: {
        classes,
      },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ... existing imports

// Update a class (e.g., to add a schedule)
export const updateClass = async (req, res) => {
  try {
    // 1. Find the class
    const classToUpdate = await Class.findById(req.params.id);

    if (!classToUpdate) {
      return res.status(404).json({
        status: 'fail',
        message: 'No class found with that ID',
      });
    }

    // 2. SECURITY CHECK: Ensure the logged-in user is the teacher of this class
    // We compare the ID string values
    if (classToUpdate.teacher.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to edit this class.',
      });
    }

    // 3. Update the class
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body, 
      {
        new: true, // Return the updated document
        runValidators: true, // Ensure data format is correct
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        class: updatedClass,
      },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};