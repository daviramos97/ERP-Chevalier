import { useContext, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { AlertTriangle, Truck, MapPin, Phone, Calendar } from 'lucide-react';

// Utilitário: retorna "YYYY-MM-DD" de hoje sem problemas de timezone
const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// Dias entre duas strings "YYYY-MM-DD"
const diasEntre = (dataStr1, dataStr2) => {
  const [a1, m1, d1] = dataStr1.split('-').map(Number);
  const [a2, m2, d2] = dataStr2.split('-').map(Number);
  const t1 = new Date(a1, m1 - 1, d1).getTime();
  const t2 = new Date(a2, m2 - 1, d2).getTime();
  return Math.abs(Math.round((t2 - t1) / 86400000));
};

// Início da semana atual (segunda-feira)
const inicioSemana = () => {
  const d = new Date();
  const diaSemana = d.getDay(); // 0=dom,1=seg,...
  const diff = (diaSemana === 0) ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const CIDADES = ['São Gonçalo', 'Niterói', 'Itaboraí', 'Maricá'];
const STATUS_PROSPEC = ['Lead', 'Amostra Entregue'];

export function RadarDaSemana() {
  const { data } = useContext(GlobalContext);
  const [cidadeFiltro, setCidadeFiltro] = useState('São Gonçalo');

  const HOJE = hoje();
  const INICIO_SEMANA = inicioSemana();

  // ─── BLOCO 1: Alerta de Quebra de Ciclo ─────────────────────────────────────
  const clientesAtivos = (data.clientes || []).filter(c => c.status === 'Ativo' && (c.frequenciaCompra === 'Semanal' || c.frequenciaCompra === 'Quinzenal'));

  const faltosos = clientesAtivos.map(cliente => {
    const limiteDias = cliente.frequenciaCompra === 'Semanal' ? 6 : 13;

    // Último orçamento ou venda desse cliente
    const datasOrc = (data.orcamentos || [])
      .filter(o => o.clienteId === cliente.id && o.data)
      .map(o => o.data);
    const datasVenda = (data.vendas || [])
      .filter(v => v.clienteId === cliente.id && v.dataHora)
      .map(v => v.dataHora.split('T')[0]);

    const todasDatas = [...datasOrc, ...datasVenda].sort().reverse();
    const ultimaData = todasDatas[0] || null;

    if (!ultimaData) {
      return { ...cliente, ultimaData: null, diasSemPedir: 999 };
    }

    const dias = diasEntre(ultimaData, HOJE);
    if (dias > limiteDias) {
      return { ...cliente, ultimaData, diasSemPedir: dias };
    }
    return null;
  }).filter(Boolean).sort((a, b) => b.diasSemPedir - a.diasSemPedir);

  // ─── BLOCO 2: Previsão de Entrega ───────────────────────────────────────────
  const vendasSemana = (data.vendas || []).filter(v => {
    if (!v.dataHora) return false;
    const dataVenda = v.dataHora.split('T')[0];
    return dataVenda >= INICIO_SEMANA && dataVenda <= HOJE;
  });

  const entregasQuarta = vendasSemana.filter(v => {
    const cli = (data.clientes || []).find(c => c.id === v.clienteId);
    return cli?.diaEntrega === 'Quarta-feira';
  });

  const entregasQuinta = vendasSemana.filter(v => {
    const cli = (data.clientes || []).find(c => c.id === v.clienteId);
    return cli?.diaEntrega === 'Quinta-feira';
  });

  const entregasSemDia = vendasSemana.filter(v => {
    const cli = (data.clientes || []).find(c => c.id === v.clienteId);
    return !cli?.diaEntrega;
  });

  // ─── BLOCO 3: Rota de Prospecção ────────────────────────────────────────────
  const prospectos = (data.clientes || []).filter(c =>
    STATUS_PROSPEC.includes(c.status) &&
    c.cidade === cidadeFiltro
  );

  // ─── Utilitários de renderização ────────────────────────────────────────────
  const formatarData = (str) => str ? str.split('-').reverse().join('/') : '—';

  const badgeStatus = (status) => {
    const map = {
      'Lead': 'bg-blue-100 text-blue-700',
      'Amostra Entregue': 'bg-amber-100 text-amber-700',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Radar da Semana</h1>
            <p className="text-sm text-gray-500">Central de comando — Semana de {formatarData(INICIO_SEMANA)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── BLOCO 1: Faltosos ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-red-50 to-white">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Alerta de Ciclo</h2>
              <p className="text-xs text-gray-500">Clientes ativos sem pedido recente</p>
            </div>
            {faltosos.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {faltosos.length}
              </span>
            )}
          </div>

          <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
            {faltosos.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-semibold text-gray-500">Todos em dia!</p>
                <p className="text-xs text-gray-400 mt-1">Nenhum cliente fora do ciclo.</p>
              </div>
            ) : faltosos.map(cliente => (
              <div key={cliente.id} className="flex items-start justify-between bg-red-50/60 border border-red-100 rounded-xl p-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800 text-sm truncate">{cliente.nome}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white whitespace-nowrap">
                      LIGAR AGORA
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-gray-500">
                      {cliente.frequenciaCompra} · {cliente.cidade || '—'}
                    </span>
                    {cliente.ultimaData ? (
                      <span className="text-xs text-red-600 font-medium">
                        Último pedido: {formatarData(cliente.ultimaData)} ({cliente.diasSemPedir}d atrás)
                      </span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium italic">Nunca pediu</span>
                    )}
                  </div>
                </div>
                {cliente.telefone && (
                  <a
                    href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition-colors"
                    title="WhatsApp"
                  >
                    <Phone size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── BLOCO 2: Previsão de Entrega ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-blue-50 to-white">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
              <Truck size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Previsão de Entrega</h2>
              <p className="text-xs text-gray-500">Vendas registradas esta semana</p>
            </div>
            <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {vendasSemana.length}
            </span>
          </div>

          <div className="p-4 max-h-[520px] overflow-y-auto space-y-4">
            {vendasSemana.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm font-semibold text-gray-500">Sem vendas esta semana ainda.</p>
              </div>
            ) : (
              <>
                {/* Quarta */}
                {entregasQuarta.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                        📦 Quarta-feira
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entregasQuarta.map(v => {
                        const cli = (data.clientes || []).find(c => c.id === v.clienteId);
                        return (
                          <div key={v.id} className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl px-4 py-2.5">
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{cli?.nome || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{cli?.cidade || '—'} · {cli?.bairro || ''}</p>
                            </div>
                            <span className="font-bold text-blue-600 text-sm">
                              {v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quinta */}
                {entregasQuinta.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full">
                        📦 Quinta-feira
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entregasQuinta.map(v => {
                        const cli = (data.clientes || []).find(c => c.id === v.clienteId);
                        return (
                          <div key={v.id} className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-2.5">
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{cli?.nome || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{cli?.cidade || '—'} · {cli?.bairro || ''}</p>
                            </div>
                            <span className="font-bold text-indigo-600 text-sm">
                              {v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sem dia definido */}
                {entregasSemDia.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        Dia não definido
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entregasSemDia.map(v => {
                        const cli = (data.clientes || []).find(c => c.id === v.clienteId);
                        return (
                          <div key={v.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5">
                            <div>
                              <p className="font-semibold text-sm text-gray-800">{cli?.nome || 'N/A'}</p>
                              <p className="text-xs text-gray-400">{cli?.cidade || '—'}</p>
                            </div>
                            <span className="font-bold text-gray-600 text-sm">
                              {v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── BLOCO 3: Rota de Prospecção ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-white">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <MapPin size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Rota de Prospecção</h2>
              <p className="text-xs text-gray-500">Leads e amostras por cidade</p>
            </div>
          </div>

          {/* Filtro de cidade */}
          <div className="px-4 pt-4 pb-2 flex gap-2 flex-wrap">
            {CIDADES.map(cidade => (
              <button
                key={cidade}
                onClick={() => setCidadeFiltro(cidade)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                  cidadeFiltro === cidade
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cidade}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
            {prospectos.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">🗺️</div>
                <p className="text-sm font-semibold text-gray-500">Nenhum prospecto em {cidadeFiltro}.</p>
                <p className="text-xs text-gray-400 mt-1">Clientes com status Lead ou Amostra Entregue aparecerão aqui.</p>
              </div>
            ) : prospectos.map(cliente => (
              <div key={cliente.id} className="flex items-start justify-between bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{cliente.nome}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStatus(cliente.status)}`}>
                      {cliente.status}
                    </span>
                  </div>
                  {cliente.bairro && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin size={10} /> {cliente.bairro}
                    </p>
                  )}
                  {cliente.telefone && (
                    <p className="text-xs text-gray-500 mt-0.5">{cliente.telefone}</p>
                  )}
                  {cliente.observacoes && (
                    <p className="text-xs text-gray-400 mt-1 italic truncate" title={cliente.observacoes}>
                      "{cliente.observacoes}"
                    </p>
                  )}
                </div>
                {cliente.telefone && (
                  <a
                    href={`https://wa.me/55${cliente.telefone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-shrink-0 w-8 h-8 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg flex items-center justify-center transition-colors"
                    title="WhatsApp"
                  >
                    <Phone size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
