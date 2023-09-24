import AppError from "../utils/error.util.js"
import jwt from 'jsonwebtoken';
const isLoggedIn = async (req,res,next) => {
    try{
        const {token} = req.cookies;
        if(!token){
            next(new AppError('Unauthenticated, please login again',401))
        }
        const userDetails = await jwt.verify(token,process.env.JWT_SECRET);
        req.user = userDetails;
        next();
    }catch(e){
        next(new AppError(e.message,500));
    }
}

export {
    isLoggedIn
}