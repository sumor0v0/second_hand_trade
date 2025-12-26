import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useAuth } from "../context/AuthContext.jsx";

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, initializing } = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!initializing && isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [initializing, isAuthenticated, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await login({ identifier, password });
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "登录失败");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: "60vh" }}
        >
            <Card
                style={{ width: "100%", maxWidth: "420px" }}
                className="shadow-sm"
            >
                <Card.Body className="d-flex flex-column gap-3">
                    <div>
                        <Card.Title className="mb-1">登录</Card.Title>
                        <Card.Subtitle className="text-muted">
                            使用账号和密码进入平台
                        </Card.Subtitle>
                    </div>
                    {error && (
                        <Alert variant="danger" className="mb-0">
                            {error}
                        </Alert>
                    )}
                    <Form
                        onSubmit={handleSubmit}
                        className="d-flex flex-column gap-3"
                    >
                        <Form.Group controlId="loginIdentifier">
                            <Form.Label>用户名</Form.Label>
                            <Form.Control
                                type="text"
                                value={identifier}
                                onChange={(event) =>
                                    setIdentifier(event.target.value)
                                }
                                placeholder="输入用户名"
                                autoComplete="username"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="loginPassword">
                            <Form.Label>密码</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="输入密码"
                                autoComplete="current-password"
                                required
                            />
                        </Form.Group>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting}
                        >
                            {submitting ? "登录中..." : "登录"}
                        </Button>
                    </Form>
                    <div className="text-center text-muted">
                        还没有账号？
                        <Link to="/auth/register" className="ps-1">
                            去注册
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default LoginPage;
