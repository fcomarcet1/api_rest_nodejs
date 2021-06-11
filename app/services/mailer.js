require("dotenv").config();
const nodemailer = require("nodemailer");

async function sendEmail(email, code) {
    try {

        // const smtpEndpoint = "smtp.sendgrid.net";
        // const port = 465;
        // const smtpUsername = "apikey";
        // const smtpPassword = process.env.SG_APIKEY;

        const smtpEndpoint = process.env.MAILTRAP_HOST;
        const port = process.env.MAILTRAP_PORT;
        const smtpUsername = process.env.MAILTRAP_USER;
        const smtpPassword = process.env.MAILTRAP_PASSWORD;
        const senderAddress = "backend_nodejs@nodejs.es";

        var toAddress = email;
        var subject = "Verify your email";
        var confirmationAddress = `${process.env.API_HOSTNAMME}:${process.env.API_PORT}/users/activate`;


        // The body of the email for recipients
        var body_html = `<!DOCTYPE> 
            <html lang="es">
              <body>
                <h2>Hello from Nodejs</h2>
                <p>Your authentication code is : <strong>${code}</strong></p> 
                <p>Thank you for subscribing. Please confirm your email by clicking on the following link and insert your authentication code</p>
                <a href=http://localhost:5000/users/activate> Click here</a>
                <p>If link doesnt work use this link http://localhost:5000/users/activate</p>  
                <p>If you have not requested this code please do not reply to this email</p>
              </body>
            </html>`;

        // Create the SMTP transport.
        let transporter = nodemailer.createTransport({
            host: smtpEndpoint,
            port: port,
            secure: false, // true for 465, false for other ports
            auth: {
                user: smtpUsername,
                pass: smtpPassword,
            },
        });

        // Specify the fields in the email.
        let mailOptions = {
            from: senderAddress,
            to: toAddress,
            subject: subject,
            html: body_html,
        };

        // send email
        let info = await transporter.sendMail(mailOptions);

        return {error: false};

    } catch (error) {
        console.error("send-email-error", error);
        return {
            status: "error",
            error: true,
            message: "Cannot send email",
        };
    }
}

module.exports = sendEmail;
