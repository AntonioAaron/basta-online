import { useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [cantidad, setCantidad] = useState(2);
  const [nombres, setNombres] = useState(["", ""]);

  const manejarCambioCantidad = (e) => {
    const num = parseInt(e.target.value);
    setCantidad(num);
    setNombres(Array(num).fill(""));
  };

  const manejarCambioNombre = (index, valor) => {
    const nuevos = [...nombres];
    nuevos[index] = valor;
    setNombres(nuevos);
  };

  const comenzar = () => {
    const nombresValidados = nombres.filter((n) => n.trim() !== "");
    if (nombresValidados.length === cantidad) {
      // Guardar nombres como parámetro en la URL
      const query = nombres.map((n, i) => `jugador${i + 1}=${encodeURIComponent(n)}`).join("&");
      router.push(`/juego?${query}`);
    } else {
      alert("Por favor, completa todos los nombres.");
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <h1>Juego de Basta 🧠</h1>

      <label>¿Cuántos jugadores? </label>
      <input
        type="number"
        min="1"
        max="20"
        value={cantidad}
        onChange={manejarCambioCantidad}
        style={{ width: 50 }}
      />

      <div style={{ marginTop: 20 }}>
        {nombres.map((nombre, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <label>Jugador {i + 1}: </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => manejarCambioNombre(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      <button onClick={comenzar} style={{ marginTop: 20 }}>
        Comenzar juego
      </button>
    </main>
  );
}
