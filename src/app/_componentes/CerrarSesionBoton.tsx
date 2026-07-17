"use client";

import { useRouter } from "next/navigation";

export default function CerrarSesionBoton() {
  const router = useRouter();

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={cerrarSesion}
      style={{
        background: "none",
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: "6px 12px",
        fontSize: 13,
        cursor: "pointer",
        color: "#555",
      }}
    >
      Salir
    </button>
  );
}
