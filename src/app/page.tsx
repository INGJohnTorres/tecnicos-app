import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";

// La raíz nunca se muestra directamente: redirige según haya o no sesión.
export default async function Home() {
  const usuario = await usuarioActual();

  if (!usuario) redirect("/login");
  redirect(usuario.rol === "ADMIN" ? "/admin" : "/mi-ciclo");
}
