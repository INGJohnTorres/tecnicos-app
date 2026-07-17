import { jwtVerify } from "jose";

// El middleware de Next.js corre en el runtime "Edge", donde la librería
// `jsonwebtoken` (que usa el módulo `crypto` de Node) no funciona bien.
// Por eso, SOLO para el middleware, verificamos el mismo token con `jose`,
// que sí es compatible con Edge. El token se firma igual en todos lados
// (jsonwebtoken en las rutas de API, que corren en runtime Node).
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function verificarSesionEdge(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; rol: "ADMIN" | "TECNICO" };
  } catch {
    return null;
  }
}
