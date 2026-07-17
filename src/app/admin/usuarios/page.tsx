import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import UsuariosPanel from "./UsuariosPanel";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/mi-ciclo");

  return <UsuariosPanel />;
}
