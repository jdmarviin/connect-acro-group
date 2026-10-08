import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Política de Privacidade</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

          <p>A <strong>ACRO GROUP</strong> está comprometida com a proteção da sua privacidade. Esta Política de Privacidade explica como coletamos, usamos, divulgamos e protegemos suas informações quando você utiliza nossa plataforma e nossos serviços, incluindo a integração com o Zoom.</p>

          <h2 className="text-xl font-semibold">1. Informações que Coletamos</h2>
          <p>Podemos coletar as seguintes informações:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Dados de Conta:</strong> Nome, endereço de e-mail e outras informações fornecidas no momento do cadastro.</li>
            <li><strong>Dados de Integração (Zoom):</strong> Quando você autoriza a integração com o Zoom, acessamos os dados necessários para agendar, gerenciar e permitir sua participação em reuniões (como ID da conta Zoom, tokens de acesso temporários e dados básicos de perfil).</li>
            <li><strong>Dados de Uso:</strong> Informações sobre como você interage com a plataforma, incluindo acessos a reuniões e conteúdos.</li>
          </ul>

          <h2 className="text-xl font-semibold">2. Como Usamos Suas Informações</h2>
          <p>Utilizamos os dados coletados para:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fornecer, operar e manter nossos serviços;</li>
            <li>Facilitar a criação de reuniões e sua conexão aos eventos via Zoom;</li>
            <li>Melhorar e personalizar sua experiência na plataforma;</li>
            <li>Processar solicitações de suporte e atendimento;</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Compartilhamento de Dados</h2>
          <p>Não vendemos suas informações pessoais. Podemos compartilhar dados com:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Zoom Video Communications, Inc.:</strong> Para habilitar a integração de videoconferência. Consulte a Política de Privacidade do Zoom para mais detalhes.</li>
            <li><strong>Provedores de Serviço:</strong> Terceiros que prestam serviços em nosso nome (ex: hospedagem, suporte técnico), sempre sob rígidos acordos de confidencialidade.</li>
            <li><strong>Autoridades Legais:</strong> Quando exigido por lei ou para proteger nossos direitos.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Segurança dos Dados</h2>
          <p>Adotamos medidas técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.</p>

          <h2 className="text-xl font-semibold">5. Retenção e Exclusão de Dados</h2>
          <p>Manteremos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta Política. Você pode solicitar a exclusão da sua conta e dos seus dados a qualquer momento enviando um e-mail para o nosso suporte.</p>
          <p>Para revogar o acesso da ACRO GROUP à sua conta Zoom, você pode fazer isso diretamente nas configurações da sua conta Zoom, na seção de Aplicativos Autorizados.</p>

          <h2 className="text-xl font-semibold">6. Seus Direitos</h2>
          <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de acessar, corrigir, atualizar ou solicitar a exclusão de suas informações pessoais. Para exercer esses direitos, entre em contato conosco.</p>

          <h2 className="text-xl font-semibold">7. Contato</h2>
          <p>Se você tiver alguma dúvida sobre esta Política de Privacidade ou sobre o tratamento de seus dados, entre em contato:</p>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
            <p><strong>E-mail:</strong> suporte@acrogroup.com.br</p>
            <p><strong>Site:</strong> acrogroup.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
