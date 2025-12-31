import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import ItemDetailsPage from "./pages/item-details.jsx";
import ItemsPage from "./pages/items.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProfilePage from "./pages/profile.jsx";
import ItemPostPage from "./pages/item-post.jsx";
import ItemsManagePage from "./pages/items-manage.jsx";
import ConversationsPage from "./pages/conversations.jsx";
import UserProfilePage from "./pages/user-profile.jsx";
import OrdersPage from "./pages/orders.jsx";
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
                path: "items/new",
                element: <ItemPostPage />,
            },
            {
                path: "items/:id",
                element: <ItemDetailsPage />,
            },
            {
                path: "items/manage",
                element: <ItemsManagePage />,
            },
            {
                path: "conversations",
                element: <ConversationsPage />,
            },
            {
                path: "orders",
                element: <OrdersPage />,
            },
            {
                path: "users/:userId",
                element: <UserProfilePage />,
            },
            {
                path: "profile",
                element: <ProfilePage />,
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
