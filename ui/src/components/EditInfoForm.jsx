import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import http from "../lib/http.js";
import { BACKEND_URL } from "../config/apiUrl.js";

function EditInfoForm({ show, onHide, onSuccess, onError }) {
    const { user, refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        bio: "",
        password: "",
        avatar: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (show && user) {
            setFormData({
                username: user.username || "",
                email: user.email || "",
                bio: user.bio || "",
                password: "",
                avatar: user.avatar || "",
            });
            setLocalError(null);
        }
    }, [show, user]);

    const handleChange = (field) => (event) => {
        setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!user) {
            return;
        }
        setSubmitting(true);
        setLocalError(null);
        onError?.(null);

        const payload = {
            username: formData.username,
            email: formData.email,
            bio: formData.bio,
        };
        if (formData.password) {
            payload.password = formData.password;
        }
        if (formData.avatar) {
            payload.avatar = formData.avatar;
        }

        try {
            await http.put(`/users/${user.id}`, payload);
            await refreshUser();
            onSuccess?.("资料更新成功");
            onHide?.();
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "更新失败，请稍后再试";
            setLocalError(message);
            onError?.(message);
        } finally {
            setSubmitting(false);
            setFormData((prev) => ({ ...prev, password: "" }));
        }
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        if (!user) {
            return;
        }
        setUploading(true);
        setLocalError(null);
        onError?.(null);
        try {
            const data = new FormData();
            data.append("image", file);
            const response = await http.post("/uploads/avatars", data, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setFormData((prev) => ({ ...prev, avatar: response.data.url }));
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                "头像上传失败，请稍后再试";
            setLocalError(message);
            onError?.(message);
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const avatarPreview = useMemo(() => {
        const value = formData.avatar;
        if (!value) {
            return null;
        }
        if (/^https?:\/\//i.test(value)) {
            return value;
        }
        if (value.startsWith("/")) {
            return `${BACKEND_URL}${value}`;
        }
        return `${BACKEND_URL}/${value}`;
    }, [formData.avatar]);

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>编辑个人信息</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {localError && <Alert variant="danger">{localError}</Alert>}
                <Form
                    id="editProfileForm"
                    onSubmit={handleSubmit}
                    className="d-flex flex-column gap-3"
                >
                    <Form.Group controlId="editProfileAvatar">
                        <Form.Label>头像</Form.Label>
                        {avatarPreview && (
                            <div className="mb-2">
                                <img
                                    src={avatarPreview}
                                    alt="头像预览"
                                    style={{
                                        width: "96px",
                                        height: "96px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                    }}
                                />
                            </div>
                        )}
                        <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            disabled={uploading || submitting}
                        />
                        <Form.Text className="text-muted">
                            支持 JPG / PNG，大小不超过服务器限制。
                        </Form.Text>
                    </Form.Group>
                    <Form.Group controlId="editProfileUsername">
                        <Form.Label>用户名</Form.Label>
                        <Form.Control
                            type="text"
                            value={formData.username}
                            onChange={handleChange("username")}
                            placeholder="请输入用户名"
                            autoComplete="username"
                            required
                        />
                    </Form.Group>
                    <Form.Group controlId="editProfileEmail">
                        <Form.Label>电子邮箱</Form.Label>
                        <Form.Control
                            type="email"
                            value={formData.email}
                            onChange={handleChange("email")}
                            placeholder="请输入电子邮箱"
                            autoComplete="email"
                            required
                        />
                    </Form.Group>
                    <Form.Group controlId="editProfileBio">
                        <Form.Label>个人简介</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={formData.bio}
                            onChange={handleChange("bio")}
                            placeholder="填写个人简介"
                        />
                    </Form.Group>
                    <Form.Group controlId="editProfilePassword">
                        <Form.Label>修改密码</Form.Label>
                        <Form.Control
                            type="password"
                            value={formData.password}
                            onChange={handleChange("password")}
                            placeholder="如需修改请输入新密码"
                            autoComplete="new-password"
                            minLength={6}
                        />
                        <Form.Text className="text-muted">
                            留空则保持当前密码不变。
                        </Form.Text>
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={submitting || uploading}
                >
                    关闭
                </Button>
                <Button
                    type="submit"
                    form="editProfileForm"
                    variant="primary"
                    disabled={submitting || uploading}
                >
                    {submitting || uploading ? "保存中..." : "保存更改"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default EditInfoForm;
