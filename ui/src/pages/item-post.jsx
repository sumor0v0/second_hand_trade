import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";
import http from "../lib/http.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const initialForm = {
    title: "",
    description: "",
    price: "",
};

const ItemPostPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState(initialForm);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [successState, setSuccessState] = useState(null);

    const canSubmit = useMemo(() => {
        if (submitting) {
            return false;
        }
        if (!form.title.trim()) {
            return false;
        }
        const price = Number.parseFloat(form.price);
        return Number.isFinite(price) && price > 0;
    }, [form.price, form.title, submitting]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] || null;
        setImageFile(file);
        setPreviewUrl((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }
            if (!file) {
                return null;
            }
            return URL.createObjectURL(file);
        });
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.title.trim()) {
            nextErrors.title = "请输入商品标题";
        }

        const price = Number.parseFloat(form.price);
        if (!Number.isFinite(price) || price <= 0) {
            nextErrors.price = "请输入有效价格";
        }

        return nextErrors;
    };

    const resetForm = () => {
        setForm({ ...initialForm });
        setImageFile(null);
        setPreviewUrl((prev) => {
            if (prev) {
                URL.revokeObjectURL(prev);
            }
            return null;
        });
        setFileInputKey((value) => value + 1);
        setErrors({});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isAuthenticated || submitting) {
            return;
        }

        const validationErrors = validate();
        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        setErrors({});
        setSuccessState(null);

        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                price: Number.parseFloat(form.price),
                status: "on_sale",
            };

            const { data: created } = await http.post("/items", payload);

            let attachedImage = null;
            let imageWarning = null;

            if (imageFile) {
                try {
                    const fileData = new FormData();
                    fileData.append("image", imageFile);

                    // Upload first, then associate the stored URL with the new item.
                    const { data: uploadData } = await http.post(
                        "/uploads/items",
                        fileData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );

                    const { data: imageRecord } = await http.post(
                        `/items/${created.id}/images`,
                        { imageUrl: uploadData.url }
                    );

                    attachedImage = imageRecord;
                } catch (uploadError) {
                    const message =
                        uploadError?.response?.data?.message ||
                        uploadError?.message ||
                        "图片上传失败，请稍后在商品详情中补充";
                    imageWarning = message;
                }
            }

            setSuccessState({
                item: created,
                image: attachedImage,
                imageWarning,
            });
            resetForm();
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "发布失败，请稍后重试";
            setSubmitError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewItem = () => {
        if (successState?.item?.id) {
            navigate(`/items/${successState.item.id}`);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (!isAuthenticated) {
        return (
            <Alert variant="warning">
                发布商品需要先登录，请返回首页并登录后再试。
            </Alert>
        );
    }

    return (
        <Row className="justify-content-center">
            <Col lg={8} xl={7}>
                <Card>
                    <Card.Body className="d-flex flex-column gap-4">
                        <div>
                            <h1 className="h5 mb-1">发布商品</h1>
                            <p className="text-muted mb-0">
                                填写商品信息并上传图片，让买家快速找到你的宝贝。
                            </p>
                        </div>

                        {submitError && (
                            <Alert variant="danger">{submitError}</Alert>
                        )}

                        {successState && (
                            <Alert
                                variant="success"
                                className="d-flex flex-column flex-md-row gap-3"
                            >
                                <div className="flex-grow-1">
                                    商品发布成功！
                                    {successState.imageWarning && (
                                        <div className="text-warning mt-1">
                                            {successState.imageWarning}
                                        </div>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline-success"
                                        onClick={handleViewItem}
                                    >
                                        查看详情
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline-secondary"
                                        onClick={() => setSuccessState(null)}
                                    >
                                        继续发布
                                    </Button>
                                </div>
                            </Alert>
                        )}

                        <Form
                            onSubmit={handleSubmit}
                            className="d-flex flex-column gap-3"
                        >
                            <Form.Group controlId="title">
                                <Form.Label>商品标题</Form.Label>
                                <Form.Control
                                    type="text"
                                    maxLength={100}
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    isInvalid={Boolean(errors.title)}
                                    placeholder="例如：九成新 iPhone 13"
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.title}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group controlId="description">
                                <Form.Label>商品描述</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={4}
                                    name="description"
                                    value={form.description}
                                    placeholder="描述商品亮点、使用情况以及交易方式。"
                                    onChange={handleChange}
                                />
                            </Form.Group>

                            <Form.Group controlId="price">
                                <Form.Label>价格 (¥)</Form.Label>
                                <Form.Control
                                    type="number"
                                    name="price"
                                    value={form.price}
                                    step="0.01"
                                    min="0"
                                    onChange={handleChange}
                                    isInvalid={Boolean(errors.price)}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {errors.price}
                                </Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group controlId="image">
                                <Form.Label>商品主图（可选）</Form.Label>
                                <Form.Control
                                    key={fileInputKey}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Form.Text className="text-muted">
                                    建议上传清晰的商品实拍图，大小不超过 5MB。
                                </Form.Text>
                                {previewUrl && (
                                    <div className="mt-3">
                                        <img
                                            src={previewUrl}
                                            alt="预览"
                                            style={{
                                                maxWidth: "240px",
                                                borderRadius: "8px",
                                            }}
                                        />
                                    </div>
                                )}
                            </Form.Group>

                            <div className="d-flex gap-2 justify-content-end">
                                <Button
                                    type="button"
                                    variant="outline-secondary"
                                    onClick={resetForm}
                                    disabled={submitting}
                                >
                                    清空
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={!canSubmit}
                                >
                                    {submitting ? (
                                        <Spinner
                                            animation="border"
                                            size="sm"
                                            className="me-2"
                                        />
                                    ) : null}
                                    发布商品
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default ItemPostPage;
