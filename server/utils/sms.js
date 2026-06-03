import { getDB } from '../db/init.js';

/**
 * SMS utility - mock implementation
 * In production, this would integrate with an SMS provider (e.g., Alibaba Cloud SMS)
 */
export function sendSmsCode(phone, code) {
  // Mock: just log to console
  console.log(`[SMS] Sending code ${code} to ${phone}`);
  return true;
}

/** Verify SMS code */
export function verifySmsCode(phone, code) {
  const db = getDB();
  const record = db.prepare(
    `SELECT * FROM sms_codes WHERE phone = ? AND code = ? AND expire_at > datetime('now') ORDER BY created_at DESC LIMIT 1`
  ).get(phone, code);
  return !!record;
}
