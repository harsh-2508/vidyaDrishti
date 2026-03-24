import Class from '../models/ClassModel.js';
// We do NOT need LocationModel anymore because we embedded the location in ClassModel

export const createClass = async (req, res) => {
  try {
    const { className, classCode, roomName, latitude, longitude, radius } = req.body;

    // 1. Validate Input
    if (!roomName || !latitude || !longitude) {
      return res.status(400).json({ 
        status: 'fail', 
        message: 'Please provide Room Name and allow Location Access.' 
      });
    }

    // 2. Create the Class with GeoJSON Location
    const newClass = await Class.create({
      className,
      classCode,
      roomName, // ✅ Pass roomName explicitly
      teacher: req.user.id, // Assigned from the logged-in user
      radius: radius || 25,
      // ✅ FIX: Construct the GeoJSON object here
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)] // Note: MongoDB uses [Lon, Lat] order
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        class: newClass,
      },
    });
  } catch (err) {
    // Better Error Handling for Duplicate Keys (like Class Code)
    if (err.code === 11000) {
      return res.status(400).json({ status: 'fail', message: 'Class Code already exists!' });
    }
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const joinClass = async (req, res) => {
  try {
    const { classCode } = req.body;
    const studentId = req.user.id;

    // Add student to the class list (prevent duplicates with $addToSet)
    const classToJoin = await Class.findOneAndUpdate(
      { classCode: classCode },
      { $addToSet: { students: studentId } },
      { new: true }
    );

    if (!classToJoin) {
      return res.status(404).json({ status: 'fail', message: 'Class code not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Successfully joined class',
      data: { class: classToJoin },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const getMyClasses = async (req, res) => {
  try {
    let classes;
    // Return classes based on Role
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user.id });
    } else {
      classes = await Class.find({ students: req.user.id });
    }

    res.status(200).json({
      status: 'success',
      results: classes.length,
      data: { classes },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const classToUpdate = await Class.findById(req.params.id);

    if (!classToUpdate) {
      return res.status(404).json({ status: 'fail', message: 'No class found' });
    }

    // Security: Only the owner teacher can edit
    if (classToUpdate.teacher.toString() !== req.user.id) {
      return res.status(403).json({ status: 'fail', message: 'Permission denied.' });
    }

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: { class: updatedClass },
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};