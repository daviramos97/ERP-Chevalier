import { useContext, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { Modal } from '../components/ui/Modal';
import { Plus, Edit2, Trash2, TrendingDown } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export function Despesas() {
  const { data, addDespesa, updateDespesa, deleteDespesa } = useContext(GlobalContext);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDespesa, setEditingDespesa] = useState(null);
  
  // Dialog de Exclusão
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [despesaToDelete, setDespesaToDelete] = useState(null);

  const [formData, setFormData] = useState({ 
    descricao: '', 
    valor: '', 
    data: new Date().toISOString().split('T')[0] 
  });

  // Ordena por data decrescente
  const despesasOrdenadas = [...data.despesas].sort((a, b) => new Date(b.data) - new Date(a.data));
  const totalDespesas = despesasOrdenadas.reduce((acc, d) => acc + d.valor, 0);

  const openModal = (despesa = null) => {
    if (despesa) {
      setEditingDespesa(despesa);
      setFormData({ 
        descricao: despesa.descricao, 
        valor: despesa.valor.toString(),
        data: despesa.data
      });
    } else {
      setEditingDespesa(null);
      setFormData({ 
        descricao: '', 
        valor: '', 
        data: new Date().toISOString().split('T')[0] 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valorFloat = parseFloat(formData.valor.replace(',', '.'));
    
    if (editingDespesa) {
      updateDespesa(editingDespesa.id, { 
        descricao: formData.descricao, 
        valor: valorFloat,
        data: formData.data
      });
    } else {
      addDespesa({ 
        descricao: formData.descricao, 
        valor: valorFloat,
        data: formData.data
      });
    }
    setIsModalOpen(false);
  };

  const confirmDelete = (id) => {
    setDespesaToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleDelete = () => {
    if (despesaToDelete) {
      deleteDespesa(despesaToDelete);
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Despesas</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de custos operacionais</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-red-600/20"
        >
          <Plus size={20} />
          Nova Despesa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-100 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-600 rounded-xl text-white shadow-sm">
              <TrendingDown size={24} />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total de Despesas Registradas</h3>
          <p className="text-3xl font-bold text-red-600">
            {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Data</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Descrição</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Valor (R$)</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesasOrdenadas.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4 text-gray-500 text-sm">
                  {new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </td>
                <td className="py-3 px-4 text-gray-800 font-medium">{d.descricao}</td>
                <td className="py-3 px-4 font-semibold text-red-600 text-right">
                  {d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="py-3 px-4 flex justify-center gap-2">
                  <button 
                    onClick={() => openModal(d)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => confirmDelete(d.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {despesasOrdenadas.length === 0 && (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">Nenhuma despesa cadastrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingDespesa ? "Editar Despesa" : "Nova Despesa"}
      >
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input 
              type="date" 
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              value={formData.data}
              onChange={(e) => setFormData({...formData, data: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição / Motivo *</label>
            <input 
              type="text" 
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              placeholder="Ex: Pagamento de Fornecedor"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              required
              autoComplete="off"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-mono"
              value={formData.valor}
              onChange={(e) => setFormData({...formData, valor: e.target.value})}
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
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-md shadow-red-600/20"
            >
              Salvar Despesa
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Excluir Despesa"
        message="Tem certeza que deseja excluir esta despesa? Esta ação não poderá ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setIsConfirmOpen(false)}
        confirmText="Excluir"
      />
    </div>
  );
}
