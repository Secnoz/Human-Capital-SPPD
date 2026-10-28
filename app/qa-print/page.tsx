import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '../chatgpt-auth';
import PrintCheck from './print-check';
export default async function Page(){if(process.env.NODE_ENV!=='development')notFound();await requireChatGPTUser('/qa-print');return <PrintCheck/>;}
