import { LuSwords } from "react-icons/lu";
import { FaIdCard, FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import InitiativeTracker from "../../components/IniciativeTracker/InitiativeTracker";
import ClockManager from "../../components/ClockManager/ClockManager";
import './CombatPage.css';

export default function CombatPage({ isMestre }) {
  return (
    <div className="combat-page">
      <header className="combat-header">
        <div className="combat-header-title-wrap">
          <h1><LuSwords /> Painel de Conflito & Relógios</h1>
          <p>Gerencie a ordem de iniciativa dos turnos e acompanhe os relógios de tensão e perigo da cena.</p>
        </div>
        <div className="combat-header-nav">
          <Link to="/ficha" className="combat-nav-link combat-nav-link-primary" title="Ir para a Ficha do Personagem">
            <FaIdCard /> Minha Ficha
          </Link>
          {isMestre && (
            <Link to="/mestre/fichas" className="combat-nav-link" title="Painel do Mestre - Gerenciar Fichas">
              <FaShieldAlt /> Gerenciar Fichas
            </Link>
          )}
        </div>
      </header>

      <ClockManager isMestre={isMestre} />
      <InitiativeTracker isMestre={isMestre} />
      <div className="combat-bottom-spacer" aria-hidden="true" />
    </div>
  );
}
