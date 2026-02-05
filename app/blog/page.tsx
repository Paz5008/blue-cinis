import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import PaginationGeneric from "@/components/ui/PaginationGeneric";
import { SubTitle, BodyText } from "../../components/typography";
import { SectionTitle } from "../../components/typography";
export const dynamic = 'force-dynamic';

export const revalidate = 600;

export default async function BlogPage({ searchParams }: { searchParams?: { page?: string } }) {
    const page = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1);
    const pageSize = 9;
    const where = {} as const;
    let total = 0; let posts: any[] = [];
    try {
        total = await prisma.blogPost.count({ where });
        // Récupération des articles triés par date de publication décroissante
        posts = await prisma.blogPost.findMany({
            where,
            orderBy: { publishedAt: "desc" },
            select: {
                id: true,
                title: true,
                content: true,
                excerpt: true,
                publishedAt: true,
                imageUrl: true,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
    } catch {
        return (
            <section className="py-16">
                <div className="container mx-auto px-4 text-center">
                    <SectionTitle as="h1" className="mb-6">Blog indisponible</SectionTitle>
                    <BodyText as="p" className="mb-8 text-body">Un problème temporaire empêche d'afficher les articles. Merci de réessayer.</BodyText>
                    <div className="flex items-center justify-center gap-3">
                        <Link href="/blog" className="inline-flex items-center justify-center rounded-md bg-accent text-black px-4 py-2 font-medium hover:bg-accent-hover">Réessayer</Link>
                        <Link href="/contact" className="inline-flex items-center justify-center rounded-md border border-subtle px-4 py-2 font-medium text-text-heading hover:bg-white/10">Nous contacter</Link>
                    </div>
                </div>
            </section>
        );
    }
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <section className="py-16">
            <SectionTitle as="h1" className="mb-6 text-center">Blog</SectionTitle>
            {posts.length === 0 ? (
                <BodyText as="p" className="text-center text-body-subtle">
                    Aucun article à afficher pour le moment.
                </BodyText>
            ) : (
                <>
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
                                {post.imageUrl && (
                                    <div className="w-full h-40 relative rounded mb-4 overflow-hidden">
                                        <Image
                                            src={post.imageUrl}
                                            alt={post.title}
                                            fill
                                            sizes="(max-width: 1024px) 100vw, 33vw"
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <SubTitle as="h3" className="mb-2 line-clamp-2 text-heading">{post.title}</SubTitle>
                                <BodyText as="p" className="text-body-subtle mb-2 line-clamp-3 flex-grow">
                                    {post.excerpt ||
                                        (post.content.length > 100
                                            ? post.content.substring(0, 100) + "…"
                                            : post.content)}
                                </BodyText>
                                {post.publishedAt && (
                                    <BodyText as="p" className="text-body mb-2"><strong>Publié le :</strong> {new Date(post.publishedAt).toLocaleDateString("fr-FR")}</BodyText>
                                )}
                                <div className="mt-4">
                                    <Link
                                        href={`/blog/${post.id}`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Lire l'article
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                    <PaginationGeneric currentPage={page} totalPages={totalPages} makeHref={(p) => `/blog?page=${p}`} />
                </>
            )}
        </section>
    );
}
