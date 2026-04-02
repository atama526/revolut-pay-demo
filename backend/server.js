const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;






// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));


app.use('/api/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

const path = require('path');



// Routes
// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: 'sandbox' });
});

app.post('/api/create-order', async (req, res) => {
  const { amount, currency = 'GBP' } = req.body;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const response = await fetch('https://sandbox-merchant.revolut.com/api/1.0/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REVOLUT_SECRET_KEY}`
      },
      body: JSON.stringify({
        amount,
        currency,
        description: 'Demo Store Order',
        redirect_url: 'http://localhost:3000/payment-result'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Revolut API error:', error);
      return res.status(response.status).json({ error: 'Failed to create order', details: error });
    }

    const order = await response.json();


    res.json({
      token: order.public_id,
      orderId: order.id
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/payment-result', (req, res) => {
  const status = req.query.status;
  const messages = {
    success: { emoji: '✅', text: 'Payment successful!', color: '#00b341' },
    failure: { emoji: '❌', text: 'Payment failed. Please try again.', color: '#e02020' },
    cancel:  { emoji: '🚫', text: 'Payment was cancelled.', color: '#888888' }
  };

  const result = messages[status] || { emoji: '❓', text: 'Unknown payment status.', color: '#888888' };

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Payment Result</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f7f7f8; }
        .box { text-align: center; padding: 48px; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .emoji { font-size: 64px; }
        h1 { font-size: 24px; margin: 16px 0 8px; color: ${result.color}; }
        a { display: inline-block; margin-top: 24px; padding: 12px 24px; background: #0a0a0a; color: white; border-radius: 8px; text-decoration: none; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="emoji">${result.emoji}</div>
        <h1>${result.text}</h1>
        <a href="/">Back to checkout</a>
      </div>
    </body>
    </html>
  `);
});

//static files 
app.use(express.static(path.join(__dirname, '../public')));


//Webhook
app.post('/api/webhook', (req, res) => {
  const rawBody = req.body.toString('utf8');
  let event;

  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    console.error('Invalid webhook payload');
    return res.status(400).json({ error: 'Invalid payload' });
  }

  console.log(`[Webhook] event=${event.event} order=${event.order_id}`);

  switch (event.event) {
    case 'ORDER_COMPLETED':
      console.log(`✅ Order completed: ${event.order_id}`);
      break;
    case 'ORDER_PAYMENT_DECLINED':
      console.log(`❌ Payment declined: ${event.order_id}`);
      break;
    case 'ORDER_PAYMENT_CANCELLED':
      console.log(`🚫 Payment cancelled: ${event.order_id}`);
      break;
    default:
      console.log(`ℹ️ Unhandled event: ${event.event}`);
  }

  res.status(200).json({ received: true });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});