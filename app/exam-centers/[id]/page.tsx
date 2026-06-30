import { getExamCenter } from '@/lib/api';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ExamCenterClient from './ExamCenterClient';

interface Props {
  params: Promise<{ id: string }>;
}

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
