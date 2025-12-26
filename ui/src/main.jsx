import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import ItemDetailsPage from "./pages/item-details.jsx";
import ItemsPage from "./pages/items.jsx";
import LoginPage from "./pages/login.jsx";
import RegisterPage from "./pages/register.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                index: true,
                element: <ItemsPage />,
            },
            {
                path: "items",
                element: <ItemsPage />,
            },
            {
                path: "items/:id",
                element: <ItemDetailsPage />,
            },
            {
                path: "auth/login",
                element: <LoginPage />,
            },
            {
                path: "auth/register",
                element: <RegisterPage />,
            },
        ],
    },
]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </StrictMode>
);
