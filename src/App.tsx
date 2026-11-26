import Header from "./components/builder/Header";
import { useServerClock } from "./hooks/useServerClock";

function App() {
  const serverNow = useServerClock();

  return (
    <main className="container">
      <Header serverNow={serverNow} />
    </main>
  );
}

export default App;
