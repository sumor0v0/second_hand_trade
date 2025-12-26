import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";

const LoginModal = ({ show, onHide, switchToRegister }) => {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await login({ identifier, password });
            onHide?.();
        } catch (err) {
            setError(err.message || "登录失败");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExited = () => {
        setIdentifier("");
        setPassword("");
        setSubmitting(false);
        setError(null);
    };

    return (
        <Modal show={show} onHide={onHide} centered onExited={handleExited}>
            <Modal.Header closeButton>
                <Modal.Title>登录</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column gap-3">
                <div className="text-muted small">使用账号和密码进入平台</div>
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
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                <span className="text-muted small">
                    还没有账号？
                    <Button
                        variant="link"
                        size="sm"
                        className="ps-1"
                        onClick={() => {
                            onHide?.();
                            switchToRegister?.();
                        }}
                    >
                        去注册
                    </Button>
                </span>
            </Modal.Footer>
        </Modal>
    );
};

export default LoginModal;
