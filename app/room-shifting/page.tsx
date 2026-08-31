import ShiftingPage from '@/components/shifting/ShiftingPage';
import { NavBar } from '@/components/common/navbar';
export const metadata = { title: 'Room Shifting | RoomKhoj', robots: { index: false, follow: false } };
export default function Page() { return <><NavBar /><div className="pt-16"><ShiftingPage /></div></>; }
