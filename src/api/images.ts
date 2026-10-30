import { HiResImagesResponse, HiResImageItem } from '@/types';
import { tmRequest } from './client';
import { getEventById } from './events';

/**
 * Fetches high-resolution images for an event with 16:9 banner and responsive ratio ranking
 */
export async function getEventImages(id: string): Promise<HiResImagesResponse> {
  let rawImages: any[] = [];
  try {
    const data = await tmRequest<any>(`/events/${id}/images.json`);
    rawImages = data?._embedded?.images || data?.images || [];
  } catch {
    try {
      const event = await getEventById(id);
      rawImages = event.images || [];
    } catch {
      rawImages = [];
    }
  }

  const mapped: HiResImageItem[] = rawImages.map((img: any) => {
    const width = Number(img.width) || 0;
    const height = Number(img.height) || 0;
    return {
      url: img.url,
      ratio: img.ratio || '16_9',
      width,
      height,
      fallback: Boolean(img.fallback),
      attribution: img.attribution,
      isHiRes: width >= 1024 || width * height >= 786432,
    };
  });

  mapped.sort((a, b) => b.width * b.height - a.width * a.height);
  const hiResImage = mapped.find((img) => img.isHiRes) || mapped[0];
  const bannerImage = mapped.find((img) => img.ratio === '16_9') || mapped[0];
  const thumbnailImage =
    mapped.find((img) => img.ratio === '4_3' || img.ratio === '3_2') || mapped[mapped.length - 1];

  return {
    id,
    type: 'event',
    hiResImage,
    bannerImage,
    thumbnailImage,
    images: mapped,
  };
}

/**
 * Fetches high-resolution images for an attraction/artist/performer
 */
export async function getAttractionImages(id: string): Promise<HiResImagesResponse> {
  let rawImages: any[] = [];
  try {
    const data = await tmRequest<any>(`/attractions/${id}/images.json`);
    rawImages = data?._embedded?.images || data?.images || [];
  } catch {
    rawImages = [];
  }

  const mapped: HiResImageItem[] = rawImages.map((img: any) => {
    const width = Number(img.width) || 0;
    const height = Number(img.height) || 0;
    return {
      url: img.url,
      ratio: img.ratio || '16_9',
      width,
      height,
      fallback: Boolean(img.fallback),
      attribution: img.attribution,
      isHiRes: width >= 1024 || width * height >= 786432,
    };
  });

  mapped.sort((a, b) => b.width * b.height - a.width * a.height);
  const hiResImage = mapped.find((img) => img.isHiRes) || mapped[0];
  const bannerImage = mapped.find((img) => img.ratio === '16_9') || mapped[0];
  const thumbnailImage =
    mapped.find((img) => img.ratio === '4_3' || img.ratio === '3_2') || mapped[mapped.length - 1];

  return {
    id,
    type: 'attraction',
    hiResImage,
    bannerImage,
    thumbnailImage,
    images: mapped,
  };
}
