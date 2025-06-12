// pages/sala/[id].jsAdd commentMore actions
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { database } from "../../firebase/firebase";
import { ref, onValue, set, update, get } from "firebase/database";


async function acumularPuntajes(idSala, jugadorId, puntajesRonda) {
  const totalesRef = ref(database, `salas/${idSala}/puntajesTotales/${jugadorId}`);
  const totalesSnap = await get(totalesRef);
  const totalesActuales = totalesSnap.exists() ? totalesSnap.val() : {};

  // Suma puntajes por categoría
  const nuevosTotales = { ...totalesActuales };
  for (const [cat, pts] of Object.entries(puntajesRonda)) {
    const ptsNum = Number(pts) || 0;
    nuevosTotales[cat] = (nuevosTotales[cat] || 0) + ptsNum;
  }

  await set(totalesRef, nuevosTotales);
}

function obtenerLetraAleatoria() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letras[Math.floor(Math.random() * letras.length)];
}

export default function Sala() {

  const [puntajesTotales, setPuntajesTotales] = useState({});

  const [puntuacionesJugador, setPuntuacionesJugador] = useState({});

  const [todosEnviaron, setTodosEnviaron] = useState(false);

  const router = useRouter();
  const { id } = router.query;

  //const categorias = ["nombre", "animal", "color", "fruta", "pais", "pruebna"];
  const categorias = ["Nombres", "Apellidos", "Ciudad estado o país", "Animal", "Flor o fruto", "Película o serie", "Canción", "Marcas", "Objetos"];


  const [nombreJugador, setNombreJugador] = useState("");
  const [jugadorRegistrado, setJugadorRegistrado] = useState(false);
  const [jugadorId, setJugadorId] = useState(null);
  const [sala, setSala] = useState(null);
  const [esHost, setEsHost] = useState(false);

  const [respuestasJugador, setRespuestasJugador] = useState(
    categorias.reduce((acc, cat) => {
      acc[cat] = "";
      return acc;
    }, {})
  );

  //Puntajes totales
  useEffect(() => {
    if (!id) return;

    // Ref para la sala
    const salaRef = ref(database, `salas/${id}`);
    const unsubscribeSala = onValue(salaRef, (snapshot) => {
      setSala(snapshot.val());
    });

    // Ref para puntajes totales
    const puntajesRef = ref(database, `salas/${id}/puntajesTotales`);
    const unsubscribePuntajes = onValue(puntajesRef, (snapshot) => {
      setPuntajesTotales(snapshot.val() || {});
    });

    return () => {
      unsubscribeSala();
      unsubscribePuntajes();
    };
  }, [id]);

  // Detectar si todos los jugadores enviaron respuestas
  useEffect(() => {
    if (!sala?.jugadores || !sala?.respuestas) {
      setTodosEnviaron(false);
      return;
    }

    const jugadoresIds = Object.keys(sala.jugadores);
    const respuestasIds = Object.keys(sala.respuestas);

    // Si todos respondieron
    const allSent = jugadoresIds.every((jid) => respuestasIds.includes(jid));
    if (allSent) {
      setTodosEnviaron(true);
      return;
    }

    // Si alguien ya respondió, iniciar cuenta regresiva
    if (respuestasIds.length > 0 && !sala.tiempoLimiteActivado) {
      const salaRef = ref(database, `salas/${id}`);
      set(salaRef, {
        ...sala,
        tiempoLimiteActivado: true,
        tiempoLimiteInicio: Date.now(), // para sincronizar con todos
      });
    }

    // Si ya está activado, verificar si el tiempo se acabó
    if (sala.tiempoLimiteActivado && sala.tiempoLimiteInicio) {
      const tiempoPasado = Date.now() - sala.tiempoLimiteInicio;
      const limite = 15000; // segundos

      if (tiempoPasado >= limite) {
        const jugadoresFaltantes = jugadoresIds.filter((jid) => !respuestasIds.includes(jid));
        // Opcional: guardar lista de jugadores que no participaron
        setTodosEnviaron(true); // avanzamos a la siguiente fase aunque falten
      }
    }

  }, [sala]);


  // Escuchar cambios en la sala
  useEffect(() => {
    if (!id) return;
    const salaRef = ref(database, "salas/" + id);
    const unsubscribe = onValue(salaRef, (snapshot) => {
      setSala(snapshot.val());
    });
    return () => unsubscribe();
  }, [id]);

  // Revisar si ya estaba registrado (localStorage)
  useEffect(() => {
    const savedId = localStorage.getItem("jugadorId");
    if (savedId) {
      setJugadorId(savedId);
      setJugadorRegistrado(true);
    }
  }, []);

  // Detectar si jugador es host cuando sala o jugador cambian
  useEffect(() => {
    if (sala && jugadorId) {
      setEsHost(sala.host === jugadorId);
    }
  }, [sala, jugadorId]);

  //Reiniciar Partida
  async function reiniciarRonda() {
    if (!id) return;

    // Limpiar respuestas y puntuaciones
    await set(ref(database, `salas/${id}/respuestas`), null);
    await set(ref(database, `salas/${id}/puntuaciones`), null);

    // Cambiar estado y asignar letra nueva
    const nuevaLetra = obtenerLetraAleatoria();
    await update(ref(database, `salas/${id}`), {
      estado: "jugando",
      letraActual: nuevaLetra,
    });
  }

  //Enviar Puntuacion  
  async function enviarPuntuaciones() {
    if (!jugadorId) return;
    const puntuacionesRef = ref(database, `salas/${id}/puntuaciones/${jugadorId}`);
    await set(puntuacionesRef, puntuacionesJugador);

    // Acumular puntajes totales
    await acumularPuntajes(id, jugadorId, puntuacionesJugador);

    alert("Puntuaciones enviadas y acumuladas");
  }

  // Función para unirse a la sala
  async function unirseASala() {
    if (!nombreJugador.trim()) return;

    const nuevoId = nombreJugador.toLowerCase().replace(/\s+/g, "_");
    const jugadorRef = ref(database, `salas/${id}/jugadores/${nuevoId}`);

    await set(jugadorRef, {
      nombre: nombreJugador,
      puntos: 0,
    });

    localStorage.setItem("jugadorId", nuevoId);
    setJugadorId(nuevoId);

    // Si no hay host asignado, asignar el jugador que entra primero como host
    const salaRef = ref(database, `salas/${id}`);
    const snapshot = await new Promise((resolve) =>
      onValue(salaRef, resolve, { onlyOnce: true })
    );
    const data = snapshot.val();

    if (!data?.host) {
      await update(salaRef, {
        host: nuevoId,
      });
    }

    setJugadorRegistrado(true);
  }

  // Función para iniciar ronda (host)
  async function iniciarRonda() {
    const letra = obtenerLetraAleatoria();
    const salaRef = ref(database, `salas/${id}`);
    await update(salaRef, {
      estado: "jugando",
      letraActual: letra,
      respuestas: {}, // Limpiar respuestas previas
    });
    // Limpiar respuestas locales también
    setRespuestasJugador(
      categorias.reduce((acc, cat) => {
        acc[cat] = "";
        return acc;
      }, {})
    );
  }

  // Enviar respuestas del jugador
  async function enviarRespuestas() {
    if (!jugadorId) return;
    const respuestasRef = ref(database, `salas/${id}/respuestas/${jugadorId}`);
    await set(respuestasRef, {
      nombre: sala.jugadores[jugadorId].nombre,
      respuestas: respuestasJugador,
    });
    alert("Respuestas enviadas");
  }

  if (!sala) return <p>Cargando sala...</p>;

  if (!jugadorRegistrado) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Sala: {id}</h1>
        <p>Ingresa tu nombre para unirte:</p>
        <input
          type="text"
          value={nombreJugador}
          onChange={(e) => setNombreJugador(e.target.value)}
        />
        <button onClick={unirseASala}>Unirse</button>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        maxWidth: 600,
        margin: "20px auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        color: "#333",
      }}
    >
      <h1 style={{ borderBottom: "2px solid #4a90e2", paddingBottom: 10, marginBottom: 20 }}>
        Sala {id}
      </h1>

      <h2 style={{ color: "#4a90e2" }}>Bienvenid@, {sala.jugadores?.[jugadorId]?.nombre}</h2>

      <p style={{ fontWeight: "600", marginTop: 30, marginBottom: 10 }}>Jugadores conectados:</p>
      <ul style={{ listStyleType: "circle", paddingLeft: 20, marginBottom: 30 }}>
        {sala.jugadores &&
          Object.values(sala.jugadores).map((j) => (
            <li key={j.nombre} style={{ padding: "4px 0", fontSize: 16 }}>
              {j.nombre}
            </li>
          ))}
      </ul>

      {esHost && sala.estado !== "jugando" && (
        <button
          onClick={iniciarRonda}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 5,
            border: "none",
            backgroundColor: "#4a90e2",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 3px 6px rgba(74,144,226,0.4)",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#357ABD")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4a90e2")}
        >
          Iniciar Ronda
        </button>
      )}

      {esHost && sala.estado === "jugando" && (
        <button
          onClick={reiniciarRonda}
          style={{
            marginTop: 20,
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 5,
            border: "none",
            backgroundColor: "orange",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 3px 6px rgba(255,165,0,0.4)",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#cc8400")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "orange")}
        >
          Reiniciar Ronda
        </button>
      )}

      {!todosEnviaron && sala.tiempoLimiteActivado && sala.tiempoLimiteInicio && (
        <div style={{
          marginTop: 20,
          padding: '10px 15px',
          backgroundColor: '#fff3cd', 
          color: '#856404',
          border: '1px solid rgb(240, 186, 26)',
          borderRadius: 4,
          fontWeight: 600,
          fontSize: '16px',
          textAlign: 'center'
        }}>
          ⏳ ¡Apúrate! Tienes <strong>{Math.max(0, 15 - Math.floor((Date.now() - sala.tiempoLimiteInicio) / 1000))}</strong> segundos para terminar.
        </div>
      )}

      {!todosEnviaron && sala.estado === "jugando" && sala.letraActual && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ marginBottom: 15, color: "#4a90e2" }}>
            Completa las categorías con la letra: {sala.letraActual}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarRespuestas();
            }}
          >
            {categorias.map((cat) => (
              <div
                key={cat}
                style={{
                  marginBottom: 15,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <label
                  htmlFor={`input-${cat}`}
                  style={{ minWidth: 120, fontWeight: "600", fontSize: 16 }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}:
                </label>
                <input
                  id={`input-${cat}`}
                  type="text"
                  value={respuestasJugador[cat]}
                  onChange={(e) =>
                    setRespuestasJugador({
                      ...respuestasJugador,
                      [cat]: e.target.value,
                    })
                  }
                  style={{
                    marginLeft: 10,
                    flexGrow: 1,
                    padding: "8px 12px",
                    fontSize: 16,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#4a90e2")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
                  autoComplete="off"
                />
              </div>
            ))}
            <button
              type="submit"
              style={{
                marginTop: 10,
                padding: "10px 25px",
                fontSize: 16,
                borderRadius: 5,
                border: "none",
                backgroundColor: "#4a90e2",
                color: "white",
                cursor: "pointer",
                boxShadow: "0 3px 6px rgba(74,144,226,0.4)",
                transition: "background-color 0.3s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#357ABD")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4a90e2")}
            >
              Enviar respuestas
            </button>
          </form>
        </div>
      )}

      {todosEnviaron && (
        <p style={{ marginTop: 30, fontWeight: "600", fontSize: 16 }}>
          Todos enviaron sus respuestas. Esperando a que asignen puntos...
        </p>
      )}

      {todosEnviaron && sala.respuestas?.[jugadorId] && (
        <div style={{ marginTop: 30 }}>
          <h3 style={{ marginBottom: 15, color: "#4a90e2" }}>Asigna puntos a tus respuestas:</h3>
          <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
            {Object.entries(sala.respuestas[jugadorId].respuestas).map(([cat, resp]) => (
              <li
                key={cat}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  fontSize: 16,
                }}
              >
                <b style={{ minWidth: 120 }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}:
                </b>{" "}
                <span style={{ flexGrow: 1, marginLeft: 5 }}>{resp}</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={puntuacionesJugador[cat] ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPuntuacionesJugador((prev) => ({
                      ...prev,
                      [cat]: val === "" ? "" : Number(val),
                    }));
                  }}
                  style={{
                    width: 60,
                    marginLeft: 10,
                    padding: "6px 8px",
                    fontSize: 16,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    textAlign: "center",
                    transition: "border-color 0.3s ease",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#4a90e2")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#ccc")}
                />
              </li>
            ))}
          </ul>
          <button
            onClick={enviarPuntuaciones}
            style={{
              marginTop: 10,
              padding: "10px 25px",
              fontSize: 16,
              borderRadius: 5,
              border: "none",
              backgroundColor: "#4a90e2",
              color: "white",
              cursor: "pointer",
              boxShadow: "0 3px 6px rgba(74,144,226,0.4)",
              transition: "background-color 0.3s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#357ABD")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4a90e2")}
          >
            Enviar puntuaciones
          </button>
        </div>
      )}

      <h3
        style={{
          marginTop: 40,
          borderTop: "1px solid #ddd",
          paddingTop: 20,
          color: "#4a90e2",
        }}
      >
        Puntajes Totales:
      </h3>
      <ul style={{ listStyleType: "none", paddingLeft: 0, fontSize: 16 }}>
        {puntajesTotales &&
          Object.entries(puntajesTotales).map(([jugadorId, puntosPorCategoria]) => {
            const total = Object.values(puntosPorCategoria).reduce((acc, val) => acc + val, 0);
            return (
              <li
                key={jugadorId}
                style={{
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                  color: "#555",
                }}
              >
                {sala?.jugadores?.[jugadorId]?.nombre || jugadorId}:{" "}
                <b style={{ color: "#000" }}>{total} puntos</b>
              </li>
            );
          })}
      </ul>
    </div>

  );
}
