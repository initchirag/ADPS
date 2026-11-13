import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import { EnhancedDashboard } from "./pages/EnhancedDashboard";
import { Datasets } from "./pages/Datasets";
import { DatasetDetails } from "./pages/DatasetDetails";
import { UploadDataset } from "./pages/UploadDataset";
import { LineageVisualization } from "./pages/LineageVisualization";
import { AuditLogs } from "./pages/AuditLogs";
import { NewAdminPanel } from "./pages/NewAdminPanel";
import { Login } from "./pages/Login";
import { Landing } from "./pages/Landing";
import { FileAnalysisPage } from "./pages/FileAnalysisPage";
import { AuditImage } from "./pages/AuditImage";
import { DatabaseAudit } from "./pages/DatabaseAudit";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/dashboard",
    Component: MainLayout,
    children: [
      { index: true, Component: EnhancedDashboard },
      { path: "datasets", Component: Datasets },
      { path: "datasets/:id", Component: DatasetDetails },
      { path: "upload", Component: UploadDataset },
      { path: "lineage", Component: LineageVisualization },
      { path: "logs", Component: AuditLogs },
      { path: "admin", Component: NewAdminPanel },
      { path: "analysis/:id", Component: FileAnalysisPage },
      { path: "audit-image", Component: AuditImage },
      { path: "db-audit", Component: DatabaseAudit },
    ],
  },
]);