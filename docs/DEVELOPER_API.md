# DCS ELITE — Developer API Guide

Integrate DCS ELITE into your own app, bot, website, or reseller workflow. This
REST API lets you list bundles, place single and bulk data orders, check order
status, read your wallet balance, and receive real-time webhooks — all backed by
your vendor wallet.

- **Base URL:** `https://dcselite.com/api/v1`
- **Format:** JSON over HTTPS
- **Auth:** `Authorization: Bearer <your_api_key>`
- **Currency:** GHS (Ghanaian Cedi)

> Every path below is relative to the base URL. For example, `GET /ping` means
> `GET https://dcselite.com/api/v1/ping`.

---

## 1. Get your API key

1. Log in to your vendor dashboard at `https://dcselite.com/auth/login`.
2. Go to **Dashboard → Developer**.
3. Click **Create key**, give it a label, and copy the full key.

Your key looks like `dcs_live_xxxxxxxxxxxxxxxxxxxxxxxx`.

> **Important:** The full key is shown **once**, at creation time. Store it
> somewhere safe (e.g. your server's environment variables). If you lose it,
> revoke it and create a new one. Never put your key in client-side/browser code
> or commit it to a public repo.

Your store **setup fee must be paid** before the API will accept your key.

---

## 2. Authentication

Send your key as a Bearer token on **every** request:

```
Authorization: Bearer dcs_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

Quick test:

```bash
curl https://dcselite.com/api/v1/ping \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected response:

```json
{
  "ok": true,
  "vendor": { "id": "uuid", "name": "Your Store", "slug": "your-store" },
  "server_time": "2026-06-08T12:00:00.000Z"
}
```

If you get `401`, the key is missing, malformed, revoked, or expired.

---

## 3. Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET  | `/ping` | Verify your key and reach the API |
| GET  | `/account` | Vendor info, wallet balance, webhook status |
| GET  | `/networks` | Supported telco networks |
| GET  | `/bundles` | All active bundles you can sell, with your prices |
| POST | `/orders` | Place a single order |
| POST | `/orders/bulk` | Place up to 500 orders at once (supports price preview) |
| GET  | `/orders/{reference}` | Get one order + its line items by reference |
| GET  | `/orders?limit=&status=` | List recent orders, newest first |

---

### 3.1 GET `/ping` — Health check

Confirms your key is valid and the API is reachable. See the example above.

---

### 3.2 GET `/account` — Account & wallet

```bash
curl https://dcselite.com/api/v1/account \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```json
{
  "vendor": {
    "id": "uuid",
    "name": "Your Store",
    "slug": "your-store",
    "verified": true,
    "status": "active",
    "member_since": "2025-11-01T00:00:00Z"
  },
  "wallet": { "currency": "GHS", "balance": 1250.5, "pending_balance": 0 },
  "webhook": { "configured": true, "enabled": true }
}
```

> Orders are paid from your **wallet balance**. Top up your wallet from the
> vendor dashboard before placing orders.

---

### 3.3 GET `/networks` — Supported networks

```json
{
  "networks": [
    { "id": "mtn", "name": "MTN" },
    { "id": "telecel", "name": "Telecel" },
    { "id": "at", "name": "AirtelTigo" }
  ]
}
```

---

### 3.4 GET `/bundles` — List bundles

Returns every active SKU you can sell, with your wholesale price and a suggested
retail price.

```bash
curl https://dcselite.com/api/v1/bundles \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```json
{
  "currency": "GHS",
  "bundles": [
    {
      "id": "uuid",
      "sku": "MTN-1GB",
      "network": "mtn",
      "name": "MTN 1GB",
      "data_mb": 1024,
      "validity_days": 30,
      "price": 5.5,
      "suggested_retail": 7,
      "product_line": "voucher",
      "popular": true
    }
  ]
}
```

Use either the `sku` or the `id` of a bundle when placing orders.

---

### 3.5 POST `/orders` — Place a single order

Charges your wallet and queues delivery to the recipient. Returns **`202
Accepted`** — delivery happens asynchronously; track it via webhook or by polling
the order endpoint.

**Request body**

```json
{
  "sku": "MTN-1GB",
  "recipient_phone": "0241234567",
  "quantity": 1,
  "reference": "my-order-001"
}
```

| Field | Required | Notes |
| ----- | -------- | ----- |
| `sku` | one of `sku`/`bundle_id` | Bundle SKU, e.g. `MTN-1GB` |
| `bundle_id` | one of `sku`/`bundle_id` | Bundle UUID (alternative to `sku`) |
| `recipient_phone` | yes | Ghana number; `024…`, `+233…`, or `233…` all accepted |
| `quantity` | no | Default `1`, max `100` |
| `reference` | no | Your unique ID. Makes the call **idempotent** — retrying with the same reference returns the original order instead of charging again |

**Example**

```bash
curl -X POST https://dcselite.com/api/v1/orders \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "MTN-1GB",
    "recipient_phone": "0241234567",
    "quantity": 1,
    "reference": "my-order-001"
  }'
