import { useContext, useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { GlobalContext, normalizeSearch } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, MessageCircle, FileText, Trash2, Edit2, Search, UserPlus, CheckSquare, ArrowLeft, User, ShoppingCart } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Orcamentos() {
  const { data, addOrcamento, updateOrcamento, deleteOrcamento, addCliente } = useContext(GlobalContext);
  const location = useLocation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  
  // Form State
  const [clienteId, setClienteId] = useState('');
  const [clienteSearch, setClienteSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Dynamic Fast-Entry State
  const [produtoCodigo, setProdutoCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [itens, setItens] = useState([]);

  // Refs for Fast-Entry
  const codigoRef = useRef(null);
  const qtdRef = useRef(null);
  const precoRef = useRef(null);

  // Quick Client State
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);
  const [quickClientForm, setQuickClientForm] = useState({ nome: '', contato: '', telefone: '', cidade: '' });
  const CIDADES_ORC = ['Niterói', 'São Gonçalo', 'Itaboraí', 'Maricá'];

  // Toast State
  const [toastMsg, setToastMsg] = useState('');
  
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState(null);
  const [orcamentoSearch, setOrcamentoSearch] = useState('');
  const [displayedCount, setDisplayedCount] = useState(10);

  useEffect(() => {
    setDisplayedCount(10);
  }, [orcamentoSearch]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setDisplayedCount(prev => prev + 10);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const maskTelefone = (value) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      return v
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };



  const valorTotalOrcamento = itens.reduce((acc, item) => acc + item.subtotal, 0);

  const openModal = (orcamento = null) => {
    if (orcamento) {
      setEditingOrcamento(orcamento);
      setClienteId(orcamento.clienteId.toString());
      const c = data.clientes.find(cli => cli.id === orcamento.clienteId);
      setClienteSearch(c ? c.nome : '');
      setItens(orcamento.itens);
    } else {
      setEditingOrcamento(null);
      setClienteId('');
      setClienteSearch('');
      setItens([]);
    }
    setProdutoCodigo('');
    setQuantidade('');
    setPrecoUnitario('');
    setIsModalOpen(true);
  };

  // Foco automático na quantidade quando o modal abrir
  useEffect(() => {
    if (isModalOpen && qtdRef.current) {
      setTimeout(() => qtdRef.current.focus(), 100);
    }
  }, [isModalOpen]);

  // Pré-selecionar cliente vindo do Mapa de Domínio
  useEffect(() => {
    const clienteId = location.state?.clientePreSelecionado;
    if (clienteId) {
      const cliente = data.clientes.find(c => c.id === clienteId);
      if (cliente) {
        setEditingOrcamento(null);
        setClienteId(cliente.id.toString());
        setClienteSearch(cliente.nome);
        setItens([]);
        setProdutoCodigo('');
        setQuantidade('');
        setPrecoUnitario('');
        setIsModalOpen(true);
        // Limpa o state para não reabrir ao navegar de volta
        window.history.replaceState({}, '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const [currentIsDiscounted, setCurrentIsDiscounted] = useState(false);

  const handleCodigoChange = (e) => {
    const code = e.target.value;
    setProdutoCodigo(code);
    const produto = data.produtos.find(p => p.codigo === code || p.id.toString() === code);
    if (produto) {
      // Busca preço especial na aba Descontos (clienteId + produtoId)
      const desconto = (data.descontos || []).find(
        d => d.clienteId === parseInt(clienteId) && d.produtoId === produto.id
      );
      if (desconto) {
        setPrecoUnitario(desconto.preco.toString());
        setCurrentIsDiscounted(true);
      } else {
        setPrecoUnitario(produto.preco.toString());
        setCurrentIsDiscounted(false);
      }
    } else {
      setPrecoUnitario('');
      setCurrentIsDiscounted(false);
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
    
    // Verifica se o preço atual é menor que o padrão (desconto)
    const temDesconto = precoNum < produto.preco;

    // Check se já existe na lista e soma
    const itemExistente = itens.find(i => i.produtoId === produto.id && i.preco === precoNum);
    if (itemExistente) {
      setItens(itens.map(i => 
        i.produtoId === produto.id && i.preco === precoNum
          ? { ...i, quantidade: i.quantidade + qtdNum, subtotal: i.subtotal + subtotal, temDesconto } 
          : i
      ));
    } else {
      setItens([...itens, {
        produtoId: produto.id,
        nome: produto.nome,
        preco: precoNum,
        quantidade: qtdNum,
        subtotal,
        temDesconto
      }]);
    }

    setProdutoCodigo('');
    setQuantidade('');
    setPrecoUnitario('');
    setCurrentIsDiscounted(false);
    return true; // Sucesso
  };

  const handleQtdKeyDown = (e) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault(); // Previne o comportamento padrão (pular para outro campo ou enviar form)
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
      // Allows typing intermediate values like "10.", so we might want to store a string for input
      // but to keep it simple, we'll try parsing. If user types "10", it's 10.
      item.preco = parseFloat(value.toString().replace(',', '.')) || 0;
    }
    
    item.subtotal = item.quantidade * item.preco;
    newItens[index] = item;
    setItens(newItens);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clienteId || itens.length === 0) {
      setConfirmDialog({ isOpen: true, title: 'Atenção', message: 'Selecione um cliente e adicione pelo menos um item.', isAlert: true });
      return;
    }

    if (editingOrcamento) {
      updateOrcamento(editingOrcamento.id, {
        clienteId: parseInt(clienteId),
        itens,
        valorTotal: valorTotalOrcamento
      });
    } else {
      // Usar data local sem problemas de timezone
      const hoje = new Date();
      const dataLocal = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
      addOrcamento({
        clienteId: parseInt(clienteId),
        data: dataLocal,
        itens,
        valorTotal: valorTotalOrcamento
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteOrcamento = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Orçamento',
      message: 'Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.',
      isDestructive: true,
      onConfirm: () => {
        deleteOrcamento(id);
        setConfirmDialog({ isOpen: false });
        showToast('Orçamento excluído com sucesso!');
      }
    });
  };

  const handleWhatsApp = (orcamento) => {
    const cliente = data.clientes.find(c => c.id === orcamento.clienteId);
    const dataFormatada = new Date(orcamento.data).toLocaleDateString('pt-BR');
    
    let msg = `*Orçamento ${cliente?.nome || 'Cliente'}* - ${dataFormatada}\n\n`;
    orcamento.itens.forEach(item => {
      msg += `${item.quantidade}x ${item.nome} - ${item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    });
    msg += `\n*Total: ${orcamento.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*`;

    navigator.clipboard.writeText(msg).then(() => {
      showToast('Copiado para a área de transferência!');
    }).catch(() => {
      setConfirmDialog({ isOpen: true, title: 'Erro', message: 'Erro ao copiar para área de transferência.', isAlert: true, isDestructive: true });
    });
  };

  const handleGeneratePDF = (orcamento) => {
    try {
      const doc = new jsPDF();
      const cliente = data.clientes.find(c => c.id === orcamento.clienteId);
      
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("CHEVALIER", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text("Gestão de vendas", 14, 30);
      
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("ORÇAMENTO", 140, 22);
      doc.setFontSize(10);
      doc.text(`Data: ${orcamento.data ? orcamento.data.split('-').reverse().join('/') : '-'}`, 140, 30);
      doc.text(`ID: #${orcamento.id}`, 140, 36);
      
      doc.setDrawColor(200);
      doc.line(14, 42, 196, 42);
      
      doc.setFontSize(11);
      doc.setTextColor(60);
      doc.text("DADOS DO CLIENTE:", 14, 52);
      doc.setFontSize(10);
      doc.text(`Nome: ${cliente?.nome || 'N/A'}`, 14, 60);
      doc.text(`Documento: ${cliente?.cnpj || 'N/A'}`, 14, 66);
      doc.text(`Telefone: ${cliente?.telefone || 'N/A'}`, 14, 72);
      
      const tableColumn = ["Item", "Qtd", "Valor Unit.", "Subtotal"];
      autoTable(doc, {
        startY: 85,
        head: [tableColumn],
        body: orcamento.itens.map(item => [
          item.nome,
          item.quantidade.toString(),
          { 
            content: item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            styles: item.temDesconto ? { textColor: [37, 99, 235], fontStyle: 'bold' } : {}
          },
          item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        ]),
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 5 },
      });

      const finalY = doc.lastAutoTable.finalY || 85;
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(`Total: ${orcamento.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 140, finalY + 15);
      
      doc.save(`Orcamento_${cliente?.nome?.replace(/\s+/g, '_') || 'Cliente'}.pdf`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setConfirmDialog({ isOpen: true, title: 'Erro', message: 'Ocorreu um erro ao gerar o PDF. Verifique o console.', isAlert: true, isDestructive: true });
    }
  };

  const filteredOrcamentos = data.orcamentos.filter(orc => {
    const cli = data.clientes.find(c => c.id === orc.clienteId);
    const termo = normalizeSearch(orcamentoSearch);
    return normalizeSearch(orc.id).includes(termo) || (cli && normalizeSearch(cli.nome).includes(termo));
  }).sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  const visibleOrcamentos = filteredOrcamentos.slice(0, displayedCount);
  const selectedOrcamento = data.orcamentos.find(o => o.id === selectedOrcamentoId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <MessageCircle size={18} className="text-green-400" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      {/* Painel Esquerdo: Lista de Orçamentos */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedOrcamentoId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Orçamentos</h1>
            <button 
              onClick={() => openModal()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              title="Novo Orçamento"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por ID ou cliente..."
              value={orcamentoSearch}
              onChange={(e) => setOrcamentoSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1" onScroll={handleScroll}>
          {visibleOrcamentos.map(orc => {
            const cli = data.clientes.find(c => c.id === orc.clienteId);
            return (
              <button
                key={orc.id}
                onClick={() => setSelectedOrcamentoId(orc.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedOrcamentoId === orc.id 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${selectedOrcamentoId === orc.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                    #{orc.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{cli?.nome || 'N/A'}</p>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className={`text-[10px] uppercase tracking-wider truncate ${selectedOrcamentoId === orc.id ? 'text-blue-100' : 'text-gray-400'}`}>
                        {orc.data ? orc.data.split('-').reverse().join('/') : '-'}
                      </p>
                      <p className={`text-xs font-bold ${selectedOrcamentoId === orc.id ? 'text-white' : 'text-blue-600'}`}>
                        {orc.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {visibleOrcamentos.length < filteredOrcamentos.length && (
            <button
              onClick={() => setDisplayedCount(prev => prev + 10)}
              className="w-full py-3 mt-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              Carregar mais...
            </button>
          )}
          {filteredOrcamentos.length === 0 && (
             <div className="text-center p-4 text-gray-500 text-sm">Nenhum orçamento encontrado.</div>
          )}
        </div>
      </div>

      {/* Painel Direito: Detalhes do Orçamento */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedOrcamentoId ? 'hidden md:flex' : 'flex'}`}>
        {selectedOrcamento ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedOrcamentoId(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Orçamento #{selectedOrcamento.id}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest">
                    {selectedOrcamento.data ? selectedOrcamento.data.split('-').reverse().join('/') : '-'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleWhatsApp(selectedOrcamento)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Copiar para WhatsApp"
                >
                  <MessageCircle size={18} />
                </button>
                <button 
                  onClick={() => handleGeneratePDF(selectedOrcamento)}
                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Gerar PDF"
                >
                  <FileText size={18} />
                </button>
                <button
                  onClick={() => openModal(selectedOrcamento)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar Orçamento"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    handleDeleteOrcamento(selectedOrcamento.id);
                    setSelectedOrcamentoId(null);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir Orçamento"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30 space-y-6">
              {/* Cliente Info */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={14} /> Dados do Cliente
                </h3>
                {(() => {
                  const cli = data.clientes.find(c => c.id === selectedOrcamento.clienteId);
                  return (
                    <div>
                      <p className="font-bold text-gray-800 text-lg mb-1">{cli?.nome || 'N/A'}</p>
                      <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {cli?.telefone && <p><span className="font-medium text-gray-500">Telefone:</span> {cli.telefone}</p>}
                        {cli?.cidade && <p><span className="font-medium text-gray-500">Localidade:</span> {cli.cidade} {cli.bairro ? `- ${cli.bairro}` : ''}</p>}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Itens */}
              <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShoppingCart size={14} /> Itens do Orçamento
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 border-y border-gray-100">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Produto</th>
                        <th className="px-4 py-2 font-semibold text-center">Qtd</th>
                        <th className="px-4 py-2 font-semibold text-right">Unitário</th>
                        <th className="px-4 py-2 font-semibold text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrcamento.itens.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.nome}</td>
                          <td className="px-4 py-3 text-center text-gray-600 bg-gray-50/30">{item.quantidade}</td>
                          <td className={`px-4 py-3 text-right text-gray-600 ${item.temDesconto ? 'font-bold text-blue-600' : ''}`}>
                            {item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-700">
                            {item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totais */}
              <div className="flex justify-end">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 min-w-[200px]">
                  <p className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1 text-right">
                    Total do Orçamento
                  </p>
                  <p className="text-2xl font-black text-blue-700 text-right">
                    {selectedOrcamento.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileText size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione um orçamento</h2>
            <p className="text-gray-500 max-w-sm text-sm">
              Escolha um orçamento na lista ao lado para visualizar os detalhes, itens e opções disponíveis.
            </p>
          </div>
        )}
      </div>

      {/* Modal Novo/Editar Orçamento */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingOrcamento ? "Editar Orçamento" : "Novo Orçamento"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Cliente */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setClienteId('');
                    setIsDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && isDropdownOpen) {
                      const filtered = data.clientes.filter(c => normalizeSearch(c.nome).includes(normalizeSearch(clienteSearch)));
                      if (filtered.length > 0) {
                        e.preventDefault();
                        setClienteId(filtered[0].id.toString());
                        setClienteSearch(filtered[0].nome);
                        setIsDropdownOpen(false);
                        if (qtdRef.current) qtdRef.current.focus();
                      }
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <button
                type="button"
                onClick={() => { setQuickClientForm({ nome: clienteSearch, telefone: '', cidade: '' }); setIsQuickClientOpen(true); }}
                title="Cadastrar novo cliente rapidamente"
                className="flex items-center gap-1.5 px-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-emerald-600/20 whitespace-nowrap"
              >
                <UserPlus size={16} />
                Novo
              </button>
            </div>
            
            {isDropdownOpen && (
              <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {data.clientes.filter(c => normalizeSearch(c.nome).includes(normalizeSearch(clienteSearch))).map(c => (
                  <li 
                    key={c.id}
                    onClick={() => {
                      setClienteId(c.id.toString());
                      setClienteSearch(c.nome);
                      setIsDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
                  >
                    {c.nome}
                  </li>
                ))}
                {data.clientes.filter(c => normalizeSearch(c.nome).includes(normalizeSearch(clienteSearch))).length === 0 && (
                  <li className="px-4 py-2 text-sm text-gray-500 text-center">Nenhum cliente encontrado</li>
                )}
              </ul>
            )}
          </div>

          {/* Adição de Produtos Estilo Fast-Entry (ERP SIC) */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              Lançamento Rápido
            </h3>
            <div className="flex flex-col md:flex-row gap-3 items-end bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade</label>
                <input 
                  type="number" 
                  min="1"
                  ref={qtdRef}
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  onKeyDown={handleQtdKeyDown}
                  placeholder="Ex: 1000"
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono"
                />
              </div>
              <div className="w-full md:w-1/3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Cód. Produto</label>
                <input 
                  type="text" 
                  ref={codigoRef}
                  value={produtoCodigo}
                  onChange={handleCodigoChange}
                  onKeyDown={handleCodigoKeyDown}
                  placeholder="Ex: PROD-1"
                  autoComplete="off"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none font-mono"
                />
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Vlr. Unitário</label>
                <input 
                  type="text" 
                  ref={precoRef}
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(e.target.value)}
                  onKeyDown={handlePrecoKeyDown}
                  placeholder="0.00"
                  autoComplete="off"
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 outline-none font-mono transition-all ${currentIsDiscounted ? 'border-blue-300 bg-blue-50 text-blue-700 focus:ring-blue-500/20 focus:border-blue-600' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-600'}`}
                />
              </div>
              <button 
                type="button"
                onClick={() => {
                  const sucesso = handleAddItem();
                  if (sucesso && qtdRef.current) qtdRef.current.focus();
                }}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors w-full md:w-auto h-[42px]"
              >
                Adicionar
              </button>
            </div>

            {/* Dica de usabilidade */}
            <p className="text-xs text-gray-500 mt-3 ml-1">
              <strong>Dica:</strong> Digite a Qtd, aperte TAB, digite o Código, aperte TAB, verifique/altere o Preço e aperte TAB para adicionar e voltar ao início.
            </p>

            {/* Tabela de Referência Oculta ou Visível (Opcional, mas útil para ver os IDs) */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <details className="text-xs text-gray-500 mb-4 cursor-pointer">
                <summary className="font-medium hover:text-gray-700">Ver códigos dos produtos disponíveis</summary>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 bg-white p-3 rounded border border-gray-100">
                  {data.produtos.map(p => (
                    <div key={p.id} className="flex justify-between">
                      <span className="font-mono text-gray-800 font-medium">{p.codigo || p.id}</span>
                      <span className="truncate ml-2" title={p.nome}>{p.nome}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* Lista de Itens */}
              {itens.length > 0 && (
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
                          <td className={`px-4 py-3 text-right font-medium ${item.temDesconto ? 'text-blue-600 bg-blue-50/30' : 'text-gray-700'}`}>
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
              )}
            </div>

            <div className="mt-5 flex justify-end items-center bg-blue-50/50 p-4 rounded-lg border border-blue-100">
              <span className="text-sm font-semibold text-blue-800 mr-3 uppercase tracking-wider">Total Final:</span>
              <span className="font-bold text-2xl text-blue-700">
                {valorTotalOrcamento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
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
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-600/20"
            >
              {editingOrcamento ? "Atualizar Orçamento" : "Salvar Orçamento"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        isAlert={confirmDialog.isAlert}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Modal Cadastro Rápido de Cliente */}
      <Modal
        isOpen={isQuickClientOpen}
        onClose={() => setIsQuickClientOpen(false)}
        title="Cadastro Rápido de Cliente"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!quickClientForm.nome.trim()) return;
            addCliente({
              nome: quickClientForm.nome,
              contato: quickClientForm.contato,
              razaoSocial: '',
              cnpj: '',
              ie: '',
              telefone: quickClientForm.telefone,
              email: '',
              endereco: '',
              bairro: '',
              cidade: quickClientForm.cidade,
              statusCrm: 'Lead'
            });
            setIsQuickClientOpen(false);
            setQuickClientForm({ nome: '', contato: '', telefone: '', cidade: '' });
            showToast('Cliente cadastrado e pronto para uso!');
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pizzaria / Cliente *</label>
            <input 
              type="text" required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={quickClientForm.nome} onChange={(e) => setQuickClientForm({...quickClientForm, nome: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={quickClientForm.contato} onChange={(e) => setQuickClientForm({...quickClientForm, contato: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input 
                type="text"
                autoComplete="off"
                placeholder="(xx) xxxxx-xxxx"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={quickClientForm.telefone} onChange={(e) => setQuickClientForm({...quickClientForm, telefone: maskTelefone(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
              value={quickClientForm.cidade} onChange={(e) => setQuickClientForm({...quickClientForm, cidade: e.target.value})}
            >
              <option value="">Selecione...</option>
              {CIDADES_ORC.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setIsQuickClientOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-all shadow-md shadow-emerald-600/20">Cadastrar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
