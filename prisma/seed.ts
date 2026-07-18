import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// --- 1. Cargar la tabla oficial de comisión FTTH -----------------------
// El CSV fue generado a partir de la tabla real de la empresa
// (tabla_Puntos_2024.xlsx, hoja "Puntos FTTH") y ya está validado
// contra 10 técnicos reales (ver validar_comision.py).
async function cargarTablaComision() {
  const csvPath = join(__dirname, "data", "tabla_comision_ftth.csv");
  const contenido = readFileSync(csvPath, "utf-8");
  const [, ...filas] = contenido.trim().split("\n"); // saltar encabezado

  console.log(`Cargando ${filas.length} filas de la tabla de comisión FTTH...`);

  // Prisma no soporta bulk insert nativo en todos los providers de forma
  // simple, así que lo hacemos en lotes para no saturar la conexión.
  const LOTE = 1000;
  const datos = filas.map((linea) => {
    const [puntos, comision, produccion] = linea.split(",");
    return {
      puntos: parseInt(puntos, 10),
      comision: parseFloat(comision),
      produccion: parseFloat(produccion),
    };
  });

  for (let i = 0; i < datos.length; i += LOTE) {
    const lote = datos.slice(i, i + LOTE);
    await prisma.tablaComisionFTTH.createMany({
      data: lote,
      skipDuplicates: true,
    });
    process.stdout.write(`  ${Math.min(i + LOTE, datos.length)}/${datos.length}\r`);
  }
  console.log("\nTabla de comisión FTTH cargada.");
}

// --- 2. Crear las 4 cuentas iniciales -----------------------------------
// "nombre" acá funciona como usuario de login (tiene que ser único y
// corto, sin espacios raros) — CAMBIALO por algo que cada técnico
// recuerde fácil, por ejemplo su primer nombre en minúsculas.
//
// Las claves son de arranque. requiereCambioClave queda en `true` por
// default (ver schema.prisma), así que la primera vez que cada uno entre
// la app le va a pedir cambiarla antes de dejarlo seguir (Fase 1).
const USUARIOS_INICIALES = [
  { nombre: "admin", rol: "ADMIN" as const, clave: "CAMBIAR_ESTA_CLAVE_ADMIN" },
  { nombre: "Luis", rol: "TECNICO" as const, clave: "CAMBIAR_ESTA_CLAVE_ADMIN" },
  { nombre: "Mauricio", rol: "TECNICO" as const, clave: "CAMBIAR_ESTA_CLAVE_ADMIN" },
  { nombre: "John", rol: "TECNICO" as const, clave: "CAMBIAR_ESTA_CLAVE_ADMIN" },
];

async function crearUsuariosIniciales() {
  for (const u of USUARIOS_INICIALES) {
    const claveHash = await bcrypt.hash(u.clave, 10);
    await prisma.usuario.upsert({
      where: { nombre: u.nombre },
      update: {},
      create: {
        nombre: u.nombre,
        rol: u.rol,
        claveHash,
      },
    });
  }
  console.log("Usuarios iniciales creados (recordá cambiar las claves de arranque).");
}

async function main() {
  await cargarTablaComision();
  await crearUsuariosIniciales();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
