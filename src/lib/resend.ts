import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'EastAfrica Export OS <noreply@eastafrica-export.com>';

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
