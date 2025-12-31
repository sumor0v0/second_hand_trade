import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Form,
    ListGroup,
    Row,
    Spinner,
} from "react-bootstrap";
import http from "../lib/http.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../config/apiUrl.js";
import { io } from "socket.io-client";

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

const resolveMediaUrl = (raw) => {
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

const resolveAvatarUrl = (raw) => resolveMediaUrl(raw);

const getInitial = (value) => {
    if (!value) {
        return "?";
    }
    const trimmed = String(value).trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
};

const MESSAGE_PANEL_HEIGHT = 420;

const ConversationsPage = () => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [conversationsLoading, setConversationsLoading] = useState(false);
    const [conversationsError, setConversationsError] = useState(null);

    const [selectedId, setSelectedId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesError, setMessagesError] = useState(null);

    const [composeText, setComposeText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fileInputRef = useRef(null);
    const socketRef = useRef(null);
    const selectedIdRef = useRef(null);

    useEffect(() => {
        selectedIdRef.current = selectedId;
    }, [selectedId]);

    useEffect(() => {
        if (!isAuthenticated) {
            return undefined;
        }

        const token =
            typeof window !== "undefined"
                ? window.localStorage.getItem("auth_token")
                : null;

        const socket = io(BACKEND_URL, {
            auth: { token },
            transports: ["websocket"],
        });

        const handleIncomingMessage = (message) => {
            if (!message) {
                return;
            }
            if (message.conversation_id !== selectedIdRef.current) {
                return;
            }
            setMessages((prev) => {
                if (prev.some((item) => item.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
        };

        socketRef.current = socket;
        socket.on("message:new", handleIncomingMessage);

        return () => {
            socket.off("message:new", handleIncomingMessage);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [isAuthenticated]);

    useEffect(() => {
        const socket = socketRef.current;
        if (!socket || !selectedId) {
            return undefined;
        }

        socket.emit("join-conversation", selectedId);

        return () => {
            socket.emit("leave-conversation", selectedId);
        };
    }, [selectedId]);

    const peerCache = useMemo(() => {
        const map = new Map();
        conversations.forEach((item) => {
            if (!user) {
                return;
            }
            if (item.user1_id === user.id) {
                map.set(item.id, {
                    id: item.user2_id,
                    name: item.user2_name,
                    avatar: item.user2_avatar,
                });
            } else {
                map.set(item.id, {
                    id: item.user1_id,
                    name: item.user1_name,
                    avatar: item.user1_avatar,
                });
            }
        });
        return map;
    }, [conversations, user]);

    const activePeer = selectedId ? peerCache.get(selectedId) : null;

    const fetchConversations = useCallback(
        async (preferredId = null) => {
            if (!isAuthenticated) {
                setConversations([]);
                setSelectedId(null);
                return;
            }
            setConversationsLoading(true);
            setConversationsError(null);
            try {
                const { data } = await http.get("/conversations");
                const list = Array.isArray(data) ? data : [];
                setConversations(list);
                if (list.length) {
                    const stateFocus = location.state?.focusId;
                    const resolved =
                        preferredId ??
                        stateFocus ??
                        selectedId ??
                        list[0]?.id ??
                        null;
                    setSelectedId(resolved);
                } else {
                    setSelectedId(null);
                }
            } catch (error) {
                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "获取会话失败";
                setConversationsError(message);
            } finally {
                setConversationsLoading(false);
            }
        },
        [isAuthenticated, location.state, selectedId]
    );

    useEffect(() => {
        if (location.state?.focusId) {
            navigate(location.pathname, { replace: true, state: null });
        }
    }, [location.pathname, location.state, navigate]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (!selectedId) {
            setMessages([]);
            setMessagesLoading(false);
            setMessagesError(null);
            return;
        }

        let cancelled = false;
        setMessagesLoading(true);
        setMessagesError(null);

        http.get(`/conversations/${selectedId}/messages`)
            .then(({ data }) => {
                if (cancelled) {
                    return;
                }
                setMessages(Array.isArray(data) ? data : []);
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                const message =
                    error?.response?.data?.message ||
                    error?.message ||
                    "获取消息失败";
                setMessagesError(message);
            })
            .finally(() => {
                if (!cancelled) {
                    setMessagesLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [selectedId]);

    const handleSendMessage = async (event) => {
        event.preventDefault();
        if (sending || uploadingImage || !selectedId) {
            return;
        }
        const content = composeText.trim();
        if (!content) {
            return;
        }
        setSending(true);
        try {
            const { data } = await http.post(
                `/conversations/${selectedId}/messages`,
                { content }
            );
            setMessages((prev) => {
                if (prev.some((item) => item.id === data.id)) {
                    return prev;
                }
                return [...prev, data];
            });
            setComposeText("");
            await fetchConversations(selectedId);
        } catch (error) {
            const message =
                error?.response?.data?.message || error?.message || "发送失败";
            setMessagesError(message);
        } finally {
            setSending(false);
        }
    };

    const handlePickImage = () => {
        if (uploadingImage || sending) {
            return;
        }
        fileInputRef.current?.click();
    };

    const handleImageSelected = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file || !selectedId) {
            return;
        }
        const formData = new FormData();
        formData.append("image", file);
        setUploadingImage(true);
        setMessagesError(null);
        try {
            const { data: uploadData } = await http.post(
                "/uploads/conversations",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
            const imageUrl = uploadData?.url;
            if (!imageUrl) {
                throw new Error("上传结果缺少图片地址");
            }
            const { data } = await http.post(
                `/conversations/${selectedId}/messages`,
                { content: imageUrl, is_image: 1 }
            );
            setMessages((prev) => [...prev, data]);
            await fetchConversations(selectedId);
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "发送图片失败";
            setMessagesError(message);
        } finally {
            setUploadingImage(false);
        }
    };

    if (!isAuthenticated) {
        return <Alert variant="warning">登录后才能查看会话。</Alert>;
    }

    return (
        <Row className="g-3">
            <Col lg={4} xl={3} className="d-flex flex-column gap-3">
                <Card className="flex-grow-1">
                    <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h2 className="h6 mb-0">会话列表</h2>
                            {conversationsLoading && (
                                <Spinner size="sm" animation="border" />
                            )}
                        </div>
                        {conversationsError && (
                            <Alert variant="danger" className="mb-3">
                                {conversationsError}
                            </Alert>
                        )}
                        {conversations.length ? (
                            <ListGroup className="flex-grow-1 overflow-auto">
                                {conversations.map((item) => {
                                    const peer = peerCache.get(item.id);
                                    const active = item.id === selectedId;
                                    const avatarUrl = resolveAvatarUrl(
                                        peer?.avatar
                                    );
                                    const initials = getInitial(peer?.name);
                                    return (
                                        <ListGroup.Item
                                            key={item.id}
                                            action
                                            active={active}
                                            onClick={() =>
                                                setSelectedId(item.id)
                                            }
                                        >
                                            <div className="d-flex align-items-center gap-3">
                                                <div
                                                    style={{
                                                        width: "40px",
                                                        height: "40px",
                                                        borderRadius: "50%",
                                                        backgroundColor:
                                                            avatarUrl
                                                                ? "transparent"
                                                                : "#0d6efd",
                                                        color: "#fff",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        overflow: "hidden",
                                                        flexShrink: 0,
                                                        fontWeight: "bold",
                                                    }}
                                                >
                                                    {avatarUrl ? (
                                                        <img
                                                            src={avatarUrl}
                                                            alt="会话头像"
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                        />
                                                    ) : (
                                                        initials
                                                    )}
                                                </div>
                                                <div className="d-flex flex-column align-items-start gap-1">
                                                    <div className="fw-semibold">
                                                        {peer?.name ||
                                                            "未知用户"}
                                                    </div>
                                                    <div className="text-muted small">
                                                        最近消息：
                                                        {formatTime(
                                                            item.last_message_at
                                                        ) || "暂无"}
                                                    </div>
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    );
                                })}
                            </ListGroup>
                        ) : (
                            <Alert variant="info" className="mb-0">
                                暂无会话，可在商品详情或用户主页发起对话。
                            </Alert>
                        )}
                    </Card.Body>
                </Card>
            </Col>
            <Col lg={8} xl={9} className="d-flex flex-column">
                <Card className="flex-grow-1 d-flex flex-column">
                    <Card.Body className="d-flex flex-column gap-3">
                        {selectedId ? (
                            <>
                                <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <div className="d-flex align-items-center gap-2">
                                        <h3 className="h6 mb-0">
                                            {activePeer?.name || "未选择会话"}
                                        </h3>
                                        {activePeer?.id && (
                                            <Badge bg="secondary">
                                                用户 #{activePeer.id}
                                            </Badge>
                                        )}
                                    </div>
                                    {activePeer?.id && (
                                        <Button
                                            variant="link"
                                            className="p-0"
                                            onClick={() =>
                                                navigate(
                                                    `/users/${activePeer.id}`
                                                )
                                            }
                                        >
                                            查看资料
                                        </Button>
                                    )}
                                </div>
                                {messagesError && (
                                    <Alert variant="danger" className="mb-0">
                                        {messagesError}
                                    </Alert>
                                )}
                                <div
                                    className="border rounded p-3 bg-light"
                                    style={{
                                        maxHeight: `${MESSAGE_PANEL_HEIGHT}px`,
                                        minHeight: `${MESSAGE_PANEL_HEIGHT}px`,
                                        overflowY: "auto",
                                    }}
                                >
                                    {messagesLoading ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <Spinner animation="border" />
                                        </div>
                                    ) : messages.length ? (
                                        <div className="d-flex flex-column gap-3">
                                            {messages.map((message) => {
                                                const mine =
                                                    message.sender_id ===
                                                    user?.id;
                                                const mediaUrl =
                                                    message.is_image
                                                        ? resolveMediaUrl(
                                                              message.content
                                                          )
                                                        : null;
                                                const bubbleClassName = [
                                                    "p-2",
                                                    "rounded",
                                                    "d-flex",
                                                    "flex-column",
                                                    "gap-2",
                                                    mine
                                                        ? message.is_image
                                                            ? "bg-primary bg-opacity-25"
                                                            : "bg-primary text-white"
                                                        : "bg-white border",
                                                ]
                                                    .filter(Boolean)
                                                    .join(" ");
                                                const bubbleStyle = {
                                                    maxWidth: "70%",
                                                    backgroundColor:
                                                        mine && message.is_image
                                                            ? "rgba(13, 110, 253, 0.15)"
                                                            : undefined,
                                                };
                                                return (
                                                    <div
                                                        key={message.id}
                                                        className={`d-flex ${
                                                            mine
                                                                ? "justify-content-end"
                                                                : "justify-content-start"
                                                        }`}
                                                    >
                                                        <div
                                                            className={
                                                                bubbleClassName
                                                            }
                                                            style={bubbleStyle}
                                                        >
                                                            {message.is_image ? (
                                                                mediaUrl ? (
                                                                    <img
                                                                        src={
                                                                            mediaUrl
                                                                        }
                                                                        alt="会话图片"
                                                                        style={{
                                                                            maxWidth:
                                                                                "100%",
                                                                            borderRadius:
                                                                                "0.5rem",
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="small">
                                                                        图片加载失败
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <div className="small">
                                                                    {
                                                                        message.content
                                                                    }
                                                                </div>
                                                            )}
                                                            <div className="text-muted small mt-1 text-end">
                                                                {formatTime(
                                                                    message.created_at
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-muted text-center">
                                            暂无消息，发送第一条吧。
                                        </div>
                                    )}
                                </div>
                                <Form
                                    onSubmit={handleSendMessage}
                                    className="d-flex flex-column gap-2"
                                >
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={composeText}
                                        onChange={(event) =>
                                            setComposeText(event.target.value)
                                        }
                                        disabled={sending || uploadingImage}
                                        placeholder="输入消息..."
                                    />
                                    <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                                        <div className="d-flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline-secondary"
                                                onClick={handlePickImage}
                                                disabled={
                                                    sending ||
                                                    uploadingImage ||
                                                    !selectedId
                                                }
                                            >
                                                {uploadingImage
                                                    ? "上传中..."
                                                    : "发送图片"}
                                            </Button>
                                        </div>
                                        <Button
                                            type="submit"
                                            className="flex-shrink-0"
                                            disabled={
                                                sending ||
                                                uploadingImage ||
                                                !composeText.trim()
                                            }
                                        >
                                            {sending ? "发送中..." : "发送"}
                                        </Button>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="d-none"
                                        onChange={handleImageSelected}
                                    />
                                </Form>
                            </>
                        ) : (
                            <div className="text-muted text-center">
                                选择左侧的会话，或在商品详情与用户主页中发起对话。
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ConversationsPage;
