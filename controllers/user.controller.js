import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    httpOnly: true,
    secure: true,
}
const register = async (req, res, next) => {
    try {
        const { fullName, email, password } = req.body;
        if (!fullName || !email || !password) {
            return next(new AppError('All fields are required', 400));
        }
        const userExits = await User.findOne({ email });
        if (userExits) {
            return next(new AppError('Email already exits', 400));
        }
        const user = await User.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url: `Hello`
            }
        });
        if (!user) {
            return next(new AppError('User registration failed, Please try again', 400));
        }
        await user.save();
        user.password = undefined;
        const token = await user.generateJWTToken();
        res.cookie('token', token, cookieOptions);
        return res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new AppError('All fields are required', 400));
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !user.comparePassword(password)) {
            return next(new AppError('Email or Password does not matched', 400));
        }
        const token = await user.generateJWTToken();

        user.password = undefined;
        res.cookie('token', token, cookieOptions);
        res.status(200).json({
            success: true,
            message: 'User loggedin successfully',
            user,
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}
const logout = (req, res, next) => {
    try {
        res.cookie('token', null, {
            secure: true,
            maxAge: 0,
            httpOnly: true,
        });
        return res.status(200).json({
            success: true,
            message: 'User logged out successfully',
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        return res.status(200).json({
            success: true,
            message: 'User Details',
            user,
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

export {
    register,
    login,
    logout,
    getProfile
}