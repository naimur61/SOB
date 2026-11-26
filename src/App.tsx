import Header from "./components/builder/Header";
import { useServerClock } from "./hooks/useServerClock";
import BuilderPage from "./pages/BuilderPage";

function App() {
  const serverNow = useServerClock();

  return (
    <main className="container">
      <Header serverNow={serverNow} />
      <BuilderPage />
    </main>
  );
}

export default App;
