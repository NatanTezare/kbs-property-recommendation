import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ListingPage from './pages/ListingPage';
import RecommendationsPage from './pages/RecommendationsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ListingPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;