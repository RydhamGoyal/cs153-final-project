import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteProvider, useSite } from './context/siteState'
import { buildSeo } from './lib/seo'
import { HomePage } from './pages/Home'
import { WorkspacePage } from './pages/Workspace'

function WorkspaceDocumentTitle() {
  const { state } = useSite()
  useEffect(() => {
    const seo = buildSeo(state)
    const prev = document.title
    document.title = `${seo.title} · editor`
    return () => {
      document.title = prev
    }
  }, [state])
  return null
}

function WorkspaceRoute() {
  return (
    <>
      <WorkspaceDocumentTitle />
      <WorkspacePage />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/workspace" element={<WorkspaceRoute />} />
        </Routes>
      </SiteProvider>
    </BrowserRouter>
  )
}
