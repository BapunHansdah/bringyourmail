import nodemailer from "nodemailer";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { google } from "googleapis";
import { JWT } from "google-auth-library";
import { SendMailClient } from "zeptomail"; 

import {
  AwsSesProvider,
  EmailProvider,
  GmailApiProvider,
  SmtpProvider,
  ZeptoMailProvider,
} from "@/types/config";
import { EmailMessage, SendEmailResult } from "@/types/email";

export class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async send(message: EmailMessage): Promise<SendEmailResult> {
    try {
      switch (this.provider.type) {
        case "smtp":
          return await this.sendWithSmtp(message);
        case "aws_ses":
          return await this.sendWithSes(message);
        case "gmail_api":
          return await this.sendWithGmail(message);
        case "zepto_mail":
          return await this.sendWithZepto(message);
        default:
          throw new Error(
            `Unsupported provider type: ${(this.provider as any).type}`
          );
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async sendWithSmtp(message: EmailMessage): Promise<SendEmailResult> {
    const config = (this.provider as SmtpProvider).config;

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    } as nodemailer.TransportOptions);

    const info = await transporter.sendMail({
      from: message.from || config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  }

  private async sendWithSes(message: EmailMessage): Promise<SendEmailResult> {
    const config = (this.provider as AwsSesProvider).config;

    const client = new SESClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    const params = {
      Source: message.from || config.from,
      Destination: {
        ToAddresses: [message.to],
      },
      Message: {
        Subject: {
          Data: message.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: message.html,
            Charset: "UTF-8",
          },
          ...(message.text && {
            Text: {
              Data: message.text,
              Charset: "UTF-8",
            },
          }),
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await client.send(command);

    return {
      success: true,
      messageId: response.MessageId,
    };
  }

  private async sendWithGmail(message: EmailMessage): Promise<SendEmailResult> {
    const config = (this.provider as GmailApiProvider).config;

    console.log("Gmail API config:", config);
    console.log("Message to be sent:", message);

    const jwtClient = new JWT({
      email: config.client_email,
      key: config?.private_key?.split(String.raw`\n`).join('\n'),
      scopes: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
      ],
      subject: config.from,
    });

    console.log("JWT client initialized:", jwtClient);

    await jwtClient.authorize();

    console.log("JWT client authorized:", jwtClient);

    const gmail = google.gmail({ version: "v1", auth: jwtClient });

    console.log("Gmail client initialized:", gmail);

    const encodedMessage = this.createGmailMessage(
      message.to,
      message.subject,
      message.html,
      message.from || config.from,
      message.fromName
    );

    console.log("Gmail encoded message:", encodedMessage);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("Gmail send result:", response.data);

    return {
      success: true,
      messageId: response.data.id as string,
    };
  }

  private createGmailMessage(
    to: string,
    subject: string,
    htmlContent: string,
    from: string,
    fromName?: string
  ): string {
    const fromHeader = fromName ? `${fromName} <${from}>` : from;

    const messageParts = [
      `From: ${fromHeader}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="boundary123"`,
      ``,
      `--boundary123`,
      `Content-Type: text/plain; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      subject,
      ``,
      `--boundary123`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      htmlContent,
      ``,
      `--boundary123--`,
    ];

    const message = messageParts.join("\n");

    return Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  private async sendWithZepto(message: EmailMessage): Promise<SendEmailResult> {
    const config = (this.provider as ZeptoMailProvider).config;

    console.log("Zepto Mail config:", config);

    const client = new SendMailClient({
      url: config.url,
      token: config.apiKey,
    });

    const response = await client.sendMail({
      from: {
        address: message.from || config.from,
        name: message.fromName || config?.fromName || "",
      },
      to: [
        {
          email_address: {
            address: message.to,
            name: "",
          },
        },
      ],
      subject: message.subject,
      htmlbody: message.html,
    }).catch((error) => {
        console.error("Zepto Mail error:", JSON.stringify(error));
    });

    return {
      success: true,
      messageId: response.data?.[0]?.message_id,
    };
  }
}
