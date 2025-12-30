import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    ListGroup,
    Row,
    Spinner,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import EditInfoForm from "../components/EditInfoForm";
import { BACKEND_URL } from "../config/apiUrl.js";
import http from "../lib/http.js";

const formatDateTime = (value) => {
    if (!value) {
        return "未知";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }
    return date.toLocaleString();
};

function ProfilePage() {
    const { user, initializing, refreshUser } = useAuth();
    const [showEdit, setShowEdit] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);
    const [rechargeAmount, setRechargeAmount] = useState("");
    const [rechargeSubmitting, setRechargeSubmitting] = useState(false);
    const [rechargeError, setRechargeError] = useState(null);
    const [rechargeSuccess, setRechargeSuccess] = useState(null);

    const avatarUrl = useMemo(() => {
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
    }, [user?.avatar]);

    const avatarLetter = useMemo(() => {
        const name = user?.username;
        if (!name) {
            return "?";
        }
        return name.charAt(0).toUpperCase();
    }, [user?.username]);

    const createdAt = useMemo(
        () => formatDateTime(user?.created_at),
        [user?.created_at]
    );

    const balanceDisplay = useMemo(() => {
        if (user?.balance === undefined || user?.balance === null) {
            return "0.00";
        }
        const numeric = Number.parseFloat(user.balance);
        if (!Number.isFinite(numeric)) {
            return String(user.balance);
        }
        return numeric.toFixed(2);
    }, [user?.balance]);

    const handleRecharge = async (event) => {
        event.preventDefault();
        if (!user || rechargeSubmitting) {
            return;
        }

        const amountNumber = Number.parseFloat(rechargeAmount);
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            setRechargeError("请输入有效的充值金额");
            setRechargeSuccess(null);
            return;
        }

        setRechargeSubmitting(true);
        setRechargeError(null);
        setRechargeSuccess(null);

        try {
            await http.post(`/users/${user.id}/recharge`, {
                amount: amountNumber,
            });
            await refreshUser();
            setRechargeAmount("");
            setRechargeSuccess("充值成功");
        } catch (submitError) {
            const message =
                submitError?.response?.data?.message ||
                submitError?.message ||
                "充值失败";
            setRechargeError(message);
        } finally {
            setRechargeSubmitting(false);
        }
    };

    if (initializing) {
        return (
            <Container className="text-center" style={{ marginTop: "100px" }}>
                <Spinner animation="border" />
                <p>正在加载用户信息...</p>
            </Container>
        );
    }

    if (!user) {
        return (
            <Container className="text-center" style={{ marginTop: "100px" }}>
                <h2>用户未登录</h2>
                <p>请登录后查看个人中心。</p>
            </Container>
        );
    }

    return (
        <>
            <Container fluid>
                <Row className="m-3">
                    <h1>个人中心</h1>
                </Row>
                <Row className="g-4">
                    <Col md={4}>
                        <Card className="h-100">
                            <Card.Header as="h5">个人信息</Card.Header>
                            <Card.Body className="text-center d-flex flex-column gap-3">
                                <div
                                    style={{
                                        width: "100px",
                                        height: "100px",
                                        borderRadius: "50%",
                                        backgroundColor: avatarUrl
                                            ? "transparent"
                                            : "#0d6efd",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "36px",
                                        margin: "0 auto 16px",
                                        overflow: "hidden",
                                    }}
                                >
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={`${user.username} avatar`}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        avatarLetter
                                    )}
                                </div>
                                <Card.Title className="text-center mb-0">
                                    {user.username}
                                </Card.Title>
                                <Card.Subtitle className="text-muted text-center">
                                    {user.email || "未填写邮箱"}
                                </Card.Subtitle>
                                {feedback && (
                                    <Alert
                                        variant="success"
                                        className="w-100 mb-0"
                                        onClose={() => setFeedback(null)}
                                        dismissible
                                    >
                                        {feedback}
                                    </Alert>
                                )}
                                {error && (
                                    <Alert
                                        variant="danger"
                                        className="w-100 mb-0"
                                        onClose={() => setError(null)}
                                        dismissible
                                    >
                                        {error}
                                    </Alert>
                                )}
                                <Button
                                    variant="primary"
                                    className="w-100"
                                    onClick={() => {
                                        setError(null);
                                        setShowEdit(true);
                                    }}
                                >
                                    编辑个人信息
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={8}>
                        <div className="d-flex flex-column gap-3">
                            <Card>
                                <Card.Header as="h5">详细信息</Card.Header>
                                <ListGroup variant="flush">
                                    <ListGroup.Item>
                                        <strong>用户ID:</strong> {user.id}
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>用户名:</strong> {user.username}
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>电子邮箱:</strong>{" "}
                                        {user.email || "未填写"}
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>账户余额:</strong> ¥
                                        {balanceDisplay}
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>个人简介:</strong>{" "}
                                        {user.bio?.trim() || "暂无简介"}
                                    </ListGroup.Item>
                                    <ListGroup.Item>
                                        <strong>注册时间:</strong> {createdAt}
                                    </ListGroup.Item>
                                </ListGroup>
                            </Card>
                            <Card>
                                <Card.Header as="h5">余额充值</Card.Header>
                                <Card.Body>
                                    <Form
                                        className="d-flex flex-column gap-3"
                                        onSubmit={handleRecharge}
                                    >
                                        <Form.Group controlId="rechargeAmount">
                                            <Form.Label>充值金额</Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="输入充值金额"
                                                value={rechargeAmount}
                                                onChange={(event) => {
                                                    setRechargeAmount(
                                                        event.target.value
                                                    );
                                                    setRechargeError(null);
                                                    setRechargeSuccess(null);
                                                }}
                                                disabled={rechargeSubmitting}
                                            />
                                        </Form.Group>
                                        {rechargeError && (
                                            <Alert
                                                variant="danger"
                                                className="mb-0"
                                            >
                                                {rechargeError}
                                            </Alert>
                                        )}
                                        {rechargeSuccess && (
                                            <Alert
                                                variant="success"
                                                className="mb-0"
                                            >
                                                {rechargeSuccess}
                                            </Alert>
                                        )}
                                        <div className="d-flex justify-content-end">
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={rechargeSubmitting}
                                            >
                                                {rechargeSubmitting
                                                    ? "充值中..."
                                                    : "确认充值"}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </div>
                    </Col>
                </Row>
            </Container>
            <EditInfoForm
                show={showEdit}
                onHide={() => setShowEdit(false)}
                onSuccess={(message) => {
                    setFeedback(message);
                    setError(null);
                }}
                onError={(message) => {
                    setError(message);
                    setFeedback(null);
                }}
            />
        </>
    );
}

export default ProfilePage;
