import { Link } from "react-router-dom";

const LAST_UPDATED = "18 de abril de 2026";
const ACCOUNT_DELETE_CONTACT_EMAIL = "contato@storyforge.app";

const sections = [
  {
    title: "Como excluir sua conta pelo app",
    paragraphs: [
      "O StoryForge permite que a exclusão da conta seja feita diretamente no aplicativo, sem necessidade de abrir um chamado separado quando você ainda consegue acessar seu perfil.",
      "Esse fluxo fica disponível na área de configurações da conta e exige uma confirmação final antes de concluir a remoção."
    ],
    steps: [
      "Abra o StoryForge e entre na sua conta.",
      "Acesse a tela Configurações.",
      "Role até a seção Zona destrutiva.",
      "Selecione a opção Excluir Conta.",
      "Confirme a exclusão para concluir o processo."
    ]
  },
  {
    title: "O que acontece após a exclusão",
    paragraphs: [
      "Na implementação atual do StoryForge, a exclusão remove a conta ativa da base local em uso e também apaga os registros associados àquele usuário, incluindo perfil, sessão, projetos, pastas, manuscritos, obras públicas, posts, enquetes e dados básicos de moderação vinculados ao autor.",
      "Como a versão atual do produto usa armazenamento local como camada principal de persistência, a remoção atua sobre os dados disponíveis naquela instalação do app ou navegador. Em instalações diferentes que ainda não tenham sido limpas ou atualizadas, algum conteúdo local antigo pode continuar visível até que esses dados também sejam removidos."
    ]
  },
  {
    title: "Se você não conseguir acessar a conta",
    paragraphs: [
      "Se você perdeu acesso ao email, não consegue entrar no aplicativo ou precisa solicitar ajuda para remover sua conta, entre em contato pelo canal abaixo.",
      "Para agilizar o atendimento, envie o email da conta, o nome de usuário usado no StoryForge e uma breve descrição do problema de acesso."
    ]
  }
];

function Section({ title, paragraphs, steps = [] }) {
  return (
    <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm sm:p-7">
      <h2 className="text-lg font-semibold text-foreground sm:text-xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground sm:text-[15px]">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {steps.length ? (
        <ol className="mt-5 space-y-3 text-sm leading-7 text-foreground sm:text-[15px]">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export default function DeleteAccountPage() {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,rgba(247,249,253,0.98),rgba(240,244,252,0.96))]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="rounded-[32px] border border-border bg-background/90 p-6 shadow-[0_25px_80px_rgba(25,34,58,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Voltar para o acesso
            </Link>
            <span className="hidden sm:inline">•</span>
            <span>Página pública para exclusão de conta do StoryForge</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Exclusão de Conta – StoryForge
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Esta página explica como excluir sua conta no StoryForge e oferece um canal de contato caso você não consiga
            entrar no aplicativo para concluir o processo.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-primary/15 bg-primary/5 px-4 py-2 font-medium text-primary">
              Última atualização: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-border bg-muted/60 px-4 py-2 text-muted-foreground">
              Link público para Google Play Store
            </span>
          </div>
        </header>

        <div className="grid gap-4 rounded-[28px] border border-border bg-background/70 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ação principal</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Exclusão feita pelo próprio usuário em Configurações &gt; Zona destrutiva &gt; Excluir Conta.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Escopo atual</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              Remoção de conta, sessão e conteúdo autoral associado na base ativa da aplicação.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contato</p>
            <p className="mt-2 text-sm leading-6 text-foreground">{ACCOUNT_DELETE_CONTACT_EMAIL}</p>
          </div>
          <div className="sm:col-span-3">
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to="/privacy" className="font-medium text-primary hover:underline">
                Política de Privacidade
              </Link>
              <Link to="/terms" className="font-medium text-primary hover:underline">
                Termos de Uso
              </Link>
              <Link to="/community-guidelines" className="font-medium text-primary hover:underline">
                Diretrizes da Comunidade
              </Link>
            </div>
          </div>
        </div>

        <main className="space-y-5">
          {sections.map((section) => (
            <Section key={section.title} {...section} />
          ))}

          <section className="rounded-3xl border border-primary/15 bg-primary/5 p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">Canal de contato para suporte</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-[15px]">
              Se você não conseguir acessar o StoryForge para excluir a conta, envie sua solicitação para{" "}
              <span className="font-semibold text-foreground">{ACCOUNT_DELETE_CONTACT_EMAIL}</span>. Informe o email da
              conta e, se possível, seu nome de usuário para facilitar a análise.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}
