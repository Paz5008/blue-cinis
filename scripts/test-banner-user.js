const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'artist@example.com';
    console.log(`Checking for user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { artist: true },
    });

    if (!user) {
        console.error('User not found!');
        return;
    }

    if (!user.artist) {
        console.error('User is not an artist!');
        return;
    }

    console.log(`Found artist: ${user.artist.name} (${user.artist.id})`);
    console.log('Current Banner State:', {
        layout: user.artist.bannerLayout,
        preset: user.artist.bannerPreset,
        palette: user.artist.bannerPalette,
    });

    // Test 1: Apply "Bold" Preset
    console.log('\n--- Test 1: Update to "Bold" Preset ---');
    const boldPalette = { accent: '#d97706', background: '#ffffff', text: '#0f172a' };
    await prisma.artist.update({
        where: { id: user.artist.id },
        data: {
            bannerPreset: 'bold',
            bannerPalette: boldPalette,
            bannerLayout: 'minimal',
        },
    });

    const artistAfterBold = await prisma.artist.findUnique({ where: { id: user.artist.id } });
    console.log('State after Bold:', {
        preset: artistAfterBold.bannerPreset,
        palette: artistAfterBold.bannerPalette,
    });

    // Test 2: Apply "Elegant" Preset with Custom Colors
    console.log('\n--- Test 2: Update to "Elegant" Preset (Custom) ---');
    const customPalette = { accent: '#ff0000', background: '#000000', text: '#ffffff' };
    await prisma.artist.update({
        where: { id: user.artist.id },
        data: {
            bannerPreset: 'elegant',
            bannerPalette: customPalette, // Custom override
        },
    });

    const artistAfterCustom = await prisma.artist.findUnique({ where: { id: user.artist.id } });
    console.log('State after Custom:', {
        preset: artistAfterCustom.bannerPreset,
        palette: artistAfterCustom.bannerPalette,
    });

    console.log('\nVerification Complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
