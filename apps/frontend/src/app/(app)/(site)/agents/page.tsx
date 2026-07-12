import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'publishr - Agent',
  description: '',
};

export default async function Page() {
  return redirect('/agents/new');
}
