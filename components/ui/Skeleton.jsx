const Skeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="py-48 bg-gray-200 rounded-md"></div>
      <div className="w-1/2 mt-6 py-5 bg-gray-200 rounded-md"></div>
      <div className="mt-8">
        <p className="mt-2 py-3 bg-gray-200 rounded-md"></p>
        <p className="mt-2 py-3 bg-gray-200 rounded-md"></p>
        <p className="mt-2 py-3 bg-gray-200 rounded-md"></p>
        <p className="mt-2 py-3 bg-gray-200 rounded-md"></p>
      </div>
    </div>
  );
};

export default Skeleton;
