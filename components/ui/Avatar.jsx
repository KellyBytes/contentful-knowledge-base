import ContentfulImage from './ContentfulImage';

const Avatar = ({ name, picture }) => {
  return (
    <div className="flex items-center">
      <div className="relative size-10 mr-4">
        <ContentfulImage
          src={picture.fields.file.url}
          width={50}
          height={50}
          className="rounded-full m-0"
          alt={name}
        />
      </div>
      <div className="font-semibold">{name}</div>
    </div>
  );
};

export default Avatar;
