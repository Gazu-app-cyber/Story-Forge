import { DEFAULT_DOCUMENT_LAYOUT } from "@/lib/documentLayout";

function repairText(value) {
  if (typeof value !== "string") return value;
  try {
    return decodeURIComponent(escape(value));
  } catch {
    return value;
  }
}

function repairTemplate(template) {
  return Object.fromEntries(
    Object.entries(template).map(([key, value]) => [
      key,
      Array.isArray(value) ? value.map((item) => repairText(item)) : repairText(value)
    ])
  );
}

function section(title, items = []) {
  if (!items.length) return "";
  return `<h2>${title}</h2><ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function block(title, body) {
  return body ? `<h2>${title}</h2><p>${body}</p>` : "";
}

function createTemplateContent(template) {
  return `
    <h1>${template.documentTitle}</h1>
    <p><em>${template.description}</em></p>
    ${block("Visão do template", template.overview)}
    ${section("Estrutura sugerida", template.structure)}
    ${section("Perguntas-guia", template.guideQuestions)}
    ${section("Conflitos que combinam com esse formato", template.conflicts)}
    ${section("Personagens para desenvolver", template.characters)}
    ${section("Ambientação e atmosfera", template.settingIdeas)}
    ${section("Ritmo e progressão", template.rhythmTips)}
    ${section("Começos possíveis", template.openingIdeas)}
    ${section("Erros comuns", template.commonMistakes)}
    ${section("Checklist de arranque", template.checklist)}
    <h2>Primeiras notas</h2>
    <p>Quem é o protagonista e o que ele deseja logo nas primeiras páginas?</p>
    <p>Qual é a promessa central desta história para o leitor?</p>
    <p>Que cena você pode escrever hoje para sentir o tom da obra?</p>
  `.trim();
}

function createTemplate(config) {
  return {
    ...config,
    content: createTemplateContent(config)
  };
}

const RAW_STORY_TEMPLATES = [
  {
    id: "blank",
    name: "Em branco",
    category: "Livre",
    format: "Qualquer formato",
    detailLevel: "Livre",
    description: "Comece do zero e molde o documento do seu jeito.",
    overview: "",
    structure: [],
    guideQuestions: [],
    conflicts: [],
    characters: [],
    settingIdeas: [],
    rhythmTips: [],
    openingIdeas: [],
    commonMistakes: [],
    checklist: [],
    documentTitle: "Novo manuscrito",
    layout: DEFAULT_DOCUMENT_LAYOUT,
    content: ""
  },
  createTemplate({
    id: "romance",
    name: "Romance",
    category: "Romântico",
    format: "Romance",
    detailLevel: "Muito guiado",
    description: "Perfeito para histórias centradas em vínculo emocional, desejo e transformação afetiva.",
    overview: "Use este template para trabalhar química, barreiras internas e crescimento emocional de forma equilibrada.",
    documentTitle: "Romance - plano inicial",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Encontro ou colisão inicial", "Motivo para os personagens permanecerem próximos", "Escalada romântica com tensão", "Quebra emocional ou separação", "Reconstrução da confiança", "Escolha final do casal"],
    guideQuestions: ["O que cada pessoa precisa aprender sobre amor?", "Qual medo impede a entrega total?", "O que torna esse casal inesquecível além da atração?"],
    conflicts: ["Amor proibido", "Diferença de objetivos de vida", "Trauma passado que afeta intimidade", "Conflito familiar ou social"],
    characters: ["Protagonista A com desejo claro", "Protagonista B com ferida emocional", "Amigo confidente", "Figura que pressiona ou separa o casal"],
    settingIdeas: ["Cidade pequena com memórias em comum", "Ambiente profissional intenso", "Viagem curta com convivência forçada"],
    rhythmTips: ["Alterne cenas íntimas e cenas de atrito", "Faça o flerte mudar a dinâmica da trama", "Guarde a maior vulnerabilidade para perto do clímax"],
    openingIdeas: ["Comece com um reencontro desconfortável", "Abra com um favor impossível de recusar", "Mostre o protagonista jurando evitar relacionamentos"],
    commonMistakes: ["Criar química só com diálogo espirituoso", "Resolver conflitos grandes rápido demais", "Transformar mal-entendidos em único motor da trama"],
    checklist: ["O casal tem objetivos próprios", "Existe tensão emocional e narrativa", "O final honra a evolução dos dois"]
  }),
  createTemplate({
    id: "dark-romance",
    name: "Dark romance",
    category: "Romântico",
    format: "Romance",
    detailLevel: "Muito guiado",
    description: "Para romances intensos, moralmente ambíguos e com atmosfera sombria.",
    overview: "Organize limites, gatilhos, intensidade emocional e uma dinâmica poderosa sem perder coerência.",
    documentTitle: "Dark romance - mapa da história",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Estabeleça o tom obscuro", "Apresente atração e perigo", "Aprofunde obsessão, segredo ou poder", "Colisão entre desejo e destruição", "Quebra de confiança máxima", "Fechamento intenso com consequência real"],
    guideQuestions: ["Qual é a linha ética desta história?", "Como a atração conversa com o perigo?", "Quais avisos ao leitor são importantes?"],
    conflicts: ["Obsessão", "Vingança cruzada", "Passado criminal", "Manipulação emocional"],
    characters: ["Interesse amoroso magnético e perigoso", "Protagonista dividido entre desejo e autopreservação", "Aliado que enxerga o risco antes de todos"],
    settingIdeas: ["Mansões isoladas", "Submundo urbano", "Famílias rivais com códigos próprios"],
    rhythmTips: ["Dose a intensidade para não saturar", "Use cenas de calmaria para aumentar o impacto do caos", "Faça o perigo mudar a relação"],
    openingIdeas: ["Abra com um acordo arriscado", "Mostre uma primeira impressão hipnótica e ameaçadora", "Comece após um erro grave que prende os personagens"],
    commonMistakes: ["Romantizar abuso sem consciência", "Confundir intensidade com falta de desenvolvimento", "Ignorar consentimento e consequências narrativas"],
    checklist: ["Os limites do projeto estão claros", "O tom sombrio tem função dramática", "A evolução emocional é consistente"]
  }),
  createTemplate({
    id: "fantasy",
    name: "Fantasia",
    category: "Fantasia",
    format: "Saga ou volume",
    detailLevel: "Muito guiado",
    description: "Ideal para mundos próprios, sistemas de magia e jornadas épicas ou intimistas.",
    overview: "Este template ajuda a equilibrar lore, personagens, regras do mundo e promessa de aventura.",
    documentTitle: "Fantasia - caderno de mundo e trama",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A4", margin: "relaxed" },
    structure: ["Premissa do mundo", "Regra central da magia ou poder", "Ameaça principal", "Grupo central e seus papéis", "Primeira travessia ou missão", "Clímax que muda o reino"],
    guideQuestions: ["O que torna esse mundo único além da estética?", "Quem paga o preço pela magia?", "Que desejo íntimo do protagonista conversa com o conflito épico?"],
    conflicts: ["Profecia mal interpretada", "Guerra entre casas ou reinos", "Artefato perigoso", "Monstro ligado ao passado do herói"],
    characters: ["Protagonista deslocado", "Mentor com segredo", "Aliado leal", "Rival com ponto de vista forte", "Antagonista com ideologia definida"],
    settingIdeas: ["Cidade suspensa", "Floresta ritualística", "Deserto com ruínas conscientes", "Capital em decadência"],
    rhythmTips: ["Entregue o lore em ação", "Faça cada capítulo revelar uma regra ou consequência", "Misture intimidade com escala"],
    openingIdeas: ["Comece com um ritual interrompido", "Abra com uma criatura impossível surgindo", "Mostre o protagonista quebrando uma regra do mundo"],
    commonMistakes: ["Excesso de exposição antes da trama começar", "Magia sem custo dramático", "Nomes demais sem contexto emocional"],
    checklist: ["O mundo tem regra central clara", "O conflito épico reflete um conflito pessoal", "Os leitores conseguem imaginar a ambientação rapidamente"]
  }),
  createTemplate({
    id: "urban-fantasy",
    name: "Fantasia urbana",
    category: "Fantasia",
    format: "Série ou volume",
    detailLevel: "Muito guiado",
    description: "Mistura cotidiano contemporâneo com magia, criaturas e segredos urbanos.",
    overview: "Bom para criar contraste entre vida comum e camadas ocultas da cidade.",
    documentTitle: "Fantasia urbana - mapa do oculto",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Cidade e regra escondida", "Incidente que revela o sobrenatural", "Entrada no submundo mágico", "Aliança improvável", "Ameaça que transborda para o cotidiano", "Novo equilíbrio"],
    guideQuestions: ["O que na cidade ganha novo significado com a fantasia?", "Quem esconde a verdade e por quê?", "Que parte da rotina do protagonista entra em choque com o sobrenatural?"],
    conflicts: ["Pacto quebrado", "Criaturas infiltradas", "Ordem secreta controlando a cidade", "Família que pertence ao oculto"],
    characters: ["Pessoa comum arrastada para o impossível", "Guia sarcástico", "Entidade ambígua", "Caçador ou investigador"],
    settingIdeas: ["Metrô assombrado", "Bares entre mundos", "Prédios históricos com memória", "Becos mágicos que só aparecem à noite"],
    rhythmTips: ["Use o contraste entre normal e extraordinário", "Dê pistas antes da revelação completa", "Faça a cidade agir como personagem"],
    openingIdeas: ["Comece com um evento estranho em horário comum", "Abra com uma criatura vista só por um personagem", "Mostre um lugar banal funcionando de modo impossível"],
    commonMistakes: ["Perder o pé no cotidiano", "Criar regras mágicas demais sem necessidade", "Esconder demais o conflito principal"],
    checklist: ["A cidade tem papel narrativo", "O sobrenatural interfere na vida prática", "Existe gancho para próximos segredos"]
  }),
  createTemplate({
    id: "science-fiction",
    name: "Ficção científica",
    category: "Especulativo",
    format: "Romance",
    detailLevel: "Muito guiado",
    description: "Para explorar tecnologia, futuros possíveis, ciência e dilemas humanos.",
    overview: "Construa uma premissa especulativa forte e deixe a consequência humana guiar a leitura.",
    documentTitle: "Ficção científica - hipótese central",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A4", margin: "relaxed" },
    structure: ["Hipótese científica central", "Mudança social causada por ela", "Protagonista diante da ruptura", "Complicação tecnológica", "Crise ética", "Resolução e novo paradigma"],
    guideQuestions: ["Qual pergunta sobre o futuro a história quer fazer?", "O que a tecnologia muda no corpo, no afeto ou no poder?", "Qual é o custo humano da inovação?"],
    conflicts: ["Inteligência artificial com agenda própria", "Viagem espacial com falha irreversível", "Colonização injusta", "Memória alterada por tecnologia"],
    characters: ["Cientista em dúvida", "Pessoa impactada pela tecnologia", "Executivo, militar ou autoridade", "Aliado pragmático"],
    settingIdeas: ["Megacidade vertical", "Nave claustrofóbica", "Colônia remota", "Futuro próximo reconhecível"],
    rhythmTips: ["Mostre o conceito por cenas concretas", "Faça a explicação nascer da necessidade", "Evite sacrificar emoção por conceito"],
    openingIdeas: ["Abra com um teste dando errado", "Mostre uma rotina futurista rompida", "Comece com notícia que muda o mundo"],
    commonMistakes: ["Jargão demais", "Exposição científica excessiva", "Premissa boa sem personagem forte"],
    checklist: ["A hipótese central é clara", "A consequência humana move a trama", "Há maravilhamento e tensão em equilíbrio"]
  }),
  createTemplate({
    id: "dystopia",
    name: "Distopia",
    category: "Especulativo",
    format: "YA ou adulto",
    detailLevel: "Muito guiado",
    description: "Para sociedades opressoras, controle institucional e resistência.",
    overview: "Use este template para estruturar a lógica do sistema opressor e o despertar do protagonista.",
    documentTitle: "Distopia - sociedade e ruptura",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Regra do sistema", "Rotina opressora", "Primeira rachadura", "Contato com resistência ou verdade oculta", "Retaliação do sistema", "Ato de ruptura"],
    guideQuestions: ["Como essa sociedade justifica a opressão?", "O que o protagonista teme perder?", "Que verdade muda tudo?"],
    conflicts: ["Vigilância total", "Classe social rígida", "Manipulação de informação", "Programa de seleção ou purge"],
    characters: ["Protagonista conformado que desperta", "Mentor rebelde", "Agente do sistema", "Pessoa amada em risco"],
    settingIdeas: ["Cidade dividida por castas", "Instituição escolar controladora", "Colônia fechada", "Estado corporativo"],
    rhythmTips: ["Mostre pequenas violências cotidianas", "Escalone o custo da resistência", "Dê esperança e medo na mesma medida"],
    openingIdeas: ["Comece no dia de uma cerimônia obrigatória", "Abra com uma infração mínima punida demais", "Mostre o protagonista repetindo uma regra absurda"],
    commonMistakes: ["Sistema opressor sem lógica interna", "Exposição política sem história", "Rebelião rápida demais"],
    checklist: ["As regras do mundo são compreensíveis", "O protagonista tem algo íntimo em jogo", "A resistência cobra preço real"]
  }),
  createTemplate({
    id: "terror",
    name: "Terror",
    category: "Suspense e horror",
    format: "Romance ou novela",
    detailLevel: "Muito guiado",
    description: "Para medo crescente, ameaça constante e atmosfera opressiva.",
    overview: "Ajuda a construir tensão, pistas e escalada sensorial sem revelar tudo cedo demais.",
    documentTitle: "Terror - escalada do medo",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "compact" },
    structure: ["Normalidade incômoda", "Primeiro sinal de ameaça", "Negação ou dúvida", "Provas do horror", "Confronto inevitável", "Consequência final"],
    guideQuestions: ["O que é pior: o que aparece ou o que permanece oculto?", "Qual medo íntimo a ameaça ativa?", "O lugar reforça a sensação de perigo?"],
    conflicts: ["Casa com presença", "Culto silencioso", "Criatura territorial", "Família escondendo algo monstruoso"],
    characters: ["Protagonista vulnerável", "Cético", "Pessoa que sabe mais do que conta", "Figura que desaparece ou enlouquece"],
    settingIdeas: ["Casa de campo", "Hospital desativado", "Cidade pequena abafada por segredos", "Prédio antigo"],
    rhythmTips: ["Tensão antes do susto", "Silêncio e repetição ajudam", "Cada revelação deve piorar a leitura do passado"],
    openingIdeas: ["Abra com um detalhe errado no cotidiano", "Mostre um luto que abre espaço para o sobrenatural", "Comece com o protagonista ouvindo algo impossível"],
    commonMistakes: ["Explicar demais cedo demais", "Repetir sustos sem escalada", "Não usar o ambiente a favor do medo"],
    checklist: ["A atmosfera é constante", "Existe progressão clara do medo", "O horror toca o emocional do protagonista"]
  }),
  createTemplate({
    id: "psychological-horror",
    name: "Horror psicológico",
    category: "Suspense e horror",
    format: "Novela ou romance",
    detailLevel: "Muito guiado",
    description: "Focado em paranoia, percepção falha, trauma e dúvida sobre a realidade.",
    overview: "Aqui o centro é a mente, não apenas a ameaça externa.",
    documentTitle: "Horror psicológico - mente em colapso",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "compact" },
    structure: ["Sinal de ruptura mental", "Rotina que se distorce", "Dúvida entre real e imaginado", "Ameaça íntima se torna concreta", "Quebra de percepção", "Final perturbador"],
    guideQuestions: ["O leitor pode confiar no narrador?", "Que trauma ou obsessão alimenta o horror?", "Qual elemento retorna de forma simbólica?"],
    conflicts: ["Memórias contraditórias", "Dupla identidade", "Luto não resolvido", "Isolamento e vigilância"],
    characters: ["Narrador pouco confiável", "Pessoa próxima que aumenta a dúvida", "Figura que talvez nem exista"],
    settingIdeas: ["Apartamento claustrofóbico", "Instituição médica", "Casa da infância", "Cidade chuvosa e repetitiva"],
    rhythmTips: ["Repetição controlada reforça paranoia", "Imagens recorrentes criam assinatura", "O silêncio psicológico é tão importante quanto ação"],
    openingIdeas: ["Comece com uma lembrança aparentemente banal quebrada", "Abra com uma certeza que logo se mostra falsa", "Use um detalhe sensorial desconfortável como porta"],
    commonMistakes: ["Confusão sem intenção", "Mistério total sem âncora emocional", "Virada final que invalida todo o percurso"],
    checklist: ["Há lógica emocional na desorientação", "O protagonista tem ferida central clara", "O final ecoa símbolos anteriores"]
  }),
  createTemplate({
    id: "mystery",
    name: "Mistério",
    category: "Investigação",
    format: "Romance ou novela",
    detailLevel: "Muito guiado",
    description: "Para enigmas, pistas, suspeitos e revelações graduais.",
    overview: "Use este template para dosar informação e sustentar curiosidade real até a solução.",
    documentTitle: "Mistério - quadro de pistas",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Crime, desaparecimento ou segredo", "Lista inicial de suspeitos", "Primeira pista real", "Pista falsa ou redirecionamento", "Revelação parcial", "Solução final"],
    guideQuestions: ["Quem ganha com o segredo?", "Que informação o leitor precisa e em que momento?", "Qual pista muda tudo quando reinterpretada?"],
    conflicts: ["Mentiras familiares", "Assassinato em grupo fechado", "Objeto sumido", "Passado escondido voltando à tona"],
    characters: ["Investigador experiente ou improvisado", "Suspeito carismático", "Testemunha inconfiável", "Pessoa que protege a verdade"],
    settingIdeas: ["Casarão", "Condomínio de luxo", "Cidade pequena", "Escola ou campus"],
    rhythmTips: ["Cada capítulo deve mover a investigação", "Pistas e emoções precisam caminhar juntas", "Guarde uma revelação que recontextualiza cenas anteriores"],
    openingIdeas: ["Abra com o evento misterioso", "Comece com o investigador recebendo um pedido", "Mostre uma cena aparentemente comum que depois vira prova"],
    commonMistakes: ["Solução sem pistas suficientes", "Suspeitos sem motivação", "Pistas falsas demais e progresso real de menos"],
    checklist: ["Existe trilha lógica até a solução", "As pistas falsas têm função", "A revelação final recompensa a leitura"]
  }),
  createTemplate({
    id: "thriller",
    name: "Thriller",
    category: "Suspense",
    format: "Romance",
    detailLevel: "Muito guiado",
    description: "Para narrativas de alta tensão, urgência e ameaça constante.",
    overview: "Bom para tramas com perseguição, segredos perigosos e decisões rápidas.",
    documentTitle: "Thriller - pressão máxima",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "compact" },
    structure: ["Incidente de alto risco", "Protagonista puxado para o jogo", "Escalada de perseguição e descoberta", "Traição ou virada", "Confronto em tempo limitado", "Desfecho com custo"],
    guideQuestions: ["Qual é o relógio da trama?", "O que acontece se o protagonista falhar?", "Que segredo precisa ser revelado antes que seja tarde?"],
    conflicts: ["Conspiração política", "Sequestro", "Documento comprometedor", "Serial killer", "Infiltração"],
    characters: ["Pessoa comum em perigo", "Aliado duvidoso", "Antagonista implacável", "Autoridade que atrapalha"],
    settingIdeas: ["Grandes centros urbanos", "Estradas noturnas", "Prédios corporativos", "Fronteiras ou aeroportos"],
    rhythmTips: ["Capítulos curtos ajudam", "Cada cena precisa aumentar risco ou informação", "Intercale ação com descobertas certeiras"],
    openingIdeas: ["Abra com fuga ou morte", "Mostre o protagonista testemunhando algo indevido", "Comece com ligação urgente e inexplicável"],
    commonMistakes: ["Ação sem contexto emocional", "Pausa longa demais no meio", "Viradas acumuladas sem preparação"],
    checklist: ["A urgência é real", "As decisões têm consequência", "A tensão sobe com clareza"]
  }),
  createTemplate({
    id: "adventure",
    name: "Aventura",
    category: "Aventura",
    format: "Série ou volume",
    detailLevel: "Muito guiado",
    description: "Perfeito para jornadas, exploração e movimento constante.",
    overview: "Organize meta, obstáculos, aliados e sensação de progresso geográfico ou emocional.",
    documentTitle: "Aventura - rota da jornada",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Chamado para a aventura", "Partida e preparo", "Primeiros obstáculos", "Descoberta maior que a missão inicial", "Sacrifício ou perda", "Chegada transformadora"],
    guideQuestions: ["Qual é a promessa de diversão e descoberta?", "O objetivo é claro para o leitor?", "Cada lugar visitado muda a história?"],
    conflicts: ["Mapa incompleto", "Tesouro disputado", "Expedição perigosa", "Missão de resgate"],
    characters: ["Líder impulsivo", "Aliado estratégico", "Companheiro cômico ou emocional", "Rival explorador"],
    settingIdeas: ["Ruínas", "Ilhas", "Serras", "Cidades perdidas", "Trens, navios ou caravana"],
    rhythmTips: ["Faça cada etapa ter identidade própria", "Recompense a travessia com descoberta", "Equilibre ação e vínculo entre personagens"],
    openingIdeas: ["Abra com um convite irrecusável", "Comece quando algo precioso some", "Mostre o protagonista falhando em uma missão menor"],
    commonMistakes: ["Objetivo mal definido", "Cenários sem impacto narrativo", "Muitos obstáculos iguais"],
    checklist: ["Existe destino claro", "A jornada muda o protagonista", "Cada etapa entrega novidade"]
  }),
  createTemplate({
    id: "drama",
    name: "Drama",
    category: "Contemporâneo",
    format: "Romance ou novela",
    detailLevel: "Muito guiado",
    description: "Para histórias centradas em relações, perdas, escolhas e tensão emocional.",
    overview: "Use quando a força do enredo está na intimidade humana e nas consequências emocionais.",
    documentTitle: "Drama - relações em tensão",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Estado emocional inicial", "Incidente que desestabiliza", "Escalada relacional", "Quebra ou revelação", "Confronto sincero", "Novo equilíbrio"],
    guideQuestions: ["Qual ferida está no centro da trama?", "Que relação sustenta a história?", "O que precisa ser dito e está sendo evitado?"],
    conflicts: ["Luto", "Separação", "Conflito familiar", "Escolha de vida", "Culpa antiga"],
    characters: ["Protagonista emocionalmente travado", "Pessoa que exige mudança", "Figura do passado", "Apoio silencioso"],
    settingIdeas: ["Casa de família", "Cidade natal", "Ambiente de trabalho", "Hospital ou escola"],
    rhythmTips: ["Dê peso às pausas e aos silêncios", "Faça o diálogo carregar subtexto", "Use cenas simples com forte emoção"],
    openingIdeas: ["Comece com notícia que reorganiza a vida", "Abra com retorno à cidade natal", "Mostre o protagonista evitando um assunto importante"],
    commonMistakes: ["Drama só em discurso", "Conflitos sem progressão", "Melodrama sem sustentação"],
    checklist: ["O conflito emocional é claro", "Os personagens mudam por causa das relações", "O final respeita a densidade da história"]
  }),
  createTemplate({
    id: "slice-of-life",
    name: "Slice of life",
    category: "Contemporâneo",
    format: "Novela ou serial",
    detailLevel: "Guiado",
    description: "Para histórias delicadas, cotidianas e voltadas à observação da vida.",
    overview: "Excelente para foco em rotina, vínculos e transformação gradual.",
    documentTitle: "Slice of life - mapa do cotidiano",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Apresentação da rotina", "Detalhe que rompe o equilíbrio", "Pequenas mudanças", "Momento íntimo de percepção", "Nova forma de habitar a vida"],
    guideQuestions: ["O que há de especial no cotidiano desse personagem?", "Quais microconflitos sustentam o interesse?", "Que sensação o leitor deve carregar ao final?"],
    conflicts: ["Mudança de fase", "Nova amizade", "Convívio familiar", "Recomeço após perda", "Pequenos sonhos"],
    characters: ["Protagonista observador", "Vizinho ou amigo catalisador", "Família ou colegas com contrastes suaves"],
    settingIdeas: ["Bairro", "Cafeteria", "Escola", "Apartamento compartilhado", "Interior do Brasil"],
    rhythmTips: ["Valorize detalhes concretos", "Deixe a transformação ser sutil mas perceptível", "Use capítulos como pequenos retratos"],
    openingIdeas: ["Comece com uma rotina detalhada", "Abra com uma mudança pequena porém significativa", "Use um encontro casual para disparar tudo"],
    commonMistakes: ["Ausência total de tensão", "Excesso de contemplação sem direção", "Personagens pouco distintos"],
    checklist: ["A atmosfera está clara", "Há progressão emocional", "Os detalhes cotidianos criam identidade"]
  }),
  createTemplate({
    id: "comedy",
    name: "Comédia",
    category: "Contemporâneo",
    format: "Romance, novela ou série",
    detailLevel: "Guiado",
    description: "Para histórias leves, personagens fortes e ritmo ágil.",
    overview: "Ajuda a planejar humor de situação, contraste de personalidades e timing narrativo.",
    documentTitle: "Comédia - motor de humor",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Premissa engraçada", "Primeira complicação", "Escalada de caos", "Ponto de humilhação ou absurdo", "Resolução criativa", "Fecho caloroso"],
    guideQuestions: ["De onde vem o humor principal?", "Quem contrasta com quem?", "Qual verdade emocional sustenta a leveza?"],
    conflicts: ["Farsa", "Plano absurdo", "Convivência forçada", "Erro de identidade", "Objetivo improvável"],
    characters: ["Protagonista obstinado", "Pessoa que bagunça tudo", "Figura cética", "Aliado que piora a situação"],
    settingIdeas: ["Casamentos", "Empresas", "Repúblicas", "Viagens", "Escolas"],
    rhythmTips: ["Humor precisa de objetivo claro", "Escalone o absurdo sem perder lógica", "Intercale piada e vulnerabilidade"],
    openingIdeas: ["Comece no pior momento possível", "Abra com uma mentira prestes a ser descoberta", "Mostre um protagonista excessivamente confiante falhando"],
    commonMistakes: ["Piadas desconectadas da trama", "Personagens só caricatos", "Falta de coração emocional"],
    checklist: ["A comédia nasce do conflito", "Existe ritmo", "Os personagens continuam humanos"]
  }),
  createTemplate({
    id: "historical",
    name: "Histórico",
    category: "Histórico",
    format: "Romance ou saga",
    detailLevel: "Muito guiado",
    description: "Para narrativas ambientadas em contextos históricos com pesquisa e atmosfera.",
    overview: "Use o template para equilibrar contexto histórico, verossimilhança e trama pessoal.",
    documentTitle: "Histórico - contexto e personagens",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A4", margin: "relaxed" },
    structure: ["Período e recorte social", "Evento histórico que molda a trama", "Conflito íntimo do protagonista", "Forças sociais em choque", "Virada histórica e pessoal", "Consequência final"],
    guideQuestions: ["Que recorte do período você quer mostrar?", "Como a história grande afeta a vida pequena?", "O que exige pesquisa mais cuidadosa?"],
    conflicts: ["Diferenças de classe", "Guerra", "Mudança política", "Tradição versus desejo pessoal"],
    characters: ["Protagonista atravessado pelo tempo histórico", "Aliado que enxerga o contexto", "Figura representando o sistema", "Pessoa amada em risco"],
    settingIdeas: ["Rio de Janeiro imperial", "Interior colonial", "São Paulo industrial", "Europa em guerra"],
    rhythmTips: ["Use detalhes históricos com função", "Pesquise costumes de fala e rotina", "Evite enciclopédia em forma de capítulo"],
    openingIdeas: ["Comece com um evento público marcante", "Abra em uma rotina que será abalada pela História", "Mostre o protagonista indo contra uma convenção do período"],
    commonMistakes: ["Exposição histórica pesada", "Anacronismo emocional mal resolvido", "Pouca textura material"],
    checklist: ["O período está vivo na página", "A trama funciona além da pesquisa", "Há coerência entre contexto e comportamento"]
  }),
  createTemplate({
    id: "young-adult",
    name: "Young adult",
    category: "Juvenil e crossover",
    format: "YA",
    detailLevel: "Muito guiado",
    description: "Para histórias de identidade, primeiras escolhas grandes e intensidade emocional jovem.",
    overview: "Organize voz, urgência emocional, descoberta de si e pertencimento.",
    documentTitle: "Young adult - voz e transformação",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Problema imediato do protagonista", "Vida social ou familiar em movimento", "Descoberta ou convite", "Conflito entre identidade e expectativa", "Decisão amadurecida", "Novo senso de si"],
    guideQuestions: ["O que o protagonista acredita sobre si no início?", "Que relação é mais determinante?", "Que escolha simboliza crescimento?"],
    conflicts: ["Pressão escolar", "Primeiro amor", "Segredo familiar", "Grupo de amigos em ruptura", "Descoberta de poder ou vocação"],
    characters: ["Protagonista em formação", "Melhor amigo", "Interesse romântico", "Adulto que pressiona", "Rival ou espelho"],
    settingIdeas: ["Escola", "Bairro", "Festival", "Internato", "Cidade pequena"],
    rhythmTips: ["Mantenha voz próxima", "Conflitos precisam parecer gigantes para quem vive", "O emocional guia a leitura"],
    openingIdeas: ["Comece em um dia decisivo", "Abra com vergonha pública ou desejo secreto", "Mostre um sonho claro sendo ameaçado"],
    commonMistakes: ["Tratar jovens como miniadultos genéricos", "Drama sem identidade de voz", "Subtramas demais sem foco"],
    checklist: ["A voz está viva", "Existe transformação clara", "As relações têm peso real"]
  }),
  createTemplate({
    id: "school-story",
    name: "Escolar",
    category: "Juvenil e cotidiano",
    format: "Serial ou novela",
    detailLevel: "Guiado",
    description: "Para histórias ambientadas em escola, turma, clube ou rotina estudantil.",
    overview: "Ajuda a montar dinâmica de grupo, calendário escolar e arcos de convivência.",
    documentTitle: "Escolar - turma e conflitos",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Ambiente escolar", "Problema da turma ou do protagonista", "Nova dinâmica social", "Evento escolar decisivo", "Conflito entre grupo e objetivo", "Fechamento do ciclo"],
    guideQuestions: ["Qual espaço escolar é mais simbólico?", "Quem o protagonista quer impressionar ou evitar?", "Que evento organiza a história?"],
    conflicts: ["Clube em risco", "Competição", "Boato", "Mudança de turma", "Professor ou coordenação pressionando"],
    characters: ["Protagonista", "Grupo de amigos", "Rival", "Interesse romântico", "Figura de autoridade"],
    settingIdeas: ["Sala de aula", "Quadra", "Corredores", "Biblioteca", "Festival escolar"],
    rhythmTips: ["Use cenas de grupo", "Faça o ambiente ter rotina reconhecível", "Misture leveza com drama genuíno"],
    openingIdeas: ["Comece no primeiro dia de aula", "Abra com uma apresentação desastrosa", "Mostre o anúncio de um evento que muda tudo"],
    commonMistakes: ["Personagens sem função na turma", "Conflitos muito genéricos", "Escola sem identidade própria"],
    checklist: ["A turma tem química", "O ambiente escolar é vivo", "Existe progressão social e emocional"]
  }),
  createTemplate({
    id: "short-story",
    name: "Conto",
    category: "Formato curto",
    format: "Conto",
    detailLevel: "Guiado",
    description: "Para histórias curtas, focadas e de impacto rápido.",
    overview: "O objetivo é condensar tema, atmosfera e virada sem dispersão.",
    documentTitle: "Conto - foco absoluto",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "compact" },
    structure: ["Situação inicial precisa", "Deslocamento", "Virada ou revelação", "Fecho marcante"],
    guideQuestions: ["Qual é o coração da ideia?", "O que precisa ficar fora para o conto respirar?", "Qual imagem final você quer deixar?"],
    conflicts: ["Escolha única", "Segredo pequeno porém devastador", "Encontro decisivo", "Memória reaparecendo"],
    characters: ["Poucos personagens, funções claras"],
    settingIdeas: ["Um único espaço forte", "Um momento delimitado no tempo"],
    rhythmTips: ["Entre tarde, saia cedo", "Cada frase precisa empurrar a sensação", "Prefira foco a abrangência"],
    openingIdeas: ["Comece já dentro do problema", "Abra com uma imagem poderosa", "Use uma frase que traga estranhamento imediato"],
    commonMistakes: ["Querer contar um romance em miniatura", "Contexto demais", "Final sem efeito"],
    checklist: ["A ideia cabe no formato curto", "Existe unidade de efeito", "A última imagem ou frase sustenta o conto"]
  }),
  createTemplate({
    id: "novella",
    name: "Novela",
    category: "Formato médio",
    format: "Novela",
    detailLevel: "Guiado",
    description: "Para histórias mais densas que um conto e mais enxutas que um romance.",
    overview: "Ótimo para um conflito central forte com menos subtramas.",
    documentTitle: "Novela - conflito concentrado",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Conflito central imediato", "Aprofundamento rápido", "Ponto de não retorno", "Clímax concentrado", "Fecho com eco"],
    guideQuestions: ["Qual conflito sustenta a história sozinho?", "Qual subtrama realmente vale ficar?", "Que ritmo combina com esse tamanho?"],
    conflicts: ["Missão única", "Relação central", "Segredo que corrói uma família", "Um período curto de crise"],
    characters: ["Elenco enxuto e funcional"],
    settingIdeas: ["Recorte temporal pequeno", "Ambiente com personalidade forte"],
    rhythmTips: ["Corte o que não empurra a tensão", "Mantenha unidade temática", "Evite dispersão de foco"],
    openingIdeas: ["Comece perto do ponto de virada", "Abra com a pergunta central já insinuada"],
    commonMistakes: ["Excesso de personagens", "Muitas subtramas", "Final abrupto por falta de preparação"],
    checklist: ["Conflito central forte", "Estrutura compacta", "Final com impacto proporcional"]
  }),
  createTemplate({
    id: "fanfic",
    name: "Fanfic",
    category: "Fandom",
    format: "Serial ou one-shot",
    detailLevel: "Muito guiado",
    description: "Para trabalhar universos já existentes com voz própria, shipping ou expansão de canon.",
    overview: "Ajuda a equilibrar respeito ao material-base com novidade autoral.",
    documentTitle: "Fanfic - premissa e recorte",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Defina o recorte do fandom", "Ponto de divergência ou complemento", "Conflito central", "Momento de recompensa para o leitor do fandom", "Fecho emocional"],
    guideQuestions: ["O que sua história entrega que o fandom ama?", "É canon-divergent, AU ou missing scene?", "Que dinâmica de personagem você quer explorar?"],
    conflicts: ["E se tal evento tivesse outro resultado?", "AU escolar ou moderna", "Relacionamento não explorado", "Perspectiva de personagem secundário"],
    characters: ["Personagens do canon", "OCs se realmente ajudarem a história"],
    settingIdeas: ["Mundo original adaptado", "AU moderna", "Evento pós-canon", "Cena que faltou"],
    rhythmTips: ["Pressupõe familiaridade, mas não confusão", "Entregue rapidamente o recorte", "Use referências com função"],
    openingIdeas: ["Comece no ponto de divergência", "Abra com cena reconhecível sob nova perspectiva", "Use um trope querido do fandom"],
    commonMistakes: ["Explicar demais o canon", "Depender só de referência", "Perder a voz autoral"],
    checklist: ["O recorte está claro", "Há algo novo para o leitor", "O fandom é ponto de partida, não muleta"]
  }),
  createTemplate({
    id: "isekai",
    name: "Isekai",
    category: "Fantasia e aventura",
    format: "Serial",
    detailLevel: "Muito guiado",
    description: "Para histórias de transporte, reencarnação ou deslocamento para outro mundo.",
    overview: "Estruture regras do novo mundo, choque inicial, progressão e fantasia de descoberta.",
    documentTitle: "Isekai - novo mundo, nova regra",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, pageSize: "A5", margin: "normal" },
    structure: ["Vida anterior ou ponto de ruptura", "Chegada ao novo mundo", "Primeira regra aprendida", "Habilidade, papel ou missão", "Escalada do novo conflito", "Escolha entre voltar, ficar ou transformar"],
    guideQuestions: ["O que o protagonista traz de único do mundo anterior?", "O novo mundo é desejo, punição ou segunda chance?", "Qual regra dá identidade ao setting?"],
    conflicts: ["Sistema de habilidades", "Reencarnação com memória", "Missão imposta", "Reino em crise", "Sobrevivência inicial"],
    characters: ["Protagonista deslocado", "Guia local", "Aliado improvável", "Antagonista do novo mundo"],
    settingIdeas: ["Reino fantástico", "Dungeon", "Cidade de guildas", "Academia mágica"],
    rhythmTips: ["Explique o mundo em ação", "O choque inicial precisa ter peso", "Faça a progressão alterar relações"],
    openingIdeas: ["Comece no instante da chegada", "Abra com o protagonista perdendo tudo", "Mostre a primeira vantagem ou desvantagem no novo mundo"],
    commonMistakes: ["Excesso de sistema sem drama", "Wish-fulfillment sem conflito", "Mundo pouco diferenciado"],
    checklist: ["O novo mundo tem regra memorável", "O protagonista muda com a jornada", "A fantasia de descoberta está viva"]
  }),
  createTemplate({
    id: "screenplay",
    name: "Roteiro",
    category: "Formato",
    format: "Audiovisual",
    detailLevel: "Guiado",
    description: "Estrutura de partida para cenas, diálogos e progressão visual.",
    overview: "Ideal para pensar por cena, objetivo dramático e ritmo audiovisual.",
    documentTitle: "ROTEIRO - estrutura inicial",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, margin: "compact", pageSize: "Letter" },
    structure: ["Logline", "Ato 1", "Ato 2", "Ato 3", "Cena de abertura", "Cenas-chave"],
    guideQuestions: ["Qual é a imagem de abertura?", "Quem quer o quê em cada cena?", "O conflito muda visualmente?"],
    conflicts: ["Conflito de objetivos por cena", "Segredo revelado em ação", "Pressão de tempo", "Confronto verbal com subtexto"],
    characters: ["Protagonista", "Antagonista", "Aliados de função clara"],
    settingIdeas: ["Locações econômicas ou visualmente fortes", "Espaços que ajudam a ação e o subtexto"],
    rhythmTips: ["Cada cena precisa ter entrada tardia", "A ação visual carrega a exposição", "Diálogo é menos eficaz sem tensão"],
    openingIdeas: ["Abra com imagem que resuma o tom", "Comece com conflito antes de explicar contexto"],
    commonMistakes: ["Diálogo explicativo", "Cenas sem objetivo", "Ação sem progressão dramática"],
    checklist: ["A logline está clara", "As cenas movem personagem e trama", "O texto é visual e direto"]
  })
];

export const STORY_TEMPLATES = RAW_STORY_TEMPLATES.map((template) => repairTemplate(template));

export const STORY_TEMPLATE_OPTIONS = STORY_TEMPLATES.map((template) => ({
  value: template.id,
  label: template.name
}));

export function getStoryTemplateById(templateId) {
  return STORY_TEMPLATES.find((template) => template.id === templateId) || STORY_TEMPLATES[0];
}
