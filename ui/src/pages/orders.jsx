import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Row,
    Spinner,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import http from "../lib/http.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const STATUS_VARIANT = {
    pending: "warning",
    paid: "info",
    completed: "success",
    cancelled: "secondary",
};

const STATUS_LABEL = {
    pending: "待完成",
    paid: "已支付",
    completed: "已完成",
    cancelled: "已取消",
};

const formatDateTime = (input) => {
    if (!input) {
        return "-";
    }
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? input : date.toLocaleString();
};

const OrdersPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get("/orders/my");
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            const message =
                err?.response?.data?.message || err?.message || "获取订单失败";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        }
    }, [fetchOrders, isAuthenticated]);

    const grouped = useMemo(() => {
        return orders.reduce(
            (acc, order) => {
                acc[order.status] = acc[order.status] || [];
                acc[order.status].push(order);
                return acc;
            },
            { pending: [], paid: [], completed: [], cancelled: [] }
        );
    }, [orders]);

    if (!isAuthenticated) {
        return <Alert variant="warning">请登录后查看购买记录。</Alert>;
    }

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
        return <Alert variant="danger">{error}</Alert>;
    }

    if (!orders.length) {
        return (
            <Card>
                <Card.Body className="d-flex flex-column gap-3 text-center">
                    <h2 className="h5 mb-0">暂无购买记录</h2>
                    <p className="text-muted mb-0">快去逛逛，挑选心仪的商品吧。</p>
                    <div>
                        <Button onClick={() => navigate("/items")}>前往商城</Button>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div className="d-flex flex-column gap-3">
            <div>
                <h1 className="h5 mb-2">购买记录</h1>
                <p className="text-muted mb-0">
                    共 {orders.length} 笔订单，包含：待完成 {grouped.pending.length}
                    、已支付 {grouped.paid.length}、已完成 {grouped.completed.length}
                    、已取消 {grouped.cancelled.length}
                </p>
            </div>

            {(["pending", "paid", "completed", "cancelled"]).map((status) => {
                const list = grouped[status] || [];
                if (!list.length) {
                    return null;
                }
                return (
                    <Card key={status}>
                        <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>{STATUS_LABEL[status] || status}</span>
                            <Badge bg={STATUS_VARIANT[status] || "secondary"}>
                                {list.length}
                            </Badge>
                        </Card.Header>
                        <Card.Body>
                            <Row className="g-3">
                                {list.map((order) => (
                                    <Col key={order.id} xs={12} md={6} lg={4}>
                                        <Card className="h-100 shadow-sm">
                                            <Card.Body className="d-flex flex-column gap-2">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span className="fw-semibold">
                                                        {order.item_title || `商品 #${order.item_id}`}
                                                    </span>
                                                    <Badge bg={STATUS_VARIANT[order.status] || "secondary"}>
                                                        {STATUS_LABEL[order.status] || order.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-muted small">
                                                    订单号：{order.id}
                                                </div>
                                                <div className="text-muted small">
                                                    金额：¥ {order.price}
                                                </div>
                                                <div className="text-muted small">
                                                    下单时间：{formatDateTime(order.created_at)}
                                                </div>
                                                <div className="pt-2">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => navigate(`/items/${order.item_id}`)}
                                                    >
                                                        查看商品
                                                    </Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </Card.Body>
                    </Card>
                );
            })}
        </div>
    );
};

export default OrdersPage;
