import { serve } from "std/http/server.ts"
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''

        webpush.setVapidDetails(
            'mailto:contato@memorizabiblia.com.br',
            vapidPublicKey,
            vapidPrivateKey
        )

        const bodyData = await req.json()
        const { user_id, title, body, url, cron_trigger } = bodyData

        let subscriptions = []

        if (cron_trigger) {
            // Logic for automatic sending via Cron
            // Get current hour and minute in Brazilian time (or based on timezone)
            // For simplicity, we'll use UTC and the user can adjust, or we can use the stored timezone.
            // Better: Get all users who should receive a notification RIGHT NOW based on their timezone.

            const now = new Date();
            // We'll iterate through timezones or just use UTC hour/minute comparison 
            // with a slight buffer or specific logic.
            // Here, let's assume the cron runs every minute.

            const { data, error } = await supabaseClient
                .from('profiles')
                .select(`
          id,
          reminder_hour,
          reminder_minute,
          timezone,
          push_subscriptions (
            subscription
          )
        `)
                // Filter profiles where reminder_hour/minute matches current time in their timezone
                // This is complex in pure SQL without custom functions, so we'll fetch profiles 
                // that have reminders set and filter in Deno for now, or use a clever SQL query.
                .not('reminder_hour', 'is', null);

            if (error) throw error;

            // Filter users whose current time matches their scheduled time
            subscriptions = data.filter(profile => {
                try {
                    const userTime = new Intl.DateTimeFormat('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: false,
                        timeZone: profile.timezone || 'America/Sao_Paulo'
                    }).formatToParts(now);

                    const h = parseInt(userTime.find(p => p.type === 'hour')?.value || '0');
                    const m = parseInt(userTime.find(p => p.type === 'minute')?.value || '0');

                    return h === profile.reminder_hour && m === profile.reminder_minute;
                } catch (e) {
                    console.error(`Invalid timezone for user ${profile.id}: ${profile.timezone}`);
                    return false;
                }
            }).flatMap(profile => profile.push_subscriptions);

        } else {
            // Manual trigger for specific user or all
            let query = supabaseClient
                .from('push_subscriptions')
                .select('subscription')

            if (user_id) {
                query = query.eq('user_id', user_id)
            }

            const { data, error: fetchError } = await query
            if (fetchError) throw fetchError
            subscriptions = data
        }

        const notifications = (subscriptions || []).map(async (sub) => {
            try {
                await webpush.sendNotification(
                    sub.subscription,
                    JSON.stringify({
                        title: title || 'MemorizaBíblia 🧠',
                        body: body || 'Hora de praticar! Vamos revisar o versículo de hoje?',
                        url: url || '/'
                    })
                )
                return { success: true }
            } catch (err) {
                console.error('Error sending push:', err)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await supabaseClient
                        .from('push_subscriptions')
                        .delete()
                        .match({ subscription: sub.subscription })
                }
                return { success: false, error: err.message }
            }
        })

        const results = await Promise.all(notifications)

        return new Response(
            JSON.stringify({
                message: cron_trigger ? 'Cron reminders processed' : 'Notifications processed',
                count: results.length,
                results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
