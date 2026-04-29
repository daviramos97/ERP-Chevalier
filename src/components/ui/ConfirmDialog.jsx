import { AlertTriangle, X } from 'lucide-react';

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar", isDestructive = false, isAlert = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${isDestructive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>
        <div className="bg-gray-50 p-4 px-6 flex justify-end gap-3 border-t border-gray-100">
          {!isAlert && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
          >
            {isAlert ? "Ok" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
