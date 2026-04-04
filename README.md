# Revolut Pay — Sandbox Integration Demo

Implementation of the Revolut Pay web widget, built using the Revolut sandbox to show how the end-to-end payment flow works — from order creation to webhook confirmation.

**The app is live here → [revolut-pay-demo-production.up.railway.app](https://revolut-pay-demo-production.up.railway.app)**

---

## What it does

A checkout page that lets you make real (sandbox) payments through Revolut Pay. It's also built for testing — you can switch between different payment scenarios with a single click, see the order ID as soon as it's created, and watch the payment result appear on screen in real time.

Here's the full flow under the hood:

```
1. You enter an amount and click "Generate Order"
2. The frontend calls our backend (Express on Node.js)
3. The backend securely calls the Revolut Merchant API to create an order
4. The order token comes back and gets passed to the Revolut Pay SDK
5. You click the Revolut Pay button — a sandbox popup appears
6. You complete the payment (card or A2A)
7. The result shows on screen via the SDK's payment event
8. Revolut sends a webhook to our server confirming the payment server-side
```

> The secret API key never touches the browser. The frontend only ever sees the public key and the order token.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Frontend | Vanilla HTML/CSS/JS |
| Revolut SDK | `@revolut/checkout` via ESM (unpkg) |
| Deployment | Railway (auto-deploys from GitHub) |

---

## Testing

### Step 1 — Create a mock Revolut account (first time only)

Before testing the A2A flow, you need to create a mock account in the sandbox. Takes about 30 seconds:

1. Click the **✅ £10.00** scenario button on the page
2. Click the **Revolut Pay** button
3. Select **Checkout as guest**
4. Use test card `5281438801804148` — any CVV, any future expiry date
5. Enter any name and email, enable **Save card**, click **Save card and pay**
6. Enter a UK phone number (e.g. `+44 7700 900123`) — must be new to the sandbox
7. Click **Fill with...** to auto-fill the mock OTP
8. Complete the payment — your mock account is now created ✅

> ⚠️ Use a UK number starting with `+44`. Non-UK numbers will give you an "Unauthenticated access" error.

---

### Step 2 — Test A2A error scenarios

Once your mock account exists, use the scenario buttons on the page. Each sets a magic amount that the Revolut sandbox uses to simulate a specific outcome:

| Scenario | Amount | What happens |
|----------|--------|--------------|
| ✅ Successful payment | £10.00 | Payment goes through |
| ❌ Insufficient funds | £10.01 | A2A fails — not enough balance |
| ❌ Payment declined | £10.02 | A2A payment declined |
| ❌ Transaction limit | £10.03 | Transaction limit exceeded |
| ❌ Account blocked | £10.04 | Account blocked |
| ❌ Too many attempts | £10.05 | Too many attempts |

> These magic amounts only trigger in the **A2A flow** — when you log in with your mock phone number. Card payments ignore them.

**To trigger an A2A error:**
1. Click a scenario button (e.g. ❌ £10.01)
2. Click the **Revolut Pay** button
3. Log in with your mock phone number (not guest checkout)
4. Click **Fill with...** for the OTP → click **Approve**

---

### Test cards

For card payments (any CVV, any future expiry):

| Card number | Result |
|-------------|--------|
| `4929 4212 3460 0821` | ✅ Successful payment |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0000 0000 9995` | ❌ Insufficient funds |

---

## Running locally

### Prerequisites

- Node.js v18+
- A Revolut Sandbox account → [sandbox-business.revolut.com](https://sandbox-business.revolut.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/atama526/revolut-pay-demo.git
cd revolut-pay-demo/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and fill in your sandbox keys
```

Your `.env` should look like this:

```
REVOLUT_SECRET_KEY=your_sandbox_secret_key
REVOLUT_PUBLIC_KEY=your_sandbox_public_key
PORT=3000
FRONTEND_URL=http://localhost:3000
```

Then add your public key to `backend/public/index.html`:

```js
const PUBLIC_KEY = 'your_sandbox_public_key';
```

```bash
# Start the server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're good to go.

---

## API reference

### `POST /api/create-order`

Called by the frontend when the user clicks the Revolut Pay button. Creates a Revolut order server-side and returns the public token.

**Request body:**
```json
{ "amount": 1000, "currency": "GBP" }
```

**Response:**
```json
{ "token": "3dd66c8f-...", "orderId": "69cc5b..." }
```

> Amounts are in minor units — £10.00 = `1000`

---

### `POST /api/webhook`

Receives payment lifecycle events from Revolut. Currently handles:

- `ORDER_COMPLETED` — payment successful
- `ORDER_PAYMENT_DECLINED` — payment declined
- `ORDER_CANCELLED` — order cancelled
- `ORDER_FAILED` — order failed

---

### `GET /payment-result`

Handles mobile redirects after payment. Revolut redirects here with `?status=success`, `?status=failure`, or `?status=cancel`.

---

## Security

- The **secret API key** lives only in the backend `.env` — it never touches the browser
- The **`.env` file** is in `.gitignore` — it's not in the repo
- The **frontend** only uses the public key and the order token, both safe to expose
- The **webhook endpoint** validates the payload before processing
- In production you'd also want to verify Revolut's webhook signature using the `Revolut-Signature` header and HMAC-SHA256 — the signing secret is returned on webhook creation

---

## Project structure

```
revolut-pay-demo/
├── backend/
│   ├── server.js          # Express server — order creation + webhook handler
│   ├── package.json
│   ├── .env               # Secret keys (not in repo)
│   ├── .env.example       # Template for environment variables
│   └── public/
│       └── index.html     # Checkout page with Revolut Pay widget
└── README.md
```

---

## Useful links

- [Revolut Pay Integration Guide](https://developer.revolut.com/docs/guides/accept-payments/online-payments/revolut-pay/web)
- [Sandbox Test Flows](https://developer.revolut.com/docs/guides/accept-payments/get-started/test-implementation/test-flows)
- [Test Cards](https://developer.revolut.com/docs/guides/accept-payments/get-started/test-implementation/test-cards)
- [Merchant API Reference](https://developer.revolut.com/docs/merchant/merchant-api)
- [Revolut Business Sandbox](https://sandbox-business.revolut.com)
