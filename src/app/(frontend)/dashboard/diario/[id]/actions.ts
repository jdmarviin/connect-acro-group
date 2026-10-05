"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function submitReflection(
  id: string,
  _state: { error: string },
  data: FormData,
) {
  const client = await supabaseServer();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { error: "Faça login novamente." };
  const { data: assignment } = await client
    .from("form_assignments")
    .select("form_version_id")
    .eq("id", id)
    .single();
  if (!assignment) return { error: "Este formulário não está disponível." };
  const { data: questions, error } = await client
    .from("form_questions")
    .select("question_key,question_type")
    .eq("form_version_id", assignment.form_version_id);
  if (error || !questions)
    return { error: "Não foi possível carregar as perguntas." };
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
      error:
        "Não foi possível enviar. Confira os campos obrigatórios ou se a resposta já foi enviada.",
    };
  revalidatePath("/dashboard");
  redirect(`/dashboard/diario/${id}`);
}
