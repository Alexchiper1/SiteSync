import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerProfilePage from "./pages/ManagerProfilePage";
import ManagerPlaceholderPage from "./pages/ManagerPlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/profile" element={<ManagerProfilePage />} />
        <Route
          path="/manager/sites"
          element={
            <ManagerPlaceholderPage
              title="Manager Sites Page"
              description="This temporary page will become the full site management area for creating, editing, deleting, and reviewing sites."
            />
          }
        />
        <Route
          path="/manager/employees"
          element={
            <ManagerPlaceholderPage
              title="Manager Employees Page"
              description="This temporary page will become the employee oversight area for reviewing staff, assignments, and quick actions."
            />
          }
        />
        <Route
          path="/manager/tasks"
          element={
            <ManagerPlaceholderPage
              title="Manager Tasks Page"
              description="This temporary page will become the task assignment and tracking area with employee, site, and status views."
            />
          }
        />
        <Route
          path="/manager/attendance"
          element={
            <ManagerPlaceholderPage
              title="Manager Attendance Page"
              description="This temporary page will become the attendance monitoring area for check-ins, check-outs, and daily records."
            />
          }
        />
        <Route
          path="/manager/holidays"
          element={
            <ManagerPlaceholderPage
              title="Manager Holiday Requests Page"
              description="This temporary page will become the holiday review area for pending, approved, and rejected leave requests."
            />
          }
        />
        <Route path="/employee" element={<EmployeeDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;