import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Form,
    Spinner,
    Table,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import http from "../lib/http.js";

const STATUS_OPTIONS = [
    { value: "on_sale", label: "在售" },
    { value: "sold", label: "已售出" },
    { value: "removed", label: "已下架" },
];

const STATUS_VARIANT = {
    on_sale: "success",
    sold: "secondary",
    removed: "warning",
};

const STATUS_FLOW = {
    on_sale: new Set(["on_sale", "sold", "removed"]),
    sold: new Set(["sold", "removed", "on_sale"]),
    removed: new Set(["removed", "on_sale"]),
};

const ItemsManagePage = () => {
    const { isAuthenticated, user } = useAuth();
    const userId = user?.id;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [priceDraft, setPriceDraft] = useState("");
    const [priceError, setPriceError] = useState(null);
    const [busySet, setBusySet] = useState(() => new Set());

    const isBusy = useCallback((id) => busySet.has(id), [busySet]);

    const setBusy = useCallback((id, busy) => {
        setBusySet((prev) => {
            const next = new Set(prev);
            if (busy) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const fetchItems = useCallback(async () => {
        if (!isAuthenticated || !userId) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { data } = await http.get("/items", {
                params: { sellerId: userId },
            });
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            const messageText =
                err?.response?.data?.message || err?.message || "获取商品失败";
            setError(messageText);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, userId]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const visibleItems = useMemo(() => items, [items]);

    const beginEditPrice = (item) => {
        setEditingId(item.id);
        setPriceDraft(item.price?.toString() ?? "");
        setPriceError(null);
    };

    const cancelEditPrice = () => {
        setEditingId(null);
        setPriceDraft("");
        setPriceError(null);
    };

    const submitPriceChange = async (itemId) => {
        const numeric = Number.parseFloat(priceDraft);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            setPriceError("请输入有效价格");
            return;
        }
        setBusy(itemId, true);
        setPriceError(null);
        setMessage(null);
        try {
            const { data } = await http.put(`/items/${itemId}`, {
                price: numeric,
            });
            setItems((prev) =>
                prev.map((item) => (item.id === itemId ? data : item))
            );
            setMessage("价格已更新");
            cancelEditPrice();
        } catch (err) {
            const messageText =
                err?.response?.data?.message || err?.message || "更新价格失败";
            setPriceError(messageText);
        } finally {
            setBusy(itemId, false);
        }
    };

    const handleStatusChange = async (item, nextStatus) => {
        if (item.status === nextStatus) {
            return;
        }
        if (!STATUS_FLOW[item.status]?.has(nextStatus)) {
            return;
        }
        setBusy(item.id, true);
        setMessage(null);
        setError(null);
        try {
            const { data } = await http.put(`/items/${item.id}`, {
                status: nextStatus,
            });
            setItems((prev) =>
                prev.map((entry) => (entry.id === item.id ? data : entry))
            );
            setMessage("商品状态已更新");
        } catch (err) {
            const messageText =
                err?.response?.data?.message || err?.message || "更新状态失败";
            setError(messageText);
        } finally {
            setBusy(item.id, false);
        }
    };

    if (!isAuthenticated) {
        return <Alert variant="warning">请登录后管理商品。</Alert>;
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

    return (
        <div className="d-flex flex-column gap-3">
            <Card>
                <Card.Body className="d-flex flex-column gap-3">
                    <div>
                        <h1 className="h5 mb-1">商品管理</h1>
                        <p className="text-muted mb-0">
                            查看并维护你发布的商品，支持改价与状态切换。
                        </p>
                    </div>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {message && <Alert variant="success">{message}</Alert>}
                    {visibleItems.length ? (
                        <div className="table-responsive">
                            <Table hover size="sm" className="align-middle">
                                <thead>
                                    <tr>
                                        <th>商品</th>
                                        <th style={{ width: "120px" }}>
                                            价格 (¥)
                                        </th>
                                        <th style={{ width: "160px" }}>状态</th>
                                        <th>创建时间</th>
                                        <th style={{ width: "110px" }}>操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibleItems.map((item) => {
                                        const busy = isBusy(item.id);
                                        const editing = editingId === item.id;
                                        return (
                                            <tr key={item.id}>
                                                <td>{item.title}</td>
                                                <td>
                                                    {editing ? (
                                                        <div className="d-flex flex-column gap-1">
                                                            <Form.Control
                                                                size="sm"
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={
                                                                    priceDraft
                                                                }
                                                                onChange={(
                                                                    event
                                                                ) =>
                                                                    setPriceDraft(
                                                                        event
                                                                            .target
                                                                            .value
                                                                    )
                                                                }
                                                                disabled={busy}
                                                            />
                                                            {priceError && (
                                                                <span className="text-danger small">
                                                                    {priceError}
                                                                </span>
                                                            )}
                                                            <div className="d-flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        submitPriceChange(
                                                                            item.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                >
                                                                    保存
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline-secondary"
                                                                    onClick={
                                                                        cancelEditPrice
                                                                    }
                                                                    disabled={
                                                                        busy
                                                                    }
                                                                >
                                                                    取消
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span>
                                                                {item.price}
                                                            </span>
                                                            <Button
                                                                size="sm"
                                                                variant="link"
                                                                className="p-0"
                                                                onClick={() =>
                                                                    beginEditPrice(
                                                                        item
                                                                    )
                                                                }
                                                                disabled={busy}
                                                            >
                                                                改价
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column gap-2">
                                                        <Badge
                                                            bg={
                                                                STATUS_VARIANT[
                                                                    item.status
                                                                ] || "secondary"
                                                            }
                                                        >
                                                            {STATUS_OPTIONS.find(
                                                                (option) =>
                                                                    option.value ===
                                                                    item.status
                                                            )?.label ||
                                                                item.status}
                                                        </Badge>
                                                        <Form.Select
                                                            size="sm"
                                                            value={item.status}
                                                            disabled={
                                                                busy ||
                                                                STATUS_FLOW[
                                                                    item.status
                                                                ]?.size === 1
                                                            }
                                                            onChange={(event) =>
                                                                handleStatusChange(
                                                                    item,
                                                                    event.target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            {STATUS_OPTIONS.map(
                                                                (option) => (
                                                                    <option
                                                                        key={
                                                                            option.value
                                                                        }
                                                                        value={
                                                                            option.value
                                                                        }
                                                                        disabled={
                                                                            !STATUS_FLOW[
                                                                                item
                                                                                    .status
                                                                            ]?.has(
                                                                                option.value
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            option.label
                                                                        }
                                                                    </option>
                                                                )
                                                            )}
                                                        </Form.Select>
                                                    </div>
                                                </td>
                                                <td>
                                                    {item.created_at
                                                        ? new Date(
                                                              item.created_at
                                                          ).toLocaleString()
                                                        : "-"}
                                                </td>
                                                <td>
                                                    <Button
                                                        as={Link}
                                                        size="sm"
                                                        variant="outline-primary"
                                                        to={`/items/${item.id}`}
                                                        disabled={busy}
                                                    >
                                                        查看
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <Alert variant="info" className="mb-0">
                            暂无商品，请先发布。
                        </Alert>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default ItemsManagePage;
