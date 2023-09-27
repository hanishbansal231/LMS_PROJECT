import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js"
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
const getAllCourses = async (req, res, next) => {
    try {
        const courses = await Course.find({}).select('-lectures');
        if (!courses) {
            return next(new AppError('Courses is not found...', 401));
        }
        res.status(200).json({
            success: true,
            message: 'All Courses',
            courses,
        })

    } catch (e) {
        return next(new AppError(e.message, 401));
    }
}
const getLecturesByCourseId = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError('Courses is not found...', 401));
        }
        res.status(200).json({
            success: true,
            message: 'Course lectures fetched successfully...',
            lectures: course.lectures,
        })

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const createCourse = async (req, res, next) => {
    try {
        const { title, description, category, createdBy } = req.body;
        if (!title || !description || !category || !createdBy) {
            return next(new AppError('ALl fields are required...', 400));
        }
        const course = await Course.create({
            title,
            description,
            category,
            createdBy,
            thumbnail: {
                public_id: 'Dummy',
                secure_url: 'Dummy',
            }
        });
        if (!course) {
            return next(new AppError('Course could not be created, please try again', 402));
        }
        if (req.file) {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                width: 250,
                height: 250,
                gravity: 'faces',
                crop: 'fill',
            });
            if (result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }
            fs.rm(`uploads/${req.file.filename}`);
        }
        await course.save();
        res.status(200).json({
            success: true,
            message: 'Course created successfully',
            course,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await Course.findByIdAndUpdate(
            { _id: id },
            {
                $set: req.body,
            },
            {
                // runValidators: true,
                new: true,
            });
        if (!course) {
            return next(new AppError('Course with given id does not exits', 402));
        }
        res.status(200).json({
            success: true,
            message: 'Course updated successfully...',
            course,
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const removeCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) {
            return next(new AppError('Course with given id does not exits', 402));
        }
        await Course.findByIdAndDelete({ _id: id });
        res.status(200).json({
            success: true,
            message: 'Course deleted successfully...',
        })

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const addLectureToCourseByID = async (req, res, next) => {
    try {
        const { title, description } = req.body;
        const { id } = req.params;
        if (!title || !description) {
            return next(new AppError('ALl fields are required...', 400));
        }
        const course = await Course.findById({ _id: id });
        if (!course) {
            return next(new AppError('Course with given id does not exits', 402));
        }
        const lectureData = {
            title,
            description,
            lecture: {}
        };
        if (req.file) {
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                });
                if (result) {
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                }
                fs.rm(`uploads/${req.file.filename}`);
            } catch (e) {
                return next(new AppError(e.message, 500));
            }
        }
        course.lectures.push(lectureData);
        course.numbersOfLectures = course.lectures.length;
        await course.save();
        return res.status(200).json({
            success: true,
            message: 'Lecture successfully added to the course',
            course,
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const removeLectureFromCourse = async (req, res, next) => {
    try {
        const { courseId, lectureId } = req.query;
        if (!courseId) {
            return next(new AppError('Course ID is required', 400));
        }
        if (!lectureId) {
            return next(new AppError('Lecture ID is required', 400));
        }
        const course = await Course.findById({ _id: courseId });
        if (!course) {
            return next(new AppError('Invalid ID or Course does not exist.', 404));
        }
        const lectureIndex = course.lectures.findIndex((lecture) => lecture._id.toString() === lectureId.toString());
        if (lectureIndex === -1) {
            return next(new AppError('Lecture does not exist.', 404));
        }

        await cloudinary.v2.uploader.destroy(
            course.lectures[lectureIndex].lecture.public_id,
            {
                resource_type: 'video',
            }
        );
        course.lectures.splice(lectureIndex, 1);
        course.numbersOfLectures = course.lectures.length;
        await course.save();
        res.status(200).json({
            success: true,
            message: 'Course lecture removed successfully',
        });

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}
export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseByID,
    removeLectureFromCourse
}