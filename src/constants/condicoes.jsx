import {
  FaSkull,
  FaExclamationTriangle,
  FaSpider,
  FaBolt,
  FaWeightHanging,
  FaHeartBroken,
  FaEyeSlash,
} from "react-icons/fa";

export const CONDICOES_DISPONIVEIS = [
  { id: "envenenado", label: "Envenenado", icon: <FaSpider /> },
  { id: "atordoado", label: "Atordoado", icon: <FaBolt /> },
  { id: "vulneravel", label: "Vulnerável", icon: <FaHeartBroken /> },
  { id: "lento", label: "Lento", icon: <FaWeightHanging /> },
  { id: "fraco", label: "Fraco", icon: <FaSkull /> },
  { id: "dominado", label: "Dominado", icon: <FaEyeSlash /> },
];

export const getCondicaoIcon = (id) => {
  const cond = CONDICOES_DISPONIVEIS.find((c) => c.id === id);
  return cond ? cond.icon : <FaExclamationTriangle />;
};
