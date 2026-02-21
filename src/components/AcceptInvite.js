import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // Assicurati che il percorso sia giusto

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const inviteId = searchParams.get("inviteId");
  const navigate = useNavigate();
  
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState("");

  const handleAccept = async () => {
    // Controllo di sicurezza: l'utente DEVE essere loggato per accettare
    if (!auth.currentUser) {
      alert("Devi effettuare il login nella tua app prima di poter accettare l'invito!");
      // Opzionale: rimanda alla pagina di login
      navigate('/login'); 
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch('/api/acceptInvite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteId: inviteId,
          userUid: auth.currentUser.uid,
          userEmail: auth.currentUser.email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Errore sconosciuto");
        return;
      }

      setStatus("success");
      // Dopo 2 secondi di successo, rimanda l'utente alla sua dashboard/calendario
      setTimeout(() => {
        navigate('/'); 
      }, 2000);

    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Impossibile connettersi al server.");
    }
  };

  if (!inviteId) {
    return <div className="text-center mt-20 text-red-500">Nessun ID invito trovato nel link.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-zinc-900">
      <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Invito al Calendario</h1>
        
        {status === "idle" && (
          <>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sei stato invitato a collaborare a un calendario. Vuoi accettare?
            </p>
            <button 
              onClick={handleAccept}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              Accetta l'invito
            </button>
          </>
        )}

        {status === "loading" && <p className="text-blue-500 font-semibold mt-4">Sincronizzazione in corso...</p>}
        
        {status === "success" && (
          <div className="text-green-500 font-semibold mt-4">
            <p>Invito accettato con successo! 🎉</p>
            <p className="text-sm mt-2 text-gray-500">Ti stiamo riportando al calendario...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-red-500 font-semibold mt-4">
            <p>Ops! Qualcosa è andato storto:</p>
            <p className="text-sm mt-1">{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}