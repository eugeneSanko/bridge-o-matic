
import { DebugSection } from "./DebugSection";

interface QrCodeRequestSectionProps {
  requestDetails?: {
    url: string;
    method: string;
    requestBody: any;
    requestBodyString: string;
  };
}

export const QrCodeRequestSection = ({ requestDetails }: QrCodeRequestSectionProps) => {
  if (!requestDetails) return null;

  return (
    <DebugSection
      title="QR Code Request Details"
      copyData={JSON.stringify(requestDetails.requestBody, null, 2)}
      copyLabel="QR code request body"
    >
      <div>URL: {requestDetails.url}</div>
      <pre className="mt-2 text-xs overflow-x-auto">
        {JSON.stringify(requestDetails.requestBody, null, 2)}
      </pre>
    </DebugSection>
  );
};
