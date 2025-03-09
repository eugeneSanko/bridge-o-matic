
import { DebugSection } from "./DebugSection";
import { CodeBlock } from "./CodeBlock";

interface CurlCommandSectionProps {
  curlCommand?: string;
}

export const CurlCommandSection = ({ curlCommand }: CurlCommandSectionProps) => {
  if (!curlCommand) return null;

  return (
    <DebugSection title="cURL Command">
      <CodeBlock 
        content={curlCommand} 
        label="cURL command" 
        tryParseJson={false} 
      />
    </DebugSection>
  );
};
