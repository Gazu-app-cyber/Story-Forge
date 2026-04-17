import { Link } from "react-router-dom";

const LAST_UPDATED = "17 de abril de 2026";
const PRIVACY_CONTACT_EMAIL = "contato@storyforge.app";

const sections = [
  {
    title: "1. Introdução",
    paragraphs: [
      "Esta Política de Privacidade descreve como o StoryForge trata dados relacionados ao uso do aplicativo, da versão web e da versão distribuída para Android. Ela foi escrita para explicar, de forma clara, quais informações são usadas para autenticação, funcionamento do editor, gerenciamento de perfil e exibição de conteúdos públicos.",
      "O texto abaixo reflete o funcionamento atual do produto. Se o StoryForge passar a usar novas integrações, novas formas de sincronização remota ou novos recursos de análise, esta política será atualizada para refletir essas mudanças."
    ]
  },
  {
    title: "2. Dados que podem ser tratados pelo StoryForge",
    paragraphs: [
      "O StoryForge pode tratar dados informados diretamente por você ao criar ou usar sua conta, como nome de exibição, email, senha, nome de usuário, biografia, links sociais, imagem de perfil e banner.",
      "O aplicativo também trata o conteúdo que você cria dentro da plataforma, incluindo projetos, pastas, manuscritos, obras públicas, capítulos vinculados, posts, enquetes, preferências visuais, plano selecionado e configurações de leitura ou escrita.",
      "Além disso, o app mantém dados de autenticação e recuperação de acesso, como estado de sessão, tokens de verificação de email e tokens de redefinição de senha gerados para o próprio fluxo de autenticação.",
      "Na versão atual, grande parte dessas informações é armazenada localmente no navegador ou no dispositivo em que o aplicativo está sendo usado, por meio de armazenamento local e mecanismos equivalentes de sessão."
    ]
  },
  {
    title: "3. Como esses dados são usados",
    paragraphs: [
      "Os dados são usados para criar e gerenciar sua conta, autenticar seu acesso, restaurar sua sessão, permitir redefinição de senha, verificar email e manter o aplicativo funcionando de forma consistente entre telas e reaberturas.",
      "As informações de perfil e conteúdo são usadas para organizar sua experiência de escrita, salvar projetos e manuscritos, permitir edição de obras públicas, publicar conteúdos marcados como públicos e montar páginas como perfil público, vitrine de obras, posts e enquetes.",
      "Dados técnicos mínimos do próprio ambiente do app podem ser usados para manter compatibilidade entre navegador, webview Android e interface responsiva, além de reduzir falhas de carregamento e melhorar a estabilidade do produto."
    ]
  },
  {
    title: "4. Conteúdo público",
    paragraphs: [
      "Quando você ativa recursos públicos, como perfil público, obra pública, post ou enquete, essas informações deixam de ser tratadas apenas como conteúdo privado de escrita e passam a poder ser exibidas em áreas públicas do StoryForge.",
      "Isso inclui, conforme o recurso usado, título da obra, capa, descrição breve, resumo, capítulos publicados, nome do autor, nome de usuário, bio pública, posts e enquetes. Só publique informações que você realmente deseje tornar visíveis para outras pessoas.",
      "Projetos e manuscritos que não forem convertidos em conteúdos públicos continuam destinados ao uso privado dentro da sua instalação e da sua conta, conforme o funcionamento atual do aplicativo."
    ]
  },
  {
    title: "5. Compartilhamento e acesso por terceiros",
    paragraphs: [
      "O StoryForge não foi construído, nesta versão, com SDKs de anúncios ou bibliotecas de analytics comportamental integradas ao código principal da aplicação.",
      "Ainda assim, a versão web depende de infraestrutura de hospedagem e distribuição para funcionar publicamente. Isso significa que provedores técnicos envolvidos na entrega do aplicativo podem processar registros operacionais básicos, como requisições, data e hora de acesso, compatibilidade do navegador e dados necessários para disponibilidade, segurança e entrega do serviço.",
      "No fluxo atual do produto, o armazenamento principal de conta, sessão e conteúdo ocorre localmente na instalação em uso. Se uma versão futura passar a sincronizar dados com banco remoto ou serviços adicionais, esta política será revisada para refletir esse novo compartilhamento."
    ]
  },
  {
    title: "6. Cookies, sessão e tecnologias similares",
    paragraphs: [
      "Na versão web, o StoryForge utiliza armazenamento local e mecanismos equivalentes para manter sessão, preferências e conteúdo salvo na instalação em uso. Em alguns contextos, o navegador também pode usar recursos semelhantes a cookies para funcionamento normal da navegação.",
      "Na versão Android empacotada, a persistência depende do armazenamento disponível no próprio app/webview, com a mesma finalidade: manter sua sessão ativa, restaurar preferências e preservar dados criados no dispositivo."
    ]
  },
  {
    title: "7. Retenção e exclusão de dados",
    paragraphs: [
      "Os dados permanecem disponíveis enquanto forem necessários para o funcionamento da conta e do conteúdo criado por você dentro da instalação em uso.",
      "Se você usar a função de exclusão de conta disponível no aplicativo, o StoryForge remove os registros associados àquela conta na base atual da aplicação, incluindo perfil, projetos, pastas, manuscritos, obras públicas, posts, enquetes e estado de sessão correspondente.",
      "Como a versão atual usa armazenamento local como camada principal de persistência, a exclusão atua sobre os dados disponíveis naquela instalação. Limpar dados do navegador, limpar dados do app ou desinstalar o aplicativo também pode remover conteúdo salvo localmente."
    ]
  },
  {
    title: "8. Segurança",
    paragraphs: [
      "O StoryForge adota medidas compatíveis com a arquitetura atual do produto para reduzir falhas de sessão, perda acidental de estado e exposição indevida de conteúdo público, além de utilizar rotas e fluxos separados para conteúdo privado e conteúdo público.",
      "Nenhum sistema é absolutamente inviolável. Por isso, embora o aplicativo adote cuidados razoáveis de implementação e distribuição, não é possível prometer segurança total contra todas as formas de falha, acesso indevido, perda de dispositivo ou comportamento inesperado do ambiente do usuário."
    ]
  },
  {
    title: "9. Direitos do usuário",
    paragraphs: [
      "Você pode revisar e alterar informações do seu perfil pelo próprio aplicativo, atualizar conteúdos publicados, remover materiais públicos e solicitar exclusão da conta usando os recursos disponíveis na interface.",
      "Também é possível entrar em contato para tratar dúvidas sobre acesso, correção, exclusão ou esclarecimentos relacionados a esta política."
    ]
  },
  {
    title: "10. Privacidade de crianças e adolescentes",
    paragraphs: [
      "O StoryForge é uma plataforma de criação e publicação de histórias. O app não foi desenhado especificamente para coleta intencional de dados de crianças sem supervisão adequada.",
      "Se você for responsável legal por um menor e acreditar que dados foram informados de forma inadequada, entre em contato para análise e encaminhamento apropriado."
    ]
  },
  {
    title: "11. Alterações nesta política",
    paragraphs: [
      "Esta política pode ser atualizada para refletir mudanças no funcionamento do aplicativo, em integrações técnicas, em exigências legais ou em requisitos de distribuição, inclusive da Google Play.",
      "Quando houver alteração relevante, a data de atualização desta página será modificada para refletir a versão mais recente do documento."
    ]
  },
  {
    title: "12. Contato",
    paragraphs: [
      `Se você tiver dúvidas sobre esta Política de Privacidade, sobre tratamento de dados no StoryForge ou sobre exclusão de conta, entre em contato por: ${PRIVACY_CONTACT_EMAIL}.`
    ]
  }
];

