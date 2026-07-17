import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CargarVisitaForm from "./CargarVisitaForm";

export const dynamic = "force-dynamic";

export default async function CargarVisitaAdminPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/mi-ciclo");

  const tecnicos = await prisma.usuario.findMany({
    where: { rol: "TECNICO", activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  return <CargarVisitaForm tecnicos={tecnicos} />;
}
