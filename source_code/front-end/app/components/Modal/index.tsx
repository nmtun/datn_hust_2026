import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showEditButton?: boolean;
  onEdit?: () => void;
}

const Modal = ({ isOpen, onClose, title, children, showEditButton, onEdit }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black opacity-50"></div>

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0 relative">
            {children}
            {showEditButton && onEdit && (
              <div className="sticky bottom-6 right-6 flex justify-end">
                <button
                  onClick={onEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg"
                >
                  Chỉnh sửa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;