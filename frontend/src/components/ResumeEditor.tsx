import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';

export default function ResumeEditor() {
  return (
    <div className="min-h-screen h-screen bg-slate-100 flex flex-col font-sans w-full max-w-full overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden w-full">
        <Sidebar />
        <main className="flex-1 flex justify-center items-start overflow-x-auto overflow-y-auto w-full">
          <Canvas />
        </main>
      </div>
    </div>
  );
}
