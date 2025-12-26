import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    ListGroup,
    Row,
    Spinner,
} from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import EditInfoForm from "../components/EditInfoForm";
import { BACKEND_URL } from "../config/apiUrl.js";

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
    const { user, initializing } = useAuth();
    const [showEdit, setShowEdit] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [error, setError] = useState(null);

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
                        <Card className="h-100">
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
                                    <strong>个人简介:</strong>{" "}
                                    {user.bio?.trim() || "暂无简介"}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>注册时间:</strong> {createdAt}
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
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
