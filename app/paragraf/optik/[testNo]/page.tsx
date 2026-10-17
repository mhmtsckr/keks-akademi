import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {parseOpticalTest} from '@/lib/paragrafOptik';
import ParagrafOptikClient from './OptikClient';
export const metadata:Metadata={title:'KEKS Paragraf | Dijital Optik',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{testNo:string}>}){
 const {testNo}=await params;
 if(parseOpticalTest(testNo)===null)notFound();
 return <ParagrafOptikClient testNo={testNo}/>;
}
