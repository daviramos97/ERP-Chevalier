import { useContext, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Edit2, Trash2, Ban, CheckCircle2, ChevronLeft, ChevronRight, History, ShoppingCart } from 'lucide-react';

export function Clientes() {
  const { data, addCliente, updateCliente, deleteCliente, toggleStatusCliente } = useContext(GlobalContext);
  
  // Modals & Drawers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Action Dialogs State
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, type: '', id: null, title: '', message: '' });
  
  // Selected Client State
  const [editingCliente, setEditingCliente] = useState(null);
  const [selectedClienteHistory, setSelectedClienteHistory] = useState(null);
  
  // Form State
  const initialForm = { nome: '', razaoSocial: '', cnpj: '', ie: '', telefone: '', email: '', endereco: '', observacoes: '' };
  const [formData, setFormData] = useState(initialForm);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(data.clientes.length / itemsPerPage);
  const paginatedClientes = data.clientes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
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

  // Handlers
  const openModal = (cliente = null) => {
    if (cliente) {
      setEditingCliente(cliente);
      setFormData({
        nome: cliente.nome,
        razaoSocial: cliente.razaoSocial || '',
        cnpj: cliente.cnpj || '',
        ie: cliente.ie || '',
        telefone: cliente.telefone || '',
        email: cliente.email || '',
        endereco: cliente.endereco || '',
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
    setSelectedClienteHistory(cliente);
    setIsDrawerOpen(true);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600 text-sm">Nome</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Contato</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClientes.map((c) => (
              <tr 
                key={c.id} 
                onClick={() => openHistory(c)}
                className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
              >
                <td className="p-4">
                  <div className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">{c.nome}</div>
                  {c.cnpj && <div className="text-xs text-gray-500 mt-1">{c.cnpj}</div>}
                </td>
                <td className="p-4">
                  <div className="text-sm text-gray-700">{c.telefone || '-'}</div>
                  <div className="text-xs text-gray-500 mt-1">{c.email || '-'}</div>
                </td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    c.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => handleActionClick(e, 'edit', c)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => handleActionClick(e, 'toggle', c)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        c.status === 'Ativo' 
                          ? 'text-orange-600 hover:bg-orange-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={c.status === 'Ativo' ? 'Inativar' : 'Ativar'}
                    >
                      {c.status === 'Ativo' ? <Ban size={18} /> : <CheckCircle2 size={18} />}
                    </button>
                    <button 
                      onClick={(e) => handleActionClick(e, 'delete', c)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedClientes.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">Nenhum cliente cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, data.clientes.length)} de {data.clientes.length} clientes
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
              <input 
                type="text" required
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
              <input 
                type="text"
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                placeholder="Ex: Avenida Jose manna junior, 400"
                value={formData.endereco} onChange={(e) => setFormData({...formData, endereco: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea 
                rows="3"
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

      {/* Drawer Histórico de Compras */}
      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        title="Ficha do Cliente"
      >
        {selectedClienteHistory && (() => {
          const clientSales = data.vendas
            .filter(v => v.clienteId === selectedClienteHistory.id)
            .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
          
          const totalGasto = clientSales.reduce((acc, v) => acc + (v.valorTotal || 0), 0);

          return (
            <div className="h-full flex flex-col">
              {/* Cabeçalho com Resumo */}
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="font-bold text-xl text-gray-800">{selectedClienteHistory.nome}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-md">{selectedClienteHistory.cnpj || 'Sem CPF/CNPJ'}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${selectedClienteHistory.status === 'Ativo' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600'}`}>
                    {selectedClienteHistory.status}
                  </span>
                </div>
                
                {/* Stats Rápidas */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total de Pedidos</p>
                    <p className="text-lg font-black text-gray-800">{clientSales.length}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Gasto</p>
                    <p className="text-lg font-black text-blue-600">{totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  </div>
                </div>

                {selectedClienteHistory.endereco && (
                  <div className="mt-4 p-3 bg-blue-50/30 rounded-xl border border-blue-50 flex items-start gap-2">
                    <div className="text-blue-500 mt-0.5">
                      <History size={14} />
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      <span className="font-bold">Endereço:</span> {selectedClienteHistory.endereco}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingCart size={16} className="text-gray-400" />
                  Linha do Tempo de Compras
                </h4>
                
                {clientSales.length > 0 ? (
                  <div className="relative border-l-2 border-gray-100 ml-3 pl-6 space-y-6 pb-10">
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
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <History size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma compra registrada.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </Drawer>

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
