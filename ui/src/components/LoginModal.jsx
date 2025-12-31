import { useState } from "react";
import { Alert, Button, Form, Modal } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext.jsx";
import http from "../lib/http.js";

const LoginModal = ({ show, onHide, switchToRegister }) => {
    const { login } = useAuth();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [resetting, setResetting] = useState(false);
    const [resetFeedback, setResetFeedback] = useState(null);
    const [resetVariant, setResetVariant] = useState("success");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        setResetFeedback(null);
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
        setResetFeedback(null);
        setResetting(false);
    };

    const handleResetPassword = async () => {
        const trimmedIdentifier = identifier.trim();
        if (!trimmedIdentifier) {
            setResetVariant("danger");
            setResetFeedback("请先填写用户名或手机号");
            return;
        }

        const input = window.prompt("输入新的密码（留空则重置为 123456）");

        if (input === null) {
            return;
        }

        setResetting(true);
        setResetFeedback(null);
        try {
            const payload = { identifier: trimmedIdentifier };
            if (typeof input === "string" && input.trim().length) {
                payload.newPassword = input.trim();
            }
            const { data } = await http.post("/auth/reset-password", payload);
            const message = data?.password
                ? `密码已重置，新密码：${data.password}`
                : data?.message || "密码已重置";
            setResetVariant("success");
            setResetFeedback(message);
        } catch (resetError) {
            const message =
                resetError?.response?.data?.message ||
                resetError?.message ||
                "重置密码失败";
            setResetVariant("danger");
            setResetFeedback(message);
        } finally {
            setResetting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered onExited={handleExited}>
                            <Form.Label>用户名或手机号</Form.Label>
                <Modal.Title>登录</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column gap-3">
                <div className="text-muted small">使用账号和密码进入平台</div>
                {error && (
                    <Alert variant="danger" className="mb-0">
                                placeholder="输入用户名或手机号"
                    </Alert>
                )}
                {resetFeedback && (
                    <Alert variant={resetVariant} className="mb-0">
                        {resetFeedback}
                    </Alert>
                )}
                <Form
                    onSubmit={handleSubmit}
                        setResetFeedback("请先填写用户名或手机号");
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
                        <div className="d-flex justify-content-end mt-1">
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0"
                                onClick={handleResetPassword}
                                disabled={submitting || resetting}
                            >
                                {resetting ? "重置中..." : "忘记密码？"}
                            </Button>
                        </div>
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
