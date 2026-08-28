import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import AppShell from "@/app/_componentes/AppShell";
import RegistrarForm from "./RegistrarForm";

export const dynamic = "force-dynamic";

export default async function RegistrarPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");

  return (
    <AppShell usuario={usuario} activo="registrar" titulo="Registrar visitas">
      <RegistrarForm />
    </AppShell>
  );
}
