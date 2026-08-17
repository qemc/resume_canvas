import Toolbar from './Toolbar';
import Canvas from './Canvas';

export default function ResumeEditor() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      <Toolbar />
      <main className="flex-1 flex justify-center items-start overflow-x-auto overflow-y-auto w-full">
        <Canvas />
      </main>
    </div>
  );
}
