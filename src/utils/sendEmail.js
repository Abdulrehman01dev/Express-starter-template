const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, message) => {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
    });

    // Convert the message to a string if it's an object (e.g., an error object)
    const textMessage = typeof message === 'object' ? JSON.stringify(message) : message;

    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text: textMessage,
      html: `<b>${textMessage}</b>`,
    });

    console.log("Email sent successfully!");
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Rethrow the error to handle it further up the call stack
  }
};

module.exports = sendEmail;
