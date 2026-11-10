import {
  FaShip,
  FaUserSecret,
  FaCompass,
  FaScroll,
  FaExclamationTriangle,
  FaWind,
} from "react-icons/fa";

export function getTipoRotaInfo(tipo) {
  switch (tipo) {
    case "comercial":
      return {
        label: "Comercial (Oficial)",
        icon: FaShip,
        classe: "tipo-comercial",
        cor: "#3498db",
      };
    case "contrabando":
      return {
        label: "Contrabando (Clandestina)",
        icon: FaUserSecret,
        classe: "tipo-contrabando",
        cor: "#9b59b6",
      };
    case "secreta":
      return {
        label: "Secreta (Atalho Oculto)",
        icon: FaCompass,
        classe: "tipo-secreta",
        cor: "#f1c40f",
      };
    case "tradicional":
      return {
        label: "Tradicional (Peregrina)",
        icon: FaScroll,
        classe: "tipo-tradicional",
        cor: "#2ecc71",
      };
    case "corrompida":
      return {
        label: "Corrompida (Névoa Sombria)",
        icon: FaExclamationTriangle,
        classe: "tipo-corrompida",
        cor: "#e74c3c",
      };
    default:
      return {
        label: "Rota Aérea",
        icon: FaWind,
        classe: "",
        cor: "#d4af37",
      };
  }
}

export function getAmeacaBadge(nivel) {
  switch (nivel) {
    case "minimo":
      return { label: "Mínimo", classe: "ameaca-minimo" };
    case "baixo":
      return { label: "Baixo", classe: "ameaca-baixo" };
    case "medio":
      return { label: "Médio", classe: "ameaca-medio" };
    case "alto":
      return { label: "Alto", classe: "ameaca-alto" };
    case "muito_alto":
      return { label: "Muito Alto", classe: "ameaca-muito-alto" };
    default:
      return { label: nivel, classe: "" };
  }
}

export function getDadosPorAmeaca(ameaca) {
  switch (ameaca) {
    case "minimo":
      return { dado: "d6", ip: 1 };
    case "baixo":
      return { dado: "d8", ip: 1 };
    case "medio":
      return { dado: "d10", ip: 1 };
    case "alto":
      return { dado: "d12", ip: 2 };
    case "muito_alto":
      return { dado: "d20", ip: 2 };
    default:
      return { dado: "d8", ip: 1 };
  }
}
