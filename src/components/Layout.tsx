import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Plus, Menu, X, ArrowUpRight, LogOut, Settings } from "lucide-react";
import { useAuth } from "../auth";
import { Avatar } from "./ui";

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Folio — на главную">
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      folio<span className="brand-dot">.</span>
    </Link>
  );
}
export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav
            className={`main-nav ${open ? "is-open" : ""}`}
            aria-label="Основная навигация"
          >
            <NavLink to="/" end>
              Работы
            </NavLink>
            <NavLink to="/creators" end>
              Авторы
            </NavLink>
            {user && <NavLink to="/briefs">Мои брифы</NavLink>}
            {user?.roles.includes("author") && (
              <NavLink to="/studio">Мастерская</NavLink>
            )}
            {user?.roles.includes("admin") && (
              <NavLink to="/admin">Модерация</NavLink>
            )}
            {user && (
              <NavLink className="mobile-only" to="/account">
                Мой аккаунт
              </NavLink>
            )}
            {user && (
              <button
                className="mobile-only nav-exit"
                onClick={() => {
                  navigate("/");
                  void logout();
                }}
              >
                Выйти
              </button>
            )}
          </nav>
          <div className="header-actions">
            {user ? (
              <>
                <Link
                  className="header-account"
                  to="/account"
                  title="Мой аккаунт"
                >
                  <Avatar name={user.name} size="small" />
                  <span>{user.name.split(" ")[0]}</span>
                </Link>
                <button
                  className="icon-button logout-button"
                  aria-label="Выйти"
                  onClick={() => {
                    navigate("/");
                    void logout();
                  }}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link className="login-link" to="/login">
                Войти
              </Link>
            )}
            <Link
              className="btn btn-dark header-publish"
              to={
                user?.roles.includes("author")
                  ? "/studio/artworks/new"
                  : user
                    ? "/become-author"
                    : "/register?role=author"
              }
            >
              <Plus size={17} />
              Опубликовать
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label="Меню"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <Brand />
          <p>
            Для тех, кто создаёт.
            <br />И тех, кто ищет свой стиль.
          </p>
        </div>
        <div className="footer-links">
          <Link to="/">
            Смотреть работы <ArrowUpRight size={14} />
          </Link>
          <Link to="/creators">
            Найти автора <ArrowUpRight size={14} />
          </Link>
        </div>
        <span className="footer-note">
          Folio · 2026
          <br />
          Идеям нужно пространство.
        </span>
      </footer>
    </div>
  );
}
