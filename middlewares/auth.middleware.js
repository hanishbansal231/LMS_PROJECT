import AppError from "../utils/error.util.js"
import jwt from 'jsonwebtoken';
import asyncHandler from "./asyncHandler.middleware.js";
const isLoggedIn = asyncHandler(async (req, res, next) => {
        try {
            const { token } = req.cookies;
            if (!token) {
                next(new AppError('Unauthenticated, please login again', 401))
            }
            const userDetails = await jwt.verify(token, process.env.JWT_SECRET);
            req.user = userDetails;
            next();
        } catch (e) {
            next(new AppError(e.message, 500));
        }
    });

const authorizedRole = (...roles) => async(req, res, next) => {
    try{
        const currentUserRole = req.user.role;
        if(!roles.includes(currentUserRole)){
            return next(new AppError('You do not have premission to access this route',402))
        }
        next();
    }catch(e){
        next(new AppError(e.message, 500));
    }
}

const authorizeSubscribe = async (req,res,next) => {
    try{
        const subscription = req.user.subscription;
        const currentRole = req.user.role;
        if(currentRole !== 'ADMIN' && subscription.status !== 'active'){
            return next(new AppError('Please subscribce to access this remote!',403));
        }
    }catch(e){
        return next(new AppError(e.message,500));
    }
}
export {
    isLoggedIn,
    authorizedRole,
    authorizeSubscribe
}