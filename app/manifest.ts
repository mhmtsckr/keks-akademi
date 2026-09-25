import type { MetadataRoute } from 'next';

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'KEKS Akademi — Kazandıran Eğitim ve Koçluk Sistemi',
    short_name:'KEKS Akademi',
    description:'Kişisel çalışma planı, tekrar, deneme analizi ve koçluk takip sistemi.',
    start_url:'/',
    display:'standalone',
    background_color:'#ffffff',
    theme_color:'#071d37',
    lang:'tr',
    icons:[
      {src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
      {src:'/icon.svg',sizes:'any',type:'image/svg+xml',purpose:'maskable'}
    ]
  };
}
