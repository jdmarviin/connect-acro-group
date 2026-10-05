"use client";
import { useActionState } from "react";
import { submitReflection } from "./actions";
export type Question = {
  id: string;
  question_key: string;
  label: Record<string, string>;
  question_type: string;
  is_required: boolean;
  form_question_options: { value: string; label: Record<string, string> }[];
};
export default function ReflectionForm({
  id,
  questions,
}: {
  id: string;
  questions: Question[];
}) {
  const [state, action, pending] = useActionState(
    submitReflection.bind(null, id),
    { error: "" },
  );
  const fieldClass =
    "block w-full rounded-lg border border-white/20 bg-zinc-900 p-3 mt-2";
  return (
    <form action={action} className="space-y-6">
      {questions.map((q) => (
        <label key={q.id} className="block">
          {q.label["pt-BR"] || q.question_key}
          {q.is_required ? " *" : ""}
          {q.question_type === "long_text" ? (
            <textarea
              className={fieldClass}
              name={q.question_key}
              required={q.is_required}
              maxLength={2000}
              rows={4}
            />
          ) : ["single_choice", "boolean"].includes(q.question_type) ? (
            <select
              className={fieldClass}
              name={q.question_key}
              required={q.is_required}
              defaultValue=""
            >
              <option value="">Selecione</option>
              {q.question_type === "boolean" ? (
                <>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </>
              ) : (
                q.form_question_options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label["pt-BR"] || o.value}
                  </option>
                ))
              )}
            </select>
          ) : q.question_type === "multiple_choice" ? (
            <span className="block">
              {q.form_question_options.map((o) => (
                <span className="block" key={o.value}>
                  <input
                    type="checkbox"
                    name={q.question_key}
                    value={o.value}
                  />{" "}
                  {o.label["pt-BR"] || o.value}
                </span>
              ))}
            </span>
          ) : (
            <input
              className={fieldClass}
              name={q.question_key}
              type={
                q.question_type === "date"
                  ? "date"
                  : ["number", "scale"].includes(q.question_type)
                    ? "number"
                    : "text"
              }
              required={q.is_required}
              maxLength={2000}
            />
          )}
        </label>
      ))}
      {state.error && (
        <p role="alert" className="text-red-400">
          {state.error}
        </p>
      )}
      <p className="text-sm">
        Após enviar, o registro fica disponível para você e para o
        administrador.
      </p>
      <button
        disabled={pending}
        className="rounded-xl bg-acro-blue px-6 py-3 text-white disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Salvar reflexão"}
      </button>
    </form>
  );
}