```

**Response (`202`)**

```json
{
  "order": {
    "id": "uuid",
    "reference": "my-order-001",
    "status": "queued",
    "bundle": { "id": "uuid", "sku": "MTN-1GB", "name": "MTN 1GB", "network": "mtn", "data_mb": 1024 },
    "recipient_phone": "0241234567",
    "quantity": 1,
    "unit_price": 5.5,
    "total": 5.5,
    "wallet_balance_after": 1245
  }
}
```

---

### 3.6 POST `/orders/bulk` — Place a bulk order

Submit up to **500** line items in one call. Your wallet is debited once for the
full amount, and each line is fulfilled independently (a single bad line does not
block the rest). Returns **`202 Accepted`**.

Pass `dry_run: true` to get a **price preview** without charging.

**Request body**

```json
{
  "items": [
    { "sku": "MTN-1GB", "recipient_phone": "0241234567", "quantity": 1 },
    { "sku": "TELECEL-2GB", "recipient_phone": "0501112222", "quantity": 2 }
  ],
  "dry_run": false,
  "reference": "campaign-abc"
}
```

**Response (`202`)**

```json
{
  "order": {
    "id": "uuid",
    "reference": "campaign-abc",
    "status": "queued",
    "item_count": 3,
    "line_count": 2,
    "total": 23.5,
    "wallet_balance_after": 1221.5,
    "invalid_lines": []
  }
}
```

When `dry_run` is `true`, the response instead reports `valid_count`,
`invalid_count`, `total`, `wallet_balance`, `sufficient_funds`, and the resolved
`lines`/`errors` so you can validate before charging.

---

### 3.7 GET `/orders/{reference}` — Get one order

```bash
curl https://dcselite.com/api/v1/orders/my-order-001 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```json
{
  "order": {
    "id": "uuid",
    "reference": "my-order-001",
    "status": "fulfilled",
    "supplier_status": "processed",
    "total": 5.5,
    "fulfilled_at": "2026-06-08T12:05:30Z",
    "items": [
      {
        "id": "uuid",
        "recipient_phone": "0241234567",
        "quantity": 1,
        "unit_price": 5.5,
        "line_total": 5.5,
        "status": "fulfilled",
        "fulfilled_at": "2026-06-08T12:05:28Z",
        "bundle": { "sku": "MTN-1GB", "name": "MTN 1GB", "network": "mtn", "data_mb": 1024 }
      }
    ]
  }
}
```

---

### 3.8 GET `/orders` — List recent orders

Query params:

- `limit` — 1–100 (default 25)
- `status` — optional filter, e.g. `queued`, `fulfilled`, `failed`

```bash
curl "https://dcselite.com/api/v1/orders?limit=25&status=fulfilled" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

```json
{
  "orders": [
    {
      "id": "uuid",
      "reference": "my-order-001",
      "status": "fulfilled",
      "supplier_status": "processed",
      "total": 5.5,
      "item_count": 1,
      "source": "single",
      "created_at": "2026-06-08T12:00:00Z"
    }
  ],
  "count": 1
}
```

