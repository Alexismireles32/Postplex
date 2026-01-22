import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let _stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripeClient) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      console.warn('[Stripe] STRIPE_SECRET_KEY not configured - payment features will not work');
    }
    
    _stripeClient = new Stripe(stripeSecretKey || '', {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    });
  }
  return _stripeClient;
}

// Export a proxy that lazily initializes Stripe
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripeClient()[prop as keyof Stripe];
  },
});

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      campaigns: 1,
      videosPerCampaign: 10,
      postsPerMonth: 10,
      connectedAccounts: 2,
      storageGB: 1,
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
    features: {
      campaigns: 5,
      videosPerCampaign: 50,
      postsPerMonth: 100,
      connectedAccounts: 5,
      storageGB: 10,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 79,
    stripePriceId: process.env.STRIPE_PRICE_PRO,
    features: {
      campaigns: 20,
      videosPerCampaign: 200,
      postsPerMonth: 500,
      connectedAccounts: 15,
      storageGB: 50,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
    features: {
      campaigns: -1, // unlimited
      videosPerCampaign: -1, // unlimited
      postsPerMonth: -1, // unlimited
      connectedAccounts: -1, // unlimited
      storageGB: 200,
    },
  },
} as const;

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer_email: undefined, // Let Stripe collect email
    client_reference_id: userId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
    },
  });
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(subscriptionId);
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  params: Stripe.SubscriptionUpdateParams
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, params);
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Get customer by ID
 */
export async function getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  return stripe.customers.retrieve(customerId);
}

/**
 * Create a customer
 */
export async function createCustomer(
  email: string,
  metadata: Record<string, string>
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email,
    metadata,
  });
}
