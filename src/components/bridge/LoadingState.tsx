
export const LoadingState = () => {
  return (
    <div className="min-h-screen bg-bridge-dark pt-24 px-8 pb-24 flex items-center justify-center">
      <div className="text-center animate-slideUp">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-bridge-accent opacity-20 animate-spin"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-bridge-accent animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </div>
        <h2 className="text-xl font-bold mb-2">Loading Order Details</h2>
        <p className="text-gray-400">Please wait while we fetch your transaction information</p>
      </div>
    </div>
  );
};
