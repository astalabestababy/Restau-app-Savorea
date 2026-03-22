const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, code) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"Lutong Bahay" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email - Lutong Bahay',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #D72323; text-align: center;">Mabuhay!</h2>
                    <p>Salamat sa pag-register sa <strong>Lutong Bahay</strong>. Use the code below to verify your email and start ordering delicious Filipino food!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background: #f9f9f9; padding: 10px 20px; border-radius: 5px; border: 1px dashed #D72323;">
                            ${code}
                        </span>
                    </div>
                    
                    <p style="color: #666; font-size: 12px; text-align: center;">If you didn't request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to: ${email}`);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

module.exports = { sendVerificationEmail };
