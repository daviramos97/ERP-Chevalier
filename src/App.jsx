import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GlobalProvider } from './context/GlobalContext';
import { Layout } from './components/Layout';

import { Dashboard } from './pages/Dashboard';
import { Produtos } from './pages/Produtos';
import { Clientes } from './pages/Clientes';
import { Orcamentos } from './pages/Orcamentos';
import { Vendas } from './pages/Vendas';
import { Comissao } from './pages/Comissao';
import { Despesas } from './pages/Despesas';
import { Descontos } from './pages/Descontos';

function App() {
  return (
    <GlobalProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/orcamentos" element={<Orcamentos />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/comissao" element={<Comissao />} />
            <Route path="/despesas" element={<Despesas />} />
            <Route path="/descontos" element={<Descontos />} />
          </Routes>
        </Layout>
      </Router>
    </GlobalProvider>
  );
}

export default App;
