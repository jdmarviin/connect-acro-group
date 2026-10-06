"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from 'next/headers';
import { participantText } from '@/i18n/participant';

export async function submitReflection(
  id: string,
  _state: { error: string },
  data: FormData,
) {
  const locale = (await cookies()).get('NEXT_LOCALE')?.value === 'pt' ? 'pt' : 'ht';
  const t = participantText(locale);
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: t.loginError };
  const { data: assignment } = await client
    .from("form_assignments")
    .select("form_version_id")
    .eq("id", id)
    .single();
  if (!assignment) return { error: t.unavailable };
  const { data: questions, error } = await client
    .from("form_questions")
    .select("question_key,question_type")
    .eq("form_version_id", assignment.form_version_id);
  if (error || !questions)
    return { error: t.unavailable };
  const answers: Record<string, unknown> = {};
  for (const q of questions) {
    const value = data.get(q.question_key);
    if (q.question_type === "multiple_choice")
      answers[q.question_key] = data.getAll(q.question_key);
    else if (value !== null && value !== "")
      answers[q.question_key] =
        q.question_type === "boolean"
          ? value === "true"
          : ["number", "scale"].includes(q.question_type)
            ? Number(value)
            : String(value);
  }
  const result = await client.rpc("submit_form", { assignment: id, answers });
  if (result.error)
    return {
      error: t.formError,
    };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pesquisas");
  redirect(`/dashboard/diario/${id}`);
}
