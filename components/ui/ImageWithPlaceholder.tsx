import React, { useState, useEffect } from 'react';

interface ImageWithPlaceholderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholderKeyword?: string;
}

export const ImageWithPlaceholder: React.FC<ImageWithPlaceholderProps> = ({ 
    src, 
    alt, 
    placeholderKeyword = 'engineering',
    className = '',
    ...props 
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string>('');

    useEffect(() => {
        setIsLoaded(false);
        setError(false);
        
        const img = new Image();
        img.src = src;
        
        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
        };
        
        img.onerror = () => {
            setError(true);
            setIsLoaded(true);
        };
        
        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    const placeholderUrl = `https://picsum.photos/seed/${placeholderKeyword}/800/600?blur=4`;

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Placeholder / Loading State */}
            <img 
                src={placeholderUrl}
                alt="Loading placeholder"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                referrerPolicy="no-referrer"
            />
            
            {/* Actual Image */}
            {isLoaded && !error && (
                <img
                    src={currentSrc}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    {...props}
                />
            )}
            
            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">Failed to load image</span>
                </div>
            )}
        </div>
    );
};
