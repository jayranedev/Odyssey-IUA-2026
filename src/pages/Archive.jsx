import React from 'react';

const Archive = () => {
  const projects = [
    {
      id: 'ARCH-2023-01',
      title: 'Low-cost Solar Dryer',
      status: 'SUCCESS',
      annotation: '"Dries chillies in 40% less time"',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwgUTUsEKc1sKf0MM956pGK5Zr5luq8cr1n9e1Mudg4xcHpcTzkVBq2aZW93HSg7Blmtpfy5uvDjMFzO2ykKgA1ACwkqyYwqAIq-C5g9frVawRg9u4czfBVcjAg8zn1rxPGgCR68VaA_7QYKO5vhgtMxLi1RqPY9wb042ITrqkpSFnD74KdvHDrIVZRSbFhLKcW5hFs8exSMlrVSgFMW3QTKOyHZ0cDMIBAcQe5kpEQyHTRSVS5WPDd65m4ONz_KZ7OrMz-rvgSOI',
      rotation: 'rotate-1',
      bgColor: 'bg-white'
    },
    {
      id: 'ARCH-2022-09',
      title: 'Manual Grain De-husker',
      status: 'V2 OPTIMIZED',
      statusColor: 'bg-secondary',
      annotation: '"Welded bicycle parts work best"',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB9oi6hs7Pep86C9Q5FCAaewmqEVk_moEqg2KnMVtWKkkJn3OxCVpvutTcg1Q8koKst-uKXO8tH-4428j0RRL-UkRj2-IvcELR66ECn-7ng89HCU0THpg43mczVehSQp3tGBthkb0Ug0x5X1rRuzWwarFQYdsPVVf-JPfl0YL0_pL63B5smBnEM8p32F0KQ66_h1bAbfLvHBc03ZCWZPXDNVV37vcQEOae80MpZqJBI45vfC7s7a3ztehPczUY2jJMMyaKoQQrsRJM',
      rotation: '-rotate-2',
      bgColor: 'bg-[#fdfcf0]'
    },
    {
      id: 'ARCH-2023-04',
      title: 'Pedal-Power Pump',
      status: 'COMMUNITY FAV',
      annotation: '"No electricity needed"',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5dYPA23PwqzLirz_-3yJyjTt77uRCb2ntlftaDU5SQp27RKLJyh7oJg04K4dK6--zNVEa5sKilfXj2CiJr_hY_C49oe66u_ZUHFfgZfiJyEr_YFNPl-sThjRgYxifK4Caa4-0WrRNHN-SEPEO7aAqnunWpO4Xehf_JJuy4mJMLX93AExsTNso3a5PruHruJUsKr7QQ_l1gdPHxe7vOzX8Xh1TPc_vJ8iZ3XAzjcL6pLRzrs15njAKx0JzYvX9KO8NVFrsvHfWALY',
      rotation: 'rotate-3',
      bgColor: 'bg-white',
      starred: true
    },
    {
      id: 'ARCH-2021-12',
      title: 'Compressed Earth Press',
      status: 'ARCHIVED',
      statusColor: 'bg-stone-500',
      annotation: '"Heavy but indestructible"',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCsBjgbMR8sZUPs4tIKHlH2j-UAeLRMq9hkmTGZVNxZmAMLTbIZeplPOQVZAt6at27zFvWb6TNPWCKY8ExCTlmff1-mhX4It_vgPXMFV_JmReHGyoBaYmQF_V1PHp-Q3e5hoYj-bW0B3VJe5kihK8WPsSbz1wFVbzUGwPJ6FFOAZ1jPo6-CbpY6sPE1s0NL4sm1uteER0bm6bPPVBC_X3JUC5YfrypKfvr6DAzE0W1bBSWmeoDkDgcup9D4vSqkloCGUMNI8_HzWQ',
      rotation: '-rotate-1',
      bgColor: 'bg-[#fafafa]'
    }
  ];

  return (
    <main className="mt-2 corkboard min-h-screen py-10 pb-32 px-margin">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="font-display text-5xl inline-block bg-white px-6 py-2 border-4 border-primary shadow-jugaad-lg -rotate-1">
            THE ARCHIVE
          </h1>
          <p className="font-annotation text-lg mt-4 text-primary font-bold">
            // A trophy wall of resourcefulness and rural grit
          </p>
        </div>

        {/* Bento/Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {projects.map((project) => (
            <div 
              key={project.id} 
              className={`relative ${project.bgColor} p-4 shadow-xl border-b-[12px] border-stone-200 ${project.rotation} hover:rotate-0 transition-transform cursor-pointer group`}
            >
              {project.starred ? (
                <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 border-4 border-black flex items-center justify-center rounded-full font-black text-xl z-10">★</div>
              ) : (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 w-24 h-8 bg-zinc-300 opacity-80 shadow-sm border border-zinc-400 rotate-2"></div>
              )}
              <div className="aspect-square overflow-hidden border-2 border-stone-100 bg-stone-50">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                />
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="font-display text-2xl uppercase text-primary border-b-2 border-dashed border-primary pb-1">
                  {project.title}
                </h3>
                <p className="font-data-tabular text-sm text-stone-600">ID: {project.id}</p>
                <div className="flex justify-between items-center pt-2">
                  <span className={`${project.statusColor || 'bg-primary'} text-white text-[10px] px-2 py-1 font-bold uppercase`}>
                    {project.status}
                  </span>
                  <span className="font-annotation text-sm text-secondary">{project.annotation}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Sketch Entry */}
          <div className="relative bg-[url('https://www.transparenttextures.com/patterns/graph-paper.png')] bg-white p-6 shadow-xl border-2 border-dashed border-stone-400 rotate-2 hover:rotate-0 transition-transform cursor-pointer flex flex-col justify-center items-center text-center">
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <span className="material-symbols-outlined text-stone-300 text-6xl mb-4">edit_note</span>
            <h3 className="font-display text-2xl uppercase text-stone-400">Draft: Bio-gas Stove</h3>
            <p className="font-annotation text-sm text-stone-400 mt-2">Incomplete documentation...</p>
            <div className="mt-4 px-4 py-1 border border-stone-300 text-stone-400 font-bold text-xs uppercase">Resume Blueprint</div>
          </div>

          {/* Add New Placeholder */}
          <div className="relative flex flex-col items-center justify-center p-8 border-4 border-dashed border-primary/30 rounded-xl hover:bg-white/20 transition-colors cursor-pointer group">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">add</span>
            </div>
            <p className="mt-4 font-display text-2xl text-primary uppercase opacity-50">Upload New Legacy</p>
          </div>
        </div>

        {/* Stats Taped to bottom */}
        <div className="mt-20 flex justify-center">
          <div className="bg-white p-6 border-2 border-black shadow-jugaad-yellow-lg relative max-w-md w-full">
            <div className="absolute -top-3 -left-6 w-20 h-6 bg-zinc-300 -rotate-12 border border-zinc-400 opacity-80"></div>
            <div className="absolute -top-3 -right-6 w-20 h-6 bg-zinc-300 rotate-12 border border-zinc-400 opacity-80"></div>
            <h4 className="font-display text-2xl text-center uppercase border-b-2 border-black mb-4">Archive Ledger</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-primary">12</p>
                <p className="text-xs font-bold uppercase text-stone-500">Live Projects</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-secondary">248</p>
                <p className="text-xs font-bold uppercase text-stone-500">Hours Saved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Archive;
