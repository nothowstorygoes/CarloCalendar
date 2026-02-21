import admin from "firebase-admin";

// Inizializza Firebase Admin se non lo è già
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.REACT_APP_GOOGLEPROJECTID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { inviteId, userUid, userEmail } = req.body;

  try {
    // 1. RECUPERA L'INVITO DAL DATABASE
    const inviteRef = db.collection("invitations").doc(inviteId);
    const inviteSnap = await inviteRef.get();

    if (!inviteSnap.exists) {
      return res.status(404).json({ error: "Invito non trovato o inesistente." });
    }

    const inviteData = inviteSnap.data();

    // 2. CONTROLLA CHE SIA ANCORA IN ATTESA
    if (inviteData.status !== "pending") {
      return res.status(400).json({ error: "Questo invito è già stato utilizzato o revocato." });
    }

    // 3. VERIFICA DI SICUREZZA (La mail invitata è quella di chi sta cliccando?)
    if (inviteData.targetEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return res.status(403).json({ error: "Questo invito è stato inviato a un altro indirizzo email." });
    }

    const { ownerId, calendarId, permissionLevel } = inviteData;

    // 4. ESEGUI LA CONDIVISIONE VERA E PROPRIA
    // A. Aggiungi il permesso nel calendario dell'Owner
    const calendarRef = db.doc(`users/${ownerId}/calendars/${calendarId}`);
    await calendarRef.set({
      sharedWith: {
        [userUid]: permissionLevel
      }
    }, { merge: true });

    // B. Crea il puntatore per l'utente che ha accettato
    const pointerRef = db.collection(`users/${userUid}/shared_calendars`).doc(calendarId);
    await pointerRef.set({
      calendarId: calendarId,
      ownerId: ownerId,
      role: permissionLevel,
      addedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 5. MARCA L'INVITO COME ACCETTATO
    await inviteRef.update({ status: "accepted" , acceptedUid: userUid});

    return res.status(200).json({ success: true, message: "Invito accettato con successo!" });

  } catch (error) {
    console.error("Errore server durante l'accettazione:", error);
    return res.status(500).json({ error: "Errore interno del server." });
  }
}