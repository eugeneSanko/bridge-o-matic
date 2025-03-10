
import { DebugSection } from "./DebugSection";
import { CodeBlock } from "./CodeBlock";

interface ResponseSectionProps {
  responseDetails?: {
    status: string;
    body: string;
    headers?: Record<string, string>;
  };
}

export const ResponseSection = ({ responseDetails }: ResponseSectionProps) => {
  if (!responseDetails) return null;

  return (
    <DebugSection
      title="Response Details"
      copyData={responseDetails.body || ""}
      copyLabel="Response body"
    >
      <div>Status: {responseDetails.status}</div>
      
      {/* Headers section */}
      {responseDetails.headers && (
        <div className="mt-2">
          <div className="text-xs text-[#0FA0CE] mb-1">Headers:</div>
          <div className="overflow-x-auto bg-black/20 p-2 rounded">
            <CodeBlock 
              content={JSON.stringify(responseDetails.headers, null, 2)} 
              label="Response headers" 
              showCopyButton={false}
            />
          </div>
        </div>
      )}
      
      {/* Body section */}
      <div className="mt-2">
        <div className="text-xs text-[#0FA0CE] mb-1">Response Body:</div>
        {responseDetails.body ? (
          <div className="overflow-x-auto bg-black/20 p-2 rounded">
            <CodeBlock 
              content={responseDetails.body} 
              label="Response body" 
              showCopyButton={false}
            />
          </div>
        ) : (
          <div className="text-gray-400 italic">No response body available</div>
        )}
      </div>
    </DebugSection>
  );
};
