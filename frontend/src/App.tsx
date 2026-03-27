import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import PageDetails from './pages/PageDetails'
import AddPage from './pages/AddPage'
import Analytics from './pages/Analytics'
import FunnelMapper from './pages/FunnelMapper'
import UncloakTool from './pages/UncloakTool'
import AdLibraryViewer from './pages/AdLibraryViewer'
import ErrorBoundary from './components/common/ErrorBoundary'

function App() {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="page/:id" element={<PageDetails />} />
                        <Route path="add" element={<AddPage />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="funnel" element={<FunnelMapper />} />
                        <Route path="uncloak" element={<UncloakTool />} />
                        <Route path="library" element={<AdLibraryViewer />} />
                    </Route>
                </Routes>
            </ErrorBoundary>
        </BrowserRouter>
    )
}

export default App
