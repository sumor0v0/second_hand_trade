import { useState } from "react";
import { Container, Navbar, Form, Row, Col, Button } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import SidebarNav from "./components/SidebarNav.jsx";
import { useAuth } from "./contexts/AuthContext.jsx";
import LoginModal from "./components/LoginModal.jsx";
import RegisterModal from "./components/RegisterModal.jsx";

function App() {
    const { user, isAuthenticated, logout } = useAuth();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    const openLogin = () => {
        setShowRegister(false);
        setShowLogin(true);
    };

    const openRegister = () => {
        setShowLogin(false);
        setShowRegister(true);
    };

    const closeLogin = () => setShowLogin(false);
    const closeRegister = () => setShowRegister(false);

    return (
        <Container fluid className="vh-100 d-flex flex-column p-0">
            <Row className="g-0 flex-shrink-0">
                <Col className="p-0">
                    <Navbar
                        bg="light"
                        expand="lg"
                        className="border-bottom px-3 py-2"
                    >
                        <Navbar.Brand>二手交易平台</Navbar.Brand>
                        <div className="d-flex align-items-center ms-auto gap-3 flex-wrap">
                            <Form
                                className="flex-grow-1"
                                style={{ minWidth: "200px", maxWidth: "320px" }}
                            >
                                <Form.Control
                                    type="search"
                                    placeholder="搜索商品或用户"
                                    aria-label="搜索"
                                />
                            </Form>
                            <div className="d-flex align-items-center gap-2">
                                {isAuthenticated ? (
                                    <>
                                        <span className="text-muted small">
                                            你好，{user.username}
                                        </span>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={logout}
                                        >
                                            退出
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={openLogin}
                                        >
                                            登录
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={openRegister}
                                        >
                                            注册
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </Navbar>
                </Col>
            </Row>
            <Row className="flex-grow-1 overflow-hidden g-0">
                <Col
                    xs={12}
                    md={2}
                    lg={2}
                    className="border-end bg-light overflow-auto p-0"
                >
                    <SidebarNav />
                </Col>
                <Col
                    xs={12}
                    md={10}
                    lg={10}
                    className="overflow-auto p-3 bg-white"
                >
                    <Outlet />
                </Col>
            </Row>
            <LoginModal
                show={showLogin && !isAuthenticated}
                onHide={closeLogin}
                switchToRegister={openRegister}
            />
            <RegisterModal
                show={showRegister && !isAuthenticated}
                onHide={closeRegister}
                switchToLogin={openLogin}
            />
        </Container>
    );
}

export default App;
