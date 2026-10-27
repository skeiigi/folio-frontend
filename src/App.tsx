import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Layout from "./components/Layout";
import { RequireAuth } from "./auth";
import { Loading, Empty } from "./components/ui";
const Explore = lazy(() => import("./pages/Explore"));
const Creators = lazy(() => import("./pages/Creators"));
const Artwork = lazy(() => import("./pages/Artwork"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.Login })),
);
const Register = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.Register })),
);
const BecomeAuthor = lazy(() =>
  import("./pages/AuthPages").then((m) => ({ default: m.BecomeAuthor })),
);
const Studio = lazy(() =>
  import("./pages/Studio").then((m) => ({ default: m.Studio })),
);
const ProfileEditor = lazy(() =>
  import("./pages/Studio").then((m) => ({ default: m.ProfileEditor })),
);
const ArtworkEditor = lazy(() =>
  import("./pages/Studio").then((m) => ({ default: m.ArtworkEditor })),
);
const Services = lazy(() =>
  import("./pages/Studio").then((m) => ({ default: m.Services })),
);
const BriefForm = lazy(() =>
  import("./pages/Briefs").then((m) => ({ default: m.BriefForm })),
);
const BriefList = lazy(() =>
  import("./pages/Briefs").then((m) => ({ default: m.BriefList })),
);
const BriefDetail = lazy(() =>
  import("./pages/Briefs").then((m) => ({ default: m.BriefDetail })),
);
const Account = lazy(() =>
  import("./pages/AccountAdmin").then((m) => ({ default: m.Account })),
);
const Admin = lazy(() =>
  import("./pages/AccountAdmin").then((m) => ({ default: m.Admin })),
);
export default function App() {
  return (
    <Suspense fallback={<Loading label="Открываем страницу…" />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Explore />} />
          <Route path="creators" element={<Creators />} />
          <Route path="creators/:id" element={<Profile />} />
          <Route path="artworks/:id" element={<Artwork />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route
            path="become-author"
            element={
              <RequireAuth>
                <BecomeAuthor />
              </RequireAuth>
            }
          />
          <Route
            path="creators/:id/brief"
            element={
              <RequireAuth>
                <BriefForm />
              </RequireAuth>
            }
          />
          <Route
            path="briefs"
            element={
              <RequireAuth>
                <BriefList />
              </RequireAuth>
            }
          />
          <Route
            path="briefs/:id"
            element={
              <RequireAuth>
                <BriefDetail />
              </RequireAuth>
            }
          />
          <Route
            path="studio"
            element={
              <RequireAuth role="author">
                <Studio />
              </RequireAuth>
            }
          />
          <Route
            path="studio/profile"
            element={
              <RequireAuth role="author">
                <ProfileEditor />
              </RequireAuth>
            }
          />
          <Route
            path="studio/services"
            element={
              <RequireAuth role="author">
                <Services />
              </RequireAuth>
            }
          />
          <Route
            path="studio/artworks/new"
            element={
              <RequireAuth role="author">
                <ArtworkEditor />
              </RequireAuth>
            }
          />
          <Route
            path="studio/artworks/:id/edit"
            element={
              <RequireAuth role="author">
                <ArtworkEditor />
              </RequireAuth>
            }
          />
          <Route
            path="account"
            element={
              <RequireAuth>
                <Account />
              </RequireAuth>
            }
          />
          <Route
            path="admin"
            element={
              <RequireAuth role="admin">
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <Empty
                title="Кажется, эта страница ещё не создана"
                text="Зато в каталоге уже есть что посмотреть."
                action={
                  <Link className="btn btn-dark" to="/">
                    К работам
                  </Link>
                }
              />
            }
          />
        </Route>
      </Routes>
    </Suspense>
  );
}
