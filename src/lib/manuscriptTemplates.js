import { DEFAULT_DOCUMENT_LAYOUT } from "@/lib/documentLayout";

export const MANUSCRIPT_TEMPLATES = [
  {
    id: "blank",
    name: "Em branco",
    description: "Comece do zero.",
    layout: DEFAULT_DOCUMENT_LAYOUT,
    content: ""
  },
  {
    id: "romance",
    name: "Romance",
    description: "Estrutura inicial para romance tradicional.",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, margin: "normal", pageSize: "A5" },
    content: "<h1>Titulo do romance</h1><h2>Capitulo 1</h2><p>Apresente o protagonista, o conflito e o tom da historia.</p><h2>Capitulo 2</h2><p>Desenvolva a tensao e aproxime os personagens centrais.</p>"
  },
  {
    id: "fantasy",
    name: "Fantasia",
    description: "Ideal para mundos, magia e lore.",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, margin: "relaxed", pageSize: "A4" },
    content: "<h1>Crônicas de um mundo novo</h1><h2>Premissa</h2><p>Descreva o reino, a ameaça e a lenda que move a historia.</p><h2>Personagens centrais</h2><p>Liste heroi, mentor, antagonista e aliados.</p><h2>Capitulo 1</h2><p>Abra com um evento que revele o tom epico do universo.</p>"
  },
  {
    id: "screenplay",
    name: "Roteiro",
    description: "Estrutura inicial para cenas e dialogos.",
    layout: { ...DEFAULT_DOCUMENT_LAYOUT, margin: "compact", pageSize: "Letter" },
    content: "<h1>TITULO DO ROTEIRO</h1><p><strong>CENA 1 - INTERIOR - DIA</strong></p><p>Descreva a acao principal da cena em poucas linhas.</p><p><strong>PERSONAGEM</strong></p><p>Primeira fala do roteiro.</p>"
  }
];

export function getTemplateById(templateId) {
  return MANUSCRIPT_TEMPLATES.find((template) => template.id === templateId) || MANUSCRIPT_TEMPLATES[0];
}
