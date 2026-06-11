'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Spinner } from '@/components/ui/Spinner';

export default function ConversationRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`/conversations?id=${id}`);
  }, [id, router]);

  return (
    <AppLayout>
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    </AppLayout>
  );
}
