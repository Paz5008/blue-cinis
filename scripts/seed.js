#!/usr/bin/env node
"use strict";
// Charger les variables d'environnement depuis .env
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async function main() {
  console.log('Starting seed...');

  // --- CATEGORIES ---
  const sculpture = await prisma.category.upsert({
    where: { name: 'Sculpture' },
    update: {},
    create: { name: 'Sculpture' },
  });
  const peinture = await prisma.category.upsert({
    where: { name: 'Peinture' },
    update: {},
    create: { name: 'Peinture' },
  });
  const photographie = await prisma.category.upsert({
    where: { name: 'Photographie' },
    update: {},
    create: { name: 'Photographie' },
  });
  const dessin = await prisma.category.upsert({
    where: { name: 'Dessin' },
    update: {},
    create: { name: 'Dessin' },
  });

  // --- ARTISTS ---
  const aurore = await prisma.artist.upsert({
    where: { slug: 'aurore' },
    update: {},
    create: {
      slug: 'aurore',
      name: 'Aurore Dupont',
      biography: 'Passionnée par la peinture abstraite.',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
      artStyle: 'Peinture'
    }
  });

  const liam = await prisma.artist.upsert({
    where: { slug: 'liam-voisin' },
    update: {},
    create: {
      slug: 'liam-voisin',
      name: 'Liam Voisin',
      biography: 'Photographe de rue urbain.',
      photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
      artStyle: 'Photographie'
    }
  });

  const marcus = await prisma.artist.upsert({
    where: { slug: 'marcus-torn' },
    update: {},
    create: {
      slug: 'marcus-torn',
      name: 'Marcus Torn',
      biography: 'Sculpteur sur métal et lumière.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      artStyle: 'Sculpture'
    }
  });

  // --- ARTWORKS ---
  // Delete existing artworks for these artists to avoid duplicates on re-seed
  await prisma.artwork.deleteMany({ where: { artistId: { in: [aurore.id, liam.id, marcus.id] } } });

  const artworksData = [
    // Aurore (Peinture)
    { title: 'Éclats de Matin', price: 1200, categoryId: peinture.id, artistId: aurore.id, imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80' },
    { title: 'Bleu Profond', price: 2500, categoryId: peinture.id, artistId: aurore.id, imageUrl: 'https://images.unsplash.com/photo-1578321272172-72981315fb3f?w=800&q=80' },
    { title: 'Horizon Rouge', price: 1800, categoryId: peinture.id, artistId: aurore.id, imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=80' },
    { title: 'Silence Abstrait', price: 3000, categoryId: peinture.id, artistId: aurore.id, imageUrl: 'https://images.unsplash.com/photo-1549887552-93f954d1d960?w=800&q=80' },
    { title: 'Fragments de Couleur', price: 950, categoryId: peinture.id, artistId: aurore.id, imageUrl: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80' },

    // Liam (Photographie)
    { title: 'Tokyo Night', price: 800, categoryId: photographie.id, artistId: liam.id, imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80' },
    { title: 'Subway Solitude', price: 1100, categoryId: photographie.id, artistId: liam.id, imageUrl: 'https://images.unsplash.com/photo-1515595967223-f9fa59af5a3b?w=800&q=80' },
    { title: 'Urban Geometry', price: 750, categoryId: photographie.id, artistId: liam.id, imageUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80' },
    { title: 'Shadows Play', price: 600, categoryId: photographie.id, artistId: liam.id, imageUrl: 'https://images.unsplash.com/photo-1516055273510-4473e083972c?w=800&q=80' },
    { title: 'Neon Rain', price: 1400, categoryId: photographie.id, artistId: liam.id, imageUrl: 'https://images.unsplash.com/photo-1555677284-6a6fd20d0e65?w=800&q=80' },

    // Marcus (Sculpture)
    { title: 'Bronze Flow', price: 4500, categoryId: sculpture.id, artistId: marcus.id, imageUrl: 'https://images.unsplash.com/photo-1554188248-986adbb73be0?w=800&q=80' },
    { title: 'Steel Virtue', price: 3200, categoryId: sculpture.id, artistId: marcus.id, imageUrl: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&q=80' },
    { title: 'Marble Thought', price: 5000, categoryId: sculpture.id, artistId: marcus.id, imageUrl: 'https://images.unsplash.com/photo-1493026369527-30e704a29a4a?w=800&q=80' },
    { title: 'Abstract Iron', price: 2800, categoryId: sculpture.id, artistId: marcus.id, imageUrl: 'https://images.unsplash.com/photo-1545625447-fdc77da72b38?w=800&q=80' },
    { title: 'Golden Ratio', price: 6000, categoryId: sculpture.id, artistId: marcus.id, imageUrl: 'https://images.unsplash.com/photo-1551893478-d726eaf0442c?w=800&q=80' },
  ];

  await prisma.artwork.createMany({ data: artworksData });

  console.log(`Seeded ${artworksData.length} artworks.`);
  console.log('Seed completed.');
})()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
