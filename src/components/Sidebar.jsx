import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Users, FileText, ShoppingCart, DollarSign, Wallet } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Produtos', path: '/produtos', icon: Package },
  { name: 'Clientes', path: '/clientes', icon: Users },
  { name: 'Orçamentos', path: '/orcamentos', icon: FileText },
  { name: 'Vendas', path: '/vendas', icon: ShoppingCart },
  { name: 'Comissão', path: '/comissao', icon: DollarSign },
  { name: 'Despesas', path: '/despesas', icon: Wallet },
];

export function Sidebar() {
  return (
    <div className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-wider text-white">CHEVALIER</h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Gestão & Vendas</p>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-bold">U</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Usuário</span>
            <span className="text-xs text-gray-500">Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
