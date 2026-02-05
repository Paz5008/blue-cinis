// Charger les variables d'environnement depuis .env
import dotenv from "dotenv";
dotenv.config();
console.log("Running comprehensive seed script, DATABASE_URL=", process.env.DATABASE_URL ? '[OK]' : '[missing]');
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Pre-hashed password for "Demo1234!" using bcrypt (10 rounds)
const DEMO_PASSWORD_HASH = "$2a$10$K8jIRdYpBdCmB5Qj5gUaMe5E9JxZ5PcF8qN2gVeZnF8iMwXrF5Y2O";

// Helper to create dates in the past
function daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

function daysFromNow(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

async function main() {
    console.log("🌱 Seeding database with comprehensive demo data...\n");

    // ============================================
    // 1. CATEGORIES
    // ============================================
    console.log("📁 Creating categories...");

    const sculpture = await prisma.category.upsert({
        where: { name: "Sculpture" },
        update: {},
        create: { name: "Sculpture" },
    });

    const peinture = await prisma.category.upsert({
        where: { name: "Peinture" },
        update: {},
        create: { name: "Peinture" },
    });

    const photographie = await prisma.category.upsert({
        where: { name: "Photographie" },
        update: {},
        create: { name: "Photographie" },
    });

    const dessin = await prisma.category.upsert({
        where: { name: "Dessin" },
        update: {},
        create: { name: "Dessin" },
    });

    const artNumerique = await prisma.category.upsert({
        where: { name: "Art Numérique" },
        update: {},
        create: { name: "Art Numérique" },
    });

    const ceramique = await prisma.category.upsert({
        where: { name: "Céramique" },
        update: {},
        create: { name: "Céramique" },
    });

    // Sous-catégories
    await prisma.category.upsert({
        where: { name: "Acrylique" },
        update: {},
        create: { name: "Acrylique", parentId: peinture.id },
    });
    await prisma.category.upsert({
        where: { name: "Huile sur toile" },
        update: {},
        create: { name: "Huile sur toile", parentId: peinture.id },
    });
    await prisma.category.upsert({
        where: { name: "Aquarelle" },
        update: {},
        create: { name: "Aquarelle", parentId: peinture.id },
    });
    await prisma.category.upsert({
        where: { name: "Technique mixte" },
        update: {},
        create: { name: "Technique mixte", parentId: peinture.id },
    });

    console.log("✅ Categories created\n");

    // ============================================
    // 2. ARTISTS (8 artists with varied creation dates)
    // ============================================
    console.log("🎨 Creating artists...");

    const artistsData = [
        {
            slug: "aurore-dupont",
            name: "Aurore Dupont",
            biography: "Passionnée par la peinture abstraite depuis plus de 15 ans, Aurore explore les nuances de couleurs pour évoquer des émotions vibrantes. Diplômée des Beaux-Arts de Paris, elle expose régulièrement dans les galeries de la Loire.",
            photoUrl: "/aurore-profile.webp",
            artStyle: "Abstrait",
            location: "Tours, France",
            portfolio: "https://auroredelac.com",
            instagramUrl: "https://instagram.com/auroredupont_art",
            isFeatured: true,
            createdAt: daysAgo(450),
        },
        {
            slug: "liam-voisin",
            name: "Liam Voisin",
            biography: "Photographe de rue depuis 10 ans, Liam capture la magie des instants urbains et la poésie du quotidien. Son travail a été publié dans plusieurs magazines internationaux.",
            photoUrl: "/liam-voisin-profile.webp",
            artStyle: "Photographie",
            location: "Nantes, France",
            portfolio: "https://liamvoisinphoto.com",
            instagramUrl: "https://instagram.com/liamvoisin",
            isFeatured: true,
            createdAt: daysAgo(380),
        },
        {
            slug: "jules-martin",
            name: "Jules Martin",
            biography: "Peintre de paysages inspirés par la nature et la lumière changeante de la vallée de la Loire. Jules travaille principalement à l'huile sur toile.",
            photoUrl: "/jules-profile.webp",
            artStyle: "Paysagiste",
            location: "Amboise, France",
            portfolio: "https://julesmartin-art.com",
            isFeatured: false,
            createdAt: daysAgo(320),
        },
        {
            slug: "marie-lefevre",
            name: "Marie Lefèvre",
            biography: "Sculptrice contemporaine travaillant le bronze et l'acier. Marie crée des œuvres monumentales qui interrogent notre rapport à l'espace urbain.",
            photoUrl: "/marie-profile.webp",
            artStyle: "Sculpture",
            location: "Orléans, France",
            isFeatured: true,
            createdAt: daysAgo(290),
        },
        {
            slug: "thomas-bernard",
            name: "Thomas Bernard",
            biography: "Artiste numérique et créateur 3D, Thomas fusionne technologie et art pour créer des expériences immersives uniques.",
            photoUrl: "/thomas-profile.webp",
            artStyle: "Art Numérique",
            location: "Paris, France",
            instagramUrl: "https://instagram.com/thomas.creates",
            isFeatured: false,
            createdAt: daysAgo(180),
        },
        {
            slug: "claire-moreau",
            name: "Claire Moreau",
            biography: "Aquarelliste talentueuse, Claire capture la délicatesse des fleurs et des jardins de la région avec une précision remarquable.",
            photoUrl: "/claire-profile.webp",
            artStyle: "Aquarelle",
            location: "Blois, France",
            isFeatured: true,
            createdAt: daysAgo(150),
        },
        {
            slug: "antoine-duval",
            name: "Antoine Duval",
            biography: "Céramiste inspiré par les traditions japonaises, Antoine crée des pièces uniques où la nature rencontre la sérénité.",
            photoUrl: "/antoine-profile.webp",
            artStyle: "Céramique",
            location: "Chinon, France",
            isFeatured: false,
            createdAt: daysAgo(90),
        },
        {
            slug: "sophie-lambert",
            name: "Sophie Lambert",
            biography: "Dessinatrice au fusain et au graphite, Sophie révèle l'âme des portraits avec une intensité émotionnelle saisissante.",
            photoUrl: "/sophie-profile.webp",
            artStyle: "Portrait",
            location: "Saumur, France",
            isFeatured: true,
            createdAt: daysAgo(60),
        },
    ];

    const artists: Record<string, any> = {};
    for (const artistData of artistsData) {
        const artist = await prisma.artist.upsert({
            where: { slug: artistData.slug },
            update: { isFeatured: artistData.isFeatured },
            create: artistData,
        });
        artists[artistData.slug] = artist;
    }

    console.log(`✅ ${artistsData.length} artists created\n`);

    // ============================================
    // 3. ARTWORKS (30+ artworks with varied dates and statuses)
    // ============================================
    console.log("🖼️ Creating artworks...");

    // Clear existing artworks for these artists
    for (const slug of Object.keys(artists)) {
        await prisma.artwork.deleteMany({ where: { artistId: artists[slug].id } });
    }

    const artworksData = [
        // Aurore Dupont - Peintures abstraites
        { title: "Rêve Pastel", imageUrl: "/uploads/artwork-landscape-01.png", price: 1500, artistId: artists["aurore-dupont"].id, categoryId: peinture.id, status: "available", year: 2023, medium: "Acrylique sur toile", style: ["abstract", "colorful"], mood: ["serene", "contemplative"], createdAt: daysAgo(400) },
        { title: "Nuances de Sable", imageUrl: "/uploads/artwork-portrait-01.png", price: 1800, artistId: artists["aurore-dupont"].id, categoryId: peinture.id, status: "available", year: 2023, medium: "Acrylique sur toile", style: ["abstract", "minimalist"], mood: ["serene"], createdAt: daysAgo(350) },
        { title: "Lueurs Crépusculaires", imageUrl: "/uploads/artwork-portrait-02.png", price: 2000, artistId: artists["aurore-dupont"].id, categoryId: peinture.id, status: "sold", year: 2022, medium: "Huile sur toile", style: ["abstract", "expressionist"], mood: ["contemplative"], createdAt: daysAgo(300) },
        { title: "Éclats d'Aurore", imageUrl: "/uploads/1589be68-d355-41fb-a85f-4dc89e70eb77.webp", price: 2200, artistId: artists["aurore-dupont"].id, categoryId: peinture.id, status: "available", year: 2024, medium: "Technique mixte", style: ["abstract"], mood: ["joyful", "energetic"], createdAt: daysAgo(45) },

        // Liam Voisin - Photographies
        { title: "Ombres Urbaines", imageUrl: "/uploads/6a596e69-767e-452e-a938-9c9c89f6b8d4.jpg", price: 800, artistId: artists["liam-voisin"].id, categoryId: photographie.id, status: "available", year: 2023, medium: "Tirage argentique", style: ["urban", "minimalist"], mood: ["contemplative"], createdAt: daysAgo(360) },
        { title: "Reflets Métropolitains", imageUrl: "/uploads/606f92ff-a83b-4cd2-92b3-15338d6abf8b.jpg", price: 950, artistId: artists["liam-voisin"].id, categoryId: photographie.id, status: "available", year: 2023, medium: "Tirage pigmentaire", style: ["urban"], mood: ["energetic"], createdAt: daysAgo(280) },
        { title: "Perspective Nocturne", imageUrl: "/uploads/8b6b7fba-2095-42b8-8351-544ed67bb111.jpg", price: 1100, artistId: artists["liam-voisin"].id, categoryId: photographie.id, status: "sold", year: 2022, medium: "Tirage argentique", style: ["urban", "noir"], mood: ["contemplative", "melancholic"], createdAt: daysAgo(250) },
        { title: "Lignes de Fuite", imageUrl: "/uploads/b4df0264-83e1-43df-926f-e294801de2e0.jpg", price: 750, artistId: artists["liam-voisin"].id, categoryId: photographie.id, status: "available", year: 2024, medium: "Tirage pigmentaire", style: ["minimalist", "geometric"], mood: ["serene"], createdAt: daysAgo(30) },

        // Jules Martin - Paysages
        { title: "Lever sur la Loire", imageUrl: "/uploads/365e45f3-9e96-4c6e-b883-3f8694b2569f.webp", price: 1200, artistId: artists["jules-martin"].id, categoryId: peinture.id, status: "available", year: 2023, medium: "Huile sur toile", style: ["landscape", "impressionist"], mood: ["serene", "joyful"], widthCm: 80, heightCm: 60, createdAt: daysAgo(300) },
        { title: "Brumes Matinales", imageUrl: "/uploads/38ca318e-8558-4320-8acd-f7a848cc7c2e.webp", price: 1300, artistId: artists["jules-martin"].id, categoryId: peinture.id, status: "available", year: 2023, medium: "Huile sur toile", style: ["landscape"], mood: ["serene", "contemplative"], widthCm: 100, heightCm: 70, createdAt: daysAgo(220) },
        { title: "Automne en Touraine", imageUrl: "/uploads/dfa27fc9-1716-4c9f-844c-a869e209506e.webp", price: 1400, artistId: artists["jules-martin"].id, categoryId: peinture.id, status: "sold", year: 2022, medium: "Huile sur toile", style: ["landscape", "colorful"], mood: ["contemplative"], createdAt: daysAgo(180) },
        { title: "Vignobles au Crépuscule", imageUrl: "/uploads/8e60c7cf-83fa-4e33-9ba6-56b81d4de7f1.webp", price: 1600, artistId: artists["jules-martin"].id, categoryId: peinture.id, status: "available", year: 2024, medium: "Huile sur toile", style: ["landscape"], mood: ["serene"], createdAt: daysAgo(15) },

        // Marie Lefèvre - Sculptures
        { title: "Élévation", imageUrl: "/uploads/04b20931-c30a-47b4-81f7-9d1c221a74ea.png", price: 4500, artistId: artists["marie-lefevre"].id, categoryId: sculpture.id, status: "available", year: 2023, medium: "Bronze", style: ["abstract", "monumental"], mood: ["contemplative"], createdAt: daysAgo(260) },
        { title: "Équilibre Précaire", imageUrl: "/uploads/566024ff-076c-4788-9168-c4ba70451406.png", price: 5200, artistId: artists["marie-lefevre"].id, categoryId: sculpture.id, status: "available", year: 2022, medium: "Acier corten", style: ["abstract", "geometric"], mood: ["energetic"], createdAt: daysAgo(200) },
        { title: "Convergence", imageUrl: "/uploads/artwork-portrait-01.png", price: 3800, artistId: artists["marie-lefevre"].id, categoryId: sculpture.id, status: "sold", year: 2021, medium: "Bronze et acier", style: ["abstract"], mood: ["contemplative"], createdAt: daysAgo(400) },

        // Thomas Bernard - Art Numérique
        { title: "Fractales Oniriques", imageUrl: "/uploads/f8381df5-ebb6-4fcc-a9cc-2f968f025da5.webp", price: 600, artistId: artists["thomas-bernard"].id, categoryId: artNumerique.id, status: "available", year: 2024, medium: "NFT / Tirage limité", style: ["digital", "abstract"], mood: ["energetic", "joyful"], createdAt: daysAgo(120) },
        { title: "Synthèse Organique", imageUrl: "/uploads/0b0c9dc5-f723-48c1-97bb-dce63785eea6.webp", price: 750, artistId: artists["thomas-bernard"].id, categoryId: artNumerique.id, status: "available", year: 2023, medium: "Impression sur aluminium", style: ["digital", "futuristic"], mood: ["contemplative"], createdAt: daysAgo(90) },

        // Claire Moreau - Aquarelles
        { title: "Jardin Secret", imageUrl: "/uploads/74ac960b-1c0f-4412-a62e-9f4af3f73205.webp", price: 450, artistId: artists["claire-moreau"].id, categoryId: peinture.id, status: "available", year: 2024, medium: "Aquarelle sur papier", style: ["botanical", "delicate"], mood: ["serene", "joyful"], createdAt: daysAgo(100) },
        { title: "Roses de Mai", imageUrl: "/uploads/83bb5b21-5ddd-4779-b251-71e899f1ffad.webp", price: 520, artistId: artists["claire-moreau"].id, categoryId: peinture.id, status: "sold", year: 2023, medium: "Aquarelle sur papier", style: ["botanical", "romantic"], mood: ["serene"], createdAt: daysAgo(130) },
        { title: "Pavots Sauvages", imageUrl: "/uploads/8f2c2160-3c64-4755-b8ff-3c6535e2e1ab.webp", price: 480, artistId: artists["claire-moreau"].id, categoryId: peinture.id, status: "available", year: 2024, medium: "Aquarelle sur papier", style: ["botanical"], mood: ["joyful"], createdAt: daysAgo(20) },

        // Antoine Duval - Céramiques
        { title: "Bol Zen", imageUrl: "/uploads/aa2eccd3-e2d6-4a94-aecc-40f99bbf3197.webp", price: 280, artistId: artists["antoine-duval"].id, categoryId: ceramique.id, status: "available", year: 2024, medium: "Grès émaillé", style: ["minimalist", "japanese"], mood: ["serene"], createdAt: daysAgo(70) },
        { title: "Vase Lunaire", imageUrl: "/uploads/artwork-portrait-02.png", price: 350, artistId: artists["antoine-duval"].id, categoryId: ceramique.id, status: "available", year: 2024, medium: "Porcelaine", style: ["organic", "minimalist"], mood: ["contemplative"], createdAt: daysAgo(40) },

        // Sophie Lambert - Portraits
        { title: "Regard Intense", imageUrl: "/uploads/artwork-portrait-01.png", price: 900, artistId: artists["sophie-lambert"].id, categoryId: dessin.id, status: "available", year: 2024, medium: "Fusain sur papier", style: ["portrait", "realistic"], mood: ["contemplative", "intense"], createdAt: daysAgo(50) },
        { title: "Mélancolie", imageUrl: "/uploads/artwork-portrait-02.png", price: 1100, artistId: artists["sophie-lambert"].id, categoryId: dessin.id, status: "available", year: 2024, medium: "Graphite sur papier", style: ["portrait", "expressive"], mood: ["melancholic"], createdAt: daysAgo(25) },
    ];

    for (const artwork of artworksData) {
        await prisma.artwork.create({
            data: artwork as any,
        });
    }

    console.log(`✅ ${artworksData.length} artworks created\n`);

    // ============================================
    // 4. EVENTS (Past and upcoming)
    // ============================================
    console.log("📅 Creating events...");

    await prisma.event.deleteMany({});

    const eventsData = [
        { title: "Vernissage - Aurore Dupont", description: "Découvrez les nouvelles œuvres abstraites d'Aurore Dupont. Cocktail et rencontre avec l'artiste.", date: daysAgo(120), location: "Galerie Blue Cinis, Tours", imageUrl: "/uploads/artwork-landscape-01.png", createdAt: daysAgo(150) },
        { title: "Exposition Collective - Lumières de Loire", description: "Une exposition regroupant 5 artistes de la région autour du thème de la lumière.", date: daysAgo(60), location: "Château de Villandry", imageUrl: "/uploads/artwork-portrait-01.png", createdAt: daysAgo(90) },
        { title: "Atelier Aquarelle avec Claire Moreau", description: "Initiation à l'aquarelle botanique. Places limitées.", date: daysAgo(30), location: "Atelier Blue Cinis, Blois", imageUrl: "/uploads/artwork-portrait-02.png", createdAt: daysAgo(60) },
        { title: "Nuit des Galeries", description: "Ouverture exceptionnelle en nocturne avec performances live.", date: daysFromNow(15), location: "Galerie Blue Cinis, Tours", imageUrl: "/uploads/6a596e69-767e-452e-a938-9c9c89f6b8d4.jpg", createdAt: daysAgo(10) },
        { title: "Exposition - Photographes Urbains", description: "Liam Voisin et deux photographes invités présentent leur vision de la ville.", date: daysFromNow(45), location: "Espace Culturel, Nantes", imageUrl: "/uploads/365e45f3-9e96-4c6e-b883-3f8694b2569f.webp", createdAt: daysAgo(5) },
        { title: "Salon d'Art Contemporain de Tours", description: "Blue Cinis présente une sélection de ses artistes au salon annuel.", date: daysFromNow(90), location: "Parc des Expositions, Tours", imageUrl: "/uploads/1589be68-d355-41fb-a85f-4dc89e70eb77.webp", createdAt: daysAgo(2) },
    ];

    for (const event of eventsData) {
        await prisma.event.create({ data: event });
    }

    console.log(`✅ ${eventsData.length} events created\n`);

    // ============================================
    // 5. BLOG POSTS
    // ============================================
    console.log("📝 Creating blog posts...");

    await prisma.blogPost.deleteMany({});

    const blogPostsData = [
        {
            title: "Comment choisir une œuvre d'art pour son intérieur",
            content: "Choisir une œuvre d'art est avant tout une question d'émotion. Voici nos conseils pour trouver la pièce qui vous correspond...",
            excerpt: "Nos conseils pour trouver l'œuvre parfaite pour votre espace de vie.",
            publishedAt: daysAgo(180),
            imageUrl: "/blog-choix1.webp",
            createdAt: daysAgo(185),
        },
        {
            title: "Rencontre avec Aurore Dupont : L'abstraction comme langage",
            content: "Nous avons rencontré Aurore Dupont dans son atelier pour parler de son parcours et de sa vision de l'art abstrait...",
            excerpt: "Interview exclusive avec l'une de nos artistes phares.",
            publishedAt: daysAgo(120),
            imageUrl: "/blog-aurore1.webp",
            createdAt: daysAgo(125),
        },
        {
            title: "Investir dans l'art : Guide pour débutants",
            content: "L'art n'est pas seulement une passion, c'est aussi un investissement. Découvrez comment démarrer votre collection...",
            excerpt: "Tout ce que vous devez savoir pour commencer à collectionner.",
            publishedAt: daysAgo(90),
            imageUrl: "/blog-invest1.webp",
            createdAt: daysAgo(95),
        },
        {
            title: "La céramique japonaise : Tradition et modernité",
            content: "Antoine Duval nous explique comment les techniques ancestrales japonaises inspirent son travail contemporain...",
            excerpt: "Entre tradition millénaire et création moderne.",
            publishedAt: daysAgo(45),
            imageUrl: "/blog-ceramique1.webp",
            createdAt: daysAgo(50),
        },
        {
            title: "Bilan 2024 : Une année riche en découvertes",
            content: "Retour sur les moments forts de l'année : nouvelles expositions, artistes émergents, et perspectives pour 2025...",
            excerpt: "Les temps forts de notre année artistique.",
            publishedAt: daysAgo(10),
            imageUrl: "/blog-bilan1.webp",
            createdAt: daysAgo(12),
        },
    ];

    for (const post of blogPostsData) {
        await prisma.blogPost.create({ data: post });
    }

    console.log(`✅ ${blogPostsData.length} blog posts created\n`);

    // ============================================
    // 6. DEMO USER (Optional admin)
    // ============================================
    console.log("👤 Creating demo users...");

    const hashedPassword = DEMO_PASSWORD_HASH;

    await prisma.user.upsert({
        where: { email: "demo@bluecinis.com" },
        update: {},
        create: {
            email: "demo@bluecinis.com",
            password: hashedPassword,
            name: "Demo Admin",
            role: "admin",
            isActive: true,
            createdAt: daysAgo(500),
        },
    });

    // Link artist Aurore to a user account
    const auroreUser = await prisma.user.upsert({
        where: { email: "aurore@bluecinis.com" },
        update: {},
        create: {
            email: "aurore@bluecinis.com",
            password: hashedPassword,
            name: "Aurore Dupont",
            role: "artist",
            isActive: true,
            createdAt: daysAgo(450),
        },
    });

    await prisma.artist.update({
        where: { slug: "aurore-dupont" },
        data: { userId: auroreUser.id },
    });

    console.log("✅ Demo users created\n");

    // ============================================
    // SUMMARY
    // ============================================
    console.log("🎉 Database seeding complete!");
    console.log(`   📁 Categories: 10`);
    console.log(`   🎨 Artists: ${artistsData.length}`);
    console.log(`   🖼️ Artworks: ${artworksData.length}`);
    console.log(`   📅 Events: ${eventsData.length}`);
    console.log(`   📝 Blog Posts: ${blogPostsData.length}`);
    console.log(`   👤 Users: 2`);
    console.log("\n💡 Demo accounts:");
    console.log("   Admin: demo@bluecinis.com / Demo1234!");
    console.log("   Artist: aurore@bluecinis.com / Demo1234!");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
