import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/auth';
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { uploadImageFile } from "@/lib/uploads";

// Validation de base du profil
const ArtistProfileSchema = z.object({
  name: z.string().min(1),
  biography: z.string().optional(),
  phone: z.string().optional(),
  portfolio: z.string().optional(),
  artStyle: z.string().optional(),
  instagramUrl: z.string().url().optional(),
  facebookUrl: z.string().url().optional(),
  enableCommerce: z.boolean().optional(),
  enableLeads: z.boolean().optional(),
  contactEmail: z.string().email().optional(),
  allowInternationalShipping: z.boolean().optional(),
  defaultShippingFee: z.number().int().nonnegative().optional(), // cents
  processingTimeDays: z.number().int().min(0).max(60).optional(),
  deliveryBannerMessage: z.string().max(200).optional(),
});

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const artist = await prisma.artist.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          slug: true,
          isActive: true,
          isFeatured: true,
          name: true,
          biography: true,
          photoUrl: true,
          phone: true,
          portfolio: true,
          artStyle: true,
          instagramUrl: true,
          facebookUrl: true,
          enableCommerce: true,
          enableLeads: true,
          contactEmail: true,
          allowInternationalShipping: true,
          defaultShippingFee: true,
          processingTimeDays: true,
          deliveryBannerMessage: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          stripeAccountId: true,
        } as any,
      });
      if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
      return NextResponse.json(artist, { status: 200 });
    } catch {
      const artist = await prisma.artist.findUnique({
        where: { userId: session.user.id },
        select: {
          id: true,
          slug: true,
          isActive: true,
          isFeatured: true,
          name: true,
          biography: true,
          photoUrl: true,
          phone: true,
          portfolio: true,
          artStyle: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          stripeAccountId: true,
        } as any,
      });
      if (!artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
      return NextResponse.json({
        ...artist,
        enableCommerce: true,
        enableLeads: true,
        contactEmail: (artist as any).contactEmail || null,
        allowInternationalShipping: (artist as any).allowInternationalShipping ?? false,
        defaultShippingFee: (artist as any).defaultShippingFee ?? null,
        processingTimeDays: (artist as any).processingTimeDays ?? null,
        instagramUrl: (artist as any).instagramUrl || null,
        facebookUrl: (artist as any).facebookUrl || null,
        deliveryBannerMessage: (artist as any).deliveryBannerMessage || null,
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur GET /api/artist/profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "artist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
      select: { id: true, photoUrl: true },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const formData = await request.formData();

    const name = formData.get("name") as string;
    const biography = (formData.get("biography") as string) || undefined;
    const phone = (formData.get("phone") as string) || undefined;
    const portfolio = (formData.get("portfolio") as string) || undefined;
    const artStyle = (formData.get("artStyle") as string) || undefined;
    const instagramUrlRaw = (formData.get('instagramUrl') as string) ?? undefined;
    const instagramUrl = instagramUrlRaw != null ? instagramUrlRaw.trim() : undefined;
    const facebookUrlRaw = (formData.get('facebookUrl') as string) ?? undefined;
    const facebookUrl = facebookUrlRaw != null ? facebookUrlRaw.trim() : undefined;
    const enableCommerce = formData.has('enableCommerce') ? true : (formData.has('enableCommerceOff') ? false : undefined);
    const enableLeads = formData.has('enableLeads') ? true : (formData.has('enableLeadsOff') ? false : undefined);
    const contactEmailProvided = formData.has('contactEmail');
    const contactEmailRaw = (formData.get('contactEmail') as string) ?? undefined;
    const contactEmail = contactEmailRaw != null ? contactEmailRaw.trim() : undefined;
    const allowInternationalShipping = formData.has('allowInternationalShipping') ? true : (formData.has('allowInternationalShippingOff') ? false : undefined);
    const defaultShippingFeeStr = (formData.get('defaultShippingFee') as string) || '';
    const defaultShippingFee = defaultShippingFeeStr !== '' && !isNaN(Number(defaultShippingFeeStr)) ? Math.max(0, Math.round(Number(defaultShippingFeeStr) * 100)) : undefined; // euros -> cents
    const defaultShippingFeeProvided = formData.has('defaultShippingFee');
    const processingTimeDaysStr = (formData.get('processingTimeDays') as string) || '';
    const processingTimeDays = processingTimeDaysStr !== '' && !isNaN(Number(processingTimeDaysStr)) ? Math.max(0, Math.round(Number(processingTimeDaysStr))) : undefined;
    const processingTimeDaysProvided = formData.has('processingTimeDays');
    const deliveryBannerMessageRaw = (formData.get('deliveryBannerMessage') as string) ?? undefined;
    const deliveryBannerMessage =
      deliveryBannerMessageRaw != null ? deliveryBannerMessageRaw.trim() : undefined;
    const deliveryBannerMessageProvided = formData.has('deliveryBannerMessage');

    const parsed = ArtistProfileSchema.safeParse({ name, biography, phone, portfolio, artStyle, instagramUrl, facebookUrl, enableCommerce, enableLeads, contactEmail, allowInternationalShipping, defaultShippingFee, processingTimeDays, deliveryBannerMessage });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Upload éventuel de la photo via pipeline centralisée
    let newPhotoUrl = artist.photoUrl || null;
    const file = formData.get("photo") as File | null;
    if (file && file.size > 0) {
      try {
        const upload = await uploadImageFile(file);
        newPhotoUrl = upload.url;
      } catch {
        return NextResponse.json({ error: "Invalid image upload" }, { status: 400 });
      }
    }

    const baseData: any = {
      name: parsed.data.name,
      biography: parsed.data.biography ?? null,
      phone: parsed.data.phone ?? null,
      portfolio: parsed.data.portfolio ?? null,
      artStyle: parsed.data.artStyle ?? null,
      instagramUrl: parsed.data.instagramUrl ?? null,
      facebookUrl: parsed.data.facebookUrl ?? null,
      deliveryBannerMessage: parsed.data.deliveryBannerMessage ?? null,
      photoUrl: newPhotoUrl,
      ...(parsed.data.enableCommerce !== undefined ? { enableCommerce: parsed.data.enableCommerce } : {}),
      ...(parsed.data.enableLeads !== undefined ? { enableLeads: parsed.data.enableLeads } : {}),
      ...(deliveryBannerMessageProvided ? { deliveryBannerMessage: (parsed.data.deliveryBannerMessage ?? null) } : {}),
    };
    const ecommerceData: any = {
      ...(contactEmailProvided ? { contactEmail: (parsed.data.contactEmail ?? null) } : {}),
      ...(parsed.data.allowInternationalShipping !== undefined ? { allowInternationalShipping: parsed.data.allowInternationalShipping } : {}),
      ...(defaultShippingFeeProvided ? { defaultShippingFee: parsed.data.defaultShippingFee ?? null } : {}),
      ...(processingTimeDaysProvided ? { processingTimeDays: parsed.data.processingTimeDays ?? null } : {}),
    };

    try {
      const updatedArtist = await prisma.artist.update({ where: { id: artist.id }, data: { ...baseData, ...ecommerceData } });
      return NextResponse.json(updatedArtist, { status: 200 });
    } catch {
      const updatedArtist = await prisma.artist.update({ where: { id: artist.id }, data: { ...baseData } });
      return NextResponse.json(updatedArtist, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur PUT /api/artist/profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
