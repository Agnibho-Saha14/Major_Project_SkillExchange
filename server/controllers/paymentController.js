const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (req, res) => {
  const { skillId, price } = req.body;

  if (!skillId || !price) {
    return res.status(400).json({ success: false, message: 'Missing skill or price' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Skill Enrollment - ${skillId}`,
            },
            unit_amount: price * 100, // Stripe expects amount in paise
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?skillId=${skillId}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/skills/${skillId}`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session' });
  }
};
