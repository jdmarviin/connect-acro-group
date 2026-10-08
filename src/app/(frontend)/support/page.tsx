import React from 'react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Suporte – ACRO GROUP</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none">
          <p>Bem-vindo à central de suporte da ACRO GROUP.</p>
          <p>Nossa equipe está disponível para auxiliar usuários com dúvidas relacionadas à plataforma, cadastro, acesso, reuniões e integração com o Zoom.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Podemos ajudar com:</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Criação de conta;</li>
            <li>Problemas de cadastro;</li>
            <li>Problemas de login;</li>
            <li>Recuperação de acesso;</li>
            <li>Acesso às reuniões;</li>
            <li>Utilização da plataforma;</li>
            <li>Integração com o Zoom;</li>
            <li>Problemas técnicos;</li>
            <li>Solicitação de exclusão da conta;</li>
            <li>Solicitação de exclusão de dados pessoais;</li>
            <li>Dúvidas gerais sobre o funcionamento da ACRO GROUP.</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">Como entrar em contato</h2>
          <p>Envie uma mensagem para:</p>
          <p className="font-medium text-blue-600 dark:text-blue-400">
            E-mail: suporte@acrogroup.com.br
          </p>

          <p className="mt-4">Ao entrar em contato, recomendamos informar:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Seu nome;</li>
            <li>O e-mail utilizado no cadastro;</li>
            <li>Uma descrição do problema;</li>
            <li>Se possível, uma imagem ou captura de tela do erro encontrado.</li>
          </ul>
          <p className="mt-4">Nossa equipe analisará sua solicitação e responderá assim que possível.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Segurança</h2>
          <p>Nunca envie sua senha por e-mail.</p>
          <p>A ACRO GROUP não solicitará sua senha da plataforma ou da conta Zoom por meio do suporte.</p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Exclusão de Conta</h2>
          <p>Caso deseje excluir sua conta ou solicitar a exclusão de seus dados pessoais, envie uma solicitação através do e-mail oficial de suporte.</p>

          <div className="mt-10 pt-6 border-t border-gray-200 dark:border-zinc-700">
            <h3 className="font-semibold text-lg">ACRO GROUP</h3>
            <p>Site: <Link href="/" className="text-blue-600 hover:underline">acrogroup.com.br</Link></p>
            <p>E-mail: suporte@acrogroup.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
