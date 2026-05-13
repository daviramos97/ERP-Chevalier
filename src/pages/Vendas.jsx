import { useContext, useState, useRef, useEffect } from 'react';
import { GlobalContext, normalizeSearch } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Download, Trash2, ShoppingCart, Search, Edit2, Eye, Copy, Image, ArrowLeft, User } from 'lucide-react';

// Retorna a data/hora local no formato yyyy-MM-ddTHH:mm (sem conversão UTC)
const localDateTimeStr = () => {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function Vendas() {
  const { data, addVenda, updateVenda, deleteVenda } = useContext(GlobalContext);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenda, setEditingVenda] = useState(null);
  const [selectedVendaId, setSelectedVendaId] = useState(null);
  const [vendaSearch, setVendaSearch] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSearchTerm, setImportSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  
  // Form State
  const [orcamentoOrigemId, setOrcamentoOrigemId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [vendaDataHora, setVendaDataHora] = useState(() => localDateTimeStr());
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
      // Converte a data salva (ISO UTC) para string local sem desvio de fuso
      const d = new Date(venda.dataHora);
      const pad = n => String(n).padStart(2, '0');
      setVendaDataHora(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setItens([...venda.itens]);
    } else {
      setEditingVenda(null);
      setOrcamentoOrigemId('');
      setClienteId('');
      setComissaoPercentual(5);
      setVendaDataHora(localDateTimeStr());
      setItens([]);
    }
    setProdutoCodigo('');
    setQuantidade('');
    setPrecoUnitario('');
    setIsModalOpen(true);
  };

  // Duplicar venda: copia itens/cliente/comissão mas reseta data para agora e desvincula orçamento
  const openDuplicateModal = (venda) => {
    setEditingVenda(null);
    setOrcamentoOrigemId('');
    setClienteId(venda.clienteId.toString());
    setComissaoPercentual(venda.comissaoPercentual);
    setVendaDataHora(localDateTimeStr());
    setItens(venda.itens.map(item => ({ ...item })));
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

  // Gerar imagem JPG do pedido para envio à fábrica (sem comissão)
  const generateOrderImage = (venda) => {
    const cliente = data.clientes.find(c => c.id === venda.clienteId);
    const nomeCliente = cliente?.nome || 'N/A';
    const dataFormatada = new Date(venda.dataHora).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });

    const PADDING = 40;
    const WIDTH = 680;
    const ROW_H = 36;
    const HEADER_H = 160;
    const TABLE_HEADER_H = 38;
    const FOOTER_H = 70;
    const totalHeight = HEADER_H + TABLE_HEADER_H + (venda.itens.length * ROW_H) + FOOTER_H + PADDING;

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH * 2;   // retina
    canvas.height = totalHeight * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);

    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, totalHeight);

    // Barra de cabeçalho azul
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 0, WIDTH, 80);

    // Logo / título
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, Arial';
    ctx.fillText('CHEVALIER', PADDING, 32);
    ctx.font = '11px system-ui, Arial';
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText('PEDIDO DE FABRICAÇÃO', PADDING, 50);

    // Número do pedido
    ctx.font = 'bold 18px system-ui, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`Pedido #${venda.id}`, WIDTH - PADDING, 32);
    ctx.font = '11px system-ui, Arial';
    ctx.fillStyle = '#bfdbfe';
    ctx.fillText(dataFormatada, WIDTH - PADDING, 50);
    ctx.textAlign = 'left';

    // Borda inferior do cabeçalho
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(0, 80, WIDTH, 4);

    // Bloco de cliente
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(PADDING, 96, WIDTH - PADDING * 2, 50);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING, 96, WIDTH - PADDING * 2, 50);

    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 9px system-ui, Arial';
    ctx.fillText('CLIENTE', PADDING + 14, 113);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 15px system-ui, Arial';
    ctx.fillText(nomeCliente, PADDING + 14, 132);

    // Cabeçalho da tabela
    const tableTop = HEADER_H;
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(PADDING, tableTop, WIDTH - PADDING * 2, TABLE_HEADER_H);

    const cols = [0, 0.45, 0.62, 0.78, 1.0]; // frações da largura
    const tableW = WIDTH - PADDING * 2;
    const headers = ['Produto', 'Qtd', 'Unitário', 'Subtotal'];
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px system-ui, Arial';
    headers.forEach((h, i) => {
      const x = PADDING + tableW * cols[i] + 10;
      const align = i > 0 ? 'right' : 'left';
      if (align === 'right') {
        ctx.textAlign = 'right';
        ctx.fillText(h, PADDING + tableW * cols[i + 1] - 10, tableTop + 24);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(h, x, tableTop + 24);
      }
    });
    ctx.textAlign = 'left';

    // Linhas da tabela
    venda.itens.forEach((item, idx) => {
      const y = tableTop + TABLE_HEADER_H + idx * ROW_H;
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(PADDING, y, tableW, ROW_H);

      // Linha separadora
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING, y + ROW_H);
      ctx.lineTo(PADDING + tableW, y + ROW_H);
      ctx.stroke();

      ctx.fillStyle = '#111827';
      ctx.font = '12px system-ui, Arial';
      ctx.fillText(item.nome, PADDING + 10, y + 23);

      const qtd = item.quantidade.toString();
      const unit = item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      const sub = item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      ctx.textAlign = 'right';
      ctx.fillText(qtd, PADDING + tableW * cols[2] - 10, y + 23);
      ctx.fillText(unit, PADDING + tableW * cols[3] - 10, y + 23);
      ctx.font = 'bold 12px system-ui, Arial';
      ctx.fillStyle = '#1d4ed8';
      ctx.fillText(sub, PADDING + tableW - 10, y + 23);
      ctx.textAlign = 'left';
    });

    // Borda da tabela
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    const tableBottom = tableTop + TABLE_HEADER_H + venda.itens.length * ROW_H;
    ctx.strokeRect(PADDING, tableTop, tableW, TABLE_HEADER_H + venda.itens.length * ROW_H);

    // Footer: total
    const footerY = tableBottom + 16;
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(PADDING + tableW - 220, footerY, 220, 42);
    ctx.fillStyle = '#bfdbfe';
    ctx.font = 'bold 10px system-ui, Arial';
    ctx.textAlign = 'right';
    ctx.fillText('TOTAL DO PEDIDO', PADDING + tableW - 14, footerY + 15);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px system-ui, Arial';
    ctx.fillText(
      venda.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      PADDING + tableW - 14, footerY + 34
    );
    ctx.textAlign = 'left';

    // Download
    const link = document.createElement('a');
    link.download = `Pedido_${nomeCliente.replace(/\s+/g, '_')}_${venda.id}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const handleImportOrcamento = (orcamento) => {
    if (!orcamento) {
      setOrcamentoOrigemId('');
      setItens([]);
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
      // Busca preço especial na aba Descontos (clienteId + produtoId)
      const desconto = (data.descontos || []).find(
        d => d.clienteId === parseInt(clienteId) && d.produtoId === produto.id
      );
      setPrecoUnitario(desconto ? desconto.preco.toString() : produto.preco.toString());
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

  const filteredVendas = data.vendas.filter(v => {
    const cli = data.clientes.find(c => c.id === v.clienteId);
    const termo = normalizeSearch(vendaSearch);
    return normalizeSearch(v.id).includes(termo) || (cli && normalizeSearch(cli.nome).includes(termo));
  }).sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));

  const selectedVenda = data.vendas.find(v => v.id === selectedVendaId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden">
      
      {/* Painel Esquerdo: Lista de Vendas */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedVendaId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Vendas</h1>
            <button 
              onClick={() => openModal()}
              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-sm"
              title="Registrar Venda"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por ID ou cliente..."
              value={vendaSearch}
              onChange={(e) => setVendaSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none bg-white text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredVendas.map(venda => {
            const cli = data.clientes.find(c => c.id === venda.clienteId);
            return (
              <button
                key={venda.id}
                onClick={() => setSelectedVendaId(venda.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  selectedVendaId === venda.id 
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/20' 
                    : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${selectedVendaId === venda.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                    #{venda.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{cli?.nome || 'N/A'}</p>
                    <div className="flex justify-between items-center mt-0.5">
                      <p className={`text-[10px] uppercase tracking-wider truncate ${selectedVendaId === venda.id ? 'text-green-100' : 'text-gray-400'}`}>
                        {new Date(venda.dataHora).toLocaleDateString('pt-BR')}
                      </p>
                      <p className={`text-xs font-bold ${selectedVendaId === venda.id ? 'text-white' : 'text-green-600'}`}>
                        {venda.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filteredVendas.length === 0 && (
             <div className="text-center p-4 text-gray-500 text-sm">Nenhuma venda encontrada.</div>
          )}
        </div>
      </div>

      {/* Painel Direito: Detalhes da Venda */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedVendaId ? 'hidden md:flex' : 'flex'}`}>
        {selectedVenda ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedVendaId(null)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Pedido #{selectedVenda.id}
                    {selectedVenda.orcamentoOrigemId && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] uppercase font-bold rounded-full">
                        ORÇ #{selectedVenda.orcamentoOrigemId}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-widest">
                    {new Date(selectedVenda.dataHora).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateOrderImage(selectedVenda)}
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Gerar Pedido"
                >
                  <Image size={18} />
                </button>
                <button
                  onClick={() => openDuplicateModal(selectedVenda)}
                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Duplicar Pedido"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => openModal(selectedVenda)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar Venda"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteVenda(selectedVenda.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir Venda"
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
                  const cli = data.clientes.find(c => c.id === selectedVenda.clienteId);
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
                  <ShoppingCart size={14} /> Itens do Pedido
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
                      {selectedVenda.itens.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{item.nome}</td>
                          <td className="px-4 py-3 text-center text-gray-600 bg-gray-50/30">{item.quantidade}</td>
                          <td className="px-4 py-3 text-right text-gray-600">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">
                    Comissão ({selectedVenda.comissaoPercentual}%)
                  </p>
                  <p className="text-2xl font-black text-orange-600">
                    {selectedVenda.valorComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
                  <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">
                    Total da Venda
                  </p>
                  <p className="text-2xl font-black text-green-700">
                    {selectedVenda.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione uma venda</h2>
            <p className="text-gray-500 max-w-sm text-sm">
              Escolha uma venda na lista ao lado para visualizar os detalhes, itens do pedido e opções disponíveis.
            </p>
          </div>
        )}
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
                {(() => {
                  const filtered = data.orcamentos.filter(o => {
                    const cli = data.clientes.find(c => c.id === o.clienteId);
                    const term = normalizeSearch(importSearchTerm);
                    return normalizeSearch(o.id).includes(term) || (cli && normalizeSearch(cli.nome).includes(term));
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">Nenhum orçamento encontrado.</td>
                      </tr>
                    );
                  }

                  return filtered.map(o => {
                    const cli = data.clientes.find(c => c.id === o.clienteId);
                    const vinculada = data.vendas.find(v => v.orcamentoOrigemId === o.id);
                    return (
                      <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-3 text-gray-500 text-sm">
                          #{o.id}
                          {vinculada && (
                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded uppercase">Convertido</span>
                          )}
                        </td>
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
                  });
                })()}
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
