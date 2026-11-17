import {
  FaSkull,
  FaExclamationTriangle,
  FaSpider,
  FaBolt,
  FaWeightHanging,
  FaFire,
  FaDizzy,
} from "react-icons/fa";

/**
 * 6 Condições (Status Effects) Oficiais de Fabula Ultima (Livro Básico).
 */
export const CONDICOES_DISPONIVEIS = [
  { id: "abalado", label: "Abalado (VON-1)", icon: <FaDizzy /> },
  { id: "atordoado", label: "Atordoado (AST-1)", icon: <FaBolt /> },
  { id: "enfurecido", label: "Enfurecido (DES/AST-1)", icon: <FaFire /> },
  { id: "envenenado", label: "Envenenado (VIG/VON-1)", icon: <FaSpider /> },
  { id: "fraco", label: "Fraco (VIG-1)", icon: <FaSkull /> },
  { id: "lento", label: "Lento (DES-1)", icon: <FaWeightHanging /> },
];

export const getCondicaoIcon = (id) => {
  const cond = CONDICOES_DISPONIVEIS.find((c) => c.id === id);
  return cond ? cond.icon : <FaExclamationTriangle />;
};
