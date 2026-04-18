import { Link } from "react-router-dom";

const LAST_UPDATED = "17 de abril de 2026";

const sections = [
  {
    title: "1. Proposito da comunidade",
    paragraphs: [
      "O StoryForge foi pensado como um espaco para criacao, leitura e descoberta de historias. As Diretrizes da Comunidade ajudam a manter esse ambiente seguro, util e acolhedor para autores e leitores.",
      "Elas se aplicam a perfis publicos, obras publicas, posts, enquetes, comentarios futuros e demais interacoes sociais do app."
    ]
  },
  {
    title: "2. Respeito entre usuarios",
    paragraphs: [
      "Trate outras pessoas com respeito. Nao use o StoryForge para perseguir, intimidar, constranger, humilhar ou atacar usuarios individualmente ou em grupo.",
      "Assedio, discurso de odio, ameacas, humilhacao direcionada e comportamento abusivo violam estas diretrizes."
    ]
  },
  {
    title: "3. Spam e manipulacao",
    paragraphs: [
      "Nao publique spam, correntes, conteudo enganoso, autopromocao excessiva, repeticao automatizada ou material criado apenas para poluir a experiencia da comunidade.",
      "Tambem nao e permitido manipular enquetes, criar contas para inflar interacoes ou usar o aplicativo para campanhas abusivas."
    ]
  },
  {
    title: "4. Conteudo sexual, nudez e violencia",
    paragraphs: [
      "O StoryForge nao deve ser usado para expor nudez publica, conteudo sexual explicito inadequado para o escopo do app ou violencia real explicita apresentada de forma abusiva.",
      "Se uma obra abordar temas sensiveis dentro de contexto narrativo, o autor deve agir com responsabilidade editorial e respeitar a classificacao indicativa disponivel quando aplicavel."
    ]
  },
  {
    title: "5. Conteudo ilegal e seguranca",
    paragraphs: [
      "Nao publique material ilegal, incentivo a crime, exploracao, fraude, invasao, distribuicao nao autorizada de dados pessoais ou qualquer conteudo que coloque outras pessoas em risco.",
      "Conteudo que viole a lei ou represente risco real pode ser removido e gerar restricao de conta."
    ]
  },
  {
    title: "6. Direitos autorais e autoria",
    paragraphs: [
      "Publique apenas conteudo que voce tenha direito de usar. Isso inclui textos, capas, imagens, trechos de obras, marcas e demais elementos inseridos no app.",
      "Plagio, copia nao autorizada e uso indevido de propriedade intelectual podem gerar denuncia, ocultacao do conteudo e medidas adicionais."
    ]
  },
  {
    title: "7. Uso responsavel de obras publicas",
    paragraphs: [
      "Obras publicas devem ser usadas para compartilhamento autoral genuino. Descricoes, capas, capitulos, posts de divulgacao e enquetes devem refletir o material publicado e nao induzir usuarios a erro.",
      "Tambem e esperado que autores respeitem leitores e nao usem o perfil publico para assedio, spam ou divulgacao abusiva."
    ]
  },
  {
    title: "8. Denuncias, bloqueios e consequencias",
    paragraphs: [
      "O app oferece recursos reais para denunciar conteudo publico e bloquear usuarios. Denuncias sao registradas com motivo, detalhes e status inicial para revisao futura.",
      "Violacoes podem resultar em ocultacao de conteudo, restricao de conta, remocao de publicacoes ou outras medidas compativeis com a arquitetura atual do produto."
    ]
  },
  {
    title: "9. Atualizacoes",
    paragraphs: [
      "Estas diretrizes podem evoluir com novas funcionalidades, ajustes de moderacao e requisitos de distribuicao, inclusive para Google Play.",
      "Sempre que houver alteracao relevante, esta pagina indicara a data de atualizacao."
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

export default function CommunityGuidelinesPage() {
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

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">Diretrizes da Comunidade</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
            Estas diretrizes explicam o que esperamos de autores e leitores que usam areas publicas do StoryForge, incluindo perfil publico, obras, posts e enquetes.
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Foco</p>
            <p className="mt-2 text-sm leading-6 text-foreground">Respeito entre usuarios, seguranca nas areas publicas e uso responsavel de conteudo gerado por usuarios.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ferramentas reais</p>
            <p className="mt-2 text-sm leading-6 text-foreground">Denuncia de conteudo publico, bloqueio de usuarios e base persistente de moderacao minima.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Documentos relacionados</p>
            <div className="mt-2 flex flex-col gap-2 text-sm">
              <Link to="/privacy" className="text-primary hover:underline">Politica de Privacidade</Link>
              <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
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
