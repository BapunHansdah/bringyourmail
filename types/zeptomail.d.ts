// src/types/zeptomail.d.ts
declare module "zeptomail" {
  export class SendMailClient {
    constructor(options: {
      url: string;
      token: string;
    });

    sendMail(payload: any): Promise<any>;
  }
}
