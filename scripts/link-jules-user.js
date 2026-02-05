#!/usr/bin/env node
"use strict";
// Script pour créer/linker l'utilisateur Jules Francois à l'artiste slug 'jules'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    // Hash du mot de passe
    const hashed = await bcrypt.hash('Jeank107', 10);
    // Création ou mise à jour de l'utilisateur
    const user = await prisma.user.upsert({
      where: { email: 'jules.paz.francois@gmail.com' },
      update: {},
      create: {
        name: 'Jules Francois',
        email: 'jules.paz.francois@gmail.com',
        password: hashed,
        role: 'artist',
        isActive: true,
      },
    });
    console.log('User upserté:', user.id);
    // Link de l'artiste existant
    const artist = await prisma.artist.update({
      where: { slug: 'jules' },
      data: { userId: user.id },
    });
    console.log('Artist linked to user:', artist.id);
  } catch (e) {
    console.error('Erreur:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();