---

## 4. Order status lifecycle

| Status | Meaning |
| ------ | ------- |
| `queued` | Accepted and paid; waiting to be sent to the network |
| `processing` | Sent to the supplier/network |
| `fulfilled` | Data delivered successfully |
| `failed` | Delivery failed (your wallet is refunded for failed lines) |

Because orders are processed asynchronously, don't expect `fulfilled` in the
initial `202` response. Either poll `GET /orders/{reference}` or — better — use
webhooks (below).

---

## 5. Webhooks (recommended)

Instead of polling, register a webhook URL so DCS ELITE pushes order updates to
your server in real time.

**Setup:** Vendor dashboard → **Developer → Webhooks** → enter your HTTPS URL and
a signing secret, then enable it.

**Events**

- `order.queued`
- `order.processing`
- `order.fulfilled`
- `order.failed`

**Delivery** — we `POST` JSON to your URL:

```http
POST /your-webhook-endpoint HTTP/1.1
Content-Type: application/json
User-Agent: DCS-Elite-Webhook/1.0
X-DCS-Event: order.fulfilled
X-DCS-Signature: <hmac-sha256-hex>
```

```json
{
  "event": "order.fulfilled",
  "reference": "my-order-001",
  "delivered_at": "2026-06-08T12:05:30.000Z",
  "data": { }
}
```

**Verify the signature.** `X-DCS-Signature` is an HMAC-SHA256 of the raw request
body, keyed with your webhook secret. Verify before trusting the payload:

```js
import crypto from "crypto";

function verify(rawBody, signatureHeader, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expected),
  );
}
```

Respond with a `2xx` quickly (within ~8 seconds). Deliveries and their responses
are logged in your dashboard for debugging.

---

## 6. Error codes

Errors return a non-2xx HTTP status and a JSON body:

```json
{ "error": "Human readable message", "code": "machine_code" }
```

| HTTP | `code` | Meaning |
| ---- | ------ | ------- |
| 400 | `invalid_body` / `invalid_phone` / `invalid_json` | Request payload or recipient phone failed validation |
| 401 | `missing_key` / `malformed_key` / `invalid_key` / `revoked` / `expired` | API key problem |
| 402 | `insufficient_funds` | Wallet balance is below the order total — top up and retry |
| 403 | `setup_incomplete` | Store setup fee not yet paid |
| 404 | `bundle_not_found` / `not_found` | SKU/bundle or reference does not exist or is inactive |
| 409 | `recipient_cooldown` / `debit_failed` | Recipient ordered too recently, or wallet debit failed |
| 500 | `internal_error` | Unexpected server error — safe to retry with the same `reference` |
| 503 | `not_configured` | Service temporarily unavailable |

---

## 7. Best practices

- **Always send a `reference`** on orders. It guarantees idempotency, so network
  retries or timeouts never double-charge your wallet.
- **Use webhooks** rather than tight polling. If you must poll, poll
  `GET /orders/{reference}` at a sensible interval (e.g. every 10–30s).
- **Keep your wallet funded.** A `402 insufficient_funds` means top up first.
- **Keep your key server-side.** Treat it like a password.
- **Use `dry_run` for bulk** to validate phone numbers and preview cost before
  charging.

---

## 8. Quick start (Node.js)

```js
const BASE = "https://dcselite.com/api/v1";
const KEY = process.env.DCS_API_KEY;

async function placeOrder() {
  const res = await fetch(`${BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sku: "MTN-1GB",
      recipient_phone: "0241234567",
      quantity: 1,
      reference: `order-${Date.now()}`,
    }),
  });
  const data = await res.json();
  console.log(res.status, data);
}

placeOrder();
```

---

**Need help?** Reach out to the DCS ELITE admin. Interactive docs with live
copy-paste examples are also available at `https://dcselite.com/developers`.
