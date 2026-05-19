import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = "Delete", loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-gray-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/10 transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
