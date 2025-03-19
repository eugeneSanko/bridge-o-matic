
import { DebugSection } from "./DebugSection";
import { CodeBlock } from "./CodeBlock";

interface AffiliateTaxSectionProps {
  refcode?: string;
  afftax?: number;
}

export const AffiliateTaxSection = ({ refcode, afftax }: AffiliateTaxSectionProps) => {
  if (!refcode && !afftax) return null;

  const content = {
    refcode: refcode || 'Not configured',
    afftax: afftax !== undefined ? `${afftax}` : 'Not configured'
  };

  return (
    <DebugSection 
      title="Affiliate Information" 
      titleColor="#9c27b0"
      copyData={JSON.stringify(content, null, 2)}
      copyLabel="Affiliate info"
    >
      <CodeBlock 
        content={JSON.stringify(content, null, 2)} 
        label="Affiliate details" 
      />
    </DebugSection>
  );
};
