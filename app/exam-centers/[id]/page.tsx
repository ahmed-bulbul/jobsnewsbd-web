import { getExamCenter } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ExamCenterClient from './ExamCenterClient';

interface Props {
  params: Promise<{ id: string }>;
}

// Same gap as the job detail page had: a Server Component rendered fresh on
// every single request with no caching at all. ISR here too.
export const revalidate = 60;

export default async function ExamCenterDetailPage({ params }: Props) {
  const { id } = await params;
  const center = await getExamCenter(Number(id));

  return (
    <>
      <Header />
      <ExamCenterClient center={center} />
      <Footer />
    </>
  );
}
