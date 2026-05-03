import { useContext, useState } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Plus, Trash2, Tag, Search } from 'lucide-react';

export function Descontos() {
  const { data, addDesconto, deleteDesconto } = useContext(GlobalContext);

  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [produtoId, setProdutoId] = useState('');
  const [preco, setPreco] = useState('');
  const [filterClienteId, setFilterClienteId] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  const descontos = data.descontos || [];

  const filteredDescontos = filterClienteId
    ? descontos.filter(d => d.clienteId === parseInt(filterClienteId))
    : descontos;

  const handleAdd = () => {
    const cId = parseInt(clienteId);
    const pId = parseInt(produtoId);
    const precoNum = parseFloat(preco.replace(',', '.'));

    if (!cId || !pId || isNaN(precoNum) || precoNum <= 0) return;

    // Impede duplicata (mesmo cliente + mesmo produto)
    const jaExiste = descontos.some(d => d.clienteId === cId && d.produtoId === pId);
    if (jaExiste) {
      setConfirmDialog({
        isOpen: true,
        title: 'Atenção',
        message: 'Já existe um preço especial cadastrado para este cliente e produto. Exclua o existente antes de adicionar um novo.',
        isAlert: true,
        onConfirm: () => setConfirmDialog({ isOpen: false })
      });
      return;
    }

    addDesconto({ clienteId: cId, produtoId: pId, preco: precoNum });
    setClienteId('');
    setClienteSearch('');
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
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  // Produto já cadastrado para o cliente selecionado (para filtrar o select)
  const produtosJaCadastrados = descontos
    .filter(d => d.clienteId === parseInt(clienteId))
    .map(d => d.produtoId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Descontos</h1>
          <p className="text-sm text-gray-500 mt-1">Preços especiais por cliente. Aplicados automaticamente ao lançar uma venda.</p>
        </div>
      </div>

      {/* Formulário de Adição */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Tag size={16} className="text-blue-500" /> Novo Preço Especial
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

          {/* Cliente */}
          <div className="relative md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cliente</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clienteSearch}
                onChange={(e) => { setClienteSearch(e.target.value); setClienteId(''); setIsDropdownOpen(true); }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pl-10 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            </div>
            {isDropdownOpen && filteredClientes.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredClientes.map(c => (
                  <li
                    key={c.id}
                    onMouseDown={() => { setClienteId(c.id.toString()); setClienteSearch(c.nome); setIsDropdownOpen(false); }}
                    className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between items-center"
                  >
                    <span>{c.nome}</span>
                    {c.cidade && <span className="text-xs text-gray-400">{c.cidade}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Produto */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Embalagem / Produto</label>
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
                    {p.nome} (padrão: {p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                  </option>
                ))}
            </select>
          </div>

          {/* Preço */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Preço Especial (R$)</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono text-sm"
              />
              <button
                onClick={handleAdd}
                disabled={!clienteId || !produtoId || !preco}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm shadow-blue-600/20 whitespace-nowrap text-sm"
              >
                <Plus size={16} /> Adicionar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtro + Tabela */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest">
          {filteredDescontos.length} preço(s) cadastrado(s)
        </h2>
        <select
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none focus:border-blue-400 bg-white"
          value={filterClienteId}
          onChange={(e) => setFilterClienteId(e.target.value)}
        >
          <option value="">Todos os clientes</option>
          {data.clientes.map(c => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600 text-sm">Cliente</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Embalagem / Produto</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Preço Padrão</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Preço Especial</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-right">Diferença</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Ação</th>
            </tr>
          </thead>
          <tbody>
            {filteredDescontos.length > 0 ? (
              filteredDescontos.map(d => {
                const cliente = data.clientes.find(c => c.id === d.clienteId);
                const produto = data.produtos.find(p => p.id === d.produtoId);
                const diff = d.preco - (produto?.preco || 0);
                const diffPct = produto ? ((diff / produto.preco) * 100).toFixed(1) : 0;
                return (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{cliente?.nome || 'N/A'}</div>
                      {cliente?.cidade && <div className="text-xs text-gray-500">{cliente.cidade}</div>}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-700">{produto?.nome || 'Produto removido'}</div>
                      {produto?.codigo && <div className="text-xs text-gray-400 font-mono">#{produto.codigo}</div>}
                    </td>
                    <td className="p-4 text-right text-gray-500 line-through text-sm">
                      {produto ? produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}
                    </td>
                    <td className="p-4 text-right font-bold text-blue-600">
                      {d.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${diff < 0 ? 'bg-red-50 text-red-600' : diff > 0 ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                        {diff > 0 ? '+' : ''}{diffPct}%
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center">
                  <Tag size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 text-sm">Nenhum preço especial cadastrado.</p>
                  <p className="text-gray-300 text-xs mt-1">Use o formulário acima para adicionar.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
