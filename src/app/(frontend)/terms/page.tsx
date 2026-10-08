import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Termos de Uso</h1>
        
        <div className="prose prose-blue dark:prose-invert max-w-none space-y-6">
          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

          <p>Bem-vindo à <strong>ACRO GROUP</strong>. Estes Termos de Uso regulam o acesso e a utilização da nossa plataforma, dos nossos serviços e da integração de recursos de videoconferência fornecidos pelo Zoom. Ao acessar ou usar nossos serviços, você concorda em cumprir estes Termos.</p>

          <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
          <p>Ao criar uma conta e utilizar a plataforma ACRO GROUP, você confirma que leu, entendeu e concorda em ficar vinculado a estes Termos de Uso, bem como à nossa Política de Privacidade.</p>

          <h2 className="text-xl font-semibold">2. Uso dos Serviços</h2>
          <p>Nossa plataforma oferece acesso a eventos, reuniões e conteúdos ao vivo. Você concorda em:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fornecer informações precisas e completas ao criar sua conta;</li>
            <li>Manter a confidencialidade de suas credenciais de login;</li>
            <li>Não utilizar os serviços para fins ilegais, não autorizados ou que violem as normas de conduta da plataforma;</li>
            <li>Não compartilhar links de acesso a reuniões com pessoas não autorizadas.</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Integração com o Zoom</h2>
          <p>Nossos serviços utilizam a integração com o Zoom para a realização de videoconferências.</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Para utilizar os recursos integrados, você poderá ser solicitado a autorizar a conexão entre sua conta Zoom e a ACRO GROUP.</li>
            <li>O uso do Zoom também está sujeito aos <a href="https://explore.zoom.us/pt-br/terms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Termos de Serviço do Zoom</a> e à sua Política de Privacidade.</li>
            <li>Você pode desconectar a integração a qualquer momento nas configurações do seu perfil no Zoom. No entanto, isso pode limitar sua capacidade de acessar reuniões na nossa plataforma.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Propriedade Intelectual</h2>
          <p>Todo o conteúdo disponibilizado na plataforma, incluindo textos, gráficos, logotipos, vídeos e materiais das reuniões, é de propriedade exclusiva da ACRO GROUP ou de seus licenciadores. É proibida a reprodução, distribuição ou modificação não autorizada desse conteúdo.</p>

          <h2 className="text-xl font-semibold">5. Limitação de Responsabilidade</h2>
          <p>A ACRO GROUP se esforça para manter os serviços operacionais e seguros, mas não garante que a plataforma estará sempre livre de interrupções, atrasos ou erros. Não nos responsabilizamos por:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Falhas técnicas relacionadas ao seu dispositivo ou provedor de internet;</li>
            <li>Indisponibilidade ou instabilidade dos serviços de terceiros, como o Zoom;</li>
            <li>Danos indiretos ou incidentais decorrentes do uso da plataforma.</li>
          </ul>

          <h2 className="text-xl font-semibold">6. Modificações dos Termos</h2>
          <p>Podemos revisar e atualizar estes Termos de Uso periodicamente. Quaisquer alterações entrarão em vigor assim que publicadas na plataforma. É sua responsabilidade revisar os Termos regularmente. O uso contínuo da plataforma após a publicação de alterações constitui aceitação dos novos Termos.</p>

          <h2 className="text-xl font-semibold">7. Rescisão</h2>
          <p>Podemos suspender ou encerrar seu acesso à plataforma, a nosso exclusivo critério, caso você viole estes Termos ou se envolva em condutas prejudiciais à ACRO GROUP ou a outros usuários. Você também pode solicitar a exclusão de sua conta a qualquer momento via suporte.</p>

          <h2 className="text-xl font-semibold">8. Contato</h2>
          <p>Em caso de dúvidas sobre estes Termos de Uso, entre em contato através dos canais de suporte:</p>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-200 dark:border-zinc-700">
            <p><strong>E-mail:</strong> suporte@acrogroup.com.br</p>
            <p><strong>Site:</strong> acrogroup.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
}
