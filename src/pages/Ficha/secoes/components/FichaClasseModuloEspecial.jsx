import ExibirInventor from '../../components/Inventor/ExibirInventor';
import ExibirLadino from '../../components/Ladino/ExibirLadino';
import ExibirAtirador from '../../components/Atirador/ExibirAtirador';
import ExibirGuardiao from '../../components/Guardiao/ExibirGuardiao';
import ExibirMestreArmas from '../../components/MestreArmas/ExibirMestreArmas';
import ExibirArcanista from '../../components/Arcanista/ExibirArcanista';
import ExibirErudito from '../../components/Erudito/ExibirErudito';
import ExibirQuimerista from '../../components/Quimerista/ExibirQuimerista';
import ExibirFurioso from '../../components/Furioso/ExibirFurioso';
import ExibirGuerreiroSombrio from '../../components/GuerreiroSombrio/ExibirGuerreiroSombrio';
import ExibirElementalista from '../../components/Elementalista/ExibirElementalista';
import ExibirEntropista from '../../components/Entropista/ExibirEntropista';
import ExibirEspiritualista from '../../components/Espiritualista/ExibirEspiritualista';
import ExibirOrador from '../../components/Orador/ExibirOrador';
import ExibirEsper from '../../components/Esper/ExibirEsper';
import ExibirMutante from '../../components/Mutante/ExibirMutante';
import ExibirPiloto from '../../components/Piloto/ExibirPiloto';
import ExibirVirtuoso from '../../components/Virtuoso/ExibirVirtuoso';
import ExibirComandante from '../../components/Comandante/ExibirComandante';
import ExibirDancarino from '../../components/Dancarino/ExibirDancarino';
import ExibirSimbolista from '../../components/Simbolista/ExibirSimbolista';
import {
  ehClasseVirtuoso,
  ehClasseComandante,
  ehClasseDancarino,
  ehClasseSimbolista
} from '../../../../domain/fabula/highFantasyRules';

export default function FichaClasseModuloEspecial({
  classe,
  fichaId,
  ficha,
  classes,
  itensEquipados = [],
  handleAjustarRecurso,
  hpMaxCalculado,
  emCrise,
  temArmaduraMarcial = false,
  reducaoCustoPi = 0,
  nivelTotal = 5,
  onAtualizarMutante,
  onAtualizarDadosClasse,
  onAtivarGolpe
}) {
  const nomeClasse = (classe.nome_classe || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return (
    <>
      {nomeClasse.includes('inventor') && <ExibirInventor fichaId={fichaId} ficha={classe} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('ladino') && <ExibirLadino fichaId={fichaId} ficha={classe} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('atirador') && <ExibirAtirador fichaId={fichaId} ficha={classe} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('elementalista') && <ExibirElementalista ficha={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('quimerista') && <ExibirQuimerista fichaId={fichaId} ficha={classe} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('furioso') && <ExibirFurioso ficha={classe} handleAjustarRecurso={handleAjustarRecurso} emCriseGlobal={emCrise} />}
      {nomeClasse.includes('guerreiro sombrio') && (
        <ExibirGuerreiroSombrio
          ficha={classe}
          handleAjustarRecurso={handleAjustarRecurso}
          vigorValor={ficha?.vigor || 8}
          emCriseGlobal={emCrise}
          classes={classes}
          onAtivarGolpe={onAtivarGolpe}
        />
      )}
      {nomeClasse.includes('orador') && <ExibirOrador ficha={ficha} classeObjeto={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('arcanista') && <ExibirArcanista ficha={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('erudito') && <ExibirErudito ficha={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('mestre de armas') && <ExibirMestreArmas ficha={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('entropista') && <ExibirEntropista classeObjeto={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('espiritualista') && <ExibirEspiritualista classeObjeto={classe} handleAjustarRecurso={handleAjustarRecurso} />}
      {nomeClasse.includes('guardiao') && <ExibirGuardiao ficha={classe} />}
      {nomeClasse.includes('esper') && (
        <ExibirEsper
          ficha={ficha}
          classe={classe}
          classes={classes}
          handleAjustarRecurso={handleAjustarRecurso}
          onAtualizarDadosClasse={onAtualizarDadosClasse}
        />
      )}
      {nomeClasse.includes('mutant') && (
        <ExibirMutante
          ficha={ficha}
          classe={classe}
          classes={classes}
          handleAjustarRecurso={handleAjustarRecurso}
          emCriseGlobal={emCrise}
          pvMaxCalculado={hpMaxCalculado}
          onAtualizarMutante={onAtualizarMutante}
        />
      )}
      {nomeClasse.includes('pilot') && <ExibirPiloto fichaId={fichaId || ficha?.id} ficha={ficha} classe={classe} classes={classes} handleAjustarRecurso={handleAjustarRecurso} />}
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
    </>
  );
}
