import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Badge, Button, Col, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import { API_URL, BACKEND_URL } from "../config/apiUrl.js";

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

const ItemDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeImageIdx, setActiveImageIdx] = useState(0);

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
                        <div>卖家：{item.seller_name || "未知卖家"}</div>
                        <div className="text-muted small">
                            商品编号：{item.id}
                        </div>
                    </section>

                    <div className="d-flex gap-2">
                        <Button variant="primary">立即联系卖家</Button>
                        <Button
                            variant="outline-secondary"
                            onClick={() => navigate("/items")}
                        >
                            继续浏览
                        </Button>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default ItemDetailsPage;
