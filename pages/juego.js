import { useEffect, useState } from "react";
import { useRouter } from "next/router";

//const categorias = ["Nombre", "Animal", "Lugar", "Comida", "Objeto"];
const categorias = ["Nombres", "Apellidos", "Ciudad estado o país", "Animal", "Flor o fruto", "Película o serie", "Canción", "Marcas", "Objetos"];


function generarLetraAleatoria() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letras[Math.floor(Math.random() * letras.length)];
}

export default function Juego() {
  const router = useRouter();
  const [jugadores, setJugadores] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [letra, setLetra] = useState("");
  const [rondaTerminada, setRondaTerminada] = useState(false);
  const [puntosRonda, setPuntosRonda] = useState({});
  const [puntajesTotales, setPuntajesTotales] = useState({});

  useEffect(() => {
    if (router.isReady) {
      const nombres = Object.values(router.query);
      setJugadores(nombres);
      const vacio = {};
      nombres.forEach((nombre) => {
        vacio[nombre] = {};
        categorias.forEach((cat) => {
          vacio[nombre][cat] = "";
        });
      });
      setRespuestas(vacio);
      setLetra(generarLetraAleatoria());
    }
  }, [router.isReady]);

  const manejarCambio = (jugador, categoria, valor) => {
    setRespuestas((prev) => ({
      ...prev,
      [jugador]: {
        ...prev[jugador],
        [categoria]: valor,
      },
    }));
  };

  const manejarCambioPuntos = (jugador, valor) => {
    const puntos = parseInt(valor);
    setPuntosRonda((prev) => ({
      ...prev,
      [jugador]: isNaN(puntos) ? 0 : puntos,
    }));
  };

  const manejarBasta = () => {
    setRondaTerminada(true);
  };

  const confirmarPuntaje = () => {
    // Actualizar acumulado
    const nuevosTotales = { ...puntajesTotales };
    jugadores.forEach((jug) => {
      const puntos = puntosRonda[jug] || 0;
      nuevosTotales[jug] = (nuevosTotales[jug] || 0) + puntos;
    });
    setPuntajesTotales(nuevosTotales);

    // Resetear para nueva ronda
    const vacio = {};
    jugadores.forEach((nombre) => {
      vacio[nombre] = {};
      categorias.forEach((cat) => {
        vacio[nombre][cat] = "";
      });
    });

    setRespuestas(vacio);
    setPuntosRonda({});
    setLetra(generarLetraAleatoria());
    setRondaTerminada(false);
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Letra de la ronda: {letra}</h1>

      {!rondaTerminada ? (
        <>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Jugador</th>
                {categorias.map((cat) => (
                  <th key={cat}>{cat}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jugadores.map((jugador) => (
                <tr key={jugador}>
                  <td>{jugador}</td>
                  {categorias.map((cat) => (
                    <td key={cat}>
                      <input
                        type="text"
                        value={respuestas[jugador]?.[cat] || ""}
                        onChange={(e) =>
                          manejarCambio(jugador, cat, e.target.value)
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={manejarBasta} style={{ marginTop: 20 }}>
            ¡Basta!
          </button>
        </>
      ) : (
        <>
          <h2>Asignar puntos</h2>
          <table border="1" cellPadding="5">
            <thead>
              <tr>
                <th>Jugador</th>
                <th>Respuestas</th>
                <th>Puntos (total)</th>
              </tr>
            </thead>
            <tbody>
              {jugadores.map((jugador) => (
                <tr key={jugador}>
                  <td>{jugador}</td>
                  <td>
                    {categorias.map((cat) => (
                      <div key={cat}>
                        <strong>{cat}:</strong>{" "}
                        {respuestas[jugador]?.[cat] || "(vacío)"}
                      </div>
                    ))}
                  </td>
                  <td>
                    <input
                      type="number"
                      value={puntosRonda[jugador] || ""}
                      onChange={(e) =>
                        manejarCambioPuntos(jugador, e.target.value)
                      }
                      style={{ width: 60 }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={confirmarPuntaje} style={{ marginTop: 20 }}>
            Confirmar puntaje y comenzar nueva ronda
          </button>
        </>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h3>Puntajes acumulados</h3>
      <ul>
        {jugadores.map((jug) => (
          <li key={jug}>
            {jug}: {puntajesTotales[jug] || 0} puntos
          </li>
        ))}
      </ul>
    </main>
  );
}
