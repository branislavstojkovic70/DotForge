import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import theme from "./theme";
import Navbar from "./components/navbar";
import Dashboard from "./pages/Dashboard";
import Organizations from "./pages/Organizations";
import NewOrganization from "./pages/NewOrganization";
import OrganizationDetail from "./pages/OrganizationDetail";
import Repositories from "./pages/Repositories";
import NewRepository from "./pages/NewRepository";
import Grants from "./pages/Grants";
import Activity from "./pages/Activity";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navbar />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "organizations", element: <Organizations /> },
      { path: "organizations/new", element: <NewOrganization /> },
      { path: "organizations/:id", element: <OrganizationDetail /> },
      { path: "repositories", element: <Repositories /> },
      { path: "repositories/new", element: <NewRepository /> },
      { path: "grants", element: <Grants /> },
      { path: "activity", element: <Activity /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <RouterProvider router={router} />
    <Toaster
      position="bottom-center"
      toastOptions={{
        success: {
          style: {
            background: theme.palette.success.main,
          },
        },
        error: {
          style: {
            background: theme.palette.error.main,
            color: "#F5F5F5",
          },
        },
      }}
    />
  </ThemeProvider>
);
