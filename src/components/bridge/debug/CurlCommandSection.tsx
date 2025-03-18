
import { DebugSection } from "./DebugSection";
import { CodeBlock } from "./CodeBlock";

interface CurlCommandSectionProps {
  command?: string;
}

export const CurlCommandSection = ({ command }: CurlCommandSectionProps) => {
  if (!command) return null;

  return (
    <DebugSection title="cURL Command">
      <CodeBlock 
        content={command} 
        label="cURL command" 
        tryParseJson={false} 
      />
    </DebugSection>
  );
};
