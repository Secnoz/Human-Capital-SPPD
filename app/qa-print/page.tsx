import {notFound} from 'next/navigation';
import {getAppUser} from '../../src/lib/auth';
import {redirect} from 'next/navigation';
import PrintCheck from './print-check';
export default async function Page(){if(process.env.NODE_ENV!=='development')notFound();if(!await getAppUser())redirect('/login');return <PrintCheck/>;}
