import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config();
const sendEmail = async function (email, subject, message) {
    try {
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            auth: {
                user: process.env.SMTP_FROM_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        // console.log("transporter", transporter);

       let info = await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL,
            to: `${email}`,
            subject: `${subject}`,
            html: `${message}`,
        });
        // console.log('INFO -> ',info);
    } catch (e) {
        console.log("Email Not Send -> ",e);
    }
}

export default sendEmail;