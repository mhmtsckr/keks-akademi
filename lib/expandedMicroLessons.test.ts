import {describe,expect,it} from 'vitest';
import {ALL_MICRO_LESSONS,findMicroLesson} from './bankFreeMicroLessons';
import {EXPANDED_MICRO_LESSONS} from './expandedMicroLessons';
import {areEquivalentShortAnswers} from './mathAnswerEquivalence';

describe('matematik dışı özgün mikro ders kataloğu',()=>{
 it('en az 8 matematik dışı ders alanı ve 36 yeni farklı alıştırma sunar',()=>{
   expect(EXPANDED_MICRO_LESSONS).toHaveLength(9);
   expect(new Set(EXPANDED_MICRO_LESSONS.map(x=>x.subject)).size).toBeGreaterThanOrEqual(8);
   expect(EXPANDED_MICRO_LESSONS.reduce((sum,x)=>sum+x.exercises.length,0)).toBeGreaterThanOrEqual(36);
   expect(new Set(ALL_MICRO_LESSONS.map(x=>x.id)).size).toBe(ALL_MICRO_LESSONS.length);
 });
 it('her bağımsız MCQ örneği tek doğru seçenek, açıklama, beceri ve pilot etiketi taşır',()=>{
   const allPrompts:string[]=[];
   for(const lesson of EXPANDED_MICRO_LESSONS){
     expect(lesson.version).toBeGreaterThan(0);
     expect(lesson.contentStatus).toBe('PILOT');
     expect(lesson.skill.length).toBeGreaterThan(18);
     expect(lesson.worked.steps.length).toBeGreaterThanOrEqual(3);
     expect(lesson.worked.answer.length).toBeGreaterThan(4);
     expect(lesson.exercises.length).toBeGreaterThanOrEqual(4);
     for(const e of lesson.exercises){
       expect(e.explanation.length).toBeGreaterThan(20);
       expect(e.options).toBeDefined();
       expect(Object.keys(e.options||{})).toEqual(['A','B','C','D']);
       expect(Object.keys(e.options||{})).toContain(e.answer);
       expect(areEquivalentShortAnswers(e.answer,e.answer.toLowerCase())).toBe(true);
       allPrompts.push(e.prompt);
     }
   }
   expect(new Set(allPrompts).size).toBe(allPrompts.length);
 });
 it('öğrencinin metninden yalnız dar beceri kanıtıyla eşleşir',()=>{
   const cases=[
    ['Türkçe','Paragraf','Bu parçanın ana düşüncesi','tur-paragraph-main-idea-v1'],
    ['Türkçe','Sözcükte ve Cümlede Anlam','Amaç sonuç cümlesi','tur-cause-purpose-v1'],
    ['Türk Dili ve Edebiyatı','Şiir Bilgisi','Bu şiirde hangi söz sanatı vardır?','lit-figures-of-speech-v1'],
    ['Tarih','Millî Mücadele','Kongrelerin kronolojik sırası','hist-national-struggle-order-v1'],
    ['Coğrafya','Harita Bilgisi','Boylam kaçtır?','geo-latitude-longitude-v1'],
    ['Fizik','Fizik Bilimine Giriş','SI temel büyüklük hangisidir?','physics-quantities-v1'],
    ['Kimya','Genel / Karma','Element ve bileşik farkı','chem-element-compound-mixture-v1'],
    ['Biyoloji','Hücre','Ribozom hangi organeldir?','bio-organel-functions-v1'],
    ['Eğitim Bilimleri','Ölçme ve Değerlendirme','Güvenirlik nedir?','edu-validity-reliability-v1']
   ] as const;
   for(const [subject,topic,prompt,id] of cases)
     expect(findMicroLesson({subject,topic,prompt})?.id).toBe(id);
 });
 it('geniş ders/konu ve yalnız fotoğraf için keyfi kazanım seçmez',()=>{
   const cases=[
    ['Türkçe','Paragraf','Görsel yanlış soru'],
    ['Türk Dili ve Edebiyatı','Şiir Bilgisi','Görsel yanlış soru'],
    ['Tarih','Millî Mücadele','Görsel yanlış soru'],
    ['Coğrafya','Harita Bilgisi','Görsel yanlış soru'],
    ['Fizik','Fizik Bilimine Giriş','Görsel yanlış soru'],
    ['Eğitim Bilimleri','Ölçme ve Değerlendirme','Görsel yanlış soru']
   ] as const;
   for(const [subject,topic,prompt] of cases)
     expect(findMicroLesson({subject,topic,prompt})).toBeNull();
 });
 it('öğrenci seçerse konu belirsiz veya fotoğraf-only soruda doğru ders kataloğunu gösterir',()=>{
   expect(findMicroLesson({subject:'Türkçe',topic:'Genel',prompt:'Görsel yanlış soru',selectedLessonId:'tur-paragraph-main-idea-v1'})?.subject).toBe('Türkçe');
   expect(findMicroLesson({subject:'Tarih',topic:'Genel',selectedLessonId:'tur-paragraph-main-idea-v1'})).toBeNull();
   expect(findMicroLesson({subject:'Kimya',topic:'Genel',selectedLessonId:'no-such-lesson'})).toBeNull();
 });
});
