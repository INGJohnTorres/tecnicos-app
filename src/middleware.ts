import { NextRequest, NextResponse } from "next/server";
import { verificarSesionEdge } from "@/lib/auth-edge";

const COOKIE_SESION = "sesion";

// Rutas que no requieren sesión.
const RUTAS_PUBLICAS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const esPublica = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r));
  if (
    esPublica ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/comision") ||
    pathname.startsWith("/api/cron") // usa su propio secreto (Bearer), no cookie de sesión
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_SESION)?.value;
  const sesion = token ? await verificarSesionEdge(token) : null;

  if (!sesion) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Rutas de admin: solo el rol ADMIN puede entrar.
  if (pathname.startsWith("/admin") && sesion.rol !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/mi-ciclo";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protege todo excepto archivos estáticos — antes solo excluía un puñado
  // de nombres puntuales (manifest.json, sw.js), así que cualquier otra
  // imagen de /public (íconos, el logo) quedaba bloqueada para quien no
  // tuviera sesión, rompiendo el logo en la propia pantalla de login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)"],
};
