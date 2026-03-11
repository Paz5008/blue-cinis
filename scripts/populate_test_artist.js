const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Recherche de l'artiste test...");
    const user = await prisma.user.findUnique({
        where: { email: 'artiste.test@example.com' },
        include: { artist: true }
    });

    if (!user || !user.artist) {
        console.error("Artiste test introuvable.");
        process.exit(1);
    }

    console.log("Mise à jour du profil expérientiel...");

    // Default dummy data
    const artworks = [
        {
            title: "L'Aube Incandescente",
            description: "Une exploration des premières lueurs du jour à travers un prisme rouge ardent.",
            price: 1200,
            year: 2023,
            medium: "Acrylique sur toile",
            dimensions: "120x80 cm",
            status: "available",
            imageUrl: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80"
        },
        {
            title: "Résonance Magnétique",
            description: "Série géométrique abstraite cherchant à capturer les ondes invisibles.",
            price: 850,
            year: 2024,
            medium: "Technique mixte",
            dimensions: "60x60 cm",
            status: "available",
            imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80"
        },
        {
            title: "Silence Hivernal",
            description: "Paysage abstrait minimaliste évoquant la neige tombant sur un lac gelé.",
            price: 1500,
            year: 2022,
            medium: "Huile sur lin",
            dimensions: "150x100 cm",
            status: "sold",
            imageUrl: "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=800&q=80"
        },
        {
            title: "Fracture Spatiale #4",
            description: "Expressionnisme abstrait poussé à ses limites.",
            price: 600,
            year: 2024,
            medium: "Acrylique",
            dimensions: "50x50 cm",
            status: "sold", // Changed from reserved to sold to match ArtworkStatus enum
            imageUrl: "https://images.unsplash.com/photo-1501472312651-726afe119ff1?w=800&q=80"
        },
        {
            title: "Convergence",
            description: "Dernière pièce de la collection 2024, symbolisant la réconciliation des contraires.",
            price: 2100,
            year: 2024,
            medium: "Huile et feuille d'or",
            dimensions: "100x100 cm",
            status: "available",
            imageUrl: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&q=80"
        }
    ];

    // Check Categories
    let category = await prisma.category.findFirst({ where: { name: "Peinture" } });
    if (!category) {
        category = await prisma.category.create({
            data: { name: "Peinture" }
        });
    }

    // Update Profile
    await prisma.artist.update({
        where: { id: user.artist.id },
        data: {
            biography: "Artiste contemporain basé à Paris, explorant les résonances entre la couleur abstraite et l'émotion humaine brute. Je travaille principalement avec des techniques mixtes sur toiles grand format.",
            name: "Artiste Test",
            artStyle: "Expressionnisme Abstrait",
            photoUrl: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&q=80",
            stripeAccountId: "acct_dummy123", // Pretend to have commerce
            enableCommerce: true
        }
    });

    console.log("Suppression des anciennes oeuvres tests...");
    await prisma.artwork.deleteMany({
        where: { artistId: user.artist.id }
    });

    console.log("Création des 5 fausses œuvres...");
    for (const art of artworks) {
        await prisma.artwork.create({
            data: {
                ...art,
                artistId: user.artist.id,
                artistName: user.artist.name || "Artiste Test",
                categoryId: category.id
            }
        });
    }

    console.log("Artiste mis à jour avec succès. Relancez la génération !");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
