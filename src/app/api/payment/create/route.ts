import { createClient } from '@/lib/supabase/server'
import { Xendit } from 'xendit-node'

const xenditClient = new Xendit({
  secretKey: process.env.XENDIT_SECRET_KEY!,
})

const CREDITS_PACKAGE = {
  amount: 25000,
  credits: 25,
  currency: 'IDR',
  description: 'Proofly Pro — 25 AI Summary Credits',
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .single()

    const externalId = `proofly_${user.id}_${Date.now()}`

    // Create Xendit invoice
    const { Invoice } = xenditClient

    const invoice = await Invoice.createInvoice({
      data: {
        externalId,
        amount: CREDITS_PACKAGE.amount,
        currency: CREDITS_PACKAGE.currency,
        description: CREDITS_PACKAGE.description,
        invoiceDuration: 86400, // 24 hours
        payerEmail: user.email || undefined,
        customer: {
          givenNames: profile?.full_name || profile?.username || 'Proofly User',
          email: user.email || undefined,
        },
        successRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/cv-generator?payment=success`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/cv-generator?payment=failed`,
      },
    })

    // Save payment record
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: insertError } = await supabaseAdmin.from('payments').insert({
      user_id: user.id,
      external_id: externalId,
      invoice_url: invoice.invoiceUrl,
      amount: CREDITS_PACKAGE.amount,
      currency: CREDITS_PACKAGE.currency,
      credits_purchased: CREDITS_PACKAGE.credits,
      status: 'pending',
    })

    if (insertError) {
      console.error('Failed to insert payment record in Supabase:', insertError)
      throw new Error(`Database error: ${insertError.message}`)
    }

    return Response.json({
      invoiceUrl: invoice.invoiceUrl,
      externalId,
    })
  } catch (err) {
    console.error('Payment creation error:', err)
    return Response.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
