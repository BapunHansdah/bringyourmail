import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: Number.parseInt(config.port),
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    })

    await transporter.verify()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("SMTP test error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Connection failed" }, { status: 500 })
  }
}
