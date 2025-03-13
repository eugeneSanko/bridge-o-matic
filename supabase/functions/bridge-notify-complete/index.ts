
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log("Bridge Order Completion Notification Function Loaded");

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Processing bridge completion notification request");
    const requestData = await req.json();
    
    // Extract transaction ID from the request
    const { transactionId } = requestData;
    
    if (!transactionId) {
      return new Response(
        JSON.stringify({
          code: 400,
          msg: "Missing transaction ID",
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

    // Get Supabase URL and key from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log(`Fetching transaction details for ID: ${transactionId}`);
    
    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from('completed_bridge_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
    
    if (txError) {
      console.error("Error fetching transaction:", txError);
      return new Response(
        JSON.stringify({
          code: 500,
          msg: "Error fetching transaction details",
          details: txError.message,
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
    
    if (!transaction) {
      return new Response(
        JSON.stringify({
          code: 404,
          msg: "Transaction not found",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // This would be where we'd send an email notification
    // For now, we'll just log it
    console.log("Transaction completed:", transaction);
    
    // Mock email sending
    console.log(`Would send completion email for ${transaction.from_currency} to ${transaction.to_currency} transaction`);
    
    return new Response(
      JSON.stringify({
        code: 0,
        msg: "Notification processed",
        transaction: transaction,
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
