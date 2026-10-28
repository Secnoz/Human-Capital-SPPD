import { requireChatGPTUser } from './chatgpt-auth';
import Workspace from './workspace';
export default async function Home(){await requireChatGPTUser('/');return <Workspace/>;}
