import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST() {
  const client = await supabaseServer();
  const { error } = await client.auth.signOut();
  return NextResponse.json({ success: !error }, { status: error ? 500 : 200 });
}
