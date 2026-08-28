"use client";

import { useRouter } from "next/navigation";
import { IconLogOut } from "./ui/Icons";

export default function CerrarSesionBoton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (compact) {
    return (
      <button
        onClick={cerrarSesion}
        title="Cerrar sesión"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-faint)",
          cursor: "pointer",
          padding: 6,
          display: "flex",
          alignItems: "center",
        }}
      >
        <IconLogOut size={15} />
      </button>
    );
  }

  return (
    <button onClick={cerrarSesion} className="btn btn-secondary btn-sm">
      <IconLogOut size={14} />
      Salir
    </button>
  );
}
