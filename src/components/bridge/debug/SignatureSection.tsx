
import { DebugSection } from "./DebugSection";

interface SignatureSectionProps {
  signatureInfo?: {
    apiKey: string;
    signature: string;
  };
}

export const SignatureSection = ({ signatureInfo }: SignatureSectionProps) => {
  if (!signatureInfo) return null;

  return (
    <DebugSection
      title="Signature Details"
      copyData={signatureInfo.signature}
      copyLabel="Signature"
    >
      <div>API Key: {signatureInfo.apiKey}</div>
      <div className="truncate mt-2">
        Signature: {signatureInfo.signature}
      </div>
    </DebugSection>
  );
};
