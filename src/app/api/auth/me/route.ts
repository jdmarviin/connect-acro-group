import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json(
    {
      user: user
        ? { name: user.name, role: user.role, avatar_url: user.avatar_url }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
