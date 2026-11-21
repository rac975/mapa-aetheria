import ExibirVirtuoso from '../../components/Virtuoso/ExibirVirtuoso';
import ExibirComandante from '../../components/Comandante/ExibirComandante';
import ExibirDancarino from '../../components/Dancarino/ExibirDancarino';
import ExibirSimbolista from '../../components/Simbolista/ExibirSimbolista';
import ExibirFloralista from '../../components/Floralista/ExibirFloralista';
import ExibirGourmet from '../../components/Gourmet/ExibirGourmet';
import ExibirInvocador from '../../components/Invocador/ExibirInvocador';
import ExibirMercador from '../../components/Mercador/ExibirMercador';
import {
  ehClasseVirtuoso,
  ehClasseComandante,
  ehClasseDancarino,
  ehClasseSimbolista
} from '../../../../domain/fabula/highFantasyRules';
import {
  ehClasseFloralista,
  ehClasseGourmet,
  ehClasseInvocador,
  ehClasseMercador
} from '../../../../domain/fabula/naturalFantasyRules';

export default function FichaClasseModulosSuplementares({
  classe,
  ficha,
  classes,
  itensEquipados = [],
  handleAjustarRecurso,
  emCrise,
  temArmaduraMarcial = false,
  reducaoCustoPi = 0,
  nivelTotal = 5,
  onAtualizarDadosClasse
}) {
  return (
    <>
      {ehClasseVirtuoso(classe.nome_classe) && (
        <ExibirVirtuoso
          ficha={ficha}
          classe={classe}
          classes={classes}
          itensEquipados={itensEquipados}
          nivelTotal={nivelTotal}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseComandante(classe.nome_classe) && (
        <ExibirComandante
          ficha={ficha}
          classe={classe}
          classes={classes}
          nivelTotal={nivelTotal}
          emCriseGlobal={emCrise}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseDancarino(classe.nome_classe) && (
        <ExibirDancarino
          ficha={ficha}
          classe={classe}
          classes={classes}
          temArmaduraMarcial={temArmaduraMarcial}
          nivelTotal={nivelTotal}
          emCriseGlobal={emCrise}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseSimbolista(classe.nome_classe) && (
        <ExibirSimbolista
          ficha={ficha}
          classe={classe}
          classes={classes}
          reducaoCustoPi={reducaoCustoPi}
          nivelTotal={nivelTotal}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseFloralista(classe.nome_classe) && (
        <ExibirFloralista
          ficha={ficha}
          classe={classe}
          classes={classes}
          nivelTotal={nivelTotal}
          emCriseGlobal={emCrise}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseGourmet(classe.nome_classe) && (
        <ExibirGourmet
          ficha={ficha}
          classe={classe}
          classes={classes}
          itensEquipados={itensEquipados}
          nivelTotal={nivelTotal}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseInvocador(classe.nome_classe) && (
        <ExibirInvocador
          ficha={ficha}
          classe={classe}
          classes={classes}
          itensEquipados={itensEquipados}
          nivelTotal={nivelTotal}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {ehClasseMercador(classe.nome_classe) && (
        <ExibirMercador
          ficha={ficha}
          classe={classe}
          classes={classes}
          itensEquipados={itensEquipados}
          nivelTotal={nivelTotal}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
    </>
  );
}
