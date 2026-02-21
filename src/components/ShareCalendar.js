import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { auth } from "../firebase"; // 'db' non serve più qui, ci pensa il backend!

export default function ShareCalendar({ selectedCalendar, setShowShareModal }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("read"); // Default a sola lettura
  const [loading, setLoading] = useState(false);

  const handleShare = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log(`Richiesta di condivisione: ${selectedCalendar.name} con ${email} (Permesso: ${permission})`);
      
      // CHIAMATA ALLA NOSTRA API VERCEL
      const response = await fetch('/api/shareCalendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetEmail: email,
          ownerId: auth.currentUser.uid, // Prende l'ID di chi sta condividendo
          calendarId: selectedCalendar.docId,
          calendarName: selectedCalendar.name,
          permissionLevel: permission,
        }),
      });

      const data = await response.json();

      // Se il backend restituisce un errore (es. utente non trovato)
      if (!response.ok) {
        alert("Errore: " + (data.error || "Sconosciuto"));
        setLoading(false);
        return;
      }

      alert("Calendario condiviso con successo!");
      setShowShareModal(false);
    } catch (error) {
      console.error("Errore durante la connessione al server:", error);
      alert("Errore di rete. Impossibile contattare il server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 w-96 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
          Condividi "{selectedCalendar.name}"
        </h2>
        
        <form onSubmit={handleShare}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email utente
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded bg-gray-50 dark:bg-zinc-700 dark:text-white"
              placeholder="mario@esempio.it"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Permessi
            </label>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="w-full border p-2 rounded bg-gray-50 dark:bg-zinc-700 dark:text-white"
            >
              <option value="read">Sola lettura (Può solo visualizzare)</option>
              <option value="write">Lettura e Scrittura (Può modificare eventi)</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="px-4 py-2 bg-gray-300 dark:bg-zinc-600 rounded text-gray-800 dark:text-white hover:bg-gray-400"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Condivisione..." : "Condividi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}