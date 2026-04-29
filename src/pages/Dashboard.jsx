import { useContext, useMemo } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, AlertCircle, CheckCircle, TrendingUp, ShoppingCart, Activity } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function Dashboard() {
  const { data } = useContext(GlobalContext);

  const {
    faturamentoMes,
    previsaoComissao,
    despesasMes,
    lucroLiquido,
    last6MonthsData,
    topProducts,
    melhoresClientes,
    maisTempoSemPedir,
    orcamentosPendentes,
    showAlert
  } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtros para o mês atual
    const vendasMes = data.vendas.filter(v => {
      const d = new Date(v.dataHora);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const despesasDoMes = data.despesas.filter(d => {
      const dDate = new Date(d.data);
      return dDate.getMonth() === currentMonth && dDate.getFullYear() === currentYear;
    });

    // 1. Cards de Topo
    const faturamento = vendasMes.reduce((acc, v) => acc + (v.valorTotal || 0), 0);
    const comissao = vendasMes.reduce((acc, v) => acc + (v.valorComissao || 0), 0);
    const despesas = despesasDoMes.reduce((acc, d) => acc + (d.valor || 0), 0);
    const lucro = comissao - despesas;

    // 2. Gráfico de Barras (Últimos 6 meses)
    const ultimos6Meses = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const monthName = d.toLocaleString('pt-BR', { month: 'short' });
      const m = d.getMonth();
      const y = d.getFullYear();

      const comissaoMes = data.vendas
        .filter(v => { const vd = new Date(v.dataHora); return vd.getMonth() === m && vd.getFullYear() === y; })
        .reduce((acc, v) => acc + (v.valorComissao || 0), 0);

      const despesaMes = data.despesas
        .filter(desp => { const dd = new Date(desp.data); return dd.getMonth() === m && dd.getFullYear() === y; })
        .reduce((acc, desp) => acc + (desp.valor || 0), 0);

      ultimos6Meses.push({
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1), // Ex: Abr
        Comissão: comissaoMes,
        Despesas: despesaMes
      });
    }

    // 3. Gráfico de Donut (Top 5 Produtos)
    const productSales = {};
    data.vendas.forEach(venda => {
      venda.itens.forEach(item => {
        if (!productSales[item.nome]) {
          productSales[item.nome] = 0;
        }
        productSales[item.nome] += item.quantidade;
      });
    });

    const top5 = Object.keys(productSales)
      .map(key => ({ name: key, value: productSales[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 4. Últimas 5 Vendas
    const ultimas = [...data.vendas]
      .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
      .slice(0, 5);

    // 5. Alerta de Comissão em Atraso
    const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const prevMonthString = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const isPrevMonthPaid = data.comissoesPagas.includes(prevMonthString);
    
    const comissaoMesAnterior = data.vendas
      .filter(v => { 
        const d = new Date(v.dataHora); 
        return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear(); 
      })
      .reduce((acc, v) => acc + (v.valorComissao || 0), 0);

    // Se hoje for > dia 10 e a comissão do mês anterior não foi paga e houver valor, mostrar alerta
    const show = now.getDate() > 10 && !isPrevMonthPaid && comissaoMesAnterior > 0;

    return {
      faturamentoMes: faturamento,
      previsaoComissao: comissao,
      despesasMes: despesas,
      lucroLiquido: lucro,
      last6MonthsData: ultimos6Meses,
      topProducts: top5,
      showAlert: show,
      // 6. Coluna 1: Melhores Clientes (Total acumulado)
      melhoresClientes: data.clientes
        .map(c => {
          const totalComprado = data.vendas
            .filter(v => v.clienteId === c.id)
            .reduce((acc, v) => acc + (v.valorTotal || 0), 0);
          return { ...c, totalComprado };
        })
        .sort((a, b) => b.totalComprado - a.totalComprado)
        .slice(0, 5),

      // 7. Coluna 2: Mais tempo sem pedir (Inativos)
      maisTempoSemPedir: data.clientes
        .map(c => {
          const vendasCliente = data.vendas
            .filter(v => v.clienteId === c.id)
            .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
          const ultimaVenda = vendasCliente.length > 0 ? vendasCliente[0].dataHora : null;
          return { ...c, ultimaVenda };
        })
        .filter(c => c.ultimaVenda !== null) // Apenas quem já comprou
        .sort((a, b) => new Date(a.ultimaVenda) - new Date(b.ultimaVenda))
        .slice(0, 5),

      // 8. Coluna 3: Orçamentos Pendentes (Maiores Valores)
      orcamentosPendentes: data.orcamentos
        .filter(o => !data.vendas.some(v => v.orcamentoOrigemId === o.id))
        .sort((a, b) => b.valorTotal - a.valorTotal)
        .slice(0, 5)
    };
  }, [data]);

  const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Banner de Alerta Condicional */}
      {showAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-start gap-3 animate-pulse">
          <AlertCircle className="text-red-500 mt-0.5" size={24} />
          <div>
            <h3 className="text-red-800 font-bold text-lg">Atenção: Comissão do mês anterior em atraso!</h3>
            <p className="text-red-600 text-sm mt-1">
              Já passamos do dia 10 e o status da comissão do mês passado ainda não consta como "Pago".
            </p>
          </div>
        </div>
      )}

      {/* 1. Cards de Topo (Mês Atual) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="p-4 bg-blue-600 text-white rounded-xl shadow-md z-10">
            <TrendingUp size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-1">Faturamento Mensal</p>
            <h3 className="text-2xl font-black text-gray-800">{formatCurrency(faturamentoMes)}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="p-4 bg-emerald-600 text-white rounded-xl shadow-md z-10">
            <DollarSign size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-1">Previsão Comissão</p>
            <h3 className="text-2xl font-black text-gray-800">{formatCurrency(previsaoComissao)}</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl shadow-sm border border-orange-100 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300"></div>
          <div className="p-4 bg-orange-500 text-white rounded-xl shadow-md z-10">
            <Activity size={24} />
          </div>
          <div className="z-10">
            <p className="text-sm font-semibold text-orange-800 uppercase tracking-wider mb-1">Despesas do Mês</p>
            <h3 className="text-2xl font-black text-gray-800">{formatCurrency(despesasMes)}</h3>
          </div>
        </div>

        <div className={`p-6 rounded-2xl shadow-sm border flex items-center gap-4 relative overflow-hidden group ${lucroLiquido >= 0 ? 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100' : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100'}`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-300 ${lucroLiquido >= 0 ? 'bg-teal-100' : 'bg-red-100'}`}></div>
          <div className={`p-4 text-white rounded-xl shadow-md z-10 ${lucroLiquido >= 0 ? 'bg-teal-600' : 'bg-red-500'}`}>
            <CheckCircle size={24} />
          </div>
          <div className="z-10">
            <p className={`text-sm font-semibold uppercase tracking-wider mb-1 ${lucroLiquido >= 0 ? 'text-teal-800' : 'text-red-800'}`}>Lucro Líquido</p>
            <h3 className={`text-2xl font-black ${lucroLiquido >= 0 ? 'text-teal-900' : 'text-red-900'}`}>
              {formatCurrency(lucroLiquido)}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Área de Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Comissão vs Despesas (Últimos 6 Meses)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last6MonthsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} tickFormatter={(val) => `R$${val}`} />
                <RechartsTooltip 
                  formatter={(value) => formatCurrency(value)}
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Comissão" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Donut */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-6">Top 5 Produtos</h3>
          {topProducts.length > 0 ? (
            <div className="h-[300px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`${value} un.`, 'Vendido']}
                    contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="bottom" 
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-4 opacity-20" />
              <p>Nenhum dado de vendas</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. Base - Tabela Últimas Vendas */}
      {/* 3. Base - Três Colunas Estratégicas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Coluna 1: Melhores Clientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Melhores Clientes</h3>
          </div>
          <div className="space-y-4">
            {melhoresClientes.map((c, i) => (
              <div key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-4">{i + 1}º</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 line-clamp-1">{c.nome}</span>
                    <span className="text-xs text-gray-500">Total acumulado</span>
                  </div>
                </div>
                <span className="text-sm font-bold text-blue-600">{formatCurrency(c.totalComprado)}</span>
              </div>
            ))}
            {melhoresClientes.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Nenhum dado disponível</p>}
          </div>
        </div>

        {/* Coluna 2: Mais Tempo Sem Pedir */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Activity size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Mais Tempo s/ Pedir</h3>
          </div>
          <div className="space-y-4">
            {maisTempoSemPedir.map((c) => {
              const diasInativo = Math.floor((new Date() - new Date(c.ultimaVenda)) / (1000 * 60 * 60 * 24));
              return (
                <div key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 line-clamp-1">{c.nome}</span>
                    <span className="text-xs text-gray-500">Último: {new Date(c.ultimaVenda).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${diasInativo > 60 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {diasInativo} dias
                    </span>
                  </div>
                </div>
              );
            })}
            {maisTempoSemPedir.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Nenhum dado disponível</p>}
          </div>
        </div>

        {/* Coluna 3: Maiores Orçamentos Pendentes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">Maiores Orçamentos</h3>
          </div>
          <div className="space-y-4">
            {orcamentosPendentes.map((o) => {
              const cliente = data.clientes.find(c => c.id === o.clienteId);
              return (
                <div key={o.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800 line-clamp-1">#{o.id} - {cliente?.nome || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{new Date(o.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(o.valorTotal)}</span>
                </div>
              );
            })}
            {orcamentosPendentes.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Nenhum orçamento pendente</p>}
          </div>
        </div>

      </div>

    </div>
  );
}
