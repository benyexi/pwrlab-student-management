// Supabase Edge Function: send-notification
// Sends email via Resend when students submit reports or ask questions.
// Env vars required (set in Supabase Dashboard → Settings → Edge Functions):
//   RESEND_API_KEY   - from https://resend.com (free tier: 100 emails/day)
//   ADVISOR_EMAIL    - email address of the advisor, e.g. benyexi@bjfu.edu.cn
//   FROM_EMAIL       - verified sender in Resend, e.g. pwrlab@yourdomain.com

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface NotificationPayload {
  type: 'report' | 'question' | 'milestone_reminder'
  student_name: string
  title: string
  content?: string
  week_start?: string
  week_end?: string
  link?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: NotificationPayload = await req.json()
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const advisorEmail = Deno.env.get('ADVISOR_EMAIL') || 'benyexi@bjfu.edu.cn'
    const fromEmail = Deno.env.get('FROM_EMAIL') || 'PWRlab <noreply@pwrlab.cn>'

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { subject, html } = buildEmail(payload)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [advisorEmail],
        subject,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Resend error:', data)
      return new Response(JSON.stringify({ error: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function buildEmail(p: NotificationPayload): { subject: string; html: string } {
  const siteUrl = 'https://benyexi.github.io/pwrlab-student-management/'
  const link = p.link ? `${siteUrl}#${p.link}` : siteUrl

  if (p.type === 'report') {
    return {
      subject: `[PWRlab] ${p.student_name} 提交了周报`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#132d22;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="color:#d4a853;margin:0;font-size:18px">PWRlab 周报提醒</h2>
          </div>
          <div style="background:#f9f7f4;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5">
            <p style="margin:0 0 12px"><strong>${p.student_name}</strong> 提交了新的周报：</p>
            <div style="background:#fff;border:1px solid #e5e5e5;border-radius:8px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 8px;font-size:13px;color:#666">周期：${p.week_start ?? ''} ~ ${p.week_end ?? ''}</p>
              <p style="margin:0;font-size:14px">${p.content ? p.content.slice(0, 200) + (p.content.length > 200 ? '…' : '') : '（无正文摘要）'}</p>
            </div>
            <a href="${link}" style="display:inline-block;background:#132d22;color:#d4a853;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">查看并批注周报 →</a>
          </div>
          <p style="text-align:center;font-size:11px;color:#999;margin-top:12px">PWRlab 学生管理系统 · 北京林业大学</p>
        </div>
      `,
    }
  }

  if (p.type === 'question') {
    return {
      subject: `[PWRlab] ${p.student_name} 有新提问`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#132d22;padding:20px 24px;border-radius:12px 12px 0 0">
            <h2 style="color:#d4a853;margin:0;font-size:18px">PWRlab 提问提醒</h2>
          </div>
          <div style="background:#f9f7f4;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5">
            <p style="margin:0 0 12px"><strong>${p.student_name}</strong> 提出了新问题：</p>
            <div style="background:#fff;border:1px solid #fcd34d;border-left:4px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:16px">
              <p style="margin:0 0 6px;font-weight:600">${p.title}</p>
              ${p.content ? `<p style="margin:0;font-size:13px;color:#555">${p.content.slice(0, 200)}${p.content.length > 200 ? '…' : ''}</p>` : ''}
            </div>
            <a href="${link}" style="display:inline-block;background:#132d22;color:#d4a853;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">前往回复 →</a>
          </div>
          <p style="text-align:center;font-size:11px;color:#999;margin-top:12px">PWRlab 学生管理系统 · 北京林业大学</p>
        </div>
      `,
    }
  }

  // milestone_reminder
  return {
    subject: `[PWRlab] 毕业节点提醒：${p.student_name} - ${p.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
        <div style="background:#132d22;padding:20px 24px;border-radius:12px 12px 0 0">
          <h2 style="color:#d4a853;margin:0;font-size:18px">PWRlab 节点提醒</h2>
        </div>
        <div style="background:#f9f7f4;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e5e5">
          <p style="margin:0 0 12px"><strong>${p.student_name}</strong> 有即将到来的毕业节点：</p>
          <div style="background:#fff;border:1px solid #fca5a5;border-left:4px solid #ef4444;border-radius:8px;padding:16px;margin-bottom:16px">
            <p style="margin:0;font-weight:600">${p.title}</p>
            ${p.content ? `<p style="margin:4px 0 0;font-size:13px;color:#555">${p.content}</p>` : ''}
          </div>
          <a href="${link}" style="display:inline-block;background:#132d22;color:#d4a853;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px">查看毕业节点 →</a>
        </div>
        <p style="text-align:center;font-size:11px;color:#999;margin-top:12px">PWRlab 学生管理系统 · 北京林业大学</p>
      </div>
    `,
  }
}
