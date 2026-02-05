import React from "react";
import { BlockRendererProps } from "./types";

import { TextRenderer } from "./TextRenderer";
import { ImageRenderer } from "./ImageRenderer";
import { VideoRenderer } from "./VideoRenderer";
import { EmbedRenderer } from "./EmbedRenderer";
import { GalleryRenderer } from "./GalleryRenderer";
import { DividerRenderer } from "./DividerRenderer";
import { ButtonRenderer } from "./ButtonRenderer";
import { ColumnsRenderer } from "./ColumnsRenderer";
import { OeuvreRenderer } from "./OeuvreRenderer";
import { ArtworkListRenderer } from "./ArtworkListRenderer";
import { ArtistNameRenderer } from "./ArtistNameRenderer";
import { ArtistPhotoRenderer } from "./ArtistPhotoRenderer";
import { ArtistBioRenderer } from "./ArtistBioRenderer";
import { ContactFormRenderer } from "./ContactFormRenderer";
import { EventListRenderer } from "./EventListRenderer";

export const BlockRegistry: Record<string, React.FC<BlockRendererProps>> = {
    text: TextRenderer,
    image: ImageRenderer,
    video: VideoRenderer,
    embed: EmbedRenderer,
    gallery: GalleryRenderer,
    divider: DividerRenderer,
    button: ButtonRenderer,
    columns: ColumnsRenderer,
    oeuvre: OeuvreRenderer,
    artworkList: ArtworkListRenderer,
    artistName: ArtistNameRenderer,
    artistPhoto: ArtistPhotoRenderer,
    artistBio: ArtistBioRenderer,
    contactForm: ContactFormRenderer,
    eventList: EventListRenderer,
};
