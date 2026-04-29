import { useContext, useState, useRef, useEffect } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Download, Trash2, ShoppingCart, Search, Edit2 } from 'lucide-react';

export function Vendas() {
  const { data, addVenda, updateVenda, deleteVenda } = useContext(GlobalContext);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSearchTerm, setImportSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  
  // Form State
  const [orcamentoOrigemId, setOrcamentoOrigemId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [vendaDataHora, setVendaDataHora] = useState(new Date().toISOString().slice(0, 16));
  const [comissaoPercentual, setComissaoPercentual] = useState(5);
  
  // Dynamic Fast-Entry State
  const [produtoCodigo, setProdutoCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [itens, setItens] = useState([]);

  // Refs for Fast-Entry
  const codigoRef = useRef(null);
  const qtdRef = useRef(null);
  const precoRef = useRef(null);

  const valorTotalVenda = itens.reduce((acc, item) => acc + item.subtotal, 0);
  const valorComissao = valorTotalVenda * (comissaoPercentual / 100);

  const openModal = (venda = null) => {
    if (venda) {
      setEditingVenda(venda);
      setOrcamentoOrigemId(venda.orcamentoOrigemId?.toString() || '');
      setClienteId(venda.clienteId.toString());
      setComissaoPercentual(venda.comissaoPercentual);
      setVendaDataHora(new Date(venda.dataHora).toISOString().slice(0, 16));
      setItens([...venda.itens]);
    } else {
      setEditingVenda(null);
      setOrcamentoOrigemId('');
      setClienteId('');
      setComissaoPercentual(5);
      setVendaDataHora(new Date().toISOString().slice(0, 16));
      setItens([]);
    }
    setProdutoCodigo('');
    setQuantidade('');
    setPrecoUnitario('');
    setIsModalOpen(true);
  };

  const handleDeleteVenda = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Venda',
      message: `Tem certeza que deseja excluir a venda #${id}? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      onConfirm: () => {
        deleteVenda(id);
      }
    });
  };

  useEffect(() => {
    if (isModalOpen && qtdRef.current) {
      setTimeout(() => qtdRef.current.focus(), 100);
    }
  }, [isModalOpen]);

  const handleImportOrcamento = (orcamento) => {
    if (!orcamento) {
      setOrcamentoOrigemId('');
      setItens([]);
      return;
    }

    // Verifica se este orçamento já está vinculado a alguma venda
    const vendaExistente = data.vendas.find(v => v.orcamentoOrigemId === orcamento.id);
    if (vendaExistente && (!editingVenda || editingVenda.id !== vendaExistente.id)) {
      setConfirmDialog({ 
        isOpen: true, 
        title: 'Orçamento já Utilizado', 
        message: `Este orçamento (#${orcamento.id}) já foi convertido na Venda #${vendaExistente.id} e não pode ser reutilizado.`, 
        isAlert: true 
      });
      return;
    }

    setOrcamentoOrigemId(orcamento.id.toString());
    setClienteId(orcamento.clienteId.toString());
    setItens([...orcamento.itens]);
    setIsImportModalOpen(false);
  };

  const handleCodigoChange = (e) => {
    const code = e.target.value;
    setProdutoCodigo(code);
    const produto = data.produtos.find(p => p.codigo === code || p.id.toString() === code);
    if (produto) {
      setPrecoUnitario(produto.preco.toString());
    } else {
      setPrecoUnitario('');
    }
  };

  const handleAddItem = () => {
    if (!produtoCodigo || !quantidade || parseInt(quantidade) <= 0 || !precoUnitario) return false;
    
    const produto = data.produtos.find(p => p.codigo === produtoCodigo || p.id.toString() === produtoCodigo);
    if (!produto) {
      setConfirmDialog({ isOpen: true, title: 'Atenção', message: 'Produto não encontrado com esse código!', isAlert: true });
      return false;
    }

    const qtdNum = parseInt(quantidade);
    const precoNum = parseFloat(precoUnitario.replace(',', '.'));
    if (isNaN(precoNum)) {
      setConfirmDialog({ isOpen: true, title: 'Atenção', message: 'Valor unitário inválido!', isAlert: true });
      return false;
    }
    const subtotal = precoNum * qtdNum;
    
    const itemExistente = itens.find(i => i.produtoId === produto.id && i.preco === precoNum);
    if (itemExistente) {
      setItens(itens.map(i => 
        i.produtoId === produto.id && i.preco === precoNum
          ? { ...i, quantidade: i.quantidade + qtdNum, subtotal: i.subtotal + subtotal } 
          : i
      ));
    } else {
      setItens([...itens, {
        produtoId: produto.id,
        nome: produto.nome,
        preco: precoNum,
        quantidade: qtdNum,
        subtotal
      }]);
    }

    setProdutoCodigo('');
    setQuantidade('');
    setPrecoUnitario('');
    return true;
  };

  const handleQtdKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (codigoRef.current) codigoRef.current.focus();
    }
  };

  const handleCodigoKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (precoRef.current) precoRef.current.focus();
    }
  };

  const handlePrecoKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const sucesso = handleAddItem();
      if (sucesso && qtdRef.current) {
        qtdRef.current.focus();
      }
    }
  };

  const handleRemoveItem = (index) => {
    setItens(itens.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const newItens = [...itens];
    const item = { ...newItens[index] };
    
    if (field === 'quantidade') {
      item.quantidade = parseInt(value) || 0;
    } else if (field === 'preco') {
      item.preco = parseFloat(value.toString().replace(',', '.')) || 0;
    }
    
    item.subtotal = item.quantidade * item.preco;
    newItens[index] = item;
    setItens(newItens);
  };

  const handleConfirmVenda = () => {
    const payload = {
      clienteId: parseInt(clienteId),
      orcamentoOrigemId: orcamentoOrigemId ? parseInt(orcamentoOrigemId) : null,
      dataHora: new Date(vendaDataHora).toISOString(),
      itens,
      valorTotal: valorTotalVenda,
      comissaoPercentual: parseFloat(comissaoPercentual) || 0,
      valorComissao: valorComissao
    };

    if (editingVenda) {
      updateVenda(editingVenda.id, payload);
    } else {
      addVenda(payload);
    }
    setIsModalOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clienteId || itens.length === 0) {
      setConfirmDialog({ isOpen: true, title: 'Atenção', message: 'Selecione um cliente e certifique-se de que há itens na venda.', isAlert: true });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Finalizar Venda',
      message: `Deseja realmente finalizar esta venda no valor de ${valorTotalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}?`,
      confirmText: 'Finalizar',
      onConfirm: handleConfirmVenda
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)] relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Vendas</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-green-600/20"
        >
          <ShoppingCart size={20} />
          Registrar Venda
        </button>
      </div>

      {/* Tabela de Vendas */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">ID / Data</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Cliente</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Comissão (%)</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Comissão (R$)</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Total Venda</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.vendas.map((venda) => {
              const cli = data.clientes.find(c => c.id === venda.clienteId);
              return (
                <tr key={venda.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-800">#{venda.id}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(venda.dataHora).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-800">{cli?.nome || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-600">{venda.comissaoPercentual}%</td>
                  <td className="py-3 px-4 font-medium text-orange-600 text-right">
                    {venda.valorComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-green-600 text-right">
                    {venda.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openModal(venda)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Venda"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteVenda(venda.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Venda"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.vendas.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">Nenhuma venda registrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Registrar Venda */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingVenda ? "Editar Venda" : "Registrar Venda"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                <Download size={16} /> Importar de Orçamento (Opcional)
              </label>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Search size={18} />
                  Buscar Orçamento
                </button>
                {orcamentoOrigemId && (
                  <span className="text-sm font-medium text-blue-800 bg-blue-100 px-3 py-1 rounded-lg">
                    Orçamento #{orcamentoOrigemId} Vinculado
                  </span>
                )}
                {orcamentoOrigemId && (
                  <button 
                    type="button"
                    onClick={() => handleImportOrcamento(null)}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora *</label>
              <input 
                type="datetime-local"
                required
                autoComplete="off"
                value={vendaDataHora}
                onChange={(e) => setVendaDataHora(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select 
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                disabled={!!orcamentoOrigemId} // Bloqueia se importou do orçamento
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Selecione um cliente...</option>
                {data.clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                value={comissaoPercentual}
                onChange={(e) => setComissaoPercentual(e.target.value)}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Adição de Produtos Estilo Fast-Entry (ERP SIC) */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              Itens da Venda
            </h3>
            
            <div className="flex flex-col md:flex-row gap-3 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-4">
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Qtd</label>
                <input 
                  type="number" min="1" ref={qtdRef} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} onKeyDown={handleQtdKeyDown}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none font-mono"
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cód. Produto</label>
                <input 
                  type="text" ref={codigoRef} value={produtoCodigo} onChange={handleCodigoChange} onKeyDown={handleCodigoKeyDown}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none font-mono"
                />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Vlr. Unit</label>
                <input 
                  type="text" ref={precoRef} value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} onKeyDown={handlePrecoKeyDown}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-600 outline-none font-mono"
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  const sucesso = handleAddItem();
                  if (sucesso && qtdRef.current) qtdRef.current.focus();
                }}
                className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors h-[38px]"
              >
                +
              </button>
            </div>

            {itens.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100 text-gray-700 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Produto</th>
                      <th className="px-4 py-3 font-semibold text-center">Qtd</th>
                      <th className="px-4 py-3 font-semibold text-right">Unitário</th>
                      <th className="px-4 py-3 font-semibold text-right">Subtotal</th>
                      <th className="px-4 py-3 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{item.nome}</td>
                        <td className="px-4 py-3 text-center bg-gray-50/50">
                          <input 
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => handleUpdateItem(idx, 'quantidade', e.target.value)}
                            className="w-16 bg-transparent text-center border-b border-dashed border-gray-400 focus:border-blue-500 outline-none hover:bg-white transition-colors py-1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          <input 
                            type="text"
                            value={item.preco}
                            onChange={(e) => handleUpdateItem(idx, 'preco', e.target.value)}
                            className="w-24 bg-transparent text-right border-b border-dashed border-gray-400 focus:border-blue-500 outline-none hover:bg-white transition-colors py-1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-700">
                          {item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500 py-4">Nenhum item na venda.</p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 flex flex-col justify-center items-end">
                <span className="text-xs font-semibold text-orange-800 uppercase tracking-wider mb-1">Comissão Prevista</span>
                <span className="font-bold text-xl text-orange-600">
                  {valorComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="bg-green-50/50 p-4 rounded-lg border border-green-100 flex flex-col justify-center items-end">
                <span className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1">Total da Venda</span>
                <span className="font-bold text-2xl text-green-700">
                  {valorTotalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-md shadow-green-600/20"
            >
              Finalizar Venda
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Buscar Orçamento */}
      <Modal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        title="Buscar Orçamento"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar por ID ou Nome do Cliente..." 
              value={importSearchTerm}
              onChange={(e) => setImportSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
          
          <div className="max-h-96 overflow-y-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-3 font-semibold text-gray-600 text-sm">ID</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm">Cliente</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm">Data</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm">Total</th>
                  <th className="p-3 font-semibold text-gray-600 text-sm text-center">Ação</th>
                </tr>
              </thead>
              <tbody>
                {data.orcamentos
                  .filter(o => {
                    const cli = data.clientes.find(c => c.id === o.clienteId);
                    const term = importSearchTerm.toLowerCase();
                    const matchSearch = o.id.toString().includes(term) || (cli && cli.nome.toLowerCase().includes(term));
                    
                    // Só mostra orçamentos que NÃO estão vinculados a vendas (ou que estão vinculados à venda atual que estamos editando)
                    const vinculada = data.vendas.find(v => v.orcamentoOrigemId === o.id);
                    const isDisponivel = !vinculada || (editingVenda && vinculada.id === editingVenda.id);
                    
                    return matchSearch && isDisponivel;
                  })
                  .map(o => {
                    const cli = data.clientes.find(c => c.id === o.clienteId);
                    return (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-3 text-gray-500 text-sm">#{o.id}</td>
                        <td className="p-3 text-gray-800">{cli?.nome || 'N/A'}</td>
                        <td className="p-3 text-gray-600 text-sm">{new Date(o.data).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3 text-blue-600 font-medium">
                          {o.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            type="button"
                            onClick={() => handleImportOrcamento(o)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Importar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {data.orcamentos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">Nenhum orçamento encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="pt-2 flex justify-end">
            <button 
              type="button" 
              onClick={() => setIsImportModalOpen(false)}
              className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        isAlert={confirmDialog.isAlert}
        confirmText={confirmDialog.confirmText || 'Confirmar'}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
