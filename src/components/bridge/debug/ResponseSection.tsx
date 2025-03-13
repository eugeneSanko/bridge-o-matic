
import { DebugSection } from "./DebugSection";
import { CodeBlock } from "./CodeBlock";

interface ResponseSectionProps {
  responseDetails?: {
    status: string;
    body: string;
    headers?: Record<string, string>;
    statusText?: string;
  };
}

export const ResponseSection = ({ responseDetails }: ResponseSectionProps) => {
  if (!responseDetails) return null;

  // Try to parse the body as JSON for better formatting
  let formattedBody = responseDetails.body;
  try {
    if (responseDetails.body) {
      const parsedBody = JSON.parse(responseDetails.body);
      formattedBody = JSON.stringify(parsedBody, null, 2);
    }
  } catch (e) {
    // If parsing fails, use the original body
    console.log("Could not parse response body as JSON");
  }

  return (
    <DebugSection
      title="Response Details"
      copyData={responseDetails.body || ""}
      copyLabel="Response body"
    >
      <div>Status: {responseDetails.status} {responseDetails.statusText || ""}</div>
      
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
        {formattedBody ? (
          <div className="overflow-x-auto bg-black/20 p-2 rounded">
            <CodeBlock 
              content={formattedBody} 
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
