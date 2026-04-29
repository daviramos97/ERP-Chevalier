import { useContext, useState, useMemo } from 'react';
import { GlobalContext } from '../context/GlobalContext';
import { FileText, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Comissao() {
  const { data, toggleComissaoPaga } = useContext(GlobalContext);
  
  const date = new Date();
  const currentMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const [mesFiltro, setMesFiltro] = useState(currentMonth);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });

  // Cálculos baseados no mês
  const { vendasMes, totalFaturado, totalComissao, isPago, dataPagamentoPrevista } = useMemo(() => {
    const vendas = data.vendas.filter(v => {
      const vDate = new Date(v.dataHora);
      const vMonth = `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, '0')}`;
      return vMonth === mesFiltro;
    });

    const faturado = vendas.reduce((acc, v) => acc + v.valorTotal, 0);
    const comissao = vendas.reduce((acc, v) => acc + v.valorComissao, 0);
    
    // Calcula dia 10 do mês seguinte
    const [year, month] = mesFiltro.split('-');
    const nextMonthDate = new Date(parseInt(year), parseInt(month), 10);
    const dataPrevista = nextMonthDate.toLocaleDateString('pt-BR');

    const pago = data.comissoesPagas.includes(mesFiltro);

    return { 
      vendasMes: vendas, 
      totalFaturado: faturado, 
      totalComissao: comissao, 
      isPago: pago,
      dataPagamentoPrevista: dataPrevista
    };
  }, [data.vendas, data.comissoesPagas, mesFiltro]);

  const handleTogglePago = () => {
    if (vendasMes.length === 0) return;
    toggleComissaoPaga(mesFiltro);
  };

  const gerarRelatorioAuditoria = () => {
    if (vendasMes.length === 0) {
      setConfirmDialog({ isOpen: true, title: 'Atenção', message: 'Não há vendas neste mês para gerar o relatório.', isAlert: true });
      return;
    }

    const doc = new jsPDF();
    const [year, month] = mesFiltro.split('-');
    const mesFormatado = `${month}/${year}`;

    // Cabeçalho
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Blue-900
    doc.text("CHEVALIER", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Relatório de Auditoria de Comissões", 14, 30);
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text(`Referência: ${mesFormatado}`, 140, 22);
    doc.text(`Status: ${isPago ? 'PAGO' : 'PENDENTE'}`, 140, 28);
    doc.text(`Pagamento: ${dataPagamentoPrevista}`, 140, 34);

    doc.setDrawColor(200);
    doc.line(14, 42, 196, 42);

    // Tabela
    const tableColumn = ["Data/Hora", "ID", "Cliente", "Total Venda", "%", "Comissão"];
    const tableRows = [];

    vendasMes.forEach(v => {
      const cli = data.clientes.find(c => c.id === v.clienteId);
      const dataHora = new Date(v.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      
      tableRows.push([
        dataHora,
        `#${v.id}`,
        cli?.nome || 'N/A',
        v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        `${v.comissaoPercentual}%`,
        v.valorComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      ]);
    });

    autoTable(doc, {
      startY: 50,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center' },
        5: { halign: 'right', fontStyle: 'bold', textColor: [194, 65, 12] } // Orange-700
      }
    });

    // Totalizador Gigante
    const finalY = doc.lastAutoTable.finalY || 50;
    
    doc.setDrawColor(30, 58, 138);
    doc.setFillColor(243, 244, 246);
    doc.rect(14, finalY + 10, 182, 35, 'F');
    doc.rect(14, finalY + 10, 182, 35, 'S');

    doc.setFontSize(12);
    doc.setTextColor(60);
    doc.text("RESUMO FINANCEIRO", 20, finalY + 20);

    doc.setFontSize(14);
    doc.setTextColor(21, 128, 61); // Green-700
    doc.text(`Faturamento: ${totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, finalY + 30);

    doc.setFontSize(16);
    doc.setTextColor(194, 65, 12); // Orange-700
    doc.text(`Total Comissão: ${totalComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 20, finalY + 40);

    doc.save(`Auditoria_Comissoes_${mesFormatado.replace('/', '_')}.pdf`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Comissões</h1>
          <p className="text-sm text-gray-500 mt-1">Acertos e auditoria de vendas</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <Calendar size={20} className="text-gray-500 ml-2" />
          <input 
            type="month" 
            value={mesFiltro}
            onChange={(e) => setMesFiltro(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-700 font-medium px-2 py-1 cursor-pointer"
          />
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-600 rounded-xl text-white shadow-sm">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-blue-800 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wider">
              Mês Referência
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Faturado</h3>
          <p className="text-3xl font-bold text-gray-800">
            {totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 p-6 rounded-2xl relative overflow-hidden">
          {isPago && (
            <div className="absolute -right-6 top-6 bg-green-500 text-white text-xs font-bold py-1 px-10 transform rotate-45 shadow-sm">
              LIQUIDADO
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl text-white shadow-sm ${isPago ? 'bg-green-600' : 'bg-orange-500'}`}>
              <AlertCircle size={24} />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total de Comissão</h3>
          <p className={`text-3xl font-bold ${isPago ? 'text-green-700' : 'text-orange-600'}`}>
            {totalComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>

        <div className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">Data do Repasse</h3>
            <p className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              {dataPagamentoPrevista}
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Baixa de Pagamento:</span>
            <button
              onClick={handleTogglePago}
              disabled={vendasMes.length === 0}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isPago ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  isPago ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Vendas e Relatório */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-800">Vendas que geraram comissão ({vendasMes.length})</h2>
        <button 
          onClick={gerarRelatorioAuditoria}
          disabled={vendasMes.length === 0}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <FileText size={20} />
          Relatório de Auditoria
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Data</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Venda</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm">Cliente</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Faturamento</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-center">%</th>
              <th className="py-3 px-4 font-semibold text-gray-600 text-sm text-right">Comissão</th>
            </tr>
          </thead>
          <tbody>
            {vendasMes.map((v) => {
              const cli = data.clientes.find(c => c.id === v.clienteId);
              return (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(v.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">#{v.id}</td>
                  <td className="py-3 px-4 text-gray-700">{cli?.nome || 'N/A'}</td>
                  <td className="py-3 px-4 text-gray-600 text-right">
                    {v.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-center text-sm">{v.comissaoPercentual}%</td>
                  <td className="py-3 px-4 font-semibold text-orange-600 text-right">
                    {v.valorComissao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              );
            })}
            {vendasMes.length === 0 && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">Nenhuma venda registrada no mês selecionado.</td>
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
