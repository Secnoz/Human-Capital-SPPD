import {getAppUser} from '../../src/lib/auth';
import {redirect} from 'next/navigation';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function Login(){if(await getAppUser())redirect('/');return <LoginForm/>;}
