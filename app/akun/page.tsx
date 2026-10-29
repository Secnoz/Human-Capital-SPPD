import {getAppUser} from '../../src/lib/auth';
import {redirect} from 'next/navigation';
import PasswordForm from './password-form';
export const dynamic='force-dynamic';
export default async function Account(){if(!await getAppUser())redirect('/login');return <PasswordForm/>;}
