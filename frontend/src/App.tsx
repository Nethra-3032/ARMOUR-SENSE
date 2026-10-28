import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PredictPage } from './pages/PredictPage';
import { DatasetPage } from './pages/DatasetPage';
import { ModelLabPage } from './pages/ModelLabPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="predict" element={<PredictPage />} />
          <Route path="dataset" element={<DatasetPage />} />
          <Route path="model" element={<ModelLabPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
