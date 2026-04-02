Revolut Pay — Sandbox Integration Demo
Implementation of the Revolut Pay web widget, built using revolut sandbox  to show how the end-to-end payment flow  — from order creation to webhook confirmation.
The app is live here: revolut-pay-demo-production.up.railway.app
---
Main Use
Checkout page that lets you deposit real (sandbox) payments through Revolut Pay and test cards. It is built also for testing purposes, you can switch between different payment scenarios with a single click, see the order ID as soon as it's created, and watch the payment result appear on screen in real time.
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
Great security: The secret API key never touches the browser. The frontend only ever sees the public key and the order token  
---
Tech stack
Backend: Node.js + Express — handles order creation and webhooks
Frontend: Vanilla HTML/CSS/JS — no framework, keeps it simple and readable
Revolut Pay SDK: Loaded via ESM from unpkg (`@revolut/checkout`)
Deployed on: Railway (auto-deploys from GitHub on every push)
---
Testing insturctions
First you need a revolut test account. 
Before you can test the A2A (account-to-account) flow, you need to create a mock Revolut account in the sandbox. It takes about 30 seconds:
Click the ✅ £10.00 scenario button
Click the Revolut Pay button
Select Checkout as guest
Use test card `5281438801804148` (any CVV, any future expiry)
Enter any name and email, enable Save card, click Save card and pay
Enter a UK phone number (e.g. `+44 7700 900123`) — must be new to sandbox

Done — your mock account is created ✅
> ⚠️ Use a UK number starting with `+44`. Non-UK numbers will give you an "Unauthenticated access" error.

A2A test scenarios
Once your mock account exists, the scenario buttons on the page let you test specific error flows. These work by using magic amounts that the Revolut sandbox recognises:
Scenario  Amount  What happens
✅ Successful payment  £10.00  Payment goes through
❌ Insufficient funds  £10.01  A2A fails — not enough balance
❌ Payment declined  £10.02  A2A payment declined
❌ Transaction limit £10.03  Transaction limit exceeded
❌ Account blocked £10.04  Account blocked
❌ Too many attempts £10.05  Too many attempts
> These magic amounts only trigger in the **A2A flow** (when you log in with your mock phone number). Card payments ignore them.
To trigger an A2A error:
Click a scenario button
Click Revolut Pay
Log in with your mock phone number (not guest checkout)
Click Fill with... for the OTP → Approve
Test cards
For card payments, use these (any CVV, any future expiry):
Card  Result
`4929 4212 3460 0821` ✅ Success
`4000 0000 0000 0002` ❌ Declined
`4000 0000 0000 9995` ❌ Insufficient funds
---
Running it locally
Prerequisites
Node.js v18+
A Revolut Sandbox account → sandbox-business.revolut.com
Setup
```bash
# Clone the repo
git clone https://github.com/atama526/revolut-pay-demo.git
cd revolut-pay-demo/backend

# Install dependencies
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env and add your sandbox keys
```
Your `.env` should look like this:
```
REVOLUT_SECRET_KEY=your_sandbox_secret_key
REVOLUT_PUBLIC_KEY=your_sandbox_public_key
PORT=3000
FRONTEND_URL=http://localhost:3000
```
Then add your public key to `public/index.html`:
```js
const PUBLIC_KEY = 'your_sandbox_public_key';
```
```bash
# Start the server
npm run dev
```
Open http://localhost:3000 and you're good to go.
---

---
API
`POST /api/create-order`
Called by the frontend when the user clicks the Revolut Pay button. Creates a Revolut order server-side and returns the public token.
Request:
```json
{ "amount": 1000, "currency": "GBP" }
```
Response:
```json
{ "token": "3dd66c8f-...", "orderId": "69cc5b..." }
```
> Amounts are in minor units — £10.00 = `1000`
`POST /api/webhook`
Receives payment lifecycle events from Revolut. Currently handles:
`ORDER_COMPLETED` — payment successful
`ORDER_PAYMENT_DECLINED` — payment declined
`ORDER_CANCELLED` — order cancelled
`ORDER_FAILED` — order failed
`GET /payment-result`
Handles mobile redirects after payment. Revolut redirects here with `?status=success`, `?status=failure`, or `?status=cancel`.
---
A note on security
A few things worth calling out:
The secret API key lives only in the backend `.env` — it never touches the browser
The `.env` file is in `.gitignore` — it's not in the repo
The frontend only uses the public key and the order token, both of which are safe to expose
The webhook endpoint validates the payload before processing
In production you'd also want to verify Revolut's webhook signature using the `Revolut-Signature` header and HMAC-SHA256 — the signing secret is available on webhook creation
---
Project structure
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
Useful links
Revolut Pay Integration Guide
Sandbox Test Flows
Test Cards
Merchant API Reference
Revolut Business Sandbox