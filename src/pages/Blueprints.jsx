import React from 'react';

const Blueprints = () => {
  const steps = [
    { id: 1, title: 'Base Frame', description: 'Secure the bicycle frame to the heavy wooden base using iron clamps.', active: true },
    { id: 2, title: 'Drive Chain', description: 'Connect the rear sprocket to the pump impeller using a standard cycle chain.', active: true },
    { id: 3, title: 'Inlet Valve', description: 'Attach the 2-inch PVC pipe to the suction end of the pump. Ensure no air leaks.', active: true },
    { id: 4, title: 'Test Flow', description: 'Pedal at 60 RPM to start water suction from the source.', active: false },
  ];

  const materials = [
    { name: 'Old Cycle Frame', qty: '1 Unit' },
    { name: 'Hand Pump Head', qty: '1 Unit' },
    { name: 'PVC Pipe (2")', qty: '10 Feet' },
  ];

  return (
    <main className="max-w-5xl mx-auto px-margin mt-8 pb-32 blueprint-grid">
      {/* Title Section */}
      <div className="mb-8">
        <h1 className="font-display text-5xl text-primary uppercase">PEDAL-POWERED IRRIGATION PUMP</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-primary text-white px-3 py-1 text-xs font-bold">SCHEMATIC ID: BP-772-IND</span>
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 text-xs font-bold">STATUS: VERIFIED TOOL</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20">
        {/* Left: Assembly Illustration */}
        <div className="md:col-span-7 relative group">
          <div className="relative bg-primary-container border-4 border-primary p-2 shadow-jugaad-blue-lg tape-corner tape-corner-tr">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAsWUALP7E8rQY8Cz5DL0Xf_ECPrHH_MLPVkr-raClALc57XpuxKXuDNnZckDs6BswLj4r92LdFdn3rg07gD3jjF5pIcrjNMPu57SLCwgH6RKRmBHzNKck-foSrLEB8Zz0T_NDb4ZNNxFHNJCu1la-T-kSSHmEXPuaioL_rX_qKKRiNo5I9bhD-sDRxIRzMo54OsqaJul5lgWypKZHAWLbSbHo2L3UA2jjVJMxhlxaWQW73LKWRqSVy26Yv5GRX5fqmjRskoZaeIo" 
              alt="Blueprint Schematic" 
              className="w-full grayscale brightness-125 contrast-125"
            />
            {/* Callout Annotations */}
            <div className="absolute top-1/4 right-1/4 flex flex-col items-center">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 font-bold text-xs border border-black shadow-jugaad-black">USE 12mm BOLTS</span>
              <svg className="w-12 h-12 text-tertiary-fixed -scale-x-100" viewBox="0 0 100 100">
                <path d="M10,90 Q50,90 90,10" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="5,5" />
                <path d="M85,15 L90,10 L82,8" fill="none" stroke="currentColor" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* Voice Help Button Floating */}
          <button className="absolute -bottom-6 -right-6 bg-tertiary-container text-on-tertiary-container flex items-center gap-3 px-6 py-4 border-2 border-on-tertiary-container shadow-jugaad-black active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
            <span className="material-symbols-outlined">volume_up</span>
            <div className="text-left">
              <p className="font-bold text-xs uppercase leading-tight">Hindi/English Help</p>
              <p className="text-xl font-black">आवाज़ सहायता</p>
            </div>
          </button>
        </div>

        {/* Right: Steps List */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="border-2 border-primary bg-surface-container-highest p-6 relative">
            <h2 className="font-display text-2xl text-primary uppercase mb-6 border-b-2 border-primary pb-2 flex justify-between items-center">
              Assembly Steps
              <span className="material-symbols-outlined">build</span>
            </h2>
            {steps.map((step) => (
              <div key={step.id} className={`flex gap-4 mb-8 ${!step.active ? 'opacity-50' : ''}`}>
                <div className={`hand-drawn-circle w-10 h-10 shrink-0 border-2 border-primary flex items-center justify-center font-black text-xl ${step.id === 1 ? 'bg-primary text-white' : ''}`}>
                  {step.id}
                </div>
                <div>
                  <h3 className="font-display text-xl text-on-surface uppercase leading-tight">{step.title}</h3>
                  <p className="font-body-md text-on-surface-variant">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Parts List Card */}
          <div className="bg-primary text-white p-4 border-2 border-black shadow-jugaad-black">
            <p className="text-xs font-bold uppercase mb-2 opacity-80">Materials Needed</p>
            <ul className="font-data-tabular space-y-1">
              {materials.map((m, i) => (
                <li key={i} className={`flex justify-between ${i > 0 ? 'border-t border-white/20 pt-1' : ''}`}>
                  <span>{m.name}</span> <span>{m.qty}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mb-24 flex flex-wrap gap-4">
        <button className="flex-1 min-w-[200px] bg-secondary text-white py-4 font-black uppercase text-xl shadow-jugaad-black border-2 border-black flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="material-symbols-outlined">save</span>
          SAVE TO ARCHIVE
        </button>
        <button className="flex-1 min-w-[200px] bg-white text-primary py-4 font-black uppercase text-xl shadow-jugaad-blue-lg border-2 border-primary flex items-center justify-center gap-2 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
          <span className="material-symbols-outlined">share</span>
          SHARE BLUEPRINT
        </button>
      </div>
    </main>
  );
};

export default Blueprints;
