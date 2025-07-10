import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/AppRouter';

/**
 * Main application component.
 * Wraps the entire app in React Router for route handling.
 * Future layout and context providers can be added here.
 */
function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;

