import { useContext, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Edit2, ChevronLeft, ChevronRight, Trash2, CheckSquare } from 'lucide-react';

export function Produtos() {
  const { data, addProduto, updateProduto, deleteProdutos } = useContext(GlobalContext);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState(null);
  
  const [formData, setFormData] = useState({ codigo: '', nome: '', preco: '' });
  const [selectedProdutos, setSelectedProdutos] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.produtos.length / itemsPerPage);
  const paginatedProdutos = data.produtos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const openModal = (produto = null) => {
    if (produto) {
      setEditingProduto(produto);
      setFormData({ codigo: produto.codigo || '', nome: produto.nome, preco: produto.preco.toString() });
    } else {
      setEditingProduto(null);
      setFormData({ codigo: '', nome: '', preco: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const precoFloat = parseFloat(formData.preco.replace(',', '.'));
    
    if (editingProduto) {
      updateProduto(editingProduto.id, { codigo: formData.codigo, nome: formData.nome, preco: precoFloat });
    } else {
      addProduto({ codigo: formData.codigo, nome: formData.nome, preco: precoFloat });
    }
    setIsModalOpen(false);
  };

  const handleDeleteSelected = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir Produtos',
      message: `Tem certeza que deseja excluir ${selectedProdutos.length} produto(s)? Esta ação não pode ser desfeita.`,
      isDestructive: true,
      onConfirm: () => {
        deleteProdutos(selectedProdutos);
        setSelectedProdutos([]);
        setIsSelectionMode(false);
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all in current page
      const newSelected = new Set([...selectedProdutos, ...paginatedProdutos.map(p => p.id)]);
      setSelectedProdutos(Array.from(newSelected));
    } else {
      // Deselect all in current page
      const pageIds = paginatedProdutos.map(p => p.id);
      setSelectedProdutos(selectedProdutos.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelect = (id) => {
    if (selectedProdutos.includes(id)) {
      setSelectedProdutos(selectedProdutos.filter(selectedId => selectedId !== id));
    } else {
      setSelectedProdutos([...selectedProdutos, id]);
    }
  };

  const isAllPageSelected = paginatedProdutos.length > 0 && paginatedProdutos.every(p => selectedProdutos.includes(p.id));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Produtos</h1>
        <div className="flex gap-3">
          {selectedProdutos.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-xl font-medium transition-all border border-red-200"
            >
              <Trash2 size={20} />
              Excluir ({selectedProdutos.length})
            </button>
          )}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedProdutos([]);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${isSelectionMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            <CheckSquare size={20} />
            {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}
          </button>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-600/20"
          >
            <Plus size={20} />
            Novo Produto
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {isSelectionMode && (
                <th className="py-3 px-4 font-semibold text-gray-600 text-sm w-12">
                  <input 
                    type="checkbox" 
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
              )}
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Cód</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Nome</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Preço (R$)</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProdutos.map((p) => (
              <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${selectedProdutos.includes(p.id) ? 'bg-blue-50/30' : ''}`}>
                {isSelectionMode && (
                  <td className="py-2.5 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedProdutos.includes(p.id)}
                      onChange={() => handleSelect(p.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                )}
                <td className="py-2.5 px-4 text-gray-500 text-sm">{p.codigo || p.id}</td>
                <td className="py-2.5 px-4 text-gray-800 font-medium">{p.nome}</td>
                <td className="py-2.5 px-4 text-gray-600 text-right">
                  {p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-2 px-4 flex justify-center">
                  <button 
                    onClick={() => openModal(p)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {paginatedProdutos.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">Nenhum produto cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-500">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, data.produtos.length)} de {data.produtos.length} produtos
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingProduto ? "Editar Produto" : "Novo Produto"}
      >
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código (SKU/Ref) *</label>
            <input 
              type="text" 
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.codigo}
              onChange={(e) => setFormData({...formData, codigo: e.target.value})}
              placeholder="Ex: 001 ou PROD-A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto *</label>
            <input 
              type="text" 
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Cadeira Gamer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
            <input 
              type="number" 
              step="0.01"
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={formData.preco}
              onChange={(e) => setFormData({...formData, preco: e.target.value})}
              placeholder="0.00"
            />
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
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
