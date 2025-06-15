
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Parse auth JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const jwt = authHeader.replace("Bearer ", "").trim();

  // Supabase project URL and anon key from env (injected automatically)
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Create supabase client with service role for admin operations
  const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create supabase client with user's token for getting their UID
  const supabaseUser = createClient(SUPABASE_URL, jwt, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get the user from the JWT
  const { data: userData, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Could not authenticate user" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const userId = userData.user.id;

  // Try to delete all user-related data in parallel
  let deleteErrors: string[] = [];

  try {
    // 1. Delete from password_entries
    const { error: pwEntriesError } = await supabaseAdmin
      .from("password_entries")
      .delete()
      .eq("user_id", userId);
    if (pwEntriesError) deleteErrors.push("Failed to delete password_entries");

    // 2. Delete from password_histories
    const { error: pwHistoriesError } = await supabaseAdmin
      .from("password_histories")
      .delete()
      .eq("user_id", userId);
    if (pwHistoriesError) deleteErrors.push("Failed to delete password_histories");

    // 3. Delete from password_groups
    const { error: pwGroupsError } = await supabaseAdmin
      .from("password_groups")
      .delete()
      .eq("user_id", userId);
    if (pwGroupsError) deleteErrors.push("Failed to delete password_groups");

    // 4. Delete from user_master_passwords
    const { error: mpwError } = await supabaseAdmin
      .from("user_master_passwords")
      .delete()
      .eq("user_id", userId);
    if (mpwError) deleteErrors.push("Failed to delete master passwords");

    // 5. Delete from api_entries
    const { error: apiEntriesError } = await supabaseAdmin
      .from("api_entries")
      .delete()
      .eq("user_id", userId);
    if (apiEntriesError) deleteErrors.push("Failed to delete api_entries");

    // 6. Delete from api_histories
    const { error: apiHistoriesError } = await supabaseAdmin
      .from("api_histories")
      .delete()
      .eq("user_id", userId);
    if (apiHistoriesError) deleteErrors.push("Failed to delete api_histories");

    // 7. Delete from api_groups
    const { error: apiGroupsError } = await supabaseAdmin
      .from("api_groups")
      .delete()
      .eq("user_id", userId);
    if (apiGroupsError) deleteErrors.push("Failed to delete api_groups");

    // 8. Delete from profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) deleteErrors.push("Failed to delete profile");

    // 9. Delete user (auth.users)
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteUserError) deleteErrors.push("Failed to delete auth user");
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "An error occurred during user deletion", details: e instanceof Error ? e.message : e }),
      { status: 500, headers: corsHeaders }
    );
  }

  if (deleteErrors.length > 0) {
    return new Response(JSON.stringify({ error: deleteErrors }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
});
