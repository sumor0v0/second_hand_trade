import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Image,
    Row,
    Spinner,
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import http from "../lib/http.js";
import { BACKEND_URL } from "../config/apiUrl.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const resolveAvatar = (raw) => {
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
};

const resolveItemImage = (raw) => {
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
};

const formatTime = (value) => {
    if (!value) {
        return "";
    }
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
};

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user: currentUser } = useAuth();
    const [userInfo, setUserInfo] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startingConversation, setStartingConversation] = useState(false);
    const [conversationError, setConversationError] = useState(null);

    const numericId = useMemo(() => {
        const parsed = Number.parseInt(userId, 10);
        return Number.isInteger(parsed) ? parsed : null;
    }, [userId]);

    const isSelf = numericId && currentUser && currentUser.id === numericId;

    const fetchData = useCallback(async () => {
        if (!numericId) {
            setError("无效的用户 ID");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const [{ data: profile }, { data: itemsData }] = await Promise.all([
                http.get(`/users/${numericId}`),
                http.get(`/items`, { params: { sellerId: numericId } }),
            ]);
            setUserInfo(profile);
            setItems(Array.isArray(itemsData) ? itemsData : []);
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || "加载失败";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [numericId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStartConversation = async () => {
        if (!isAuthenticated || !numericId || isSelf) {
            return;
        }
        setStartingConversation(true);
        setConversationError(null);
        try {
            const { data } = await http.post("/conversations", {
                targetUserId: numericId,
            });
            const conversationId = data?.id || data?.conversation_id || null;
            navigate("/conversations", {
                state: conversationId ? { focusId: conversationId } : undefined,
            });
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || "发起对话失败";
            setConversationError(message);
        } finally {
            setStartingConversation(false);
        }
    };

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ minHeight: "50vh" }}
            >
                <Spinner animation="border" />
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!userInfo) {
        return <Alert variant="warning">未找到该用户。</Alert>;
    }

    return (
        <div className="d-flex flex-column gap-3">
            <Card>
                <Card.Body className="d-flex flex-column gap-3">
                    <div className="d-flex flex-column flex-md-row gap-3">
                        <div>
                            {userInfo.avatar ? (
                                <Image
                                    roundedCircle
                                    width={96}
                                    height={96}
                                    src={resolveAvatar(userInfo.avatar)}
                                    alt={`${userInfo.username} 的头像`}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "96px",
                                        height: "96px",
                                        borderRadius: "50%",
                                        backgroundColor: "#0d6efd",
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: "36px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {userInfo.username
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex-grow-1 d-flex flex-column gap-1">
                            <h1 className="h5 mb-0">{userInfo.username}</h1>
                            {userInfo.phone_num && (
                                <div className="text-muted small">
                                    {userInfo.phone_num}
                                </div>
                            )}
                            <div className="text-muted small">
                                注册时间：
                                {formatTime(userInfo.created_at) || "未知"}
                            </div>
                            {userInfo.bio && (
                                <div className="mt-2">{userInfo.bio}</div>
                            )}
                        </div>
                        {!isSelf && isAuthenticated && (
                            <div className="d-flex align-items-start">
                                <Button
                                    variant="primary"
                                    onClick={handleStartConversation}
                                    disabled={startingConversation}
                                >
                                    {startingConversation
                                        ? "处理中..."
                                        : "联系 Ta"}
                                </Button>
                            </div>
                        )}
                    </div>
                    {conversationError && (
                        <Alert variant="danger" className="mb-0">
                            {conversationError}
                        </Alert>
                    )}
                    {!isSelf && !isAuthenticated && (
                        <Alert variant="info" className="mb-0">
                            登录后可联系该用户。
                        </Alert>
                    )}
                </Card.Body>
            </Card>
            <Card>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h6 mb-0">发布的商品</h2>
                        <Badge bg="secondary">{items.length}</Badge>
                    </div>
                    {items.length ? (
                        <Row className="g-3">
                            {items.map((item) => (
                                <Col key={item.id} xs={12} md={6} lg={4}>
                                    <Card className="h-100">
                                        {item.cover_image && (
                                            <Card.Img
                                                variant="top"
                                                src={resolveItemImage(
                                                    item.cover_image
                                                )}
                                                alt={item.title}
                                                style={{
                                                    objectFit: "cover",
                                                    height: "160px",
                                                }}
                                            />
                                        )}
                                        <Card.Body className="d-flex flex-column gap-2">
                                            <Card.Title className="h6 mb-0">
                                                {item.title}
                                            </Card.Title>
                                            <div className="text-muted small">
                                                ¥ {item.price}
                                            </div>
                                            <div>
                                                <Badge
                                                    bg={
                                                        item.status ===
                                                        "on_sale"
                                                            ? "success"
                                                            : item.status ===
                                                              "sold"
                                                            ? "secondary"
                                                            : "warning"
                                                    }
                                                >
                                                    {item.status === "on_sale"
                                                        ? "在售"
                                                        : item.status === "sold"
                                                        ? "已售出"
                                                        : "已下架"}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="outline-primary"
                                                onClick={() =>
                                                    navigate(
                                                        `/items/${item.id}`
                                                    )
                                                }
                                            >
                                                查看详情
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Alert variant="info" className="mb-0">
                            暂无发布的商品。
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default UserProfilePage;
