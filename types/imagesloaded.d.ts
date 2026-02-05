declare module "imagesloaded" {
  type ImagesLoadedEvent = "progress" | "done" | "fail" | "always";

  interface ImagesLoadedOptions {
    background?: boolean | string | string[];
  }

  interface ImagesLoadedImage {
    img: HTMLImageElement | null;
    element: Element;
    isLoaded: boolean;
    naturalWidth: number;
    naturalHeight: number;
  }

  export interface ImagesLoadedInstance {
    images: ImagesLoadedImage[];
    progressedCount: number;
    isComplete: boolean;
    on(event: ImagesLoadedEvent, callback: (instance: ImagesLoadedInstance, image?: ImagesLoadedImage) => void): ImagesLoadedInstance;
    off(event: ImagesLoadedEvent, callback: (instance: ImagesLoadedInstance, image?: ImagesLoadedImage) => void): ImagesLoadedInstance;
    once(event: ImagesLoadedEvent, callback: (instance: ImagesLoadedInstance, image?: ImagesLoadedImage) => void): ImagesLoadedInstance;
  }

  interface ImagesLoaded {
    (elements: Element | NodeListOf<Element> | Element[] | string, options?: ImagesLoadedOptions): ImagesLoadedInstance;
    (elements: Element | NodeListOf<Element> | Element[] | string, callback: (instance: ImagesLoadedInstance) => void): ImagesLoadedInstance;
  }

  const imagesLoaded: ImagesLoaded;
  export default imagesLoaded;
}
