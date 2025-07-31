import React from 'react';
import PropertyCard from './PropertyCard';

interface MessageContentProps {
  content: string;
  senderType: 'customer' | 'agent' | 'system';
}

interface ParsedProperty {
  title: string;
  price: string;
  location: string;
  area?: string;
  amenities?: string;
  description?: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, senderType }) => {
  // Parse property information from AI response
  const parsePropertyFromMessage = (text: string): ParsedProperty[] => {
    const properties: ParsedProperty[] = [];
    
    // Look for property patterns in the message
    const propertyPattern = /🏠\s\*\*(.*?)\*\*\n💰\sPPrice:\s(.*?)\n📍\sLocation:\s(.*?)(?:\n📏\sArea:\s(.*?))?(?:\n✨\sAmenities:\s(.*?))?/g;
    
    let match;
    while ((match = propertyPattern.exec(text)) !== null) {
      properties.push({
        title: match[1],
        price: match[2],
        location: match[3],
        area: match[4] || undefined,
        amenities: match[5] || undefined,
        description: `Property in ${match[3]}`
      });
    }
    
    return properties;
  };

  const formatMessageText = (text: string): string => {
    // Remove property card patterns from the text
    return text.replace(/🏠\s\*\*(.*?)\*\*\n💰\sPrice:\s(.*?)\n📍\sLocation:\s(.*?)(?:\n📏\sArea:\s(.*?))?(?:\n✨\sAmenities:\s(.*?))?/g, '').trim();
  };

  const parsedProperties = senderType === 'system' ? parsePropertyFromMessage(content) : [];
  const messageText = parsedProperties.length > 0 ? formatMessageText(content) : content;

  return (
    <div className="space-y-3">
      {/* Regular Message Text */}
      {messageText && (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">
          {messageText}
        </div>
      )}
      
      {/* Property Cards */}
      {parsedProperties.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">
            Found {parsedProperties.length} propert{parsedProperties.length === 1 ? 'y' : 'ies'}:
          </div>
          {parsedProperties.map((property, index) => (
            <div key={index} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                {/* Property Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-lg">🏠</span>
                </div>
                
                {/* Property Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {property.title}
                  </h4>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center text-green-600 font-medium">
                      <span className="mr-1">💰</span>
                      {property.price}
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <span className="mr-1">📍</span>
                      {property.location}
                    </div>
                    
                    {property.area && (
                      <div className="flex items-center text-gray-600">
                        <span className="mr-1">📏</span>
                        {property.area}
                      </div>
                    )}
                    
                    {property.amenities && (
                      <div className="flex items-start text-gray-600">
                        <span className="mr-1 mt-0.5">✨</span>
                        <span className="flex-1">{property.amenities}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    <button className="border border-blue-600 text-blue-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-50 transition-colors">
                      Schedule Visit
                    </button>
                    <button className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50 transition-colors">
                      Contact Agent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageContent;