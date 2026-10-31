import { useRef, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Spreadsheet from "./components/Spreadsheet.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
// import { IconChevron } from "./components/icons.jsx";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState({});
  const [spreadsheet, setSpreadsheet] = useState(null);
  const [currentSpreadSheet, setCurrentSpreadSheet] = useState("");
  const profileValidator = useRef(null);

  const validateProfileBeforeSend = () => {
    const isValid = profileValidator.current?.() ?? true;
    if (!isValid) setSidebarOpen(true);
    return isValid;
  };

  return (
    <div className="app">
      <Navbar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      <div className="body-row">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
          onProfileChange={setProfile}
          onRegisterValidation={(validator) => { profileValidator.current = validator; }}
        />
        {/* <div
          className="sidebar-edge-toggle"
          style={{ left: sidebarOpen ? "308px" : "0px" }}
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Thu gọn thông tin hồ sơ" : "Mở thông tin hồ sơ"}
        >
          <IconChevron dir={sidebarOpen ? "left" : "right"} />
        </div> */}
        <Spreadsheet
          spreadsheetData={spreadsheet}
          onGridChange={setCurrentSpreadSheet}
        />
      </div>
      <ChatWidget
        profile={profile}
        currentSpreadSheet={currentSpreadSheet}
        onSpreadsheetUpdate={setSpreadsheet}
        onBeforeSend={validateProfileBeforeSend}
      />
    </div>
  );
}
