import Course from "../models/course.model";
import AppError from "../utils/error.util"

const getAllCourses = async (req,res,next) => {
    try{
        const courses = await Course.find({}).select('-lectures');
        if(!courses){
            return next(new AppError('Courses is not found...',401));
        }
        res.status(200).json({
            success: true,
            message:'All Courses',
            courses,
        })

    }catch(e){
        return  next(new AppError(e.message,401));
    }
}
const getLecturesByCourseId = async (req,res,next) => {}

export {
    getAllCourses,
    getLecturesByCourseId,
}