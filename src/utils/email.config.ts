import nodemailer from "nodemailer";

import dotenv from "dotenv";
import { forgotPasswordOtpTemplate, otpVerificationEmailTamplate } from "../emails/auth.email";

dotenv.config();


export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  const mailTransporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    auth: {
      user: process.env.NODE_MAILER_EMAIL,
      pass: process.env.NODE_MAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"BBS" <tqmhosain@gmail.com>`,
    to,
    subject,
    html: htmlContent,
  };

  await mailTransporter.sendMail(mailOptions);
};



//registaion user otp email
export const otpVerificationEmail = async (
  email: string,
  otp: string
): Promise<void> => {

  const htmlContent = otpVerificationEmailTamplate(otp);
  await sendEmail(email, "OTP Verification Email", htmlContent);
};

// Add this new email sending function
export const forgotPasswordEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const htmlContent = forgotPasswordOtpTemplate(otp);
  await sendEmail(email, "Password Reset Verification Code", htmlContent);
};