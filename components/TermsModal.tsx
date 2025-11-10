import React from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 border border-slate-700 flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white uppercase">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto text-slate-300 whitespace-pre-wrap">
          {content}
        </div>
        <div className="p-4 bg-slate-900/50 flex justify-end rounded-b-lg">
          <button
            onClick={onClose}
            className="bg-sky-600 text-white font-bold py-2 px-6 rounded-md hover:bg-sky-700 transition duration-300"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;
