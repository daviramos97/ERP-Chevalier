import { useContext, useState, useEffect } from 'react';
import { GlobalContext, normalizeSearch } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, Ban, CheckCircle2, ChevronLeft, ChevronRight, History, ShoppingCart, Search, ArrowLeft, User } from 'lucide-react';

export function Clientes() {
  const { data, addCliente, updateCliente, deleteCliente, toggleStatusCliente } = useContext(GlobalContext);
  
  // Modals & Drawers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Action Dialogs State
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
  
  // Selected Client State
  const [editingCliente, setEditingCliente] = useState(null);
  const [selectedClienteId, setSelectedClienteId] = useState(null);
  
  const [clienteSearch, setClienteSearch] = useState('');
  const [displayedCount, setDisplayedCount] = useState(10);

  useEffect(() => {
    setDisplayedCount(10);
  }, [clienteSearch]);

  const handleScroll = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      setDisplayedCount(prev => prev + 10);
    }
  };
  
  // Form State
  const STATUS_CONFIG = {
    'Lead':             { color: 'bg-purple-100 text-purple-700' },
    'Amostra Entregue': { color: 'bg-blue-100 text-blue-700' },
    'Em Negociação':    { color: 'bg-yellow-100 text-yellow-700' },
    'Ativo':            { color: 'bg-green-100 text-green-700' },
    'Inativo':          { color: 'bg-gray-100 text-gray-500' },
  };
  const STATUS_OPTIONS = Object.keys(STATUS_CONFIG);
  const CIDADES = ['Niterói', 'São Gonçalo', 'Itaboraí', 'Maricá'];
  const FREQUENCIAS = ['Semanal', 'Quinzenal', 'Esporádico'];
  const DIAS_ENTREGA = ['Quarta-feira', 'Quinta-feira'];

  const initialForm = {
    nome: '', contato: '', razaoSocial: '', cnpj: '', ie: '', telefone: '', email: '',
    endereco: '', bairro: '', cidade: '',
    statusCrm: 'Lead', frequenciaCompra: '', volumeMedioPedido: '', diaEntrega: '',
    observacoes: ''
  };
  const [formData, setFormData] = useState(initialForm);
  

  // Mascaramento
  const maskCnpjCpf = (value) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return v
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 18);
    }
  };

  const maskIE = (value) => {
    return value.replace(/\D/g, "").slice(0, 15); // IE varia por estado, mantemos apenas números
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

  // Handlers
  const openModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nome: cliente.nome,
        contato: cliente.contato || '',
        razaoSocial: cliente.razaoSocial || '',
        cnpj: cliente.cnpj || '',
        ie: cliente.ie || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        endereco: cliente.endereco || '',
        bairro: cliente.bairro || '',
        cidade: cliente.cidade || '',
        statusCrm: cliente.statusCrm || 'Lead',
        frequenciaCompra: cliente.frequenciaCompra || '',
        volumeMedioPedido: cliente.volumeMedioPedido || '',
        diaEntrega: cliente.diaEntrega || '',
        observacoes: cliente.observacoes || ''
      });
    } else {
      setEditingCliente(null);
      setFormData(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCliente) {
      updateCliente(editingCliente.id, formData);
    } else {
      addCliente(formData);
    }
    setIsModalOpen(false);
  };

  const handleActionClick = (e, actionType, cliente) => {
    e.stopPropagation(); // Evitar abrir o drawer ao clicar nas ações
    if (actionType === 'edit') {
      openModal(cliente);
    } else if (actionType === 'toggle') {
      const isAtivo = cliente.status === 'Ativo';
      setConfirmDialog({
        isOpen: true,
        type: 'toggle',
        id: cliente.id,
        title: isAtivo ? 'Inativar Cliente' : 'Ativar Cliente',
        message: `Tem certeza que deseja ${isAtivo ? 'inativar' : 'ativar'} o cliente ${cliente.nome}?`
      });
    } else if (actionType === 'delete') {
      setConfirmDialog({
        isOpen: true,
        type: 'delete',
        id: cliente.id,
        title: 'Excluir Cliente',
        message: `Tem certeza que deseja excluir o cliente ${cliente.nome}? Esta ação não pode ser desfeita e removerá todo o histórico de compras.`
      });
    }
  };

  const confirmAction = () => {
    if (confirmDialog.type === 'toggle') {
      toggleStatusCliente(confirmDialog.id);
    } else if (confirmDialog.type === 'delete') {
      deleteCliente(confirmDialog.id);
    }
  };

  const openHistory = (cliente) => {
    setSelectedClienteId(cliente.id);
  };

  const filteredClientes = data.clientes.filter(c =>
    normalizeSearch(c.nome).includes(normalizeSearch(clienteSearch)) ||
    normalizeSearch(c.cidade || '').includes(normalizeSearch(clienteSearch))
  ).sort((a, b) => a.nome.localeCompare(b.nome));

  const visibleClientes = filteredClientes.slice(0, displayedCount);
  const selectedCliente = data.clientes.find(c => c.id === selectedClienteId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden relative">
      
      {/* Painel Esquerdo: Lista de Clientes */}
      <div className={`w-full md:w-80 border-r border-gray-100 flex flex-col bg-gray-50/30 ${selectedClienteId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-gray-800">Clientes</h1>
            <button 
              onClick={() => openModal()}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
              title="Novo Cliente"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={clienteSearch}
              onChange={(e) => setClienteSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1" onScroll={handleScroll}>
          {visibleClientes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClienteId(c.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                selectedClienteId === c.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'hover:bg-white text-gray-700 hover:shadow-sm border border-transparent hover:border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${selectedClienteId === c.id ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                  {c.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{c.nome}</p>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className={`text-[10px] uppercase tracking-wider truncate ${selectedClienteId === c.id ? 'text-blue-100' : 'text-gray-400'}`}>
                      {c.cidade || 'Sem cidade'}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedClienteId === c.id ? 'bg-white/20 text-white' : STATUS_CONFIG[c.statusCrm]?.color || 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.statusCrm || 'Lead'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
          {visibleClientes.length < filteredClientes.length && (
            <button
              onClick={() => setDisplayedCount(prev => prev + 10)}
              className="w-full py-3 mt-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              Carregar mais...
            </button>
          )}
          {filteredClientes.length === 0 && (
             <div className="text-center p-4 text-gray-500 text-sm">Nenhum cliente encontrado.</div>
          )}
        </div>
      </div>

      {/* Painel Direito: Detalhes do Cliente */}
      <div className={`flex-1 flex flex-col bg-white ${!selectedClienteId ? 'hidden md:flex' : 'flex'}`}>
        {selectedCliente ? (() => {
          const clientSales = data.vendas
            .filter(v => v.clienteId === selectedCliente.id)
            .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
          const totalGasto = clientSales.reduce((acc, v) => acc + (v.valorTotal || 0), 0);

          return (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedClienteId(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-full text-gray-500"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      {selectedCliente.nome}
                    </h2>
                    <div className="flex gap-2 mt-1">
                      {selectedCliente.contato && (
                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">👤 {selectedCliente.contato}</span>
                      )}
                      {selectedCliente.telefone && (
                        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">📞 {selectedCliente.telefone}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleActionClick(e, 'edit', selectedCliente)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar Cliente"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={(e) => handleActionClick(e, 'toggle', selectedCliente)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedCliente.status === 'Ativo' 
                        ? 'text-orange-600 hover:bg-orange-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={selectedCliente.status === 'Ativo' ? 'Inativar Cliente' : 'Ativar Cliente'}
                  >
                    {selectedCliente.status === 'Ativo' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                  </button>
                  <button 
                    onClick={(e) => handleActionClick(e, 'delete', selectedCliente)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Cliente"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto bg-gray-50/30 space-y-6">
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total de Pedidos</p>
                    <p className="text-xl font-black text-gray-800 mt-1">{clientSales.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Gasto</p>
                    <p className="text-xl font-black text-blue-600 mt-1">{totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>

                {/* Logistica */}
                {(selectedCliente.frequenciaCompra || selectedCliente.volumeMedioPedido || selectedCliente.diaEntrega) && (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      Informações de Logística
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedCliente.frequenciaCompra && (
                        <div className="bg-indigo-50 p-3 rounded-xl text-center">
                          <p className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Frequência</p>
                          <p className="text-sm font-bold text-indigo-700 mt-0.5">{selectedCliente.frequenciaCompra}</p>
                        </div>
                      )}
                      {selectedCliente.volumeMedioPedido && (
                        <div className="bg-gray-50 p-3 rounded-xl text-center">
                          <p className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Volume Médio</p>
                          <p className="text-sm font-bold text-gray-700 mt-0.5">{selectedCliente.volumeMedioPedido} cx</p>
                        </div>
                      )}
                      {selectedCliente.diaEntrega && (
                        <div className="bg-emerald-50 p-3 rounded-xl text-center">
                          <p className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Entrega</p>
                          <p className="text-sm font-bold text-emerald-700 mt-0.5">{selectedCliente.diaEntrega.replace('-feira', '')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Endereço */}
                {selectedCliente.endereco && (
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <History size={12} /> Endereço
                    </h3>
                    <p className="text-sm text-blue-800 font-medium">
                      {selectedCliente.endereco}
                      {selectedCliente.bairro ? ` - ${selectedCliente.bairro}` : ''}
                      {selectedCliente.cidade ? ` - ${selectedCliente.cidade}` : ''}
                    </p>
                  </div>
                )}

                {/* Histórico */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-gray-400" />
                    Linha do Tempo de Compras
                  </h4>
                  
                  {clientSales.length > 0 ? (
                    <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-5 pb-4">
                      {clientSales.map((venda) => (
                        <div key={venda.id} className="relative">
                          <div className="absolute -left-[31px] bg-white border-2 border-blue-500 w-4 h-4 rounded-full mt-1 shadow-sm"></div>
                          
                          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Venda #{venda.id}</span>
                                <p className="text-xs text-gray-500 font-medium">
                                  {new Date(venda.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                              </div>
                              <span className="font-bold text-gray-900 text-sm">
                                {venda.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-gray-50">
                              {venda.itens.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-[11px]">
                                  <span className="text-gray-600"><span className="font-bold text-gray-400">{item.quantidade}x</span> {item.nome}</span>
                                  <span className="text-gray-400">{item.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <History size={32} className="mb-2 opacity-20" />
                      <p className="text-sm">Nenhuma compra registrada.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })() : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <User size={32} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Selecione um cliente</h2>
            <p className="text-gray-500 max-w-sm text-sm">
              Escolha um cliente na lista ao lado para visualizar os detalhes e o histórico de compras.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCliente ? "Editar Cliente" : "Novo Cliente"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Pizzaria / Cliente *</label>
              <input 
                type="text" required
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
              <input 
                type="text"
                autoComplete="off"
                placeholder="Com quem você fala?"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.contato} onChange={(e) => setFormData({...formData, contato: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input 
                type="text"
                autoComplete="off"
                placeholder="(xx) xxxxx-xxxx"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: maskTelefone(e.target.value)})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.razaoSocial} onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ / CPF</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: maskCnpjCpf(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.ie} onChange={(e) => setFormData({...formData, ie: maskIE(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input 
                type="email"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço (Rua / Número)</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: Avenida José Manna Junior, 400"
                value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.bairro} onChange={(e) => setFormData({...formData, bairro: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <select
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                value={formData.cidade} onChange={(e) => setFormData({...formData, cidade: e.target.value})}
              >
                <option value="">Selecione...</option>
                {CIDADES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Separador CRM */}
            <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-1">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Informações CRM &amp; Logística</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status do Cliente</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                    value={formData.statusCrm} onChange={(e) => setFormData({...formData, statusCrm: e.target.value})}
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequência de Compra</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                    value={formData.frequenciaCompra} onChange={(e) => setFormData({...formData, frequenciaCompra: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {FREQUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Volume Médio por Pedido <span className="text-gray-400 font-normal">(caixas)</span></label>
                  <input
                    type="number" min="0" autoComplete="off"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ex: 500"
                    value={formData.volumeMedioPedido} onChange={(e) => setFormData({...formData, volumeMedioPedido: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Entrega</label>
                  <select
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                    value={formData.diaEntrega} onChange={(e) => setFormData({...formData, diaEntrega: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {DIAS_ENTREGA.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea 
                rows="2"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                value={formData.observacoes} onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              ></textarea>
            </div>

          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md shadow-blue-600/20"
            >
              Salvar
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmAction}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.type === 'delete'}
        confirmText={confirmDialog.type === 'delete' ? 'Excluir' : confirmDialog.type === 'toggle' ? 'Confirmar' : 'Ok'}
      />

    </div>
  );
}
