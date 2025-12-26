import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useAuth } from "../context/AuthContext.jsx";

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated, initializing } = useAuth();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!initializing && isAuthenticated) {
            navigate("/", { replace: true });
        }
    }, [initializing, isAuthenticated, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await register({ username, password, email });
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message || "注册失败");
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
                style={{ width: "100%", maxWidth: "480px" }}
                className="shadow-sm"
            >
                <Card.Body className="d-flex flex-column gap-3">
                    <div>
                        <Card.Title className="mb-1">注册</Card.Title>
                        <Card.Subtitle className="text-muted">
                            创建账号以体验完整功能
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
                        <Form.Group controlId="registerUsername">
                            <Form.Label>用户名</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                placeholder="输入用户名"
                                autoComplete="username"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="registerEmail">
                            <Form.Label>邮箱</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="输入邮箱"
                                autoComplete="email"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="registerPassword">
                            <Form.Label>密码</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="设置密码"
                                autoComplete="new-password"
                                required
                                minLength={6}
                            />
                        </Form.Group>
                        <Form.Group controlId="registerConfirmPassword">
                            <Form.Label>确认密码</Form.Label>
                            <Form.Control
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                placeholder="再次输入密码"
                                autoComplete="new-password"
                                required
                            />
                        </Form.Group>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={submitting}
                        >
                            {submitting ? "注册中..." : "注册"}
                        </Button>
                    </Form>
                    <div className="text-center text-muted">
                        已有账号？
                        <Link to="/auth/login" className="ps-1">
                            去登录
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
};

export default RegisterPage;
