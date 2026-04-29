import { createContext, useState } from 'react';

export const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const getNextId = (items) => {
    if (!items || items.length === 0) return 100;
    return Math.max(...items.map(i => i.id)) + 1;
  };
    if (!items || items.length === 0) return 100;
    return Math.max(...items.map(i => i.id)) + 1;
  };

  const [data, setData] = useState({
    produtos: [
      { id: 101, codigo: '1', nome: 'Cadeira Gamer', preco: 850.00 },
      { id: 102, codigo: '2', nome: 'Mesa de Escritório', preco: 1200.00 },
      { id: 103, codigo: '3', nome: 'Monitor 27" IPS', preco: 1500.00 },
      { id: 104, codigo: '4', nome: 'Teclado Mecânico', preco: 350.00 },
      { id: 105, codigo: '5', nome: 'Mouse Sem Fio', preco: 120.00 },
      { id: 106, codigo: '6', nome: 'Headset Bluetooth', preco: 450.00 },
      { id: 107, codigo: '7', nome: 'Webcam Full HD', preco: 250.00 },
      { id: 108, codigo: '8', nome: 'Suporte Articulado', preco: 180.00 },
    ],
    clientes: [
      {
        id: 101,
        nome: 'João Silva',
        razaoSocial: 'João Silva ME',
        cnpj: '12.345.678/0001-90',
        ie: 'ISENTO',
        telefone: '(11) 98765-4321',
        email: 'joao@exemplo.com',
        observacoes: 'Cliente preferencial.',
        status: 'Ativo',
        historicoCompras: [
          { id: 101, data: '2023-10-15', valor: 1200.00, descricao: 'Mesa de Escritório' },
          { id: 102, data: '2023-11-20', valor: 350.00, descricao: 'Teclado Mecânico' },
          { id: 103, data: '2023-12-05', valor: 120.00, descricao: 'Mouse Sem Fio' }
        ]
      },
      {
        id: 102,
        nome: 'Maria Oliveira',
        razaoSocial: '',
        cnpj: '',
        ie: '',
        telefone: '(21) 99999-8888',
        email: 'maria@exemplo.com',
        observacoes: '',
        status: 'Ativo',
        historicoCompras: [
          { id: 104, data: '2024-01-10', valor: 850.00, descricao: 'Cadeira Gamer' }
        ]
      },
      {
        id: 103,
        nome: 'Carlos Souza',
        razaoSocial: 'Souza Tech LTDA',
        cnpj: '98.765.432/0001-10',
        ie: '123.456.789',
        telefone: '(31) 97777-6666',
        email: 'carlos@souzatech.com',
        observacoes: 'Paga sempre em dia.',
        status: 'Inativo',
        historicoCompras: []
      }
    ],
    orcamentos: [
      {
        id: 101,
        clienteId: 101,
        data: new Date().toISOString().split('T')[0],
        itens: [
          { produtoId: 101, nome: 'Cadeira Gamer', quantidade: 2, preco: 850.00, subtotal: 1700.00 },
          { produtoId: 104, nome: 'Teclado Mecânico', quantidade: 1, preco: 350.00, subtotal: 350.00 }
        ],
        valorTotal: 2050.00
      }
    ],
    vendas: [
      {
        id: 101,
        clienteId: 101,
        dataHora: '2026-04-05T14:30:00.000Z',
        itens: [
          { produtoId: 101, nome: 'Cadeira Gamer', quantidade: 2, preco: 850.00, subtotal: 1700.00 }
        ],
        valorTotal: 1700.00,
        comissaoPercentual: 5,
        valorComissao: 85.00
      }
    ],
    comissoesPagas: [],
    despesas: [
      {
        id: 101,
        descricao: 'Energia Elétrica',
        valor: 250.00,
        data: '2026-04-10'
      },
      {
        id: 102,
        descricao: 'Internet',
        valor: 120.00,
        data: '2026-04-15'
      }
    ]
  });

  // Funções Auxiliares para Produtos
  const addProduto = (produto) => {
    setData(prev => ({
      ...prev,
      produtos: [...prev.produtos, { ...produto, id: getNextId(prev.produtos) }]
    }));
  };

  const updateProduto = (id, produtoData) => {
    setData(prev => ({
      ...prev,
      produtos: prev.produtos.map(p => p.id === id ? { ...p, ...produtoData } : p)
    }));
  };

  const deleteProdutos = (idsArray) => {
    setData(prev => ({
      ...prev,
      produtos: prev.produtos.filter(p => !idsArray.includes(p.id))
    }));
  };

  // Funções Auxiliares para Clientes
  const addCliente = (cliente) => {
    setData(prev => ({
      ...prev,
      clientes: [...prev.clientes, { ...cliente, id: getNextId(prev.clientes), status: 'Ativo', historicoCompras: [] }]
    }));
  };

  const updateCliente = (id, clienteData) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.map(c => c.id === id ? { ...c, ...clienteData } : c)
    }));
  };

  const deleteCliente = (id) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.filter(c => c.id !== id)
    }));
  };

  const toggleStatusCliente = (id) => {
    setData(prev => ({
      ...prev,
      clientes: prev.clientes.map(c => 
        c.id === id ? { ...c, status: c.status === 'Ativo' ? 'Inativo' : 'Ativo' } : c
      )
    }));
  };

  // Funções Auxiliares para Orçamentos
  const addOrcamento = (orcamento) => {
    setData(prev => ({
      ...prev,
      orcamentos: [...prev.orcamentos, { ...orcamento, id: getNextId(prev.orcamentos) }]
    }));
  };

  const updateOrcamento = (id, orcamentoData) => {
    setData(prev => ({
      ...prev,
      orcamentos: prev.orcamentos.map(o => o.id === id ? { ...o, ...orcamentoData } : o)
    }));
  };

  // Funções Auxiliares para Vendas
  const addVenda = (venda) => {
    setData(prev => ({
      ...prev,
      vendas: [...prev.vendas, { ...venda, id: getNextId(prev.vendas) }]
    }));
  };

  const deleteVenda = (id) => {
    setData(prev => ({
      ...prev,
      vendas: prev.vendas.filter(v => v.id !== id)
    }));
  };

  // Funções Auxiliares para Comissões
  const toggleComissaoPaga = (mesAno) => {
    setData(prev => {
      const isPago = prev.comissoesPagas.includes(mesAno);
      return {
        ...prev,
        comissoesPagas: isPago 
          ? prev.comissoesPagas.filter(m => m !== mesAno)
          : [...prev.comissoesPagas, mesAno]
      };
    });
  };

  // Funções Auxiliares para Despesas
  const addDespesa = (despesa) => {
    setData(prev => ({
      ...prev,
      despesas: [...prev.despesas, { ...despesa, id: getNextId(prev.despesas) }]
    }));
  };

  const updateDespesa = (id, despesaData) => {
    setData(prev => ({
      ...prev,
      despesas: prev.despesas.map(d => d.id === id ? { ...d, ...despesaData } : d)
    }));
  };

  const deleteDespesa = (id) => {
    setData(prev => ({
      ...prev,
      despesas: prev.despesas.filter(d => d.id !== id)
    }));
  };

  return (
    <GlobalContext.Provider value={{ 
      data, 
      setData,
      addProduto,
      updateProduto,
      deleteProdutos,
      addCliente,
      updateCliente,
      deleteCliente,
      toggleStatusCliente,
      addOrcamento,
      updateOrcamento,
      addVenda,
      deleteVenda,
      toggleComissaoPaga,
      addDespesa,
      updateDespesa,
      deleteDespesa
    }}>
      {children}
    </GlobalContext.Provider>
  );
}
