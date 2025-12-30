import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Col, Form, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import { API_URL, BACKEND_URL } from "../config/apiUrl.js";
import http from "../lib/http.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const statusMeta = {
    on_sale: { text: "在售", variant: "success" },
    sold: { text: "已售出", variant: "secondary" },
    removed: { text: "已下架", variant: "warning" },
};

const resolveImageUrl = (path) => {
    if (!path) {
        return `${BACKEND_URL}/placeholder.jpg`;
    }
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    if (path.startsWith("/")) {
        return `${BACKEND_URL}${path}`;
    }
    return `${BACKEND_URL}/${path}`;
};

const formatPrice = (price) => {
    const value = Number.parseFloat(price);
    return Number.isFinite(value) ? value.toFixed(2) : price;
};

const formatDateTime = (dateString) => {
    if (!dateString) {
        return "未知时间";
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return dateString;
    }
    return date.toLocaleString();
};

const resolveUserAvatar = (path) => {
    if (!path) {
        return null;
    }
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    if (path.startsWith("/")) {
        return `${BACKEND_URL}${path}`;
    }
    return `${BACKEND_URL}/${path}`;
};

const getInitials = (value) => {
    if (!value) {
        return "?";
    }
    const trimmed = String(value).trim();
    if (!trimmed) {
        return "?";
    }
    return trimmed.charAt(0).toUpperCase();
};

const ItemDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [commentsError, setCommentsError] = useState(null);
    const [commentContent, setCommentContent] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [commentSubmitError, setCommentSubmitError] = useState(null);
    const [contacting, setContacting] = useState(false);
    const [contactError, setContactError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchItemDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data } = await axios.get(`${API_URL}/items/${id}`, {
                    signal: controller.signal,
                });

                setItem(data);
                setActiveImageIdx(0);
            } catch (err) {
                if (axios.isCancel(err)) {
                    return;
                }
                const message =
                    err.response?.data?.message ||
                    err.message ||
                    "加载详情失败";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchItemDetails();
        } else {
            setError("无效的商品编号");
            setLoading(false);
        }

        return () => controller.abort();
    }, [id]);

    useEffect(() => {
        if (!id) {
            return;
        }

        const controller = new AbortController();

        const fetchComments = async () => {
            try {
                setCommentsLoading(true);
                setCommentsError(null);

                const { data } = await axios.get(
                    `${API_URL}/items/${id}/comments`,
                    { signal: controller.signal }
                );

                setComments(Array.isArray(data) ? data : []);
            } catch (err) {
                if (axios.isCancel(err)) {
                    return;
                }
                const message =
                    err.response?.data?.message ||
                    err.message ||
                    "加载评论失败";
                setCommentsError(message);
            } finally {
                setCommentsLoading(false);
            }
        };

        fetchComments();

        return () => controller.abort();
    }, [id]);

    const handleSubmitComment = async (event) => {
        event.preventDefault();
        if (!isAuthenticated || commentSubmitting) {
            return;
        }

        const content = commentContent.trim();
        if (!content) {
            setCommentSubmitError("请输入评论内容");
            return;
        }

        setCommentSubmitting(true);
        setCommentSubmitError(null);

        try {
            const { data } = await http.post(`/items/${id}/comments`, {
                content,
            });
            setComments((prev) => [data, ...prev]);
            setCommentContent("");
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || "发表评论失败";
            setCommentSubmitError(message);
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleContactSeller = async () => {
        if (!item?.seller_id) {
            return;
        }

        if (!isAuthenticated) {
            setContactError("请先登录后再联系卖家。");
            return;
        }

        if (user?.id === item.seller_id) {
            setContactError("这是你自己的商品。");
            return;
        }

        setContacting(true);
        setContactError(null);
        try {
            const { data } = await http.post("/conversations", {
                targetUserId: item.seller_id,
            });
            const conversationId = data?.id || data?.conversation_id || null;
            navigate("/conversations", {
                state: conversationId ? { focusId: conversationId } : undefined,
            });
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || "联系卖家失败";
            setContactError(message);
        } finally {
            setContacting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">加载中...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="d-flex flex-column gap-3">
                <div>{error}</div>
                <div>
                    <Button
                        variant="outline-danger"
                        onClick={() => navigate(-1)}
                    >
                        返回上一页
                    </Button>
                </div>
            </Alert>
        );
    }

    if (!item) {
        return (
            <Alert variant="warning">
                未找到商品信息。
                <Button
                    variant="link"
                    className="ps-2"
                    onClick={() => navigate(-1)}
                >
                    返回
                </Button>
            </Alert>
        );
    }

    const imageRecords = Array.isArray(item.images) ? item.images : [];
    const gallery = imageRecords.length
        ? imageRecords.map((img) => ({
              id: img.id,
              src: resolveImageUrl(img.image_url),
          }))
        : [
              {
                  id: "placeholder",
                  src: resolveImageUrl(item.cover_image || "/placeholder.jpg"),
              },
          ];

    const activeImage = gallery[activeImageIdx]?.src || gallery[0].src;
    const status = statusMeta[item.status] || {
        text: item.status || "未知状态",
        variant: "secondary",
    };

    return (
        <div className="d-flex flex-column gap-4">
            <div>
                <Button
                    variant="link"
                    className="px-0"
                    onClick={() => navigate(-1)}
                >
                    ← 返回
                </Button>
            </div>
            <Row className="g-4">
                <Col lg={6} className="d-flex flex-column gap-3">
                    <div className="border rounded overflow-hidden bg-light">
                        <img
                            src={activeImage}
                            alt={item.title}
                            className="w-100"
                            style={{ objectFit: "cover", maxHeight: "420px" }}
                        />
                    </div>
                    {gallery.length > 1 && (
                        <Row xs={4} sm={5} md={6} className="g-2">
                            {gallery.map((img, index) => (
                                <Col key={img.id || index}>
                                    <button
                                        type="button"
                                        className={`border rounded w-100 p-0 bg-transparent ${
                                            index === activeImageIdx
                                                ? "border-primary"
                                                : "border-0"
                                        }`}
                                        onClick={() => setActiveImageIdx(index)}
                                    >
                                        <img
                                            src={img.src}
                                            alt={`${item.title} 缩略图 ${
                                                index + 1
                                            }`}
                                            className="w-100 rounded"
                                            style={{
                                                height: "80px",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </button>
                                </Col>
                            ))}
                        </Row>
                    )}
                </Col>
                <Col lg={6} className="d-flex flex-column gap-4">
                    <div>
                        <div className="d-flex align-items-start gap-3">
                            <h1 className="h4 mb-0 flex-grow-1">
                                {item.title}
                            </h1>
                            <Badge bg={status.variant}>{status.text}</Badge>
                        </div>
                        <div className="text-primary fw-semibold fs-4 mt-2">
                            ¥{formatPrice(item.price)}
                        </div>
                        <div className="text-muted small">
                            发布于 {formatDateTime(item.created_at)}
                        </div>
                    </div>

                    <section>
                        <h2 className="h6">商品描述</h2>
                        <p className="mb-0 text-muted">
                            {item.description?.trim() || "暂无描述"}
                        </p>
                    </section>

                    <section className="d-flex flex-column gap-1">
                        <h2 className="h6 mb-0">卖家信息</h2>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span>卖家：</span>
                            <Button
                                variant="link"
                                className="p-0"
                                onClick={() =>
                                    navigate(`/users/${item.seller_id}`)
                                }
                            >
                                {item.seller_name || "未知卖家"}
                            </Button>
                        </div>
                        <div className="text-muted small">
                            商品编号：{item.id}
                        </div>
                    </section>

                    <div className="d-flex gap-2">
                        <Button
                            variant="primary"
                            onClick={handleContactSeller}
                            disabled={contacting}
                        >
                            {contacting ? "处理中..." : "联系卖家"}
                        </Button>
                        <Button
                            variant="outline-secondary"
                            onClick={() => navigate("/items")}
                        >
                            继续浏览
                        </Button>
                    </div>
                    {contactError && (
                        <Alert variant="danger" className="mb-0">
                            {contactError}
                        </Alert>
                    )}
                </Col>
            </Row>
            <section className="d-flex flex-column gap-3">
                <h2 className="h6 mb-0">评论</h2>
                {isAuthenticated ? (
                    <Form
                        onSubmit={handleSubmitComment}
                        className="d-flex flex-column gap-2"
                    >
                        <Form.Group controlId="commentContent">
                            <Form.Label className="visually-hidden">
                                评论内容
                            </Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={commentContent}
                                placeholder="分享一下你的看法..."
                                onChange={(event) => {
                                    setCommentContent(event.target.value);
                                    if (commentSubmitError) {
                                        setCommentSubmitError(null);
                                    }
                                }}
                                disabled={commentSubmitting}
                            />
                        </Form.Group>
                        {commentSubmitError && (
                            <Alert variant="danger" className="mb-0">
                                {commentSubmitError}
                            </Alert>
                        )}
                        <div className="d-flex justify-content-end">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={
                                    commentSubmitting || !commentContent.trim()
                                }
                            >
                                {commentSubmitting ? "发表中..." : "发表评论"}
                            </Button>
                        </div>
                    </Form>
                ) : (
                    <Alert variant="info" className="mb-0">
                        登录后可以发表评论。
                    </Alert>
                )}

                {commentsLoading ? (
                    <div className="d-flex justify-content-center py-4">
                        <Spinner animation="border" role="status" />
                    </div>
                ) : commentsError ? (
                    <Alert variant="danger" className="mb-0">
                        {commentsError}
                    </Alert>
                ) : comments.length ? (
                    <div
                        className="d-flex flex-column gap-3"
                        style={{ maxHeight: "320px", overflowY: "auto" }}
                    >
                        {comments.map((comment) => {
                            const displayName =
                                comment?.username?.trim() || "用户";
                            const avatarUrl = resolveUserAvatar(
                                comment?.avatar
                            );
                            const initial = getInitials(displayName);

                            return (
                                <div
                                    key={comment.id}
                                    className="border rounded p-3 d-flex flex-column gap-2"
                                >
                                    <div className="d-flex justify-content-between align-items-center gap-3 text-muted small">
                                        <div className="d-flex align-items-center gap-2">
                                            <div
                                                style={{
                                                    width: "36px",
                                                    height: "36px",
                                                    borderRadius: "50%",
                                                    backgroundColor: avatarUrl
                                                        ? "transparent"
                                                        : "#0d6efd",
                                                    color: "#fff",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    overflow: "hidden",
                                                    flexShrink: 0,
                                                    fontSize: "16px",
                                                }}
                                            >
                                                {avatarUrl ? (
                                                    <img
                                                        src={avatarUrl}
                                                        alt="评论者头像"
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit: "cover",
                                                            borderRadius: "50%",
                                                        }}
                                                    />
                                                ) : (
                                                    initial
                                                )}
                                            </div>
                                            <span className="text-body">
                                                {displayName}
                                            </span>
                                        </div>
                                        <span>
                                            {formatDateTime(comment.created_at)}
                                        </span>
                                    </div>
                                    <div>{comment.content}</div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <Alert variant="secondary" className="mb-0">
                        暂无评论。
                    </Alert>
                )}
            </section>
        </div>
    );
};

export default ItemDetailsPage;
