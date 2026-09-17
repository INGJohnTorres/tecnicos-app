import CerrarSesionBoton from "./CerrarSesionBoton";
import {
  IconHome,
  IconPlusCircle,
  IconUsers,
  IconTrendingUp,
  IconTrophy,
  IconLogOut,
  IconZap,
} from "./ui/Icons";

export type SeccionActiva = "panel" | "cargar" | "usuarios" | "tendencias" | "ranking" | "registrar";

type NavItem = {
  key: SeccionActiva;
  href: string;
  label: string;
  Icon: (p: { size?: number }) => JSX.Element;
};

const NAV_ADMIN: NavItem[] = [
  { key: "panel", href: "/admin", label: "Panel", Icon: IconHome },
  { key: "cargar", href: "/admin/cargar", label: "Cargar visita", Icon: IconPlusCircle },
  { key: "usuarios", href: "/admin/usuarios", label: "Usuarios", Icon: IconUsers },
  { key: "tendencias", href: "/dashboard", label: "Tendencias", Icon: IconTrendingUp },
  { key: "ranking", href: "/ranking", label: "Ranking", Icon: IconTrophy },
];

const NAV_TECNICO: NavItem[] = [
  { key: "panel", href: "/mi-ciclo", label: "Inicio", Icon: IconHome },
  { key: "registrar", href: "/registrar", label: "Registrar", Icon: IconPlusCircle },
  { key: "ranking", href: "/ranking", label: "Ranking", Icon: IconTrophy },
  { key: "tendencias", href: "/dashboard", label: "Tendencia", Icon: IconTrendingUp },
];

type Props = {
  usuario: { nombre: string; rol: "ADMIN" | "TECNICO" };
  activo: SeccionActiva;
  titulo: string;
  subtitulo?: string;
  ciclo?: string;
  children: React.ReactNode;
};

export default function AppShell({ usuario, activo, titulo, subtitulo, ciclo, children }: Props) {
  const items = usuario.rol === "ADMIN" ? NAV_ADMIN : NAV_TECNICO;
  const iniciales = usuario.nombre.slice(0, 2).toUpperCase();

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-logo">
          <div className="shell-logo-mark">
            <IconZap size={18} />
          </div>
          <div>
            <div className="shell-logo-text">FTTH VISITAS</div>
            <div className="shell-logo-sub">{usuario.rol === "ADMIN" ? "Panel administrador" : "Panel técnico"}</div>
          </div>
        </div>

        <nav className="shell-nav">
          {items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className={`shell-nav-item${item.key === activo ? " active" : ""}`}
            >
              <span className="shell-nav-icon">
                <item.Icon size={16} />
              </span>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        <div className="shell-user">
          <div className="shell-avatar">{iniciales}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{usuario.nombre}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>
              {usuario.rol === "ADMIN" ? "Administrador" : "Técnico"}
            </div>
          </div>
          <CerrarSesionBoton compact />
        </div>
      </aside>

      <div className="shell-body">
        <header className="shell-topbar">
          <div>
            <div className="shell-topbar-title">{titulo}</div>
            {subtitulo && <div className="shell-topbar-subtitle">{subtitulo}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {ciclo && (
              <div className="shell-cycle-pill">
                <span className="shell-cycle-dot" />
                {ciclo}
              </div>
            )}
            <div className="shell-hide-desktop">
              <CerrarSesionBoton />
            </div>
          </div>
        </header>

        <div className="shell-content enter">{children}</div>
      </div>

      <nav className="shell-bottomnav">
        {items.map((item) => (
          <a key={item.key} href={item.href} className={`shell-bottomnav-item${item.key === activo ? " active" : ""}`}>
            <span className="shell-bottomnav-icon">
              <item.Icon size={17} />
            </span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
