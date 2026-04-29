import { Sidebar } from './Sidebar';

export function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100 transition-colors">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
