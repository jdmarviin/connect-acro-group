import { currentUser } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ReflectionForm, { type Question } from "./ReflectionForm";

export default async function DiaryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/auth");
  const { id } = await params;
  const client = await supabaseServer();
  const { data: assignment, error } = await client
    .from("form_assignments")
    .select("id,form_version_id,meeting_id,opens_at,closes_at")
    .eq("id", id)
    .single();
  if (error || !assignment || !assignment.meeting_id) notFound();
  const { data: questions } = await client
    .from("form_questions")
    .select(
      "id,question_key,label,question_type,is_required,form_question_options(value,label)",
    )
    .eq("form_version_id", assignment.form_version_id)
    .order("position")
    .returns<Question[]>();
  const { data: submission } = await client
    .from("form_submissions")
    .select("id,status,submitted_at")
    .eq("assignment_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: answers } = submission
    ? await client
        .from("form_answers")
        .select("*")
        .eq("submission_id", submission.id)
    : { data: [] };
  const submitted = submission?.status === "submitted";
  const closed =
    new Date(assignment.opens_at).getTime() > Date.now() ||
    (assignment.closes_at &&
      new Date(assignment.closes_at).getTime() <= Date.now());
  return (
    <div className="max-w-3xl mx-auto p-8 pb-32 space-y-8 text-white">
      <Link href="/dashboard" className="underline">
        Voltar ao painel
      </Link>
      <h1 className="text-3xl font-bold">Diário da reunião</h1>
      {submitted ? (
        <>
          <p>Reflexão registrada.</p>
          {questions?.map((q) => {
            const a = answers?.find((a) => a.question_id === q.id);
            return (
              <article key={q.id} className="glass-panel rounded-xl p-4">
                <h2 className="font-semibold">{q.label["pt-BR"]}</h2>
                <p className="whitespace-pre-wrap">
                  {a
                    ? String(
                        a.value_text ??
                          a.value_number ??
                          a.value_boolean ??
                          a.value_date ??
                          JSON.stringify(a.value_json),
                      )
                    : "Sem resposta"}
                </p>
              </article>
            );
          })}
        </>
      ) : closed ? (
        <p>Este formulário está fora do período de resposta.</p>
      ) : (
        <ReflectionForm id={id} questions={questions || []} />
      )}
    </div>
  );
}
