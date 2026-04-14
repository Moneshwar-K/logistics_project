'use client';

import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <MainLayout title="Page Not Found">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="bg-muted p-4 rounded-full mb-6">
                    <FileQuestion className="w-12 h-12 text-muted-foreground" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
                <p className="text-muted-foreground mb-8 max-w-md">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                    <Home className="w-5 h-5" />
                    Return Home
                </Link>
            </div>
        </MainLayout>
    );
}
