
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
    
    // Extract transaction ID and metadata from the request
    const { transactionId, metadata } = requestData;
    
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

    console.log(`Processing notification for transaction: ${transactionId}`, {
      metadata: metadata || 'None provided'
    });

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
    
    // Log the completed transaction details 
    console.log("Transaction completed:", {
      id: transaction.id, 
      ff_order_id: transaction.ff_order_id,
      from: transaction.from_currency,
      to: transaction.to_currency,
      amount: transaction.amount,
      created_at: transaction.created_at,
      metadata: transaction.client_metadata
    });
    
    // Here you would typically send a notification (email, webhook, etc.)
    // For now, we'll just log it
    
    // Pseudocode for email notification (implement once email service is connected)
    // if (Deno.env.get("ENABLE_EMAIL_NOTIFICATIONS") === "true") {
    //   const emailResult = await sendEmail({
    //     to: "admin@example.com",
    //     subject: `Bridge Transaction Completed: ${transaction.ff_order_id}`,
    //     body: `A bridge transaction has been completed:\n\n` +
    //           `From: ${transaction.from_currency}\n` +
    //           `To: ${transaction.to_currency}\n` +
    //           `Amount: ${transaction.amount}\n` +
    //           `Time: ${transaction.created_at}`
    //   });
    //   console.log("Email notification result:", emailResult);
    // }
    
    // Collect some additional analytics about the transaction
    const analyticsData = {
      transaction_type: "bridge",
      from_currency: transaction.from_currency,
      to_currency: transaction.to_currency,
      amount: transaction.amount,
      timestamp: new Date().toISOString(),
      client_info: transaction.client_metadata?.device || {},
      is_simulated: transaction.client_metadata?.simulation || false
    };
    
    console.log("Transaction analytics:", analyticsData);
    
    // Simulate saving analytics (would typically go to a separate analytics table or service)
    console.log("Would save analytics data for later analysis");
    
    return new Response(
      JSON.stringify({
        code: 0,
        msg: "Notification processed successfully",
        transaction: {
          id: transaction.id,
          ff_order_id: transaction.ff_order_id,
          status: transaction.status,
          from_currency: transaction.from_currency,
          to_currency: transaction.to_currency
        },
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
