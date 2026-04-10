import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerProfilePage from "./pages/ManagerProfilePage";
import ManagerSitesPage from "./pages/ManagerSitesPage";
import ManagerEmployeesPage from "./pages/ManagerEmployeesPage";
import ManagerTasksPage from "./pages/ManagerTasksPage";
import ManagerAttendancePage from "./pages/ManagerAttendancePage";
import ManagerHolidayRequestsPage from "./pages/ManagerHolidayRequestsPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import EmployeeSitesPage from "./pages/EmployeeSitesPage";
import EmployeeTasksPage from "./pages/EmployeeTasksPage";
import EmployeeAttendancePage from "./pages/EmployeeAttendancePage";
import EmployeeHolidaysPage from "./pages/EmployeeHolidaysPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/manager/profile" element={<ManagerProfilePage />} />
        <Route path="/manager/sites" element={<ManagerSitesPage />} />
        <Route path="/manager/employees" element={<ManagerEmployeesPage />} />
        <Route path="/manager/tasks" element={<ManagerTasksPage />} />
        <Route path="/manager/attendance" element={<ManagerAttendancePage />} />
        <Route path="/manager/holidays" element={<ManagerHolidayRequestsPage />} />
        <Route path="/employee" element={<EmployeeDashboard />} />
        <Route path="/employee/profile" element={<EmployeeProfilePage />} />
        <Route path="/employee/sites" element={<EmployeeSitesPage />} />
        <Route path="/employee/tasks" element={<EmployeeTasksPage />} />
        <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
        <Route path="/employee/holidays" element={<EmployeeHolidaysPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;