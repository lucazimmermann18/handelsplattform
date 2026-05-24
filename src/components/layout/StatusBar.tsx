'use client';

import React, { useState, useEffect } from 'react';

export const StatusBar = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <footer className="statusbar">
      <div className="item">
        <span className="lbl">SYS</span>
        <span className="dot success" style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
        <span className="v">OPERATIONAL</span>
      </div>
      <div className="item"><span className="lbl">DAR</span><span className="v">{time}</span></div>
      <div className="item"><span className="lbl">UTC</span><span className="v">{now.toISOString().slice(11, 19)}</span></div>
      <div className="item"><span className="lbl">EUR/USD</span><span className="v">1.0842</span><span className="up">▲ 0.21%</span></div>
      <div className="item"><span className="lbl">EUR/TZS</span><span className="v">2,847.3</span><span className="down">▼ 0.04%</span></div>
      <div className="item"><span className="lbl">BRENT</span><span className="v">$81.42</span><span className="down">▼ 0.18%</span></div>
      <div className="item"><span className="lbl">COFFEE C</span><span className="v">$2.34/lb</span><span className="up">▲ 0.62%</span></div>
      <div className="sp" />
      <div className="item"><span className="lbl">SYNC</span><span className="v">live</span></div>
      <div className="item"><span className="lbl">USER</span><span className="v">m.kassim@ea-export.os</span></div>
    </footer>
  );
};
