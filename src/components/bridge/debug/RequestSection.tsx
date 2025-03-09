
import { DebugSection } from "./DebugSection";

interface RequestSectionProps {
  requestDetails?: {
    url: string;
    method: string;
    requestBody: any;
    requestBodyString: string;
  };
}

export const RequestSection = ({ requestDetails }: RequestSectionProps) => {
  if (!requestDetails) return null;

  return (
    <DebugSection
      title="Request Details"
      copyData={JSON.stringify(requestDetails.requestBody, null, 2)}
      copyLabel="Request body"
    >
      <div>URL: {requestDetails.url}</div>
      <pre className="mt-2 text-xs overflow-x-auto">
        {JSON.stringify(requestDetails.requestBody, null, 2)}
      </pre>
    </DebugSection>
  );
};
