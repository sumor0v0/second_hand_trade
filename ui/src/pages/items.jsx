import { useEffect, useMemo, useState } from "react";
import { Alert, Col, Form, Pagination, Row, Spinner } from "react-bootstrap";
import axios from "axios";
import ItemCard from "../components/ItemCard.jsx";
import http from "../lib/http.js";

const ItemsPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 12;

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

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return items;
        }
        const keyword = searchTerm.trim().toLowerCase();
        return items.filter((item) => {
            const title = item.title?.toLowerCase() || "";
            const description = item.description?.toLowerCase() || "";
            const sellerName = item.seller_name?.toLowerCase() || "";
            return (
                title.includes(keyword) ||
                description.includes(keyword) ||
                sellerName.includes(keyword)
            );
        });
    }, [items, searchTerm]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
    );

    const currentPageSafe = Math.min(currentPage, totalPages);

    const paginatedItems = useMemo(() => {
        const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredItems, currentPageSafe]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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

    return (
        <div className="d-flex flex-column gap-3">
            <header className="d-flex flex-column flex-lg-row gap-2 gap-lg-3 align-items-lg-center justify-content-between">
                <div>
                    <h2 className="h5 mb-1">最新商品</h2>
                    <small className="text-muted">
                        共 {filteredItems.length} 件匹配结果
                    </small>
                </div>
                <Form style={{ minWidth: "240px", maxWidth: "360px" }}>
                    <Form.Control
                        type="search"
                        placeholder="搜索商品名称、描述或卖家"
                        aria-label="搜索商品"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </Form>
            </header>
            {filteredItems.length ? (
                <>
                    <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
                        {paginatedItems.map((item) => (
                            <Col key={item.id}>
                                <ItemCard item={item} />
                            </Col>
                        ))}
                    </Row>
                    {totalPages > 1 && (
                        <div className="d-flex justify-content-center pt-2">
                            <Pagination className="mb-0">
                                <Pagination.Prev
                                    disabled={currentPageSafe === 1}
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.max(1, prev - 1)
                                        )
                                    }
                                />
                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <Pagination.Item
                                        key={page}
                                        active={page === currentPageSafe}
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next
                                    disabled={currentPageSafe === totalPages}
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            Math.min(totalPages, prev + 1)
                                        )
                                    }
                                />
                            </Pagination>
                        </div>
                    )}
                </>
            ) : (
                <Alert variant="info" className="mb-0">
                    未找到匹配的商品。
                </Alert>
            )}
        </div>
    );
};

export default ItemsPage;
