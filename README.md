# Revolut Pay Sandbox Demo

A step-by-step implementation of the Revolut Pay web widget connected to the Revolut Sandbox environment. Built with Node.js (Express) on the backend and vanilla HTML/JS on the frontend.

---

## Project Structure

```
revolutDemo/
├── backend/
│   ├── server.js          # Express server — handles order creation
│   ├── package.json
│   ├── .env               # Your API keys (never commit this)
│   └── .gitignore
│
└── public/
    └── index.html         # Checkout page with Revolut Pay widget
```

---

## Requirements

- Node.js v18+
- A Revolut Sandbox account → https://sandbox-business.revolut.com
- Sandbox Public Key (`pk_...`) and Secret Key (`sk_...`) from the Merchant API section

---

## Setup

### 1. Navigate to backend folder

```bash
cd revolutDemo/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Edit `.env`:

```
REVOLUT_SECRET_KEY=your_secret_key_here
REVOLUT_PUBLIC_KEY=your_public_key_here
PORT=3000
FRONTEND_URL=http://localhost:3000
```

### 4. Add your public key to the frontend

Open `public/index.html` and replace the `PUBLIC_KEY` value:

```js
const PUBLIC_KEY = 'your_public_key_here';
```

### 5. Start the server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## How It Works

```
Browser                        Backend (Express)            Revolut Sandbox API
───────                        ─────────────────            ───────────────────
Load page
Mount Revolut Pay widget
  (uses Public Key)

User clicks Revolut Pay
  → createOrder() fires   →   POST /api/create-order   →   POST /api/1.0/orders
                          ←   { token, orderId }        ←   { public_id, id }
  ← { publicId: token }

SDK opens sandbox popup
User completes payment
revolutPay.on('payment')
  ← success / error / cancel
```

---

## Progress

### ✅ Completed

- [x] Backend Express server with `/api/create-order` endpoint
- [x] Secret key secured server-side — never exposed to the browser
- [x] Revolut Pay widget connected to sandbox environment
- [x] Amount input — enter any £ amount and generate a new order
- [x] Generate Order button — updates `currentAmount` and shows order ready message
- [x] Payment result display — shows ✅ success / ❌ error / 🚫 cancel
- [x] A2A test scenario buttons — one click sets the magic amount

### 🔲 Still To Do

- [ ] Handle the mobile redirect flow (`/payment-result` page)
- [ ] Display the Order ID on screen after order is created
- [ ] Style the page to look like a real checkout (Revolut-style UI)
- [ ] Webhook endpoint to receive server-side payment confirmations

---

## Testing

### ⚠️ Important: Two Different Payment Flows

The Revolut Pay widget supports two flows. **A2A error scenarios only work in the A2A flow**, not the card flow.

| Flow | How it's triggered | Magic amounts work? |
|------|--------------------|---------------------|
| Card payment | User pays as guest with a test card | ❌ No |
| A2A payment | User logs in with their mock Revolut account | ✅ Yes |

---

### Step 1 — Create a Mock Account (first time only)

You must do this once before A2A testing works:

1. Click the Revolut Pay button (use £10.00 scenario)
2. Select **Checkout as guest**
3. Enter test card: `4929 4212 3460 0821` (any CVV, any future expiry date)
4. Enter any name and email
5. Enable **Save card** and click **Save card and pay**
6. Enter a **UK phone number** (e.g. `+44 7700 900123`) — must not have been used in sandbox before
7. Click **Fill with...** in the top right corner of the popup to auto-fill the OTP
8. Complete payment — your mock Revolut account is now created ✅

> ⚠️ **Phone number tip:** Use a UK-format number starting with `+44`. Non-UK numbers cause "Unauthenticated access" errors.

---

### Step 2 — Test A2A Error Scenarios

Once your mock account exists, use the scenario buttons on the page:

| Button | Amount | Expected result |
|--------|--------|-----------------|
| ✅ Successful payment | £10.00 (1000) | Payment completes |
| ❌ Insufficient funds | £10.01 (1001) | Fails — not enough balance |
| ❌ Payment declined | £10.02 (1002) | A2A payment declined |
| ❌ Transaction limit | £10.03 (1003) | Transaction limit exceeded |
| ❌ Account blocked | £10.04 (1004) | Account blocked |
| ❌ Too many attempts | £10.05 (1005) | Too many attempts |

**To trigger an A2A error:**
1. Click a scenario button (e.g. ❌ £10.01)
2. Click the Revolut Pay button
3. In the popup, **log in** with your mock phone number (not guest checkout)
4. Click **Fill with...** for the OTP
5. Click **Approve** — the error scenario triggers

---

### Test Cards

Use these for card payments (any CVV, any future expiry):

| Card Number | Result |
|-------------|--------|
| `4929 4212 3460 0821` | ✅ Successful payment |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

---

## API Endpoints

### `POST /api/create-order`

Creates a Revolut order and returns the public token for the widget.

**Request body:**
```json
{
  "amount": 1000,
  "currency": "GBP"
}
```

**Response:**
```json
{
  "token": "3dd66c8f-...",
  "orderId": "69cc5b..."
}
```

> `amount` is in **minor units** (pence). £10.00 = `1000`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `REVOLUT_SECRET_KEY` | Sandbox secret key — server-side only, never exposed |
| `REVOLUT_PUBLIC_KEY` | Sandbox public key — used in the frontend widget |
| `PORT` | Port the Express server runs on (default: 3000) |
| `FRONTEND_URL` | Allowed CORS origin |

---

## Security Notes

- `.env` is in `.gitignore` — never commit it
- Secret key is only used in `server.js`, never sent to the browser
- The frontend only uses the public key, which is safe to expose
- In production, always verify webhook signatures before processing events

---

## Useful Links

- [Revolut Pay Web Integration Guide](https://developer.revolut.com/docs/guides/accept-payments/online-payments/revolut-pay/web)
- [Sandbox Test Flows](https://developer.revolut.com/docs/guides/accept-payments/get-started/test-implementation/test-flows)
- [Test Cards](https://developer.revolut.com/docs/guides/accept-payments/get-started/test-implementation/test-cards)
- [Merchant API: Create Order](https://developer.revolut.com/docs/merchant/create-order)
- [SDK Reference: revolutPay](https://developer.revolut.com/docs/sdks/merchant-web-sdk/payment-methods/revolut-pay)
- [Revolut Business Sandbox](https://sandbox-business.revolut.com)