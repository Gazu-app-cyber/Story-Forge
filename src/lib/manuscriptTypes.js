import {
  AlignLeft,
  BookOpen,
  Clock,
  Crown,
  FileText,
  Globe,
  Layers,
  Lightbulb,
  Map,
  MapPin,
  Microscope,
  Shield,
  Sparkles,
  StickyNote,
  User
} from "lucide-react";

const typeConfig = {
  "Capítulo": { icon: BookOpen, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  "Personagem": { icon: User, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  "Local": { icon: MapPin, color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  "Item": { icon: Shield, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  "Magia": { icon: Sparkles, color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  "Cultura": { icon: Globe, color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
  "Espécie": { icon: Microscope, color: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300" },
  "Religião": { icon: Crown, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  "Mapa": { icon: Map, color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  "Linha do Tempo": { icon: Clock, color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  "Ecossistema": { icon: Layers, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  "Artigo": { icon: AlignLeft, color: "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300" },
  "Documento": { icon: FileText, color: "bg-stone-100 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300" },
  "Anotação": { icon: StickyNote, color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  "Outro": { icon: Lightbulb, color: "bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300" }
};

export function getTypeIcon(type) {
  return typeConfig[type]?.icon || FileText;
}

export function getTypeColor(type) {
  return typeConfig[type]?.color || "bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300";
}

export const manuscriptTypes = Object.keys(typeConfig);
