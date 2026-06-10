import { useParams, useNavigate } from 'react-router-dom';
import { StockDetailPage } from './StockDetailPage';

export function StockDetailWrapper() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const decoded = decodeURIComponent(symbol ?? '');
  return <StockDetailPage symbol={decoded} name={decoded} onBack={() => navigate('/')} />;
}
