import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";

const RegisterModal = ({ show, onHide, switchToLogin }) => {
    const { register } = useAuth();
    const [username, setUsername] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            await register({ username, password, phone_num: phone });
            onHide?.();
        } catch (err) {
            setError(err.message || "注册失败");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExited = () => {
        setUsername("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
        setSubmitting(false);
        setError(null);
    };

    return (
        <Modal show={show} onHide={onHide} centered onExited={handleExited}>
            <Modal.Header closeButton>
                <Modal.Title>注册</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column gap-3">
                <div className="text-muted small">创建账号以体验完整功能</div>
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
                    <Form.Group controlId="registerPhone">
                        <Form.Label>手机号</Form.Label>
                        <Form.Control
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="输入手机号"
                            autoComplete="tel"
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
            </Modal.Body>
            <Modal.Footer className="justify-content-center">
                <span className="text-muted small">
                    已有账号？
                    <Button
                        variant="link"
                        size="sm"
                        className="ps-1"
                        onClick={() => {
                            onHide?.();
                            switchToLogin?.();
                        }}
                    >
                        去登录
                    </Button>
                </span>
            </Modal.Footer>
        </Modal>
    );
};

export default RegisterModal;
