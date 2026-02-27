import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"
import webpush from "npm:web-push@3.6.6"

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

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error('VAPID keys are not set in environment variables')
        }

        webpush.setVapidDetails(
            'mailto:contato@memorizabiblia.com.br',
            vapidPublicKey,
            vapidPrivateKey
        )

        let bodyData;
        try {
            bodyData = await req.json();
        } catch (e) {
            bodyData = {};
        }

        console.log('Request body:', JSON.stringify(bodyData));

        const { user_id, title, body, url, cron_trigger } = bodyData

        let subscriptions = []

        if (cron_trigger) {
            const now = new Date();
            console.log('Cron trigger activated. Current time (UTC):', now.toISOString());

            const { data, error } = await supabaseClient
                .from('profiles')
                .select(`
          id,
          reminder_hour,
          reminder_minute,
          timezone,
          current_verse_ref,
          push_subscriptions (
            subscription
          )
        `)
                .not('reminder_hour', 'is', null);

            if (error) throw error;

            console.log(`Found ${data?.length || 0} users with reminders enabled.`);

            subscriptions = (data || []).filter(profile => {
                try {
                    const userTimeParts = new Intl.DateTimeFormat('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: false,
                        timeZone: profile.timezone || 'America/Sao_Paulo'
                    }).formatToParts(now);

                    const h = parseInt(userTimeParts.find(p => p.type === 'hour')?.value || '0');
                    const m = parseInt(userTimeParts.find(p => p.type === 'minute')?.value || '0');

                    const matches = h === profile.reminder_hour && m === profile.reminder_minute;

                    if (matches) {
                        console.log(`Match found for user ${profile.id} (${profile.timezone}): ${h}:${m}`);
                    } else {
                        // Log only if it's close or for debugging small sets
                        console.log(`Skipping user ${profile.id}: prefers ${profile.reminder_hour}:${profile.reminder_minute}, current is ${h}:${m} (${profile.timezone})`);
                    }

                    return matches;
                } catch (e) {
                    console.error(`Invalid timezone for user ${profile.id}: ${profile.timezone}`);
                    return false;
                }
            }).flatMap(profile => profile.push_subscriptions || []);

        } else {
            console.log('Manual trigger. user_id filter:', user_id || 'none');
            let query = supabaseClient
                .from('push_subscriptions')
                .select('subscription')

            if (user_id) {
                query = query.eq('user_id', user_id)
            }

            const { data, error: fetchError } = await query
            if (fetchError) throw fetchError
            subscriptions = data || []
        }

        console.log(`Total subscriptions to notify: ${subscriptions.length}`);

        const notifications = subscriptions.map(async (sub, index) => {
            try {
                console.log(`Sending notification ${index + 1}/${subscriptions.length}...`);
                await webpush.sendNotification(
                    sub.subscription,
                    JSON.stringify({
                        title: title || 'MemorizaBíblia 🧠',
                        body: body || 'Hora de praticar! Vamos revisar o versículo de hoje?',
                        url: url || '/'
                    })
                )
                console.log(`Notification ${index + 1} sent successfully.`);
                return { success: true }
            } catch (err) {
                console.error(`Error sending push ${index + 1}:`, err)
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`Removing expired subscription for user.`);
                    await supabaseClient
                        .from('push_subscriptions')
                        .delete()
                        .match({ subscription: sub.subscription })
                }
                return { success: false, error: err.message, status: err.statusCode }
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
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
