import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type BlogPostPageProps = {
  params: {
    id: string;
  };
};

export default async function BlogPostDetailPage({ params }: BlogPostPageProps) {
  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    notFound();
  }

  const publishedAtLabel = post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fr-FR') : null;

  return (
    <section className="p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        {post.imageUrl && (
          <img src={post.imageUrl} alt={post.title} className="w-full h-60 object-cover rounded mb-4" />
        )}
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        {publishedAtLabel && (
          <p className="text-gray-700 mb-4">
            <strong>Publié le : </strong>
            {publishedAtLabel}
          </p>
        )}
        <p className="text-gray-700 mb-4">{post.content}</p>
        <div className="mt-4">
          <Link href="/blog" className="text-blue-600 hover:underline">
            ← Retour au blog
          </Link>
        </div>
      </div>
    </section>
  );
}
