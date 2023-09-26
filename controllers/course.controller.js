import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js"

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
        if(!course){
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

export {
    getAllCourses,
    getLecturesByCourseId,
}