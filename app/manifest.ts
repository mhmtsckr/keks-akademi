import type { MetadataRoute } from 'next';

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'KEKS Akademi — Kazandıran Eğitim ve Koçluk Sistemi',
    short_name:'KEKS Akademi',
    description:'Kişisel çalışma planı, günlük görev, yanlış soru, deneme analizi ve koçluk takip sistemi.',
    start_url:'/ogrenci/bugun?source=pwa',
    scope:'/',
    display:'standalone',
    background_color:'#071a30',
    theme_color:'#071d37',
    lang:'tr',
    categories:['education','productivity'],
    icons:[
      {src:'/keks-logo.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
      {src:'/keks-logo.svg',sizes:'any',type:'image/svg+xml',purpose:'maskable'}
    ],
    shortcuts:[
      {name:'Bugünün Görevleri',short_name:'Görevler',url:'/ogrenci/bugun#gunluk-gorevler'},
      {name:'Yanlış Soru Ekle',short_name:'Yanlış Ekle',url:'/ogrenci/bugun#yanlis-ekle'},
      {name:'Öğrenci Paneli',short_name:'Panel',url:'/ogrenci'}
    ]
  };
}
