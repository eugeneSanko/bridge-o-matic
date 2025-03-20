
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
    
    // Check if transaction with this ff_order_id already exists in bridge_transactions
    // We perform this check to avoid race conditions, but ultimately rely on the database constraint
    const { data: existingTx, error: existingTxError } = await supabase
      .from('bridge_transactions')
      .select('id, ff_order_id')
      .eq('ff_order_id', transaction.ff_order_id)
      .limit(1);
      
    if (existingTxError) {
      console.error("Error checking for existing transaction:", existingTxError);
    }
    
    // If transaction already exists, don't save it again
    if (existingTx && existingTx.length > 0) {
      console.log(`Transaction with ff_order_id ${transaction.ff_order_id} already exists in bridge_transactions. Skipping save.`);
      
      // Return success even though we didn't save (idempotent operation)
      return new Response(
        JSON.stringify({
          code: 0,
          msg: "Transaction already processed",
          transaction: {
            id: transaction.id,
            ff_order_id: transaction.ff_order_id,
            status: 'completed',
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
    }
    
    // Prepare client metadata if provided in the request or from the transaction
    const clientMetadata = metadata || transaction.client_metadata || {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
      languages: [req.headers.get('accept-language') || 'en-US']
    };
    
    // Insert into bridge_transactions with error handling for constraint violations
    try {
      const { data: savedTx, error: saveTxError } = await supabase
        .from('bridge_transactions')
        .insert({
          ff_order_id: transaction.ff_order_id,
          ff_order_token: transaction.ff_order_token,
          from_currency: transaction.from_currency,
          to_currency: transaction.to_currency,
          amount: transaction.amount,
          destination_address: transaction.destination_address,
          status: 'completed',
          deposit_address: transaction.deposit_address,
          client_metadata: clientMetadata
        })
        .select('*')
        .single();
        
      if (saveTxError) {
        // Check if the error is a unique constraint violation
        if (saveTxError.message.includes('unique constraint') || 
            saveTxError.message.includes('duplicate key')) {
          console.log("Transaction already exists due to constraint. Safe to ignore:", saveTxError.message);
        } else {
          console.error("Error saving transaction to bridge_transactions:", saveTxError);
          throw saveTxError;
        }
      } else {
        console.log("Transaction saved to bridge_transactions successfully");
      }
    } catch (insertError) {
      console.error("Exception during transaction insert:", insertError);
      // If it's not a duplicate key error, we should re-throw
      if (!insertError.message?.includes('unique constraint') && 
          !insertError.message?.includes('duplicate key')) {
        throw insertError;
      }
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
