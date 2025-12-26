import { Container, Navbar, Form, Row, Col } from "react-bootstrap";
import { Outlet } from "react-router-dom";
import SidebarNav from "./components/SidebarNav.jsx";

function App() {
  return (
    <Container fluid className="vh-100 d-flex flex-column p-0">
      <Row className="g-0 flex-shrink-0">
        <Col className="p-0">
          <Navbar bg="light" expand="lg" className="border-bottom px-3 py-2">
            <Navbar.Brand>二手交易平台</Navbar.Brand>
            <Form className="ms-auto w-50">
              <Form.Control
                type="search"
                placeholder="搜索商品或用户"
                aria-label="搜索"
              />
            </Form>
          </Navbar>
        </Col>
      </Row>
      <Row className="flex-grow-1 overflow-hidden g-0">
        <Col
          xs={12}
          md={2}
          lg={2}
          className="border-end bg-light overflow-auto p-0"
        >
          <SidebarNav />
        </Col>
        <Col xs={12} md={10} lg={10} className="overflow-auto p-3 bg-white">
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}

export default App;
