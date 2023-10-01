import { Schema, model } from 'mongoose';
import sendEmail from '../utils/sendEmail.js';
const OTPSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5,
    }
});


async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = sendEmail(email, "Verification Email", otp);
        console.log("Email sent successfully: ", mailResponse.response);
    }
    catch (error) {
        console.log("Error occurred while sending email: ", error);
        throw error;
    }
}

OTPSchema.pre("save", async function (next) {
    if (this.isNew) {
        sendVerificationEmail(this.email, this.otp);
    }
    next();
});

const OTP = model('OTP', OTPSchema);
export default OTP;