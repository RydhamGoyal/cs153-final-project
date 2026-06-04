import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from './pages/RootLayout'
import { Landing } from './pages/Landing'
import { NavigatorPage } from './pages/NavigatorPage'
import { MethodologyPage } from './pages/MethodologyPage'
import { DatabasePage } from './pages/DatabasePage'
import { GraphPage } from './pages/GraphPage'
import { NavigatorRunProvider } from './context/NavigatorRunContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <NavigatorRunProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<NavigatorPage />} />
            <Route path="/app/about" element={<MethodologyPage />} />
          <Route path="/app/methodology" element={<MethodologyPage />} />
            <Route path="/app/database" element={<DatabasePage />} />
            <Route path="/app/network" element={<GraphPage />} />
          </Route>
        </Routes>
      </NavigatorRunProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
