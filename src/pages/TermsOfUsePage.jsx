import { Link } from "react-router-dom";

const LAST_UPDATED = "17 de abril de 2026";
const TERMS_CONTACT_EMAIL = "contato@storyforge.app";

const sections = [
  {
    title: "1. Aceitacao dos termos",
    paragraphs: [
      "Estes Termos de Uso descrevem as regras basicas para acessar e usar o StoryForge, tanto na versao web quanto na versao Android. Ao criar conta, entrar no aplicativo ou publicar conteudo, voce concorda com estas regras.",
      "Se voce nao concordar com estas condicoes, nao deve usar a plataforma nem publicar conteudo no StoryForge."
    ]
  },
  {
    title: "2. Elegibilidade e responsabilidade pela conta",
    paragraphs: [
      "Voce e responsavel por manter o acesso a sua conta em seguranca, incluindo email, senha e links de verificacao ou recuperacao.",
      "Tambem e sua responsabilidade informar dados corretos, nao compartilhar a conta de forma indevida e revisar o conteudo publicado em seu perfil publico, obras, posts e enquetes."
    ]
  },
  {
    title: "3. Uso permitido do aplicativo",
    paragraphs: [
      "O StoryForge foi criado para apoiar escrita, organizacao de projetos, publicacao de obras publicas e interacoes sociais relacionadas a autores e leitores.",
      "Voce pode usar o app para criar manuscritos, organizar pastas, publicar obras publicas, manter perfil publico, publicar posts e criar enquetes dentro dos limites definidos nestes termos e nas Diretrizes da Comunidade."
    ]
  },
  {
    title: "4. Regras para conteudo publicado",
    paragraphs: [
      "Conteudos publicados devem respeitar a lei, os direitos de terceiros e as regras da comunidade. Nao e permitido publicar material ilegal, abusivo, enganoso, ofensivo, assediador, spam, violacao de direitos autorais ou conteudo sexualizado inadequado para o escopo do aplicativo.",
      "Ao tornar uma obra ou perfil publico, voce reconhece que esse material pode ser visto por outras pessoas e denunciado se violar as regras do StoryForge."
    ]
  },
  {
    title: "5. Propriedade intelectual",
    paragraphs: [
      "Cada usuario continua responsavel pelo conteudo que cria e publica, incluindo textos, capas, descricoes, posts, opcoes de enquete e demais materiais inseridos na plataforma.",
      "Voce nao deve usar o StoryForge para publicar conteudo sem permissao do titular, plagiar obras de terceiros ou distribuir material protegido por direitos autorais sem autorizacao."
    ]
  },
  {
    title: "6. Moderacao minima e medidas de seguranca",
    paragraphs: [
      "O StoryForge disponibiliza recursos reais de denuncia de conteudo publico e bloqueio de usuarios para reduzir interacoes indesejadas e registrar ocorrencias de moderacao.",
      "A existencia desses recursos nao significa revisao previa de todo conteudo. O aplicativo mantem uma base minima de moderacao, com registro persistente de denuncias e status para revisao futura."
    ]
  },
  {
    title: "7. Remocao de conteudo e limitacao de conta",
    paragraphs: [
      "O StoryForge pode limitar recursos, ocultar conteudo publico, restringir contas ou remover materiais quando houver indicio consistente de violacao destes termos, das Diretrizes da Comunidade ou da legislacao aplicavel.",
      "Essas medidas podem ocorrer especialmente em casos de conteudo ilegal, assedio, spam, violacao de direitos autorais, tentativa de fraude ou uso abusivo do aplicativo."
    ]
  },
  {
    title: "8. Disponibilidade e limitacao de responsabilidade",
    paragraphs: [
      "O aplicativo e fornecido no estado atual da arquitetura existente. Embora o projeto busque estabilidade e boa experiencia de uso, nao ha garantia absoluta de disponibilidade continua, ausencia total de falhas ou preservacao irrestrita de dados em qualquer ambiente.",
      "Voce deve manter copia adequada do seu trabalho quando isso for importante para seu uso, especialmente porque partes da persistencia atual dependem do ambiente local em que o app estiver instalado ou aberto."
    ]
  },
  {
    title: "9. Alteracoes nos termos",
    paragraphs: [
      "Estes termos podem ser atualizados para refletir novas funcionalidades, mudancas de moderacao, ajustes tecnicos, distribuicao mobile e requisitos de plataformas como a Google Play.",
      "Quando houver mudanca relevante, a data de atualizacao desta pagina sera ajustada."
    ]
  },
  {
    title: "10. Contato",
    paragraphs: [
      `Se voce tiver duvidas sobre estes Termos de Uso ou sobre medidas relacionadas a conta e conteudo, entre em contato por: ${TERMS_CONTACT_EMAIL}.`
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

export default function TermsOfUsePage() {
  return (
    <div className="min-h-[100dvh] bg-[linear-gradient(180deg,rgba(247,249,253,0.98),rgba(240,244,252,0.96))]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14">
        <header className="rounded-[32px] border border-border bg-background/90 p-6 shadow-[0_25px_80px_rgba(25,34,58,0.08)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Voltar para o acesso
            </Link>
            <span className="hidden sm:inline">•</span>
            <span>Documento publico do aplicativo StoryForge</span>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Termos de Uso</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Esta pagina descreve as regras basicas de uso do StoryForge, com foco em autenticacao, criacao de conta, conteudo gerado por usuarios e uso de areas publicas do aplicativo.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full border border-primary/15 bg-primary/5 px-4 py-2 font-medium text-primary">
              Ultima atualizacao: {LAST_UPDATED}
            </span>
            <span className="rounded-full border border-border bg-muted/60 px-4 py-2 text-muted-foreground">Aplicativo: StoryForge</span>
          </div>
        </header>

        <div className="grid gap-4 rounded-[28px] border border-border bg-background/70 p-5 sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Escopo</p>
            <p className="mt-2 text-sm leading-6 text-foreground">Conta, uso do editor, obras publicas, perfil publico, posts, enquetes e medidas minimas de moderacao.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Regras centrais</p>
            <p className="mt-2 text-sm leading-6 text-foreground">Publicacao responsavel, respeito entre usuarios, propriedade intelectual e possibilidade de restricao em caso de violacao.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Documentos relacionados</p>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <Link to="/privacy" className="text-primary hover:underline">Politica de Privacidade</Link>
              <Link to="/community-guidelines" className="text-primary hover:underline">Diretrizes da Comunidade</Link>
            </div>
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
