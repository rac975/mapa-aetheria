import { LuSwords } from "react-icons/lu";
import InitiativeTracker from "../../components/IniciativeTracker/InitiativeTracker";
import ClockManager from "../../components/ClockManager/ClockManager";
import './CombatPage.css';

export default function CombatPage({ isMestre }) {
  return (
    <div className="combat-page">
      <header className="combat-header">
        <h1><LuSwords /> Painel de Conflito & Relógios</h1>
        <p>Gerencie a ordem de iniciativa dos turnos e acompanhe os relógios de tensão e perigo da cena.</p>
      </header>

      <ClockManager isMestre={isMestre} />
      <InitiativeTracker isMestre={isMestre} />
    </div>
  );
}