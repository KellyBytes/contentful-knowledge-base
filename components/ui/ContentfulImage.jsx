'use client';

import Image from 'next/image';
import contentfulLoader from '@/lib/contentful/imageLoader';

const ContentfulImage = props => {
  return (
    <Image
      alt={props.alt}
      loader={contentfulLoader}
      sizes={props.sizes}
      {...props}
    />
  );
};

export default ContentfulImage;
