import * as Crypto from 'expo-crypto';

interface TicketPayload {
  ticketId: string;
  studentId: string;
  studentName: string;
  origin: string;
  destination: string;
  journeyDate: string;
  expiresAt: number;
  signature: string;
}

class QRValidator {
  private readonly serverPublicKey = process.env.EXPO_PUBLIC_QR_PUBLIC_KEY!;

  async validate(rawQR: string): Promise<{ valid: boolean; ticket?: TicketPayload; error?: string }> {
    try {
      const payload: TicketPayload = JSON.parse(atob(rawQR));

      // 1. Check expiry
      if (Date.now() > payload.expiresAt) {
        return { valid: false, error: 'TICKET_EXPIRED' };
      }

      // 2. Verify server-signed signature (HMAC-SHA256)
      const dataToVerify = `${payload.ticketId}:${payload.studentId}:${payload.journeyDate}`;
      const expectedSig = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        dataToVerify + this.serverPublicKey
      );

      if (payload.signature !== expectedSig) {
        return { valid: false, error: 'INVALID_SIGNATURE' };
      }

      return { valid: true, ticket: payload };
    } catch {
      return { valid: false, error: 'MALFORMED_QR' };
    }
  }
}

export const qrValidator = new QRValidator();