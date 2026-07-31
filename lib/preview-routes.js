// Manages which type of preview to show for each content type nad which url to redirect to

export const previewRoutes = {
  post: {
    contentType: 'post',
    getPath: entry => `/posts/${entry.fields.slug}`,
  },

  article: {
    contentType: 'article',
    getPath: entry => {
      const categorySlug = entry.fields.category?.fields?.slug;
      if (!categorySlug) return null;
      return `/kb/${categorySlug}/${entry.fields.slug}`;
    },
  },
};
