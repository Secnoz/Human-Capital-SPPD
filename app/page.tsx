import { getAppUser } from '../src/lib/auth';
import { redirect } from 'next/navigation';
import Workspace from './workspace';
export const dynamic='force-dynamic';
export default async function Home(){if(!await getAppUser())redirect('/login');return <Workspace/>;}