function Section({ title, paragraphs }) {
  return (
    <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-[15px]">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,rgba(247,249,253,0.98),rgba(240,244,252,0.96))]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="rounded-[32px] border border-border bg-background/90 p-6 shadow-[0_25px_80px_rgba(25,34,58,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Voltar para o acesso
            </Link>
            <span className="hidden sm:inline">•</span>
            <span>Documento público do aplicativo StoryForge</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Política de Privacidade</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Esta página explica, de forma objetiva, como o StoryForge trata dados de conta, sessão, perfil e conteúdo criado
            pelos usuários na versão web e na versão Android do aplicativo.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-primary/15 bg-primary/5 px-4 py-2 font-medium text-primary">
              Última atualização: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-border bg-muted/60 px-4 py-2 text-muted-foreground">
              Aplicativo: StoryForge
            </span>
          </div>
        </header>

        <div className="grid gap-4 rounded-[28px] border border-border bg-background/70 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tratamento atual</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Conta, sessão, preferências e conteúdo autoral com persistência local e áreas públicas controladas pelo usuário.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Fluxos cobertos</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Cadastro, login, verificação de email, recuperação de senha, perfil público, obras públicas, posts e enquetes.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contato</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{PRIVACY_CONTACT_EMAIL}</p>
          </div>
        </div>

        <main className="space-y-5">
          {sections.map((section) => (
            <Section key={section.title} {...section} />
          ))}
        </main>
      </div>
    </div>
  );
}
