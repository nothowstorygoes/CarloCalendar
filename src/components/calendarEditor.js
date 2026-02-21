import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GlobalContext from "../context/GlobalContext";
import { db, auth } from "../firebase";
import { 
  collection, query, where, getDocs, updateDoc, doc, writeBatch, deleteDoc, deleteField 
} from "firebase/firestore";

export default function CalendarEditor({ selectedCalendar, setShowCalendarEditor }) {
  const { t } = useTranslation();
  const { calendars, setCalendars } = useContext(GlobalContext);
  
  // STATI DEL CALENDARIO BASE
  const [name, setName] = useState("");
  const [prioritized, setPrioritized] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // STATI CONDIVISIONE E PERMESSI
  const [targetEmail, setTargetEmail] = useState("");
  const [newPermission, setNewPermission] = useState("read");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [permissionsList, setPermissionsList] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // CARICAMENTO INIZIALE DATI
  useEffect(() => {
    if (selectedCalendar) {
      setName(selectedCalendar.name);
      setPrioritized(selectedCalendar.prioritized || false);
      fetchPermissions();
    }
  }, [selectedCalendar]);

  const fetchPermissions = async () => {
    try {
      // Per coprire i vecchi e nuovi inviti, facciamo due query parallele o usiamo l'operatore "in"
      // selectedCalendar.id è l'ID interno numerico/corto. selectedCalendar.docId è quello di firebase
      const possibleIds = [];
      if (selectedCalendar.id) possibleIds.push(selectedCalendar.id.toString());
      if (selectedCalendar.docId) possibleIds.push(selectedCalendar.docId.toString());

      // Query "in" accetta array fino a 10 elementi
      const q = query(
        collection(db, "invitations"), 
        where("calendarId", "in", possibleIds)
      );
      
      const snap = await getDocs(q);
      const invites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPermissionsList(invites);
    } catch (error) {
      console.error("Errore recupero permessi:", error);
    }
    setLoadingPermissions(false);
  };

  // INVIA NUOVO INVITO TRAMITE API
  const handleSendInvite = async (e) => {
    e.preventDefault(); 
    if (!targetEmail) return;
    setSendingInvite(true);
    
    // Per sicurezza, cerchiamo sempre di inviare il docId
    const safeCalendarId = selectedCalendar.docId || selectedCalendar.id.toString();

    try {
      const response = await fetch('/api/shareCalendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: targetEmail,
          ownerId: auth.currentUser.uid,
          calendarId: safeCalendarId,
          calendarName: selectedCalendar.name,
          permissionLevel: newPermission,
        }),
      });
      const data = await response.json();
      
      if (response.ok) {
        alert("Invito inviato con successo!");
        setTargetEmail("");
        fetchPermissions(); // Ricarica la lista
      } else {
        alert(data.error || "Errore durante l'invio.");
      }
    } catch (error) {
      console.error(error);
      alert("Errore di connessione.");
    }
    setSendingInvite(false);
  };

  // CAMBIA PERMESSO NEL DROPDOWN
  const handlePermissionChange = (id, newLevel) => {
    setPermissionsList(prev => prev.map(inv => inv.id === id ? { ...inv, permissionLevel: newLevel } : inv));
  };

  // RIMUOVE UTENTE (Azione istantanea per sicurezza)
  const handleRemovePermission = async (e, inv) => {
    e.preventDefault();
    if(window.confirm(`Vuoi revocare l'accesso a ${inv.targetEmail}?`)) {
      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, "invitations", inv.id));
        
        if (inv.status === 'accepted' && inv.acceptedUid) {
          const calRef = doc(db, `users/${auth.currentUser.uid}/calendars`, selectedCalendar.docId);
          batch.update(calRef, { [`sharedWith.${inv.acceptedUid}`]: deleteField() });
        }
        await batch.commit();
        setPermissionsList(prev => prev.filter(i => i.id !== inv.id));
      } catch (error) {
        console.error("Errore rimozione:", error);
      }
    }
  };

  // SALVATAGGIO TOTALE
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const batch = writeBatch(db);
      
      const calRef = doc(db, `users/${auth.currentUser.uid}/calendars`, selectedCalendar.docId);
      batch.update(calRef, { 
        name: name,
        prioritized: prioritized
      });

      permissionsList.forEach(inv => {
        const invRef = doc(db, "invitations", inv.id);
        batch.update(invRef, { permissionLevel: inv.permissionLevel });
        
        if (inv.status === 'accepted' && inv.acceptedUid) {
          batch.update(calRef, {
            [`sharedWith.${inv.acceptedUid}`]: inv.permissionLevel 
          });
        }
      });

      await batch.commit();

      setCalendars(
        calendars.map((cal) =>
          cal.id === selectedCalendar.id ? { ...cal, name, prioritized } : cal
        )
      );
      
      setShowCalendarEditor(false);
    } catch (error) {
      console.error("Error updating calendar: ", error);
      setShowAlert(true);
    }
  };

  const handleClose = () => {
    setShowCalendarEditor(false);
  };

  return (
    <div className="h-screen w-full fixed left-0 top-0 flex justify-center items-center bg-black bg-opacity-50 z-40 dark:bg-zinc-800 dark:bg-opacity-75">
      <form
        className="bg-white dark:bg-zinc-950 rounded-lg shadow-2xl w-full md:w-[35rem] z-50 max-h-[90vh] flex flex-col"
        onSubmit={handleSubmit}
      >
        <header className="bg-gray-100 dark:bg-zinc-900 px-4 py-2 flex justify-between items-center rounded-t-lg shrink-0">
          <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
            drag_handle
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="material-icons-outlined text-gray-400 dark:text-zinc-200"
          >
            close
          </button>
        </header>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* INFO BASE */}
          <div className="flex flex-col gap-y-6 mb-8">
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                calendar_today
              </span>
              <input
                type="text"
                name="name"
                placeholder="Calendario"
                value={name}
                required
                className="ml-4 border-0 text-gray-600 dark:text-zinc-200 text-xl font-semibold w-48 border-b-2 border-gray-200 dark:border-zinc-700 focus:outline-none focus:ring-0 focus:border-blue-500 bg-gray-100 dark:bg-zinc-700 rounded p-1"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="material-icons-outlined text-gray-400 dark:text-zinc-200">
                star
              </span>
              <label className="ml-4 text-gray-600 dark:text-zinc-200 font-medium">
                Predefinito
              </label>
              <input
                type="checkbox"
                name="prioritized"
                checked={prioritized}
                className="ml-4 form-checkbox h-5 w-5 text-blue-600 rounded-full"
                onChange={(e) => setPrioritized(e.target.checked)}
              />
            </div>
          </div>

          <hr className="border-gray-200 dark:border-zinc-700 mb-6" />

          {/* CONDIVISIONE (Nuovo Invito) */}
          <div className="mb-8">
            <h3 className="text-gray-600 dark:text-zinc-200 font-bold mb-4 flex items-center">
              <span className="material-icons-outlined mr-2">person_add</span>
              Condivisione
            </h3>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="email"
                placeholder="Email utente..."
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="flex-1 border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <select
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
                className="border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-800 dark:text-white rounded p-2 focus:outline-none"
              >
                <option value="read">Sola lettura</option>
                <option value="write">Modifica</option>
              </select>
              <button 
                type="button"
                onClick={handleSendInvite}
                disabled={sendingInvite || !targetEmail}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded px-4 py-2 transition-colors disabled:opacity-50"
              >
                {sendingInvite ? "Invio..." : "Invia"}
              </button>
            </div>
          </div>

          {/* LISTA UTENTI CONDIVISI */}
          <div>
            <h3 className="text-gray-600 dark:text-zinc-200 font-bold mb-4 flex items-center">
              <span className="material-icons-outlined mr-2">group</span>
              Utenti con accesso
            </h3>
            
            {loadingPermissions ? (
              <p className="text-gray-500 text-sm">Caricamento...</p>
            ) : permissionsList.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Nessun utente ha accesso a questo calendario.</p>
            ) : (
              <div className="bg-gray-50 dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                {permissionsList.map((inv, index) => (
                  <div 
                    key={inv.id} 
                    className={`flex flex-col md:flex-row justify-between items-start md:items-center p-3 ${index !== permissionsList.length - 1 ? 'border-b border-gray-200 dark:border-zinc-700' : ''}`}
                  >
                    <div className="mb-2 md:mb-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{inv.targetEmail}</p>
                      <p className={`text-xs font-medium mt-1 ${inv.status === 'accepted' ? 'text-green-500' : 'text-orange-500'}`}>
                        {inv.status === "accepted" ? "Accettato" : "In attesa"}
                      </p>
                    </div>
                    
                    <div className="flex items-center w-full md:w-auto">
                      <select
                        value={inv.permissionLevel}
                        onChange={(e) => handlePermissionChange(inv.id, e.target.value)}
                        className="flex-1 md:flex-none border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white rounded p-1 text-sm mr-3 focus:outline-none"
                      >
                        <option value="read">Sola lettura</option>
                        <option value="write">Modifica</option>
                      </select>
                      <button 
                        type="button"
                        onClick={(e) => handleRemovePermission(e, inv)} 
                        className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center" 
                        title="Rimuovi accesso"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="flex justify-end border-t border-gray-200 dark:border-zinc-700 p-4 shrink-0">
          {showAlert && (
            <div className="text-sm text-red-500 mr-4 self-center font-medium">
              Errore di salvataggio!
            </div>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 px-8 py-2 rounded-full text-white font-medium transition-colors shadow-md"
          >
            {t("save")}
          </button>
        </footer>
      </form>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}