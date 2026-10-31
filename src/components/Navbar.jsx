import { useState, useEffect, useRef } from "react";
import { IconPanel, IconChevron } from "./icons.jsx";

export default function Navbar({ sidebarOpen, onToggleSidebar }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pickTemplate = (label) => {
    setMenuOpen(false);
    setNote(`"${label}" — tính năng mẫu đang được phát triển.`);
    setTimeout(() => setNote(""), 2600);
  };

  return (
    <div className="navbar">
      <button
        className="sidebar-toggle-nav"
        onClick={onToggleSidebar}
        title={sidebarOpen ? "Hide user information" : "Open user information"}
      >
        <IconPanel />
      </button>
      <div className="brand">
        <span className="brand-mark">FU</span>
        <span>FinUni</span>
      </div>

      {/* <div className="nav-menu" ref={ref}>
        <button className={"nav-menu-btn" + (menuOpen ? " open" : "")} onClick={() => setMenuOpen((v) => !v)}>
          Mẫu (Template)
          <span className="nav-menu-caret">
            <IconChevron dir="down" />
          </span>
        </button>
        {menuOpen && (
          <div className="nav-dropdown">
            <div className="nav-dropdown-item" onClick={() => pickTemplate("Hồ sơ du học Mỹ")}>
              <span>Hồ sơ du học Mỹ</span>
              <span className="tag">Mẫu có sẵn — sắp ra mắt</span>
            </div>
            <div className="nav-dropdown-item" onClick={() => pickTemplate("Hồ sơ du học Anh / Úc")}>
              <span>Hồ sơ du học Anh / Úc</span>
              <span className="tag">Mẫu có sẵn — sắp ra mắt</span>
            </div>
            <div className="nav-dropdown-item" onClick={() => pickTemplate("Theo dõi học bổng")}>
              <span>Theo dõi học bổng</span>
              <span className="tag">Mẫu có sẵn — sắp ra mắt</span>
            </div>
            <div className="nav-dropdown-sep"></div>
            <div className="nav-dropdown-item" onClick={() => pickTemplate("Bảng trống")}>
              <span>Bắt đầu từ bảng trống</span>
            </div>
          </div>
        )}
      </div> */}

      <div className="navbar-spacer"></div>
      {note && <div style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}>{note}</div>}
      <div className="navbar-right">
        <span className="status-dot"></span>
        Local saved
      </div>
    </div>
  );
}
