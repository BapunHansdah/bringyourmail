import { type NextRequest, NextResponse } from "next/server"
import { EmailService } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html } = await request.json()

   const emailConfig = request.headers.get("x-smtp-config")

   const emailService = new EmailService(emailConfig ? JSON.parse(emailConfig) : {});

   const result = await emailService.send({
     to,
     subject,
     html,
   });

   return NextResponse.json(result);
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send email" },
      { status: 500 },
    )
  }
}




// import { type NextRequest, NextResponse } from "next/server"
// import nodemailer from "nodemailer"

// export async function POST(request: NextRequest) {
//   try {
//     const { to, subject, html } = await request.json()

//     // Get SMTP config from request headers or use defaults
//     const smtpConfig = request.headers.get("x-smtp-config")
//     let config = {
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       user: process.env.SMTP_USER || "",
//       pass: process.env.SMTP_PASS || "",
//       from: process.env.SMTP_FROM || "",
//     }

//     if (smtpConfig) {
//       try {
//         config = { ...config, ...JSON.parse(smtpConfig) }
//       } catch {
//         // Use default config
//       }
//     }

//     // Check if SMTP is configured
//     if (!config.user || !config.pass) {
//       return NextResponse.json(
//         { error: "SMTP not configured. Please set SMTP_USER and SMTP_PASS environment variables." },
//         { status: 400 },
//       )
//     }

//     const transporter = nodemailer.createTransport({
//       host: config.host,
//       port: config.port,
//       secure: config.secure,
//       auth: {
//         user: config.user,
//         pass: config.pass,
//       },
//     })

//     await transporter.sendMail({
//       from: config.from || config.user,
//       to,
//       subject,
//       html,
//     })

//     return NextResponse.json({ success: true })
//   } catch (error) {
//     console.error("Email send error:", error)
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : "Failed to send email" },
//       { status: 500 },
//     )
//   }
// }
