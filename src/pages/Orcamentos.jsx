import { useContext, useState, useRef, useEffect } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, MessageCircle, FileText, Trash2, Edit2, Search, UserPlus } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Orcamentos() {
  const { data, addOrcamento, updateOrcamento, deleteOrcamento, addCliente } = useContext(GlobalContext);
  
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
  const [quickClientForm, setQuickClientForm] = useState({ nome: '', telefone: '', cidade: '' });
  const CIDADES_ORC = ['Niterói', 'São Gonçalo', 'Itaboraí', 'Maricá'];

  // Toast State
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
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
      doc.text(`Data: ${new Date(orcamento.data).toLocaleDateString('pt-BR')}`, 140, 30);
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)] relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <MessageCircle size={18} className="text-green-400" />
          <span className="font-medium">{toastMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Orçamento
        </button>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600 text-sm">ID</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Cliente</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Data</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Total</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.orcamentos.map((orc) => {
              const cli = data.clientes.find(c => c.id === orc.clienteId);
              return (
                <tr key={orc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-gray-500 text-sm">#{orc.id}</td>
                  <td className="p-4 font-medium text-gray-800">{cli?.nome || 'N/A'}</td>
                  <td className="p-4 text-gray-600">
                    {new Date(orc.data).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 font-semibold text-blue-600">
                    {orc.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openModal(orc)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Orçamento"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleWhatsApp(orc)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Copiar para WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button 
                        onClick={() => handleGeneratePDF(orc)}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Gerar PDF"
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrcamento(orc.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir Orçamento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data.orcamentos.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">Nenhum orçamento gerado.</td>
              </tr>
            )}
          </tbody>
        </table>
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
                      const filtered = data.clientes.filter(c => c.nome.toLowerCase().includes(clienteSearch.toLowerCase()));
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
                {data.clientes.filter(c => c.nome.toLowerCase().includes(clienteSearch.toLowerCase())).map(c => (
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
                {data.clientes.filter(c => c.nome.toLowerCase().includes(clienteSearch.toLowerCase())).length === 0 && (
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
              razaoSocial: '',
              cnpj: '',
              ie: '',
              telefone: quickClientForm.telefone,
              email: '',
              endereco: '',
              bairro: '',
              cidade: quickClientForm.cidade,
              consumoMensal: '',
              proximoContato: '',
              statusCrm: 'Lead',
              observacoes: ''
            });
            // Seleciona automaticamente o cliente recém-criado
            setTimeout(() => {
              const novoCliente = data.clientes.find(c => c.nome === quickClientForm.nome);
              if (novoCliente) {
                setClienteId(novoCliente.id.toString());
                setClienteSearch(novoCliente.nome);
              } else {
                setClienteSearch(quickClientForm.nome);
              }
            }, 100);
            setIsQuickClientOpen(false);
            showToast(`Cliente "${quickClientForm.nome}" cadastrado!`);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              type="text" required autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={quickClientForm.nome}
              onChange={(e) => setQuickClientForm({ ...quickClientForm, nome: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text" autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              value={quickClientForm.telefone}
              onChange={(e) => setQuickClientForm({ ...quickClientForm, telefone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white"
              value={quickClientForm.cidade}
              onChange={(e) => setQuickClientForm({ ...quickClientForm, cidade: e.target.value })}
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
