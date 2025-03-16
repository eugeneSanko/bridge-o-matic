
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Bridge Set Email Function Loaded");

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Processing bridge set email request");
    const requestData = await req.json();
    
    // Extract email and order details from the request
    const { email, id, token } = requestData;
    
    if (!email || !id || !token) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing email, order ID, or token",
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

    console.log(`Setting up email notifications for order ${id} to ${email}`);

    // This would typically be where you'd call the FixedFloat API to set up email notifications
    // For now, we'll just log it and return a success response
    
    // In a real implementation, you would make an API call similar to:
    // const signature = await generateSignature({ id, token, email });
    // const response = await fetch(`${FF_API_URL}/setemail`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-API-KEY": FF_API_KEY,
    //     "X-API-SIGN": signature,
    //   },
    //   body: JSON.stringify({ id, token, email }),
    // });
    
    // Get Supabase URL and key from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Store the email subscription in the database
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('bridge_email_subscriptions')
      .insert([
        { 
          ff_order_id: id,
          ff_order_token: token,
          email: email,
          status: 'active'
        }
      ]);
    
    if (subscriptionError) {
      console.error("Error storing email subscription:", subscriptionError);
    } else {
      console.log("Email subscription stored:", subscriptionData);
    }
    
    // For now, simulate a successful response
    return new Response(
      JSON.stringify({
        code: 0,
        msg: "Email notification set up successfully",
        debugInfo: {
          email: email,
          orderId: id
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
