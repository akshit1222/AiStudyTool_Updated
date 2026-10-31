import { createRoot } from 'react-dom/client';
import './index.css';
import Mascot from './components/Mascot';
import MascotTip from './components/MascotTip';
const moods = ['idle','thinking','reading','happy','cheer','sleepy','oops'];
createRoot(document.getElementById('root')).render(
  <div style={{padding:24}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
      {moods.map(m => <div key={m} style={{textAlign:'center'}}><Mascot mood={m} className="h-44 w-44 mx-auto" float={false}/><p>{m}</p></div>)}
    </div>
    <div style={{maxWidth:560,marginTop:20}}><MascotTip mood="happy" accent="fuchsia">Here is the short version. Copy it or save it for later!</MascotTip></div>
  </div>);
