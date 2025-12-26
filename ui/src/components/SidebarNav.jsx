import { Button, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const SidebarNav = () => {
    const { user, isAuthenticated, logout } = useAuth();

    return (
        <div className="d-flex flex-column h-100">
            {isAuthenticated ? (
                <div className="px-3 pt-3 pb-3 border-bottom">
                    <div>
                        <div className="fw-semibold">{user.username}</div>
                        {user.email && (
                            <div className="text-muted small">{user.email}</div>
                        )}
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
                <Nav.Link
                    as={NavLink}
                    to="/conversations"
                    className="w-100 text-start"
                >
                    对话
                </Nav.Link>
                <Nav.Link
                    as={NavLink}
                    to="/profile"
                    className="w-100 text-start"
                >
                    个人资料
                </Nav.Link>
                <Nav.Link
                    as={NavLink}
                    to="/orders"
                    className="w-100 text-start"
                >
                    购买记录
                </Nav.Link>
            </Nav>
        </div>
    );
};

export default SidebarNav;
