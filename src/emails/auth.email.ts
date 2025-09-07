


export const otpVerificationEmailTamplate = (OTP: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Account Verification | Left Seat Lessons</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #ffffff;
            color: #1a1a1a;
            line-height: 1.5;
            padding: 60px 20px;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          .email-container {
            max-width: 480px;
            margin: 0 auto;
            background-color: #ffffff;
            text-align: center;
          }

          .logo-section {
            margin-bottom: 48px;
          }

          .logo img {
            width: 96px;
            height: 96px;
            margin-top: 50px;
          }

          .logo {
            margin: 0 auto 24px;
          }

          .brand-name {
            font-size: 18px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }

          .title {
            font-size: 36px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 56px;
            letter-spacing: -0.75px;
          }

          .message {
            font-size: 18px;
            color: #374151;
            margin-bottom: 48px;
            line-height: 1.6;
            font-weight: 400;
          }

          .message strong {
            color: #111827;
            font-weight: 600;
          }

          .otp-section {
            margin: 20px 0;
            padding: 48px 32px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 20px;
            border: 1px solid #e5e7eb;
            position: relative;
          }

          .otp-section::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
            border-radius: 20px 20px 0 0;
          }

          .otp-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 600;
            margin-bottom: 24px;
          }

          .otp-code {
            font-size: 48px;
            font-weight: 800;
            color: #1e40af;
            letter-spacing: 12px;
            font-family: "SF Mono", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace;
            margin: 20px 0;
            text-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);
          }

          .otp-validity {
            font-size: 14px;
            color: #9ca3af;
            font-weight: 500;
            margin-top: 16px;
          }

          .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e5e7eb, transparent);
            margin: 48px 0;
          }

          .footer {
            margin-top: 10px;
          }

          .company-info {
            font-size: 16px;
            color: #374151;
            font-weight: 600;
            margin-bottom: 5px;
          }

          .support-section {
            font-size: 14px;
            color: #6b7280;
          }

          .support-link {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s ease;
          }

          .support-link:hover {
            color: #1e40af;
            text-decoration: underline;
          }

          .copyright {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 10px;
            font-weight: 400;
          }

          @media (max-width: 600px) {
            body {
              padding: 40px 16px;
            }

            .title {
              font-size: 26px;
            }

            .message {
              font-size: 15px;
            }

            .otp-code {
              font-size: 36px;
              letter-spacing: 8px;
            }

            .otp-section {
              padding: 36px 24px;
              margin: 40px 0;
            }

            .logo {
              width: 80px;
              height: 80px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo-section">
            <div class="logo">
              <img
                src="https://storage.googleapis.com/left_seat_lessons/unnamed.png"
                alt="Left Seat Lessons"
              />
            </div>
            <div class="brand-name">Left Seat Lessons</div>
          </div>

          <h1 class="title">Account Verification</h1>

          <p class="message">
            Please use the verification code below to verify your account and complete the registration process.
          </p>

          <div class="otp-section">
            <div class="otp-label">Verification Code</div>
            <div class="otp-code">${OTP}</div>
            <div class="otp-validity">Expires in 10 minutes</div>
          </div>

          <div class="divider"></div>

          <div class="footer">
            <div class="company-info">Left Seat Lessons</div>
            <div class="copyright">
              © ${new Date().getFullYear()} Left Seat Lessons. All rights reserved.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};