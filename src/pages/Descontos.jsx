import { useContext, useState } from 'react';
import { GlobalContext, normalizeSearch } from '../context/GlobalContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Trash2, Tag, Search, User, ChevronRight, ArrowLeft } from 'lucide-react';

export function Descontos() {
  const { data, addDesconto, deleteDesconto } = useContext(GlobalContext);

  const [selectedClienteId, setSelectedClienteId] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  
  const [produtoId, setProdutoId] = useState('');
  const [preco, setPreco] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const descontos = data.descontos || [];
  const selectedCliente = data.clientes.find(c => c.id === selectedClienteId);

  // Filtra descontos do cliente selecionado
  const clienteDescontos = selectedClienteId
    ? descontos.filter(d => d.clienteId === selectedClienteId)
    : [];

  const handleAdd = () => {
    const pId = parseInt(produtoId);
    const precoNum = parseFloat(preco.toString().replace(',', '.'));

    if (!selectedClienteId || !pId || isNaN(precoNum) || precoNum <= 0) return;

    // Impede duplicata
    const jaExiste = descontos.some(d => d.clienteId === selectedClienteId && d.produtoId === pId);
    if (jaExiste) {
      setConfirmDialog({
        isOpen: true,
        title: 'Atenção',
        message: 'Já existe um preço especial cadastrado para este produto neste cliente.',
        isAlert: true,
        onConfirm: () => setConfirmDialog({ isOpen: false })
      });
      return;
    }

    addDesconto({ clienteId: selectedClienteId, produtoId: pId, preco: precoNum });
    setProdutoId('');
    setPreco('');
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Desconto',
      message: 'Deseja remover este preço especial?',
      isDestructive: true,
      onConfirm: () => {
        deleteDesconto(id);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const filteredClientes = data.clientes.filter(c =>
    normalizeSearch(c.nome).includes(normalizeSearch(clientSearch))
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  const produtosJaCadastrados = clienteDescontos.map(d => d.produtoId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
      
      {/* Painel Esquerdo: Lista de Clientes */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedClienteId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-800 mb-4">Clientes</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredClientes.map(c => {
            const hasDescontos = descontos.some(d => d.clienteId === c.id);
            const count = descontos.filter(d => d.clienteId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedClienteId(c.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedClienteId === c.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedClienteId === c.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{c.nome}</p>
                    <p className={`text-[10px] uppercase tracking-wider ${selectedClienteId === c.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {c.cidade || 'Sem cidade'}
                    </p>
                  </div>
                </div>
                {hasDescontos && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${selectedClienteId === c.id ? 'bg-white text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
                    {count}
                  </span>
                )}
                <ChevronRight size={16} className={selectedClienteId === c.id ? 'text-blue-100' : 'text-gray-300'} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel Direito: Detalhes dos Descontos */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedClienteId ? 'hidden md:flex' : 'flex'}`}>
        {selectedCliente ? (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedClienteId(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{selectedCliente.nome}</h2>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest">{selectedCliente.cidade} · {selectedCliente.bairro || 'Sem bairro'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <Tag size={14} className="text-blue-600" />
                <span className="text-xs font-bold text-blue-700">{clienteDescontos.length} preços especiais</span>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              {/* Formulário Compacto */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Adicionar novo preço especial</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                  <div className="lg:col-span-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Produto / Embalagem</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
                      value={produtoId}
                      onChange={(e) => setProdutoId(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      {data.produtos
                        .filter(p => !produtosJaCadastrados.includes(p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome} ({p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1">Preço Especial (R$)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={preco}
                        onChange={(e) => setPreco(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-sm"
                      />
                      <button
                        onClick={handleAdd}
                        disabled={!produtoId || !preco}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-sm shadow-blue-600/20 whitespace-nowrap text-sm"
                      >
                        <Plus size={18} /> Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Descontos do Cliente */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 ml-1">Tabela de Preços Negociados</h3>
                <div className="overflow-x-auto border border-gray-100 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="p-4 font-bold text-gray-600 text-[10px] uppercase">Produto</th>
                        <th className="p-4 font-bold text-gray-600 text-[10px] uppercase text-right">Padrão</th>
                        <th className="p-4 font-bold text-blue-600 text-[10px] uppercase text-right">Especial</th>
                        <th className="p-4 font-bold text-gray-600 text-[10px] uppercase text-right">Variação</th>
                        <th className="p-4 text-center w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clienteDescontos.length > 0 ? (
                        clienteDescontos.map(d => {
                          const produto = data.produtos.find(p => p.id === d.produtoId);
                          const diff = d.preco - (produto?.preco || 0);
                          const diffPct = produto ? ((diff / produto.preco) * 100).toFixed(1) : 0;
                          return (
                            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <div className="font-semibold text-gray-800 text-sm">{produto?.nome || 'N/A'}</div>
                                {produto?.codigo && <div className="text-[10px] text-gray-400 font-mono">#{produto.codigo}</div>}
                              </td>
                              <td className="p-4 text-right text-gray-400 line-through text-xs">
                                {produto ? produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                              </td>
                              <td className="p-4 text-right font-bold text-blue-600 text-sm">
                                {d.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="p-4 text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff < 0 ? 'bg-red-50 text-red-600' : diff > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                                  {diff > 0 ? '+' : ''}{diffPct}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleDelete(d.id)}
                                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-12 text-center">
                            <Tag size={32} className="mx-auto text-gray-200 mb-2" />
                            <p className="text-gray-400 text-sm font-medium">Nenhum preço especial para este cliente.</p>
                            <p className="text-gray-300 text-xs mt-1">Configure as exceções de preço usando o formulário acima.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <User size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione um cliente</h2>
            <p className="text-gray-500 max-w-sm text-sm">
              Escolha um cliente na lista ao lado para gerenciar seus preços diferenciados e descontos exclusivos.
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        isAlert={confirmDialog.isAlert}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
