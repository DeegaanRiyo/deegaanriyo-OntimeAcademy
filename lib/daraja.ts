// ─── Daraja M-Pesa Sandbox Helper ────────────────────────────────────────────
// All STK Push logic is here. Switch DARAJA_BASE to production URL when going live.
// Production: "https://api.safaricom.co.ke"

const DARAJA_BASE = "https://sandbox.safaricom.co.ke";

// Normalise phone: accepts 07XX, 01XX, 254XX, +254XX → returns 254XXXXXXXXX
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0"))   return "254" + digits.slice(1);
  return digits;
}

async function getAccessToken(): Promise<string> {
  const key    = process.env.DARAJA_CONSUMER_KEY!;
  const secret = process.env.DARAJA_CONSUMER_SECRET!;
  const creds  = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${creds}` } }
  );
  if (!res.ok) throw new Error(`Daraja auth failed: ${res.status}`);
  const json = await res.json();
  return json.access_token as string;
}

// Returns YYYYMMDDHHMMSS — required by Daraja
function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
}

// Base64( shortcode + passkey + timestamp )
function getPassword(timestamp: string): string {
  const shortcode = process.env.DARAJA_SHORTCODE!;
  const passkey   = process.env.DARAJA_PASSKEY!;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export interface STKQueryResult {
  ResultCode:        string;  // "0" = paid, "1032" = cancelled, "1" = pending/failed
  ResultDesc:        string;
  ResponseCode?:     string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
}

// Directly asks Safaricom: "what is the current status of this STK Push?"
// Use this as a fallback when callbacks can't reach the server (e.g. sandbox/localhost).
export async function querySTKStatus(checkoutRequestId: string): Promise<STKQueryResult> {
  const token     = await getAccessToken();
  const timestamp = getTimestamp();
  const password  = getPassword(timestamp);
  const shortcode = process.env.DARAJA_SHORTCODE!;

  const res = await fetch(`${DARAJA_BASE}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STK Query failed ${res.status}: ${text}`);
  }

  return res.json();
}

export interface STKPushResult {
  MerchantRequestID:  string;
  CheckoutRequestID:  string;
  ResponseDescription: string;
  CustomerMessage:    string;
}

export async function initiateSTKPush(
  phone:           string,
  amount:          number,
  accountRef:      string,  // shown on customer's M-Pesa statement (max 12 chars)
  transactionDesc: string   // max 13 chars
): Promise<STKPushResult> {
  const token     = await getAccessToken();
  const timestamp = getTimestamp();
  const password  = getPassword(timestamp);
  const shortcode = process.env.DARAJA_SHORTCODE!;
  const callback  = process.env.DARAJA_CALLBACK_URL!;

  const body = {
    BusinessShortCode: shortcode,
    Password:          password,
    Timestamp:         timestamp,
    TransactionType:   "CustomerPayBillOnline",
    Amount:            Math.ceil(amount),       // must be integer
    PartyA:            formatPhone(phone),
    PartyB:            shortcode,
    PhoneNumber:       formatPhone(phone),
    CallBackURL:       callback,
    AccountReference:  accountRef.slice(0, 12),
    TransactionDesc:   transactionDesc.slice(0, 13),
  };

  const res = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`STK Push failed ${res.status}: ${text}`);
  }

  return res.json();
}
