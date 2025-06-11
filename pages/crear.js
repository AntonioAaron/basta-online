// pages/crear.js
import { useRouter } from "next/router";
import { database } from "../firebase/firebase";
import { ref, set } from "firebase/database";
import { useState } from "react";

export default function CrearSala() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Función para generar ID aleatorio para la sala
  function generarIdSala(length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function crearSala() {
    setLoading(true);
    const salaId = generarIdSala();

    // Crear objeto sala inicial con datos básicos
    const nuevaSala = {
      letraActual: null,
      jugadores: {},
      respuestas: {},
      puntos: {},
      estado: "esperando", // estados: esperando, jugando, terminado
      creadoEn: Date.now(),
    };

    // Guardar sala en Firebase Realtime Database
    await set(ref(database, "salas/" + salaId), nuevaSala);

    // Redirigir a la sala creada
    router.push(`/sala/${salaId}`);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Crear sala de Basta</h1>
      <button onClick={crearSala} disabled={loading}>
        {loading ? "Creando..." : "Crear nueva sala"}
      </button>
    </div>
  );
}
