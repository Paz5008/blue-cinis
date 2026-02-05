import { ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 relative dark:bg-slate-900 dark:text-white dark:border dark:border-slate-800">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">
          X
        </button>
        {children}
      </div>
    </div>
  );
}
