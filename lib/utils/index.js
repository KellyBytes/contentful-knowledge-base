export const formatDate = (dateString, options) => {
  const { format } = new Intl.DateTimeFormat('en-CA', options);
  return format(new Date(dateString));
};
