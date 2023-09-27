import { Router } from 'express';
import {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    removeCourse,
    addLectureToCourseByID
} from '../controllers/course.controller.js';
import { authorizeSubscribe, authorizedRole, isLoggedIn } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.middleware.js';
const router = Router();


router.route('/')
    .get(getAllCourses)
    .post(isLoggedIn, authorizedRole('ADMIN'), upload.single('thumbnail'), createCourse);

router.route('/:id')
    .get(isLoggedIn,authorizeSubscribe,getLecturesByCourseId)
    .put(isLoggedIn, authorizedRole('ADMIN'), updateCourse)
    .delete(isLoggedIn, authorizedRole('ADMIN'), removeCourse)
    .post(isLoggedIn, authorizedRole('ADMIN'),upload.single('lecture'), addLectureToCourseByID)
export default router;