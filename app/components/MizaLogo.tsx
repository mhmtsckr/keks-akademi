export function MizaLogo({size=52}:{size?:number}) {
  return <span
    aria-label="MİZA yapay zekâ asistanı"
    title="MİZA · Yapay Zekâ Asistanı"
    style={{
      width:size,
      height:size,
      minWidth:size,
      display:'inline-grid',
      placeItems:'center',
      borderRadius:'18px',
      background:'rgba(7,29,54,.72)',
      border:'1px solid rgba(232,190,91,.24)',
      boxShadow:'0 10px 24px rgba(0,0,0,.18)',
      overflow:'hidden'
    }}
  >
    <img
      src="/miza-logo.svg"
      alt=""
      width={size}
      height={size}
      style={{display:'block',width:'100%',height:'100%',objectFit:'contain'}}
    />
  </span>;
}
