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
      titulo: 'Início',
      itens: [
        { to: '/', label: 'Mapa Mundi', icon: FaMapMarkedAlt, exact: true }
      ]
    },
    {
      titulo: 'Personagem & Criação',
      itens: [
        { to: '/ficha', label: 'Minha Ficha', icon: FaIdCard, exact: false },
        { to: '/projetos', label: 'Projetos', icon: FaDraftingCompass, exact: true },
        { to: '/loja', label: 'Loja & Forja', icon: FaStore, exact: true }
      ]
    },
    {
      titulo: 'Tática & Conflito',
      itens: [
        { to: '/combate', label: 'Conflito & Relógios', icon: LuSwords, exact: true }
      ]
    },
    {
      titulo: 'Mundo & Campanha',
      itens: [
        { to: '/cronicas', label: 'Crônicas', icon: FaBookOpen, exact: true },
        { to: '/journal', label: 'Diário & Contratos', icon: FaJournalWhills, exact: true }
      ]
    },
    ...(isMestre
      ? [
          {
            titulo: 'Painel do Mestre',
            itens: [
              { to: '/mestre/fichas', label: 'Gerenciar Fichas', icon: FaShieldAlt, exact: false },
              { to: '/mestre/npcs', label: 'Gerenciar NPCs', icon: FaUserShield, exact: false }
            ]
          }
        ]
      : [])
  ];
}

export const MOBILE_TABS = [
  { to: '/', label: 'Mapa', icon: FaMapMarkedAlt, exact: true },
  { to: '/ficha', label: 'Ficha', icon: FaIdCard, exact: false },
  { to: '/projetos', label: 'Projetos', icon: FaDraftingCompass, exact: true },
  { to: '/combate', label: 'Conflito', icon: LuSwords, exact: true }
];
