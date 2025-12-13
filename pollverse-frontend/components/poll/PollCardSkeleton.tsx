

const PollCardSkeleton = () => (
    <div className="h-full w-full flex items-center justify-center p-3 snap-center">
        <div className="w-full h-full bg-white dark:bg-gray-800 flex flex-col justify-between p-4 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    <div>
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
                        <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
            </div>
            <main className="flex-grow flex flex-col justify-center my-2 overflow-hidden animate-pulse">
                <div className="h-6 w-3/4 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-4 w-full mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="h-4 w-5/6 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="px-2 space-y-2 mt-4">
                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                </div>
            </main>
            <footer className="flex-shrink-0 flex justify-between items-center p-2 border-t border-gray-100 dark:border-gray-700/50 animate-pulse">
                <div className="flex items-center space-x-4">
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
            </footer>
        </div>
    </div>
);

export default PollCardSkeleton;