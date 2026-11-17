import {
  FaMapMarkedAlt,
  FaBookOpen,
  FaShieldAlt,
  FaJournalWhills,
  FaIdCard,
  FaStore,
  FaUserShield,
  FaDraftingCompass
} from 'react-icons/fa';
import { LuSwords } from 'react-icons/lu';

export function getGruposNavegacao(isMestre) {
  return [
    {
      titulo: 'Campanha',
      itens: [
        { to: '/', label: 'Mapa Mundi', icon: FaMapMarkedAlt, exact: true },
        { to: '/cronicas', label: 'Crônicas', icon: FaBookOpen, exact: true },
        { to: '/journal', label: 'Diário & Contratos', icon: FaJournalWhills, exact: true }
      ]
    },
    {
      titulo: 'Oficina & Aventura',
      itens: [
        { to: '/combate', label: 'Conflito & Relógios', icon: LuSwords, exact: true },
        { to: '/projetos', label: 'Projetos', icon: FaDraftingCompass, exact: true },
        { to: '/loja', label: 'Loja & Forja', icon: FaStore, exact: true }
      ]
    },
    {
      titulo: isMestre ? 'Painel do Mestre' : 'Personagem',
      itens: isMestre
        ? [
            { to: '/mestre/fichas', label: 'Gerenciar Fichas', icon: FaShieldAlt, exact: false },
            { to: '/mestre/npcs', label: 'Gerenciar NPCs', icon: FaUserShield, exact: false }
          ]
        : [
            { to: '/ficha', label: 'Minha Ficha', icon: FaIdCard, exact: false }
          ]
    }
  ];
}

export const MOBILE_TABS = [
  { to: '/', label: 'Mapa', icon: FaMapMarkedAlt, exact: true },
  { to: '/cronicas', label: 'Crônicas', icon: FaBookOpen, exact: true },
  { to: '/combate', label: 'Conflito', icon: LuSwords, exact: true },
  { to: '/projetos', label: 'Projetos', icon: FaDraftingCompass, exact: true }
];
