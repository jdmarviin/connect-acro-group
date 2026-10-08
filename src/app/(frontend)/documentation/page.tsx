import React from 'react';
import Link from 'next/link';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 p-8 sm:p-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Documentação</h1>
        <h2 className="text-xl text-gray-600 dark:text-gray-300 mb-8">Integração ACRO GROUP + ZOOM</h2>
        
        <div className="prose prose-blue dark:prose-invert max-w-none space-y-8">
          <p className="text-lg">
            Esta página explica como utilizar a integração entre a plataforma ACRO GROUP e o Zoom. 
            A integração foi desenvolvida para facilitar o acesso dos usuários às reuniões e conteúdos ao vivo disponibilizados pela ACRO GROUP.
          </p>

          <section>
            <h3 className="text-2xl font-semibold mb-4">1. Como criar uma conta na ACRO GROUP</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Acesse o site oficial da ACRO GROUP.</li>
              <li>Clique na opção de cadastro.</li>
              <li>Informe os dados solicitados e conclua o processo de criação da conta.</li>
              <li>Após o cadastro, faça login na plataforma.</li>
            </ol>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">2. Como acessar a área de reuniões</h3>
            <p>Após entrar na sua conta:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Acesse seu painel;</li>
              <li>Localize a área de reuniões, transmissões ou eventos ao vivo;</li>
              <li>Selecione a reunião disponível.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">3. Como conectar ou autorizar o Zoom</h3>
            <p>Quando uma funcionalidade depender da integração com o Zoom, o usuário poderá ser direcionado para a página de autorização do Zoom. Nessa página:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Faça login em sua conta Zoom, quando necessário;</li>
              <li>Leia as permissões solicitadas;</li>
              <li>Clique para autorizar a integração.</li>
            </ul>
            <p className="mt-4 font-medium">A ACRO GROUP terá acesso somente às informações autorizadas pelo usuário e necessárias para o funcionamento da integração.</p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">4. Como participar de uma reunião</h3>
            <p>Depois de concluir a autorização:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Entre na plataforma ACRO GROUP;</li>
              <li>Acesse a área de reuniões;</li>
              <li>Escolha a reunião disponível;</li>
              <li>Clique no botão para participar;</li>
              <li>Siga as instruções apresentadas na tela.</li>
            </ul>
            <p className="mt-4">Dependendo da configuração da reunião, ela poderá ser aberta através do Zoom ou integrada diretamente à plataforma.</p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">5. Como desconectar ou remover a integração</h3>
            <p>O usuário poderá remover a autorização da integração diretamente através da sua conta Zoom. Para isso:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Acesse sua conta Zoom;</li>
              <li>Entre nas configurações relacionadas a aplicativos ou integrações;</li>
              <li>Localize a ACRO GROUP;</li>
              <li>Selecione a opção para remover ou revogar o acesso.</li>
            </ul>
            <p className="mt-4 text-orange-600 dark:text-orange-400">Após a remoção, algumas funcionalidades relacionadas às reuniões poderão deixar de funcionar até que a integração seja autorizada novamente.</p>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">6. Como solicitar ajuda</h3>
            <p>Se o usuário encontrar algum problema durante a conexão, utilização ou remoção da integração, poderá entrar em contato com nosso suporte.</p>
            <p className="mt-2 font-medium">E-mail: suporte@acrogroup.com.br</p>
            <p className="mt-4">Ao solicitar ajuda, informe:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Nome;</li>
              <li>E-mail utilizado no cadastro;</li>
              <li>Descrição do problema;</li>
              <li>Etapa em que o erro ocorreu;</li>
              <li>Captura de tela, quando possível.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">7. Privacidade</h3>
            <p>As informações utilizadas na integração com o Zoom são tratadas de acordo com a Política de Privacidade da ACRO GROUP.</p>
            <Link href="/privacy" className="text-blue-600 hover:underline mt-2 inline-block">Acessar Política de Privacidade</Link>
          </section>

          <section>
            <h3 className="text-2xl font-semibold mb-4">8. Termos de Uso</h3>
            <p>O uso da plataforma também está sujeito aos Termos de Uso da ACRO GROUP.</p>
            <Link href="/terms" className="text-blue-600 hover:underline mt-2 inline-block">Acessar Termos de Uso</Link>
          </section>

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
