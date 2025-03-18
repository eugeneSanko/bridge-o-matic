
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const baseUrl = Deno.env.get("PUBLIC_APP_URL") || "https://bridge.tradenly.xyz";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  orderId: string;
  token: string;
  fromCurrency: string;
  toCurrency: string;
  amount: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, orderId, token, fromCurrency, toCurrency, amount }: EmailRequest = await req.json();

    if (!email || !orderId || !token) {
      return new Response(
        JSON.stringify({ 
          error: "Missing required fields", 
          details: "Email, orderId, and token are required" 
        }),
        {
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
          }
        }
      );
    }

    console.log(`Sending email notification to ${email} for order ${orderId}`);

    // Create the transaction status URL
    const transactionUrl = `${baseUrl}/bridge/awaiting-deposit?orderId=${orderId}&token=${token}`;
    
    // Format the amount with commas for thousands
    const formattedAmount = parseFloat(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8
    });

    const emailResponse = await resend.emails.send({
      from: "Tradenly Bridge <bridge@tradenly.xyz>",
      to: [email],
      subject: `Your ${fromCurrency} to ${toCurrency} Exchange Status`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #13151c; color: #ffffff; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://tradenly.xyz/wp-content/uploads/2023/12/tradelogo.png" alt="Tradenly" style="max-width: 150px;">
          </div>
          
          <h1 style="color: #0FA0CE; text-align: center; margin-bottom: 20px;">Transaction Tracking Activated</h1>
          
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1; padding-right: 20px;">
              <p style="font-size: 16px; line-height: 1.5;">
                We're monitoring your exchange of <strong>${formattedAmount} ${fromCurrency}</strong> to <strong>${toCurrency}</strong>.
                You'll receive notifications about important status updates.
              </p>
              
              <p style="font-size: 16px; line-height: 1.5; margin-top: 20px;">
                <a href="${transactionUrl}" style="background-color: #0FA0CE; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Transaction Status</a>
              </p>
            </div>
            
            <div style="flex: 1; text-align: center;">
              <img src="https://tradenly.xyz/wp-content/uploads/2024/12/AlbedoBase_XL_Design_a_futuristic_space_robot_fighter_sleek_an_0-removebg-preview.png" alt="Robot Assistant" style="max-width: 100%; max-height: 200px;">
            </div>
          </div>
          
          <div style="background-color: rgba(15, 160, 206, 0.1); padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #0FA0CE; margin-top: 0;">Order Information:</h3>
            <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount} ${fromCurrency}</p>
            <p style="margin: 5px 0;"><strong>Receiving:</strong> ${toCurrency}</p>
          </div>
          
          <p style="font-size: 14px; color: #999; text-align: center; margin-top: 30px; margin-bottom: 0;">
            This is an automated notification from Tradenly Bridge. <br>
            If you have questions, please contact support at support@tradenly.xyz
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in bridge-send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
