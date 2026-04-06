import { createClient } from '@supabase/supabase-js'

// Xendit sends webhook notifications when payment status changes
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Verify webhook signature from Xendit
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN
    if (webhookToken) {
      const signature = request.headers.get('x-callback-token')
      if (signature !== webhookToken) {
        console.error('Invalid webhook signature')
        return Response.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const { external_id, status, payment_method } = body

    if (!external_id || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find the payment record
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', external_id)
      .single()

    if (findError || !payment) {
      console.error('Payment not found for external_id:', external_id)
      return Response.json({ error: 'Payment not found' }, { status: 200 })
    }

    // Only process if payment was pending
    if (payment.status !== 'pending') {
      return Response.json({ message: 'Payment already processed' })
    }

    if (status === 'PAID' || status === 'SETTLED') {
      // Update payment status
      await supabase
        .from('payments')
        .update({
          status: 'paid',
          payment_method: payment_method || 'unknown',
          paid_at: new Date().toISOString(),
        })
        .eq('id', payment.id)

      // Add credits to user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_credits')
        .eq('id', payment.user_id)
        .single()

      const currentCredits = profile?.ai_credits || 0
      const newCredits = currentCredits + payment.credits_purchased

      await supabase
        .from('profiles')
        .update({ ai_credits: newCredits })
        .eq('id', payment.user_id)

      console.log(`✅ Added ${payment.credits_purchased} credits to user ${payment.user_id}. New balance: ${newCredits}`)
    } else if (status === 'EXPIRED') {
      await supabase
        .from('payments')
        .update({ status: 'expired' })
        .eq('id', payment.id)
    }

    return Response.json({ message: 'OK' })
  } catch (err) {
    console.error('Webhook processing error:', err)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
