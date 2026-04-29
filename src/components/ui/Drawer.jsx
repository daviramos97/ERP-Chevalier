import { X } from 'lucide-react';

export function Drawer({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-white">
          {children}
        </div>
      </div>
    </>
  );
}
