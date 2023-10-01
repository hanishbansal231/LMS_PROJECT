import { Router } from "express";
import {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser,
    sendOTP,
    deleteAccount
} from '../controllers/user.controller.js';
import { isLoggedIn } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";
const router = Router();

router.post("/sendotp", asyncHandler(sendOTP))
router.post('/register', upload.single('avatar'), asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/reset', asyncHandler(forgotPassword));
router.post('/reset/:resetToken', asyncHandler(resetPassword));
router.post('/change-password', isLoggedIn, asyncHandler(changePassword));

router.get('/logout', asyncHandler(logout));
router.get('/me', isLoggedIn, asyncHandler(getProfile));

router.put('/update/:id', isLoggedIn, upload.single('avatar'), asyncHandler(updateUser));

router.delete('/delete',isLoggedIn,asyncHandler(deleteAccount));
export default router;