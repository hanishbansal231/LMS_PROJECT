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
import asyncHandler from '../middlewares/asyncHandler.middleware.js';
const router = Router();


router.route('/')
    .get(asyncHandler(getAllCourses))
    .post(isLoggedIn, authorizedRole('ADMIN'), upload.single('thumbnail'), asyncHandler(createCourse));

router.route('/:id')
    .get(isLoggedIn, authorizeSubscribe, asyncHandler(getLecturesByCourseId))
    .put(isLoggedIn, authorizedRole('ADMIN'), asyncHandler(updateCourse))
    .delete(isLoggedIn, authorizedRole('ADMIN'), asyncHandler(removeCourse))
    .post(isLoggedIn, authorizedRole('ADMIN'), upload.single('lecture'), asyncHandler(addLectureToCourseByID))
export default router;