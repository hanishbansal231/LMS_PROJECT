import User from "../models/user.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary';
import fs from 'fs/promises';
import sendEmail from "../utils/sendEmail.js";
import crypto from 'crypto';
import otpGenerator from 'otp-generator';
import OTP from "../models/otp.model.js";
const cookieOptions = {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    httpOnly: true,
    secure: true,
}

const sendOTP = async (req, res, next) => {
    try {
        console.log("Starting...");
        const { email } = req.body;
        console.log(email);
        const existUser = await User.findOne({ email });
        if (existUser) {
            return next(new AppError("User is Already Registered", 402));
        }

        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const result = await OTP.findOne({ otp: otp });
        console.log("Result is Generate OTP Func")
        console.log("OTP", otp)
        console.log("Result", result)

        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
        }

        const otpPayload = { email, otp };
        const otpBody = await OTP.create(otpPayload);
        console.log("OTP Body", otpBody)
        res.status(200).json({
            success: true,
            message: `OTP Sent Successfully`,
            otp,
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const register = async (req, res, next) => {
    try {
        console.log("Starting....");
        const { fullName, email, password, otp } = req.body;

        if (!fullName || !email || !password || !otp) {
            return next(new AppError('All fields are required', 400));
        }
        const userExits = await User.findOne({ email });

        if (userExits) {
            return next(new AppError('Email already exits', 400));
        }

        const response = await OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1);

        if (response.otp.length === 0) {
            return next(new AppError("The OTP is not valid", 402));
        } else if (otp !== response.otp) {
            return next(new AppError("The OTP is not valid", 402));
        }
        const user = await User.create({
            fullName,
            email,
            password,
            avatar: {
                public_id: email,
                secure_url:
                    'https://res.cloudinary.com/du9jzqlpt/image/upload/v1674647316/avatar_drzgxv.jpg',
            }
        });

        if (!user) {
            return next(new AppError('User registration failed, Please try again', 400));
        }
        if (req.file) {
            console.log(req.file);
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill',
                });
                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;

                    fs.rm(`uploads/${req.file.filename}`)
                }

            } catch (e) {
                next(new AppError(e.message, 400));
            }
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
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return next(new AppError("Email is required", 401));
        }
        const user = await User.findOne({ email });
        if (!user) {
            return next(new AppError('Email not registered', 401));
        }
        const resetToken = await user.generatePasswordResetToken();
        await user.save();
        const resetPasswordUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        console.log("resetPasswordUrl", resetPasswordUrl);
        const subject = 'Reset Password';
        const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;
        try {
            await sendEmail(email, subject, message);
            res.status(200).json({
                success: true,
                message: `Reset Password token has been sent to ${email} successfully`,

            })
        } catch (e) {
            user.forgotPasswordToken = undefined;
            user.forgotPasswordExpiry = undefined;
            await user.save();
            return next(new AppError(e.message, 500));
        }

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}
const resetPassword = async (req, res, next) => {
    try {
        const { resetToken } = req.params;
        console.log("resetToken", resetToken);
        const { password } = req.body;
        if (!password) {
            return next(new AppError('Password is required', 400));
        }
        const forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');


        console.log("forgotPasswordToken", forgotPasswordToken);
        const user = await User.findOne({
            forgotPasswordToken,
            forgotPasswordExpiry: { $gt: Date.now() },
        });
        console.log(user);
        if (!user) {
            return next(new AppError('Token is invalid or expired', 400));
        }
        user.password = password;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save();
        return res.status(200).json({
            success: true,
            message: 'Password Change Successfull...',
        });
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const changePassword = async (req, res, next) => {
    try {
        console.log("Starting....");
        const { oldPassword, newPassword } = req.body;
        console.log(oldPassword);
        const { id } = req.user;
        console.log(id);
        if (!oldPassword || !newPassword) {
            return next(new AppError('All fields are manddatory', 400));
        }
        const user = await User.findById(id).select('+password');
        if (!user) {
            return next(new AppError('User does not exist', 400));
        }
        const isPasswordValid = await user.comparePassword(oldPassword);
        if (!isPasswordValid) {
            return next(new AppError('Invalid Old Password', 400));
        }
        user.password = newPassword;
        await user.save();
        user.password = undefined;
        return res.status(200).json({
            success: true,
            message: 'Password Change Successfully...',
        })
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const updateUser = async (req, res, next) => {
    try {
        console.log("Start...");
        const { fullName } = req.body;
        const { id } = req.user;
        const user = await User.findById(id);
        if (!user) {
            return next(new AppError('User does not exist', 400));
        }
        if (fullName) {
            user.fullName = fullName;
        }
        console.log(fullName);
        if (req.file) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id);
            try {
                const result = await cloudinary.v2.uploader.upload(req.file.path, {
                    folder: 'lms',
                    width: 250,
                    height: 250,
                    gravity: 'faces',
                    crop: 'fill',
                });
                if (result) {
                    user.avatar.public_id = result.public_id;
                    user.avatar.secure_url = result.secure_url;
                    fs.rm(`uploads/${req.file.filename}`)
                }
            } catch (e) {
                next(new AppError(e.message, 400));
            }
            await user.save();
            console.log(user);
            return res.status(200).json({
                success: true,
                message: 'User Details Updated Successfully...',
                user,
            });
        }
    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

const deleteAccount = async (req, res, next) => {
    try {
        const { id } = req.user;

        const user = await User.findById({ _id: id });

        if(!user){
            return next(new AppError('User not found',402));
        }
        await cloudinary.uploader.destroy(user.avatar.public_id);

        await User.findByIdAndDelete({_id:id});

        res.status(200).json({
            success: true,
            message:'Deleted Successfully...',
        })

    } catch (e) {
        return next(new AppError(e.message, 500));
    }
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser,
    sendOTP,
    deleteAccount,
}