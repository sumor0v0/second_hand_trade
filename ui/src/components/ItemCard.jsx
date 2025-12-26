import { Button, Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { BACKEND_URL } from "../config/apiUrl";

function ItemCard({ item }) {
    const coverImage =
        BACKEND_URL + `${item.cover_image || "/placeholder.jpg"}`;
    const priceValue = Number.parseFloat(item.price);
    const displayPrice = Number.isFinite(priceValue)
        ? priceValue.toFixed(2)
        : item.price;

    let description = "";
    if (item.description) {
        if (item.description.length >= 15) {
            description += item.description.slice(0, 15) + "...";
        } else {
            description += item.description;
        }
    } else {
        description += "暂无描述";
    }

    const shouldTruncate = description.length > 32;

    return (
        <Card className="h-100">
            <Card.Img
                variant="top"
                src={coverImage}
                alt={item.title}
                style={{ height: "180px", objectFit: "cover" }}
            />
            <Card.Body className="d-flex flex-column gap-2">
                <Row className="align-items-center">
                    <Col>
                        <Card.Title
                            className="mb-0 text-truncate"
                            title={item.title}
                        >
                            {item.title}
                        </Card.Title>
                    </Col>
                    <Col xs="auto">
                        <strong className="text-primary">
                            ¥{displayPrice}
                        </strong>
                    </Col>
                </Row>
                <Card.Text className="mb-0" title={description}>
                    {shouldTruncate
                        ? `${description.slice(0, 32)}...`
                        : description}
                </Card.Text>
                <div className="mt-auto">
                    <Button
                        as={Link}
                        to={`/items/${item.id}`}
                        variant="outline-primary"
                    >
                        查看详情
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}

export default ItemCard;
