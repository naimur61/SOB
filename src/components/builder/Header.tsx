import { formatDhakaTime } from "../../utils/time";

type Props = {
  serverNow: number | null;
};

function Header({ serverNow }: Props) {
  return (
    <header className="header">
      <h1>Smart Order Builder</h1>
      <p className="muted">
        Server time: {serverNow === null ? "--:--:--" : formatDhakaTime(serverNow)}
      </p>
    </header>
  );
}

export default Header;
