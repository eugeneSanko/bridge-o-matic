
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Bridge Send Notification Function Loaded");

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Processing bridge notification request");
    const requestData = await req.json();
    
    // Extract transaction data from the request
    const { orderId, token, email } = requestData;
    
    if (!orderId || !token || !email) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing required parameters: orderId, token, or email",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    console.log(`Sending email notification for order ID: ${orderId} to: ${email}`);
    
    // Generate the transaction URL
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://tradenlypro-bridge.lovable.app";
    const transactionUrl = `${baseUrl}/bridge/awaiting-deposit?orderId=${orderId}&token=${token}`;
    
    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0FA0CE; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #0FA0CE; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; }
            .footer { margin-top: 20px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tradenly Bridge Transaction</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You've set up notifications for your cryptocurrency exchange transaction. You'll receive updates as your transaction progresses.</p>
            <p><strong>Transaction ID:</strong> ${orderId}</p>
            <p>Use the button below to view your transaction status at any time:</p>
            <div style="text-align: center;">
              <a href="${transactionUrl}" class="button">View Transaction</a>
            </div>
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all;">${transactionUrl}</p>
          </div>
          <div class="footer">
            <p>This is an automated message from Tradenly Bridge. Please do not reply to this email.</p>
          </div>
        </body>
      </html>
    `;
    
    // Send the email
    const emailResult = await resend.emails.send({
      from: "Tradenly Bridge <noreply@tradenly.xyz>",
      to: [email],
      subject: `Tradenly Bridge Transaction Status: ${orderId}`,
      html: emailHtml,
    });
    
    console.log("Email sending result:", emailResult);
    
    return new Response(
      JSON.stringify({
        code: 0,
        msg: "Email notification sent successfully",
        data: {
          email: email,
          transactionUrl: transactionUrl
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    
    return new Response(
      JSON.stringify({
        code: 500,
        msg: "Internal server error",
        details: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
