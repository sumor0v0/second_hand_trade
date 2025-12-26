import Nav from "react-bootstrap/Nav";
import { NavLink } from "react-router-dom";

const SidebarNav = () => (
  <Nav className="flex-column py-3 gap-2 px-3" variant="pills">
    <Nav.Link as={NavLink} to="/" className="w-100 text-start">
      首页
    </Nav.Link>
    <Nav.Link as={NavLink} to="/conversations" className="w-100 text-start">
      对话
    </Nav.Link>
    <Nav.Link as={NavLink} to="/profile" className="w-100 text-start">
      用户资料
    </Nav.Link>
    <Nav.Link as={NavLink} to="/orders" className="w-100 text-start">
      购买记录
    </Nav.Link>
  </Nav>
);

export default SidebarNav;
