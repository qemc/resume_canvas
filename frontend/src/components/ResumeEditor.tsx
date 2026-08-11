import Toolbar from './Toolbar';
import Canvas from './Canvas';

export default function ResumeEditor() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      <Toolbar />
      <main className="flex-1 flex justify-center items-start overflow-auto">
        <Canvas />
      </main>
    </div>
  );
}
