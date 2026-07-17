-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'TECNICO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'TECNICO',
    "claveHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "requiereCambioClave" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "cargadoPorId" TEXT NOT NULL,
    "fechaVisita" DATE NOT NULL,
    "cantidadSinCambio" INTEGER NOT NULL DEFAULT 0,
    "cantidadConCambio" INTEGER NOT NULL DEFAULT 0,
    "puntosSinCambio" INTEGER NOT NULL,
    "puntosConCambio" INTEGER NOT NULL,
    "puntosTotal" INTEGER NOT NULL,
    "cicloInicio" DATE NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tabla_comision_ftth" (
    "puntos" INTEGER NOT NULL,
    "comision" DOUBLE PRECISION NOT NULL,
    "produccion" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "tabla_comision_ftth_pkey" PRIMARY KEY ("puntos")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_nombre_key" ON "usuarios"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "registros_cicloInicio_idx" ON "registros"("cicloInicio");

-- CreateIndex
CREATE UNIQUE INDEX "registros_usuarioId_fechaVisita_key" ON "registros"("usuarioId", "fechaVisita");

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
