export function DeleteConfirmationModal({ onClose, onDeleteSingle, onDeleteAll, onDeleteFuture }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-52">
      <div className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl p-6 z-52">
        <h2 className="text-lg font-semibold mb-4 text-white">Elimina Evento</h2>
        <p className="mb-4 text-white">Vuoi eliminare l'evento corrente o tutte le sue occorrenze?</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded mr-2"
          >
            Cancella
          </button>
          <button
            onClick={onDeleteSingle}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white mr-2"
          >
            Solo Corrente
          </button>
          <button
            onClick={onDeleteFuture}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 mr-2 rounded text-white"
          >
            Elimina solo futuri
          </button>
          <button
            onClick={onDeleteAll}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
          >
            Elimina tutti
          </button>
        </div>
      </div>
    </div>
  );
}
