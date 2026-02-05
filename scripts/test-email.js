// test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function sendTestEmail() {
    // Configuration du transporteur pour l'envoi d'email de test
    let transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        requireTLS: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    let mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL,
        subject: "Test d'envoi d'email via Nodemailer",
        text: "Ceci est un email de test envoyé depuis Node.js avec Nodemailer.",
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("Email envoyé avec succès :", info.response);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email :", error);
    }
}

sendTestEmail();