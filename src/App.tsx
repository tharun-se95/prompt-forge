import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PersonasPage } from "@/pages/PersonasPage";
import { BuilderPage } from "@/pages/BuilderPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ClipboardPage } from "@/pages/ClipboardPage";
import { HistoryPage } from "@/pages/HistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<BuilderPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/clipboard" element={<ClipboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
