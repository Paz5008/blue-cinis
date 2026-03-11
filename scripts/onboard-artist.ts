/**
 * Blue Cinis - Script CLI pour on-boarder un artiste
 * Usage: npx tsx scripts/onboard-artist.ts --email=artist@email.com
 */

import { prisma } from '@/lib/prisma';
import { onboardArtist } from '@/lib/artist-onboarding';

interface Args {
  email?: string;
  userId?: string;
  sendEmail?: boolean;
}

function parseArgs(): Args {
  const args: Args = { sendEmail: true };
  
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--email=')) {
      args.email = arg.split('=')[1];
    } else if (arg.startsWith('--user-id=')) {
      args.userId = arg.split('=')[1];
    } else if (arg === '--no-email') {
      args.sendEmail = false;
    }
  }
  
  return args;
}

async function main() {
  const args = parseArgs();
  
  if (!args.email && !args.userId) {
    console.error('Usage: npx tsx scripts/onboard-artist.ts --email=artist@email.com [--no-email]');
    console.error('   ou: npx tsx scripts/onboard-artist.ts --user-id=uuid [--no-email]');
    process.exit(1);
  }

  let userId = args.userId;

  // Si email fourni, trouver l'utilisateur
  if (args.email && !userId) {
    const user = await prisma.user.findUnique({
      where: { email: args.email },
      select: { id: true },
    });

    if (!user) {
      console.error(`❌ Utilisateur avec email ${args.email} introuvable`);
      process.exit(1);
    }

    userId = user.id;
  }

  console.log(`\n🎨 Onboarding de l'artiste...`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Send Email: ${args.sendEmail}\n`);

  try {
    const results = await onboardArtist({ userId, sendEmail: args.sendEmail });
    
    console.log('✅ Onboarding terminé!\n');
    console.log('Résultats:');
    console.log(`   ✓ Compte activé: ${results.profileActivated}`);
    console.log(`   ✓ Page profile créée: ${results.defaultPageCreated}`);
    console.log(`   ✓ Compte Stripe créé: ${results.stripeAccountCreated}`);
    
    if (results.stripeOnboardingUrl) {
      console.log(`\n🔗 Lien onboarding Stripe:`);
      console.log(`   ${results.stripeOnboardingUrl}`);
    }
    
    console.log(`   ✓ Email envoyé: ${results.emailSent}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
