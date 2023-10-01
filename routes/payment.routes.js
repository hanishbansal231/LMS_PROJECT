import { Router } from "express";

import {
    allPayments,
    buyScription,
    cancelSubscription,
    getRazorpayApiKey,
    verifySubscription
} from "../controllers/payment.controller.js";
import { authorizedRole, isLoggedIn } from '../middlewares/auth.middleware.js'
import asyncHandler from "../middlewares/asyncHandler.middleware.js";

const router = Router();

router
    .route('/razorpay-key')
    .get(isLoggedIn, asyncHandler(getRazorpayApiKey));

router
    .route('/subscribe')
    .post(isLoggedIn, asyncHandler(buyScription));

router
    .route('/verify')
    .post(isLoggedIn, asyncHandler(verifySubscription));

router
    .route('unsubscribe')
    .post(isLoggedIn, asyncHandler(cancelSubscription))

router
    .route('/')
    .get(isLoggedIn, authorizedRole('ADMIN'), asyncHandler(allPayments));

export default router;