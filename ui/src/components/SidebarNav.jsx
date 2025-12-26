import { Button, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { BACKEND_URL } from "../config/apiUrl.js";

const SidebarNav = () => {
    const { user, isAuthenticated, logout } = useAuth();

    const avatarUrl = (() => {
        const raw = user?.avatar;
        if (!raw) {
            return null;
        }
        if (/^https?:\/\//i.test(raw)) {
            return raw;
        }
        if (raw.startsWith("/")) {
            return `${BACKEND_URL}${raw}`;
        }
        return `${BACKEND_URL}/${raw}`;
    })();

    const avatarLetter = (() => {
        const name = user?.username;
        if (!name) {
            return "?";
        }
        return name.charAt(0).toUpperCase();
    })();

    return (
        <div className="d-flex flex-column h-100">
            {isAuthenticated ? (
                <div className="px-3 pt-3 pb-3 border-bottom">
                    <div className="d-flex align-items-center gap-3 mb-3">
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                backgroundColor: avatarUrl
                                    ? "transparent"
                                    : "#0d6efd",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "20px",
                                overflow: "hidden",
                                flex: "0 0 48px",
                            }}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="用户头像"
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                    }}
                                />
                            ) : (
                                avatarLetter
                            )}
                        </div>
                        <div className="d-flex flex-column">
                            <div className="fw-semibold">{user.username}</div>
                            {user.email && (
                                <div className="text-muted small">
                                    {user.email}
                                </div>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={logout}
                    >
                        退出登录
                    </Button>
                </div>
            ) : (
                <></>
            )}

            <Nav
                className="flex-column py-3 gap-2 px-3 flex-grow-1"
                variant="pills"
            >
                <Nav.Link as={NavLink} to="/" end className="w-100 text-start">
                    首页
                </Nav.Link>
                {isAuthenticated && (
                    <Nav.Link
                        as={NavLink}
                        to="/items/new"
                        className="w-100 text-start"
                    >
                        发布商品
                    </Nav.Link>
                )}
                <Nav.Link
                    as={NavLink}
                    to="/conversations"
                    className="w-100 text-start"
                >
                    消息
                </Nav.Link>
                <Nav.Link
                    as={NavLink}
                    to="/orders"
                    className="w-100 text-start"
                >
                    购买记录
                </Nav.Link>
                <Nav.Link
                    as={NavLink}
                    to="/profile"
                    className="w-100 text-start"
                >
                    我的
                </Nav.Link>
            </Nav>
        </div>
    );
};

export default SidebarNav;
