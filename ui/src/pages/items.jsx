import { useEffect, useState } from "react";
import { Alert, Col, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import ItemCard from "../components/ItemCard.jsx";
import http from "../lib/http.js";

const ItemsPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchItems = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data } = await http.get("/items", {
                    signal: controller.signal,
                });
                setItems(Array.isArray(data) ? data : []);
            } catch (err) {
                if (axios.isCancel(err)) {
                    return;
                }
                const message =
                    err.response?.data?.message ||
                    err.message ||
                    "获取商品失败";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();

        return () => controller.abort();
    }, []);

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

    if (!items.length) {
        return <Alert variant="info">暂无商品，稍后再来看看吧。</Alert>;
    }

    return (
        <div className="d-flex flex-column gap-3">
            <header>
                <h2 className="h5 mb-1">最新商品</h2>
                <small className="text-muted">共 {items.length} 件</small>
            </header>
            <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
                {items.map((item) => (
                    <Col key={item.id}>
                        <ItemCard item={item} />
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default ItemsPage;
